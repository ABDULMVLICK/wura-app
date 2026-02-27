import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TransactionStatus } from '@prisma/client';
import { PolygonService } from '../blockchain/polygon.service';
import { KkiapayService } from '../kkiapay/kkiapay.service';
import { NotificationService } from '../notifications/notification.service';
import { PrismaService } from '../prisma/prisma.service';
import { AdminService } from './admin.service';

describe('AdminService - Wura QA', () => {
  let service: AdminService;

  const mockPrismaService = {
    transaction: {
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
      groupBy: jest.fn(),
      $queryRaw: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      delete: jest.fn(),
    },
    exchangeRate: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    sender: { delete: jest.fn() },
    receiver: { delete: jest.fn() },
    receiverVolume: { deleteMany: jest.fn() },
  };

  const mockPolygonService = {
    getTreasuryAddress: jest.fn().mockReturnValue('0xTREASURY_ADDRESS'),
    bridgeUsdtToReceiver: jest.fn().mockResolvedValue(undefined),
  };

  const mockKkiapayService = {};

  const mockNotificationService = {
    sendPushNotification: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: PolygonService, useValue: mockPolygonService },
        { provide: KkiapayService, useValue: mockKkiapayService },
        { provide: NotificationService, useValue: mockNotificationService },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
    jest.clearAllMocks();
  });

  // ================================================
  // retryBridge
  // ================================================
  describe('retryBridge', () => {
    it('✅ Cas 1: Retry réussi — status reset à PAYIN_SUCCESS + bridge lancé async', async () => {
      mockPrismaService.transaction.findUnique.mockResolvedValue({
        id: 'tx-uuid-001',
        referenceId: 'TX-WURA-RETRY-001',
        status: TransactionStatus.BRIDGE_FAILED,
      });
      mockPrismaService.transaction.update.mockResolvedValue({});

      const result = await service.retryBridge('tx-uuid-001');

      expect(mockPrismaService.transaction.update).toHaveBeenCalledWith({
        where: { id: 'tx-uuid-001' },
        data: {
          status: TransactionStatus.PAYIN_SUCCESS,
          failureReason: null,
        },
      });
      expect(mockPolygonService.bridgeUsdtToReceiver).toHaveBeenCalledWith('TX-WURA-RETRY-001');
      expect(result).toEqual({ status: 'retry_initiated', referenceId: 'TX-WURA-RETRY-001' });
    });

    it('👻 Cas 2: Transaction inexistante → NotFoundException', async () => {
      mockPrismaService.transaction.findUnique.mockResolvedValue(null);

      await expect(service.retryBridge('ghost-uuid')).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.transaction.update).not.toHaveBeenCalled();
    });
  });

  // ================================================
  // forceTransactionStatus
  // ================================================
  describe('forceTransactionStatus', () => {
    it('✅ Cas 1: Force statut COMPLETED sans raison', async () => {
      mockPrismaService.transaction.findUnique.mockResolvedValue({ id: 'tx-001' });
      mockPrismaService.transaction.update.mockResolvedValue({ id: 'tx-001', status: TransactionStatus.COMPLETED });

      await service.forceTransactionStatus('tx-001', TransactionStatus.COMPLETED);

      expect(mockPrismaService.transaction.update).toHaveBeenCalledWith({
        where: { id: 'tx-001' },
        data: { status: TransactionStatus.COMPLETED },
      });
    });

    it('✅ Cas 2: Force statut REFUNDED avec raison admin', async () => {
      mockPrismaService.transaction.findUnique.mockResolvedValue({ id: 'tx-002' });
      mockPrismaService.transaction.update.mockResolvedValue({});

      await service.forceTransactionStatus('tx-002', TransactionStatus.REFUNDED, 'Fraude détectée');

      expect(mockPrismaService.transaction.update).toHaveBeenCalledWith({
        where: { id: 'tx-002' },
        data: {
          status: TransactionStatus.REFUNDED,
          failureReason: 'Fraude détectée',
        },
      });
    });

    it('👻 Cas 3: Transaction inexistante → NotFoundException', async () => {
      mockPrismaService.transaction.findUnique.mockResolvedValue(null);

      await expect(
        service.forceTransactionStatus('ghost-tx', TransactionStatus.COMPLETED),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ================================================
  // updateRate
  // ================================================
  describe('updateRate', () => {
    it('✅ Cas 1: Mise à jour baseRate + markupPercent', async () => {
      mockPrismaService.exchangeRate.findUnique.mockResolvedValue({ pair: 'XOF_USDT', baseRate: 0.00163 });
      mockPrismaService.exchangeRate.update.mockResolvedValue({ pair: 'XOF_USDT', baseRate: 0.00165, markupPercent: 2 });

      await service.updateRate('XOF_USDT', { baseRate: 0.00165, markupPercent: 2 });

      expect(mockPrismaService.exchangeRate.update).toHaveBeenCalledWith({
        where: { pair: 'XOF_USDT' },
        data: { baseRate: 0.00165, markupPercent: 2 },
      });
    });

    it('✅ Cas 2: Mise à jour partielle (markupPercent seulement → baseRate non envoyé)', async () => {
      mockPrismaService.exchangeRate.findUnique.mockResolvedValue({ pair: 'USDT_EUR' });
      mockPrismaService.exchangeRate.update.mockResolvedValue({});

      await service.updateRate('USDT_EUR', { markupPercent: 1.5 });

      const updateArg = mockPrismaService.exchangeRate.update.mock.calls[0][0];
      expect(updateArg.data).toEqual({ markupPercent: 1.5 });
      expect(updateArg.data.baseRate).toBeUndefined();
    });

    it('👻 Cas 3: Paire inconnue → NotFoundException', async () => {
      mockPrismaService.exchangeRate.findUnique.mockResolvedValue(null);

      await expect(service.updateRate('UNKNOWN_PAIR', { baseRate: 1 })).rejects.toThrow(NotFoundException);
      await expect(service.updateRate('UNKNOWN_PAIR', { baseRate: 1 })).rejects.toThrow(/Taux introuvable/);
      expect(mockPrismaService.exchangeRate.update).not.toHaveBeenCalled();
    });
  });

  // ================================================
  // sendPushToUser
  // ================================================
  describe('sendPushToUser', () => {
    it('✅ Cas 1: Notification envoyée avec succès', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-001',
        email: 'user@example.com',
        pushToken: 'ExponentPushToken[abc123]',
      });

      const result = await service.sendPushToUser('user-001', 'Alerte', 'Votre transfert est arrivé');

      expect(mockNotificationService.sendPushNotification).toHaveBeenCalledWith({
        to: 'ExponentPushToken[abc123]',
        title: 'Alerte',
        body: 'Votre transfert est arrivé',
        sound: 'default',
        data: { type: 'ADMIN_MESSAGE' },
      });
      expect(result).toEqual({ status: 'sent', userId: 'user-001', email: 'user@example.com' });
    });

    it('🚫 Cas 2: Pas de push token → BadRequestException', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-002',
        email: 'nopush@example.com',
        pushToken: null,
      });

      await expect(service.sendPushToUser('user-002', 'Test', 'Message')).rejects.toThrow(BadRequestException);
      expect(mockNotificationService.sendPushNotification).not.toHaveBeenCalled();
    });

    it('👻 Cas 3: Utilisateur inexistant → NotFoundException', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.sendPushToUser('ghost-user', 'Test', 'Msg')).rejects.toThrow(NotFoundException);
    });
  });

  // ================================================
  // broadcastPush
  // ================================================
  describe('broadcastPush', () => {
    it('✅ Cas 1: Broadcast ALL — envoie à tous les utilisateurs avec token', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([
        { id: 'u1', pushToken: 'ExponentPushToken[tok1]', email: 'a@a.com' },
        { id: 'u2', pushToken: 'ExponentPushToken[tok2]', email: 'b@b.com' },
        { id: 'u3', pushToken: 'ExponentPushToken[tok3]', email: 'c@c.com' },
      ]);

      const result = await service.broadcastPush('Titre', 'Contenu broadcast');

      expect(mockNotificationService.sendPushNotification).toHaveBeenCalledTimes(3);
      expect(result).toEqual({ status: 'broadcast_done', total: 3, successCount: 3 });
    });

    it('✅ Cas 2: Broadcast filtré par role SENDER', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([
        { id: 'u1', pushToken: 'tok1', email: 'sender@test.com' },
      ]);

      await service.broadcastPush('Promo', 'Offre exclusive', 'SENDER');

      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ role: 'SENDER' }),
        }),
      );
    });

    it('✅ Cas 3: Echecs partiels — successCount < total', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([
        { id: 'u1', pushToken: 'tok1', email: 'ok@a.com' },
        { id: 'u2', pushToken: 'tok2', email: 'fail@b.com' },
      ]);
      mockNotificationService.sendPushNotification
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('Push token invalide'));

      const result = await service.broadcastPush('Test', 'Message');

      expect(result.total).toBe(2);
      expect(result.successCount).toBe(1);
      expect(result.status).toBe('broadcast_done');
    });

    it('✅ Cas 4: Aucun utilisateur avec token → 0 envois', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([]);

      const result = await service.broadcastPush('Vide', 'Personne');

      expect(mockNotificationService.sendPushNotification).not.toHaveBeenCalled();
      expect(result).toEqual({ status: 'broadcast_done', total: 0, successCount: 0 });
    });
  });

  // ================================================
  // deleteUser
  // ================================================
  describe('deleteUser', () => {
    it('✅ Cas 1: Suppression d\'un receiver sans transactions actives', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-del-001',
        email: 'del@test.com',
        sender: null,
        receiver: {
          id: 'recv-del-001',
          transactions: [],
        },
      });

      const result = await service.deleteUser('user-del-001');

      // Transactions supprimées en premier (contrainte FK)
      expect(mockPrismaService.transaction.deleteMany).toHaveBeenCalledWith({
        where: { receiverId: 'recv-del-001' },
      });
      expect(mockPrismaService.receiverVolume.deleteMany).toHaveBeenCalledWith({
        where: { receiverId: 'recv-del-001' },
      });
      expect(mockPrismaService.receiver.delete).toHaveBeenCalledWith({
        where: { id: 'recv-del-001' },
      });
      expect(mockPrismaService.user.delete).toHaveBeenCalledWith({
        where: { id: 'user-del-001' },
      });
      expect(result).toEqual({ status: 'deleted', userId: 'user-del-001', email: 'del@test.com' });
    });

    it('✅ Cas 2: Suppression d\'un sender avec transactions terminées (COMPLETED)', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-del-002',
        email: 'sender-del@test.com',
        sender: {
          id: 'sender-del-001',
          transactions: [
            { id: 'tx-done', status: TransactionStatus.COMPLETED },
            { id: 'tx-refund', status: TransactionStatus.REFUNDED },
          ],
        },
        receiver: null,
      });

      const result = await service.deleteUser('user-del-002');

      // Transactions du sender supprimées avant le sender
      expect(mockPrismaService.transaction.deleteMany).toHaveBeenCalledWith({
        where: { senderId: 'sender-del-001' },
      });
      expect(mockPrismaService.sender.delete).toHaveBeenCalledWith({ where: { id: 'sender-del-001' } });
      expect(result.status).toBe('deleted');
    });

    it('🚫 Cas 3: Transaction BRIDGE_PROCESSING active → suppression bloquée', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-active',
        email: 'active@test.com',
        sender: {
          id: 'sender-active',
          transactions: [{ id: 'tx-1', status: TransactionStatus.BRIDGE_PROCESSING }],
        },
        receiver: null,
      });

      await expect(service.deleteUser('user-active')).rejects.toThrow(BadRequestException);
      await expect(service.deleteUser('user-active')).rejects.toThrow(/transactions en cours/);
      expect(mockPrismaService.user.delete).not.toHaveBeenCalled();
    });

    it('🚫 Cas 4: Transaction OFFRAMP_PROCESSING → bloquée', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-offramp',
        email: 'offramp@test.com',
        sender: null,
        receiver: {
          id: 'recv-offramp',
          transactions: [{ id: 'tx-2', status: TransactionStatus.OFFRAMP_PROCESSING }],
        },
      });

      await expect(service.deleteUser('user-offramp')).rejects.toThrow(BadRequestException);
    });

    it('🚫 Cas 5: Transaction PAYIN_SUCCESS (escrow) → bloquée', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-escrow',
        email: 'escrow@test.com',
        sender: null,
        receiver: {
          id: 'recv-escrow',
          transactions: [{ id: 'tx-3', status: TransactionStatus.PAYIN_SUCCESS }],
        },
      });

      await expect(service.deleteUser('user-escrow')).rejects.toThrow(BadRequestException);
    });

    it('👻 Cas 6: Utilisateur inexistant → NotFoundException', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.deleteUser('ghost-uuid')).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.user.delete).not.toHaveBeenCalled();
    });
  });
});
