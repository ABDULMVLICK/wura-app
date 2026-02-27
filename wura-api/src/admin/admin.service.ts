import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { TransactionStatus } from '@prisma/client';
import axios from 'axios';
import { ethers } from 'ethers';
import { PolygonService } from '../blockchain/polygon.service';
import { KkiapayService } from '../kkiapay/kkiapay.service';
import { NotificationService } from '../notifications/notification.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
    private readonly logger = new Logger(AdminService.name);

    private readonly erc20Abi = [
        'function balanceOf(address account) view returns (uint256)',
    ];

    constructor(
        private prisma: PrismaService,
        private polygonService: PolygonService,
        private kkiapayService: KkiapayService,
        private notificationService: NotificationService,
    ) { }

    // ─── LIQUIDITÉ ──────────────────────────────────────────────────────────────

    async getLiquidity() {
        const treasuryAddress = this.polygonService.getTreasuryAddress();
        const kkiapayPrivateKey = process.env.KKIAPAY_PRIVATE_KEY;
        const rpcUrl = process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com';
        const usdtContractAddress = process.env.USDT_CONTRACT_ADDRESS || '0xc2132D05D31c914a87C6611C10748AEb04B58e8F';

        // Solde Kkiapay (XOF)
        let kkiapayBalanceCfa = 0;
        let kkiapayError: string | null = null;
        if (kkiapayPrivateKey) {
            try {
                const res = await axios.get('https://api.kkiapay.me/api/v1/merchants/me', {
                    headers: { 'x-private-key': kkiapayPrivateKey },
                });
                kkiapayBalanceCfa =
                    res.data?.balance ??
                    res.data?.wallet?.balance ??
                    res.data?.data?.balance ??
                    0;
            } catch (e) {
                kkiapayError = e.response?.data?.message ?? e.message;
                this.logger.warn(`[Admin] Kkiapay balance error: ${kkiapayError}`);
            }
        }

        // Soldes trésorerie Polygon (USDT + POL)
        let usdtBalance = '0';
        let polBalance = '0';
        let blockchainError: string | null = null;

        if (treasuryAddress) {
            try {
                const provider = new ethers.JsonRpcProvider(rpcUrl);
                const contract = new ethers.Contract(usdtContractAddress, this.erc20Abi, provider);

                const [usdtRaw, polRaw] = await Promise.all([
                    contract.balanceOf(treasuryAddress),
                    provider.getBalance(treasuryAddress),
                ]);

                usdtBalance = ethers.formatUnits(usdtRaw, 6);
                polBalance = ethers.formatEther(polRaw);
            } catch (e) {
                blockchainError = e.message;
                this.logger.warn(`[Admin] Blockchain balance error: ${blockchainError}`);
            }
        }

        // Escrow : USDT bloqué pour les receivers sans wallet
        const pendingEscrow = await this.prisma.transaction.aggregate({
            where: { status: TransactionStatus.PAYIN_SUCCESS },
            _sum: { amountUsdtBridged: true },
            _count: true,
        });

        return {
            kkiapay: {
                balanceCfa: kkiapayBalanceCfa,
                error: kkiapayError,
            },
            treasury: {
                address: treasuryAddress,
                usdtBalance,
                polBalance,
                error: blockchainError,
            },
            escrow: {
                pendingUsdt: pendingEscrow._sum.amountUsdtBridged?.toNumber() ?? 0,
                txCount: pendingEscrow._count,
            },
        };
    }

    // ─── ANALYTICS ──────────────────────────────────────────────────────────────

    async getAnalytics() {
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const [allTime, last30Days, statusBreakdown] = await Promise.all([
            this.prisma.transaction.aggregate({
                where: { status: TransactionStatus.COMPLETED },
                _sum: {
                    amountFiatIn: true,
                    wuraFee: true,
                    amountUsdtBridged: true,
                    kkiapayFeeCfa: true,
                },
                _count: true,
            }),
            this.prisma.transaction.aggregate({
                where: {
                    status: TransactionStatus.COMPLETED,
                    createdAt: { gte: thirtyDaysAgo },
                },
                _sum: { amountFiatIn: true, wuraFee: true },
                _count: true,
            }),
            this.prisma.transaction.groupBy({
                by: ['status'],
                _count: true,
            }),
        ]);

        // Courbe 7 jours (volume + count par jour)
        const dailyData = await this.prisma.$queryRaw<
            { day: Date; count: bigint; volume: number }[]
        >`
            SELECT DATE_TRUNC('day', created_at) AS day,
                   COUNT(*)::int                 AS count,
                   COALESCE(SUM(amount_fiat_in), 0) AS volume
            FROM transactions
            WHERE created_at >= ${sevenDaysAgo}
            GROUP BY DATE_TRUNC('day', created_at)
            ORDER BY day ASC
        `;

        return {
            allTime: {
                completedCount: allTime._count,
                volumeCfa: allTime._sum.amountFiatIn?.toNumber() ?? 0,
                revenueWuraFeeCfa: allTime._sum.wuraFee?.toNumber() ?? 0,
                volumeUsdt: allTime._sum.amountUsdtBridged?.toNumber() ?? 0,
                kkiapayFeesTotalCfa: allTime._sum.kkiapayFeeCfa?.toNumber() ?? 0,
            },
            last30Days: {
                completedCount: last30Days._count,
                volumeCfa: last30Days._sum.amountFiatIn?.toNumber() ?? 0,
                revenueWuraFeeCfa: last30Days._sum.wuraFee?.toNumber() ?? 0,
            },
            statusBreakdown: statusBreakdown.map(s => ({
                status: s.status,
                count: s._count,
            })),
            dailyChart: dailyData.map(d => ({
                day: d.day,
                count: Number(d.count),
                volume: Number(d.volume),
            })),
        };
    }

    // ─── TRANSACTIONS ────────────────────────────────────────────────────────────

    async getTransactions(page = 1, limit = 20, status?: TransactionStatus) {
        const where = status ? { status } : {};
        const skip = (page - 1) * limit;

        const [transactions, total] = await Promise.all([
            this.prisma.transaction.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    sender: { select: { firstName: true, lastName: true } },
                    receiver: {
                        select: {
                            wuraId: true,
                            web3AuthWalletAddress: true,
                        },
                    },
                },
            }),
            this.prisma.transaction.count({ where }),
        ]);

        return {
            data: transactions,
            meta: { total, page, limit, pages: Math.ceil(total / limit) },
        };
    }

    async retryBridge(transactionId: string, adminName = 'Admin') {
        const tx = await this.prisma.transaction.findUnique({
            where: { id: transactionId },
        });
        if (!tx) throw new NotFoundException('Transaction introuvable');

        // Reset en PAYIN_SUCCESS pour que bridgeUsdtToReceiver puisse re-traiter
        await this.prisma.transaction.update({
            where: { id: transactionId },
            data: {
                status: TransactionStatus.PAYIN_SUCCESS,
                failureReason: null,
            },
        });

        // Bridge asynchrone (non bloquant)
        this.polygonService.bridgeUsdtToReceiver(tx.referenceId).catch(err => {
            this.logger.error(`[Admin] Retry bridge failed for ${tx.referenceId}: ${err.message}`);
        });

        await this.logAction(adminName, 'RETRY_BRIDGE', `ref=${tx.referenceId}`);
        return { status: 'retry_initiated', referenceId: tx.referenceId };
    }

    // ─── USERS ───────────────────────────────────────────────────────────────────

    async getUsers(page = 1, limit = 20) {
        const skip = (page - 1) * limit;

        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    sender: {
                        include: {
                            transactions: {
                                select: { amountFiatIn: true },
                                where: { status: TransactionStatus.COMPLETED },
                            },
                        },
                    },
                    receiver: {
                        select: {
                            wuraId: true,
                            web3AuthWalletAddress: true,
                            volumes: true,
                        },
                    },
                },
            }),
            this.prisma.user.count(),
        ]);

        const enriched = users.map(u => {
            const ltv =
                u.sender?.transactions.reduce(
                    (sum, t) => sum + t.amountFiatIn.toNumber(),
                    0,
                ) ?? 0;

            return {
                id: u.id,
                email: u.email,
                phone: u.phone,
                role: u.role,
                createdAt: u.createdAt,
                sender: u.sender
                    ? {
                        firstName: u.sender.firstName,
                        lastName: u.sender.lastName,
                        completedTxCount: u.sender.transactions.length,
                        ltv,
                    }
                    : null,
                receiver: u.receiver
                    ? {
                        wuraId: u.receiver.wuraId,
                        walletAddress: u.receiver.web3AuthWalletAddress,
                        volumeEur: u.receiver.volumes?.totalVolumeEur.toNumber() ?? 0,
                    }
                    : null,
            };
        });

        return {
            data: enriched,
            meta: { total, page, limit, pages: Math.ceil(total / limit) },
        };
    }

    // ─── TAUX DE CHANGE ──────────────────────────────────────────────────────────

    async getRates() {
        return this.prisma.exchangeRate.findMany({
            orderBy: { pair: 'asc' },
        });
    }

    async updateRate(pair: string, data: { baseRate?: number; markupPercent?: number }, adminName = 'Admin') {
        const rate = await this.prisma.exchangeRate.findUnique({ where: { pair } });
        if (!rate) throw new NotFoundException(`Taux introuvable pour la paire ${pair}`);

        const result = await this.prisma.exchangeRate.update({
            where: { pair },
            data: {
                ...(data.baseRate !== undefined && { baseRate: data.baseRate }),
                ...(data.markupPercent !== undefined && { markupPercent: data.markupPercent }),
            },
        });

        const details = [
            data.baseRate !== undefined ? `baseRate=${data.baseRate}` : null,
            data.markupPercent !== undefined ? `markup=${data.markupPercent}%` : null,
        ].filter(Boolean).join(', ');
        await this.logAction(adminName, 'UPDATE_RATE', `pair=${pair} ${details}`);
        return result;
    }

    // ─── FORCE STATUT ────────────────────────────────────────────────────────────

    async forceTransactionStatus(transactionId: string, status: TransactionStatus, reason?: string, adminName = 'Admin') {
        const tx = await this.prisma.transaction.findUnique({ where: { id: transactionId } });
        if (!tx) throw new NotFoundException('Transaction introuvable');

        const result = await this.prisma.transaction.update({
            where: { id: transactionId },
            data: {
                status,
                ...(reason && { failureReason: reason }),
            },
        });

        await this.logAction(adminName, 'FORCE_STATUS',
            `ref=${tx.referenceId} ${tx.status}→${status}${reason ? ` (${reason})` : ''}`);
        return result;
    }

    // ─── PUSH NOTIFICATIONS ──────────────────────────────────────────────────────

    async sendPushToUser(userId: string, title: string, body: string, adminName = 'Admin') {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new NotFoundException('Utilisateur introuvable');
        if (!user.pushToken) throw new BadRequestException('Cet utilisateur n\'a pas de push token enregistré');

        await this.notificationService.sendPushNotification({
            to: user.pushToken,
            title,
            body,
            sound: 'default',
            data: { type: 'ADMIN_MESSAGE' },
        });

        await this.logAction(adminName, 'PUSH_USER', `userId=${userId} title="${title}"`);
        return { status: 'sent', userId, email: user.email };
    }

    async broadcastPush(title: string, body: string, role?: 'SENDER' | 'RECEIVER', adminName = 'Admin') {
        const where = {
            pushToken: { not: null },
            ...(role && { role }),
        };

        const users = await this.prisma.user.findMany({
            where,
            select: { id: true, pushToken: true, email: true },
        });

        let successCount = 0;
        for (const user of users) {
            try {
                await this.notificationService.sendPushNotification({
                    to: user.pushToken!,
                    title,
                    body,
                    sound: 'default',
                    data: { type: 'ADMIN_BROADCAST' },
                });
                successCount++;
            } catch (e) {
                this.logger.warn(`[Admin] Broadcast failed for user ${user.id}: ${e.message}`);
            }
        }

        await this.logAction(adminName, 'BROADCAST_PUSH',
            `title="${title}" role=${role ?? 'ALL'} envoyé=${successCount}/${users.length}`);
        return {
            status: 'broadcast_done',
            total: users.length,
            successCount,
        };
    }

    // ─── SUPPRESSION UTILISATEUR ─────────────────────────────────────────────────

    async deleteUser(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                sender: { include: { transactions: { select: { id: true, status: true } } } },
                receiver: { include: { transactions: { select: { id: true, status: true } } } },
            },
        });
        if (!user) throw new NotFoundException('Utilisateur introuvable');

        const activeTxStatuses: TransactionStatus[] = [
            TransactionStatus.INITIATED,
            TransactionStatus.PAYIN_PENDING,
            TransactionStatus.PAYIN_SUCCESS,
            TransactionStatus.BRIDGE_PROCESSING,
            TransactionStatus.WAITING_USER_OFFRAMP,
            TransactionStatus.OFFRAMP_PROCESSING,
        ];

        const allTxs = [
            ...(user.sender?.transactions ?? []),
            ...(user.receiver?.transactions ?? []),
        ];

        const hasActiveTx = allTxs.some(tx => activeTxStatuses.includes(tx.status));
        if (hasActiveTx) {
            throw new BadRequestException(
                'Impossible de supprimer : cet utilisateur a des transactions en cours. Résolvez-les d\'abord.',
            );
        }

        // Suppression en cascade dans l'ordre correct (contraintes FK)
        // Les transactions doivent être supprimées AVANT le Sender/Receiver qu'elles référencent
        if (user.receiver) {
            await this.prisma.transaction.deleteMany({ where: { receiverId: user.receiver.id } });
            await this.prisma.receiverVolume.deleteMany({ where: { receiverId: user.receiver.id } });
            await this.prisma.receiver.delete({ where: { id: user.receiver.id } });
        }
        if (user.sender) {
            await this.prisma.transaction.deleteMany({ where: { senderId: user.sender.id } });
            await this.prisma.sender.delete({ where: { id: user.sender.id } });
        }
        await this.prisma.user.delete({ where: { id: userId } });

        await this.logAction(adminName, 'DELETE_USER', `userId=${userId} email=${user.email ?? 'N/A'}`);
        return { status: 'deleted', userId, email: user.email };
    }

    // ─── JOURNAL D'AUDIT ─────────────────────────────────────────────────────────

    async logAction(adminName: string, action: string, details?: string) {
        await this.prisma.adminLog.create({
            data: { adminName, action, details },
        });
    }

    async getAuditLogs(page = 1, limit = 50) {
        const skip = (page - 1) * limit;
        const [logs, total] = await this.prisma.$transaction([
            this.prisma.adminLog.findMany({
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.adminLog.count(),
        ]);
        return { data: logs, meta: { total, page, limit, pages: Math.ceil(total / limit) } };
    }
}
