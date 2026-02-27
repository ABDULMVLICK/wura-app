import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Role, TransactionStatus } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PolygonService } from '../blockchain/polygon.service';
import { PrismaService } from '../prisma/prisma.service';
import { DeliverySpeed, QuotationService } from '../quotation/quotation.service';

@Injectable()
export class TransactionsService {
    constructor(
        private prisma: PrismaService,
        private quotationService: QuotationService,
        private polygonService: PolygonService,
    ) { }

    async createTransaction(senderUserId: string, data: { receiverWuraId: string, amountFiatIn: number, amountFiatOutExpected: number, deliverySpeed: string }) {
        const sender = await this.prisma.sender.findUnique({
            where: { userId: senderUserId }
        });

        const receiver = await this.prisma.receiver.findUnique({
            where: { wuraId: data.receiverWuraId }
        });

        if (!sender || !receiver) {
            throw new NotFoundException('Sender or Receiver not found');
        }

        const referenceId = `TX-${randomUUID().split('-')[0].toUpperCase()}`;

        const speedEnum = data.deliverySpeed === 'INSTANT' ? DeliverySpeed.INSTANT : DeliverySpeed.STANDARD;
        const routingStrategy = speedEnum === DeliverySpeed.INSTANT ? 'TRANSAK' : 'MT_PELERIN';

        // Demander un devis final au QuotationService
        const quote = await this.quotationService.getQuote({
            amount: data.amountFiatIn,
            currency: 'XOF', // On se base sur le montant en CFA saisi par le Sender
            speed: speedEnum
        });

        // Calcul Wura Fee (Profit brut sur le taux de change).
        // (Taux vendu au client - Taux réel estimé) * Montant EUR
        // Mock actuel du coût USDT : 615 CFA/USDT (Binance P2P). 
        // Wura le vend à 720 CFA (Instant) ou 690 CFA (Standard).
        const actualUsdtCostRate = 615;
        const coutDeRevientAchatUsdt = quote.montant_usdt_a_envoyer_polygon * actualUsdtCostRate;
        const wuraFee = data.amountFiatIn - coutDeRevientAchatUsdt;

        return this.prisma.transaction.create({
            data: {
                referenceId,
                senderId: sender.id,
                receiverId: receiver.id,
                status: TransactionStatus.INITIATED,
                routingStrategy,
                deliverySpeed: data.deliverySpeed,
                amountFiatIn: data.amountFiatIn,
                amountUsdtBridged: quote.montant_usdt_a_envoyer_polygon,
                amountFiatOutExpected: quote.montant_euro_recu_par_jean,
                // Comptabilité
                clientExchangeRate: quote.taux_wura_cfa,
                actualUsdtCostRate,
                kkiapayFeeCfa: quote.kkiapayFeeCfa,
                wuraFee: wuraFee > 0 ? wuraFee : 0,
            }
        });
    }

    async getTransactionsBySender(senderUserId: string) {
        const sender = await this.prisma.sender.findUnique({ where: { userId: senderUserId } });
        if (!sender) return [];

        return this.prisma.transaction.findMany({
            where: { senderId: sender.id },
            include: { receiver: true },
            orderBy: { createdAt: 'desc' }
        });
    }

    async getTransactionsByReceiver(receiverUserId: string) {
        const receiver = await this.prisma.receiver.findUnique({ where: { userId: receiverUserId } });
        if (!receiver) return [];

        // Exclure les transactions non payées : le receiver ne voit que les transactions
        // dont le paiement sender a été confirmé (PAYIN_SUCCESS ou plus avancé)
        return this.prisma.transaction.findMany({
            where: {
                receiverId: receiver.id,
                status: {
                    notIn: [
                        TransactionStatus.INITIATED,
                        TransactionStatus.PAYIN_PENDING,
                        TransactionStatus.PAYIN_FAILED,
                    ],
                },
            },
            include: { sender: true },
            orderBy: { createdAt: 'desc' }
        });
    }

    async getTransactionById(id: string) {
        const tx = await this.prisma.transaction.findUnique({
            where: { id },
            include: {
                sender: true,
                receiver: {
                    include: { user: { select: { firebaseUid: true } } }
                }
            }
        });
        if (!tx) throw new NotFoundException('Transaction non trouvée');
        const isNewBeneficiary = tx.receiver?.user?.firebaseUid?.startsWith('PROV-') ?? false;
        return { ...tx, isNewBeneficiary };
    }

    async getTransactionByReference(referenceId: string) {
        const tx = await this.prisma.transaction.findUnique({
            where: { referenceId },
            include: { sender: true, receiver: true } // Need receiver to check if claimed
        });
        if (!tx) throw new NotFoundException('Transaction non trouvée');
        return tx;
    }

    async markOfframpStarted(txId: string, polygonTxHash: string) {
        return this.prisma.transaction.update({
            where: { id: txId },
            data: {
                status: TransactionStatus.OFFRAMP_PROCESSING,
                polygonTxHash,
            },
        });
    }

    async registerClaimWithWallet(
        referenceId: string,
        walletAddress: string,
        email: string,
        firstName: string,
        lastName: string,
    ) {
        const tx = await this.getTransactionByReference(referenceId);

        // PAYIN_SUCCESS = 1er claim, BRIDGE_FAILED = retry après échec du bridge
        const retriableStatuses = [TransactionStatus.PAYIN_SUCCESS, TransactionStatus.BRIDGE_FAILED];
        if (!retriableStatuses.includes(tx.status)) {
            throw new BadRequestException(`Transaction non éligible (statut: ${tx.status})`);
        }

        // Le receiver doit être provisoire OU avoir déjà le même wallet (retry idempotent)
        const provReceiver = await this.prisma.receiver.findUnique({
            where: { id: tx.receiverId },
            include: { user: true },
        });
        const isProvisional = provReceiver?.user?.firebaseUid?.startsWith('PROV-');
        const isSameWallet = provReceiver?.web3AuthWalletAddress?.toLowerCase() === walletAddress.toLowerCase();
        if (!isProvisional && !isSameWallet) {
            throw new BadRequestException('Ce transfert a déjà été réclamé.');
        }

        // Créer ou récupérer l'User + Receiver réel
        const uid = `WEB3AUTH-${walletAddress.toLowerCase()}`;

        // Si un user existe déjà avec cet email (ex: même personne inscrite comme sender),
        // on le réutilise pour éviter la contrainte unique sur email.
        let user = email
            ? await this.prisma.user.findUnique({ where: { email } })
            : null;

        if (!user) {
            user = await this.prisma.user.upsert({
                where: { firebaseUid: uid },
                create: { firebaseUid: uid, role: Role.RECEIVER, email: email || null },
                update: {},
            });
        } else if (user.firebaseUid !== uid) {
            // Mettre à jour le firebaseUid pour lier le wallet Web3Auth à ce compte
            user = await this.prisma.user.update({
                where: { id: user.id },
                data: { firebaseUid: uid },
            });
        }
        const receiver = await this.prisma.receiver.upsert({
            where: { userId: user.id },
            create: {
                userId: user.id,
                wuraId: `WURA-${Date.now()}`,
                firstName: firstName || null,
                lastName: lastName || null,
                web3AuthWalletAddress: walletAddress,
            },
            update: { web3AuthWalletAddress: walletAddress },
        });

        // Migrer la transaction vers le nouveau receiver
        await this.prisma.transaction.update({
            where: { id: tx.id },
            data: { receiverId: receiver.id },
        });

        // Si le bridge avait échoué, remettre en PAYIN_SUCCESS pour que bridgeUsdtToReceiver accepte la TX
        if (tx.status === TransactionStatus.BRIDGE_FAILED) {
            await this.prisma.transaction.update({
                where: { id: tx.id },
                data: { status: TransactionStatus.PAYIN_SUCCESS },
            });
        }

        // Bridge USDT trésorerie → wallet (receiver a maintenant un wallet → bridge immédiat)
        // bridgeUsdtToReceiver attend le referenceId (ex: TX-XXXXXX), pas l'UUID
        await this.polygonService.bridgeUsdtToReceiver(tx.referenceId);
        return { success: true, walletAddress };
    }

    async calculateTransactionMargin(referenceId: string) {
        const tx = await this.prisma.transaction.findUnique({ where: { referenceId } });
        if (!tx) throw new NotFoundException('Transaction non trouvée');

        // Conversion des Decimal Prisma vers des nombres TS pour les calculs internes
        const amountUsdtBridged = tx.amountUsdtBridged.toNumber();
        const actualUsdtCostRate = tx.actualUsdtCostRate.toNumber();
        const kkiapayFeeCfa = tx.kkiapayFeeCfa.toNumber();
        const amountFiatIn = tx.amountFiatIn.toNumber();

        // Bénéfice Net (CFA): Chiffre d'Affaires Brut - ((USDT * Taux Achat) + Frais Kkiapay)
        const coutDeRevient = (amountUsdtBridged * actualUsdtCostRate) + kkiapayFeeCfa;
        const profit = amountFiatIn - coutDeRevient;

        return {
            referenceId: tx.referenceId,
            chiffreAffaire: amountFiatIn,
            coutUsdt: amountUsdtBridged * actualUsdtCostRate,
            fraisKkiapay: kkiapayFeeCfa,
            profitNetCfa: profit
        };
    }
}
