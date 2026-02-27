import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@prisma/client';
import { PolygonService } from '../blockchain/polygon.service';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from './users.service';

describe('UsersService - Wura QA', () => {
  let service: UsersService;

  const mockPrismaService = {
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    receiver: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    sender: {
      update: jest.fn(),
    },
    transaction: {
      findMany: jest.fn(),
    },
  };

  const mockPolygonService = {
    bridgeUsdtToReceiver: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: PolygonService, useValue: mockPolygonService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  // ================================================
  // createProvisionalReceiver
  // ================================================
  describe('createProvisionalReceiver', () => {
    it('✅ Cas 1: Crée un receiver provisoire avec email fourni', async () => {
      const mockUser = {
        id: 'uuid-prov-001',
        firebaseUid: 'PROV-1234567-abc',
        email: 'jean@example.com',
        role: Role.RECEIVER,
        receiver: { wuraId: 'WURA-XYZ123', web3AuthWalletAddress: null },
      };
      mockPrismaService.user.create.mockResolvedValue(mockUser);

      const result = await service.createProvisionalReceiver({
        firstName: 'Jean',
        lastName: 'Dupont',
        email: 'jean@example.com',
      });

      expect(mockPrismaService.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: 'jean@example.com',
            role: Role.RECEIVER,
          }),
        }),
      );
      expect(result.id).toBe('uuid-prov-001');
      expect(result.receiver.wuraId).toBe('WURA-XYZ123');
    });

    it('✅ Cas 2: Génère un email @wura.provisional si aucun email fourni', async () => {
      mockPrismaService.user.create.mockResolvedValue({
        id: 'uuid-prov-002',
        receiver: { wuraId: 'WURA-ABC456' },
      });

      await service.createProvisionalReceiver({ firstName: 'Marie', lastName: 'Martin' });

      const callArg = mockPrismaService.user.create.mock.calls[0][0];
      expect(callArg.data.email).toMatch(/@wura\.provisional$/);
    });

    it('✅ Cas 3: Le firebaseUid généré commence par PROV- (≠ UID du sender)', async () => {
      mockPrismaService.user.create.mockResolvedValue({
        id: 'uuid-prov-003',
        receiver: { wuraId: 'WURA-DEF789' },
      });

      await service.createProvisionalReceiver({ firstName: 'Test', lastName: 'User' });

      const callArg = mockPrismaService.user.create.mock.calls[0][0];
      expect(callArg.data.firebaseUid).toMatch(/^PROV-/);
      expect(callArg.data.role).toBe(Role.RECEIVER);
    });

    it('✅ Cas 4: Le wuraId généré commence par WURA-', async () => {
      mockPrismaService.user.create.mockResolvedValue({
        id: 'uuid-prov-004',
        receiver: { wuraId: 'WURA-GHI012' },
      });

      await service.createProvisionalReceiver({ firstName: 'Sophie', lastName: 'Leclerc' });

      const callArg = mockPrismaService.user.create.mock.calls[0][0];
      expect(callArg.data.receiver.create.wuraId).toMatch(/^WURA-/);
    });

    it('💥 Cas 5: ConflictException si Prisma échoue (collision uid)', async () => {
      mockPrismaService.user.create.mockRejectedValue(new Error('Unique constraint failed'));

      await expect(
        service.createProvisionalReceiver({ firstName: 'X', lastName: 'Y' }),
      ).rejects.toThrow(ConflictException);
      await expect(
        service.createProvisionalReceiver({ firstName: 'X', lastName: 'Y' }),
      ).rejects.toThrow(/Impossible de créer/);
    });
  });

  // ================================================
  // checkWuraId
  // ================================================
  describe('checkWuraId', () => {
    it('✅ WuraId disponible → available: true', async () => {
      mockPrismaService.receiver.findUnique.mockResolvedValue(null);
      const result = await service.checkWuraId('WURA-FREE123');
      expect(result).toEqual({ available: true });
    });

    it('🚫 WuraId déjà pris → available: false', async () => {
      mockPrismaService.receiver.findUnique.mockResolvedValue({ wuraId: 'WURA-TAKEN' });
      const result = await service.checkWuraId('WURA-TAKEN');
      expect(result).toEqual({ available: false });
    });
  });

  // ================================================
  // searchWuraId
  // ================================================
  describe('searchWuraId', () => {
    it('✅ Retourne les résultats avec email du user associé', async () => {
      mockPrismaService.receiver.findMany.mockResolvedValue([
        { id: 'r1', wuraId: 'WURA-JEAN1', user: { email: 'jean@test.com' } },
        { id: 'r2', wuraId: 'WURA-JEAN2', user: { email: 'jean2@test.com' } },
      ]);

      const results = await service.searchWuraId('JEAN');
      expect(results).toHaveLength(2);
      expect(results[0]).toEqual({ id: 'r1', wuraId: 'WURA-JEAN1', email: 'jean@test.com' });
    });

    it('✅ Retourne un tableau vide si aucun résultat', async () => {
      mockPrismaService.receiver.findMany.mockResolvedValue([]);
      const results = await service.searchWuraId('ZZZNOBODY');
      expect(results).toHaveLength(0);
    });
  });

  // ================================================
  // createSender
  // ================================================
  describe('createSender', () => {
    it('✅ Crée un sender avec les bons champs', async () => {
      mockPrismaService.user.create.mockResolvedValue({
        id: 'sender-001',
        role: Role.SENDER,
        sender: { firstName: 'Amadou', lastName: 'Koné', country: 'SN' },
      });

      const result = await service.createSender({
        firebaseUid: 'firebase-abc',
        phone: '+2210000000',
        firstName: 'Amadou',
        lastName: 'Koné',
        country: 'SN',
      });

      expect(mockPrismaService.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            firebaseUid: 'firebase-abc',
            phone: '+2210000000',
            role: Role.SENDER,
          }),
        }),
      );
      expect(result.role).toBe(Role.SENDER);
    });

    it('💥 ConflictException si user existe déjà', async () => {
      mockPrismaService.user.create.mockRejectedValue(new Error('Unique constraint'));
      await expect(
        service.createSender({ firebaseUid: 'dup', phone: '+229dup', firstName: 'A', lastName: 'B', country: 'BJ' }),
      ).rejects.toThrow(ConflictException);
    });
  });
});
