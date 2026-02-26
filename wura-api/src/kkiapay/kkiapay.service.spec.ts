import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TransactionStatus } from '@prisma/client';
import axios from 'axios';
import { PolygonService } from '../blockchain/polygon.service';
import { PrismaService } from '../prisma/prisma.service';
import { KkiapayService } from './kkiapay.service';

// Mock axios globalement
jest.mock('axios', () => ({
  post: jest.fn(),
}));

describe('KkiapayService - Wura QA', () => {
  let service: KkiapayService;

  const mockPrismaService = {
    transaction: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockPolygonService = {
    bridgeUsdtToReceiver: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KkiapayService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: PolygonService, useValue: mockPolygonService },
      ],
    }).compile();

    service = module.get<KkiapayService>(KkiapayService);
    process.env.KKIAPAY_PRIVATE_KEY = 'test_private_key_123';
    jest.clearAllMocks();
  });

  // ========================================
  // TESTS: verifyAndProcessPayment (Webhook)
  // ========================================
  describe('verifyAndProcessPayment', () => {

    it('✅ Cas 1: Webhook SUCCESS → PAYIN_SUCCESS + bridge Polygon déclenché', async () => {
      const payload = {
        transactionId: 'trx_12345',
        isPaymentSucces: true,
        amount: 10975,
        stateData: 'TX-WURA-001',
        status: 'SUCCESS',
      };

      mockPrismaService.transaction.findUnique.mockResolvedValue({
        referenceId: 'TX-WURA-001',
        status: TransactionStatus.INITIATED,
        receiver: { web3AuthWalletAddress: '0xABC' },
      });

      const result = await service.verifyAndProcessPayment(payload);

      expect(mockPrismaService.transaction.update).toHaveBeenCalledWith({
        where: { referenceId: 'TX-WURA-001' },
        data: {
          status: TransactionStatus.PAYIN_SUCCESS,
          kkiapayId: 'trx_12345',
          amountFiatIn: 10975,
        },
      });
      expect(mockPolygonService.bridgeUsdtToReceiver).toHaveBeenCalledWith('TX-WURA-001');
      expect(result).toEqual({ status: 'success', referenceId: 'TX-WURA-001' });
    });

    it('🔁 Cas 2: Idempotence — webhook en double ignoré silencieusement', async () => {
      const payload = {
        transactionId: 'trx_12345',
        isPaymentSucces: true,
        stateData: 'TX-WURA-001',
      };

      mockPrismaService.transaction.findUnique.mockResolvedValue({
        referenceId: 'TX-WURA-001',
        status: TransactionStatus.PAYIN_SUCCESS,
      });

      const result = await service.verifyAndProcessPayment(payload);

      expect(mockPrismaService.transaction.update).not.toHaveBeenCalled();
      expect(result).toEqual({ status: 'already_processed', referenceId: 'TX-WURA-001' });
    });

    it('❌ Cas 3: Webhook avec isPaymentSucces=false → BadRequestException', async () => {
      const payload = {
        transactionId: 'trx_failed',
        isPaymentSucces: false,
        stateData: 'TX-WURA-002',
      };

      await expect(service.verifyAndProcessPayment(payload)).rejects.toThrow(BadRequestException);
      expect(mockPrismaService.transaction.update).not.toHaveBeenCalled();
    });

    it('👻 Cas 4: Transaction inconnue → NotFoundException', async () => {
      const payload = {
        transactionId: 'trx_ghost',
        isPaymentSucces: true,
        stateData: 'TX-GHOST-404',
      };

      mockPrismaService.transaction.findUnique.mockResolvedValue(null);

      await expect(service.verifyAndProcessPayment(payload)).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.transaction.update).not.toHaveBeenCalled();
    });

    it('🚫 Cas 5: Webhook sans stateData → BadRequestException', async () => {
      const payload = {
        transactionId: 'trx_no_ref',
        isPaymentSucces: true,
      };

      await expect(service.verifyAndProcessPayment(payload)).rejects.toThrow(BadRequestException);
    });
  });

  // ========================================
  // TESTS: processFailedPayment
  // ========================================
  describe('processFailedPayment', () => {

    it('✅ Cas 1: Paiement échoué → statut mis à PAYIN_FAILED', async () => {
      const payload = {
        transactionId: 'trx_fail_001',
        stateData: 'TX-FAIL-001',
      };

      mockPrismaService.transaction.findUnique.mockResolvedValue({
        referenceId: 'TX-FAIL-001',
        status: TransactionStatus.INITIATED,
      });

      const result = await service.processFailedPayment(payload);

      expect(mockPrismaService.transaction.update).toHaveBeenCalledWith({
        where: { referenceId: 'TX-FAIL-001' },
        data: {
          status: TransactionStatus.PAYIN_FAILED,
          kkiapayId: 'trx_fail_001',
        },
      });
      expect(result).toEqual({ status: 'failed_processed', referenceId: 'TX-FAIL-001' });
    });

    it('🔁 Cas 2: Transaction déjà SUCCESS → on ne touche pas au statut', async () => {
      const payload = {
        transactionId: 'trx_fail_002',
        stateData: 'TX-ALREADY-OK',
      };

      mockPrismaService.transaction.findUnique.mockResolvedValue({
        referenceId: 'TX-ALREADY-OK',
        status: TransactionStatus.PAYIN_SUCCESS,
      });

      const result = await service.processFailedPayment(payload);

      expect(mockPrismaService.transaction.update).not.toHaveBeenCalled();
      expect(result).toEqual({ status: 'failed_processed', referenceId: 'TX-ALREADY-OK' });
    });
  });

  // ========================================
  // TESTS: refundTransaction
  // ========================================
  describe('refundTransaction', () => {

    it('✅ Cas 1: Remboursement OK — statut PAYIN_SUCCESS → REFUNDED', async () => {
      mockPrismaService.transaction.findUnique.mockResolvedValue({
        id: 'uuid-001',
        referenceId: 'TX-REFUND-001',
        status: TransactionStatus.PAYIN_SUCCESS,
        kkiapayId: 'kkp_123',
      });

      (axios.post as jest.Mock).mockResolvedValue({
        data: { status: 'success' },
      });

      const result = await service.refundTransaction('uuid-001');

      // Vérifie l'appel API Kkiapay
      expect(axios.post).toHaveBeenCalledWith(
        'https://api.kkiapay.me/api/v1/transactions/refund',
        { transactionId: 'kkp_123' },
        {
          headers: {
            'x-private-key': 'test_private_key_123',
            'Content-Type': 'application/json',
          },
        },
      );

      // Vérifie la mise à jour en base
      expect(mockPrismaService.transaction.update).toHaveBeenCalledWith({
        where: { id: 'uuid-001' },
        data: {
          status: TransactionStatus.REFUNDED,
          failureReason: "Remboursement demandé par l'utilisateur",
        },
      });

      expect(result).toEqual({ status: 'refunded', referenceId: 'TX-REFUND-001' });
    });

    it('✅ Cas 2: Remboursement OK — statut BRIDGE_FAILED → REFUNDED', async () => {
      mockPrismaService.transaction.findUnique.mockResolvedValue({
        id: 'uuid-002',
        referenceId: 'TX-REFUND-002',
        status: TransactionStatus.BRIDGE_FAILED,
        kkiapayId: 'kkp_456',
      });

      (axios.post as jest.Mock).mockResolvedValue({ data: { status: 'success' } });

      const result = await service.refundTransaction('uuid-002');

      expect(result).toEqual({ status: 'refunded', referenceId: 'TX-REFUND-002' });
      expect(mockPrismaService.transaction.update).toHaveBeenCalled();
    });

    it('🚫 Cas 3: Refund impossible — statut COMPLETED', async () => {
      mockPrismaService.transaction.findUnique.mockResolvedValue({
        id: 'uuid-003',
        referenceId: 'TX-DONE',
        status: TransactionStatus.COMPLETED,
        kkiapayId: 'kkp_789',
      });

      await expect(service.refundTransaction('uuid-003')).rejects.toThrow(BadRequestException);
      await expect(service.refundTransaction('uuid-003')).rejects.toThrow(/Impossible de rembourser/);
      expect(axios.post).not.toHaveBeenCalled();
    });

    it('🚫 Cas 4: Refund impossible — pas de kkiapayId', async () => {
      mockPrismaService.transaction.findUnique.mockResolvedValue({
        id: 'uuid-004',
        referenceId: 'TX-NO-KKP',
        status: TransactionStatus.PAYIN_SUCCESS,
        kkiapayId: null,
      });

      await expect(service.refundTransaction('uuid-004')).rejects.toThrow(BadRequestException);
      await expect(service.refundTransaction('uuid-004')).rejects.toThrow(/Aucun ID Kkiapay/);
    });

    it('👻 Cas 5: Transaction inexistante → NotFoundException', async () => {
      mockPrismaService.transaction.findUnique.mockResolvedValue(null);

      await expect(service.refundTransaction('uuid-ghost')).rejects.toThrow(NotFoundException);
    });

    it('💥 Cas 6: API Kkiapay retourne une erreur → BadRequestException', async () => {
      mockPrismaService.transaction.findUnique.mockResolvedValue({
        id: 'uuid-005',
        referenceId: 'TX-API-FAIL',
        status: TransactionStatus.PAYIN_SUCCESS,
        kkiapayId: 'kkp_error',
      });

      (axios.post as jest.Mock).mockRejectedValue({
        response: { data: { message: 'Insufficient funds' } },
        message: 'Request failed',
      });

      await expect(service.refundTransaction('uuid-005')).rejects.toThrow(BadRequestException);
      // Le statut ne doit PAS être mis à jour si l'API échoue
      expect(mockPrismaService.transaction.update).not.toHaveBeenCalled();
    });
  });
});
