import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { Role, TransactionStatus } from '@prisma/client';
import { PolygonService } from '../blockchain/polygon.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
    private readonly logger = new Logger(UsersService.name);

    constructor(
        private prisma: PrismaService,
        private polygonService: PolygonService,
    ) { }

    async createSender(data: { firebaseUid: string, phone: string, firstName: string, lastName: string, country: string }) {
        try {
            return await this.prisma.user.create({
                data: {
                    firebaseUid: data.firebaseUid,
                    phone: data.phone,
                    role: Role.SENDER,
                    sender: {
                        create: {
                            firstName: data.firstName,
                            lastName: data.lastName,
                            country: data.country,
                        }
                    }
                },
                include: { sender: true }
            });
        } catch (e) {
            throw new ConflictException('User already exists');
        }
    }

    async createReceiver(data: { firebaseUid: string, email: string, firstName: string, lastName: string, web3AuthWalletAddress?: string }) {
        const wuraId = 'WURA-' + Math.random().toString(36).substring(2, 9).toUpperCase();

        try {
            return await this.prisma.user.create({
                data: {
                    firebaseUid: data.firebaseUid,
                    email: data.email,
                    role: Role.RECEIVER,
                    receiver: {
                        create: {
                            wuraId: wuraId,
                            web3AuthWalletAddress: data.web3AuthWalletAddress,
                        }
                    }
                },
                include: { receiver: true }
            });
        } catch (e) {
            throw new ConflictException('User already exists');
        }
    }

    /**
     * Crée un receiver "provisoire" pour un bénéficiaire sans compte Wura.
     * Utilisé par les senders lors de l'ajout d'un bénéficiaire.
     * Le receiver obtient un UID système unique (pas celui du sender).
     */
    async createProvisionalReceiver(data: { firstName: string; lastName: string; email?: string }) {
        const provisionalUid = `PROV-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        const email = data.email || `${provisionalUid}@wura.provisional`;
        const wuraId = 'WURA-' + Math.random().toString(36).substring(2, 9).toUpperCase();

        try {
            return await this.prisma.user.create({
                data: {
                    firebaseUid: provisionalUid,
                    email,
                    role: Role.RECEIVER,
                    receiver: {
                        create: { wuraId },
                    },
                },
                include: { receiver: true },
            });
        } catch (e) {
            throw new ConflictException('Impossible de créer le bénéficiaire');
        }
    }

    async findByFirebaseUid(uid: string) {
        return this.prisma.user.findUnique({
            where: { firebaseUid: uid },
            include: { sender: true, receiver: true }
        });
    }

    async updateWuraId(firebaseUid: string, wuraId: string) {
        // Find existing receiver by wuraId to check for duplicates
        const existing = await this.prisma.receiver.findUnique({
            where: { wuraId }
        });

        if (existing) {
            throw new ConflictException('This Wura ID is already taken');
        }

        // Find the user making the request
        const user = await this.findByFirebaseUid(firebaseUid);
        if (!user || user.role !== Role.RECEIVER || !user.receiver) {
            throw new ConflictException('Invalid user or not a receiver');
        }

        // Update the Wura ID
        return this.prisma.receiver.update({
            where: { id: user.receiver.id },
            data: { wuraId }
        });
    }

    async checkWuraId(wuraId: string) {
        const existing = await this.prisma.receiver.findUnique({
            where: { wuraId }
        });
        return { available: !existing };
    }

    async searchWuraId(query: string) {
        const receivers = await this.prisma.receiver.findMany({
            where: {
                wuraId: {
                    contains: query,
                    mode: 'insensitive'
                }
            },
            include: {
                user: true
            },
            take: 10
        });

        return receivers.map(r => ({
            id: r.id,
            wuraId: r.wuraId,
            email: r.user.email,
        }));
    }

    /**
     * Met à jour l'adresse wallet du receiver et déclenche l'envoi
     * automatique des USDT en escrow (transactions PAYIN_SUCCESS sans bridge).
     */
    async updateWalletAddress(firebaseUid: string, walletAddress: string) {
        const user = await this.findByFirebaseUid(firebaseUid);
        if (!user || user.role !== Role.RECEIVER || !user.receiver) {
            throw new ConflictException('Utilisateur invalide ou non receiver');
        }

        // Sauvegarder le wallet
        await this.prisma.receiver.update({
            where: { id: user.receiver.id },
            data: { web3AuthWalletAddress: walletAddress },
        });
        this.logger.log(`💼 Wallet mis à jour pour ${user.receiver.wuraId}: ${walletAddress}`);

        // Auto-release escrow: chercher les transactions PAYIN_SUCCESS en attente
        const pendingTxs = await this.prisma.transaction.findMany({
            where: {
                receiverId: user.receiver.id,
                status: TransactionStatus.PAYIN_SUCCESS,
            },
        });

        if (pendingTxs.length > 0) {
            this.logger.log(`🔓 ${pendingTxs.length} transaction(s) en escrow détectée(s) pour ${user.receiver.wuraId}. Lancement du bridge...`);
            for (const tx of pendingTxs) {
                this.polygonService.bridgeUsdtToReceiver(tx.referenceId).catch(err => {
                    this.logger.error(`❌ Échec auto-bridge pour ${tx.referenceId}: ${err.message}`);
                });
            }
        }

        return { walletAddress, pendingBridges: pendingTxs.length };
    }
}
