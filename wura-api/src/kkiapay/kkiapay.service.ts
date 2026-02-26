import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { TransactionStatus } from '@prisma/client';
import axios from 'axios';
import { PolygonService } from '../blockchain/polygon.service';
import { NotificationService } from '../notifications/notification.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class KkiapayService {
    private readonly logger = new Logger(KkiapayService.name);

    constructor(
        private prisma: PrismaService,
        private polygonService: PolygonService,
        private notificationService: NotificationService,
    ) { }

    async verifyAndProcessPayment(webhookPayload: any) {
        const kkiapayTransactionId = webhookPayload.transactionId;
        this.logger.log(`Traitement de la transaction Kkiapay ${kkiapayTransactionId} depuis le Webhook...`);

        try {
            if (!webhookPayload.isPaymentSucces) {
                this.logger.warn(`Échec / Refus : Transaction Kkiapay ${kkiapayTransactionId} n'est pas en succès.`);
                throw new BadRequestException(`Paiement Kkiapay non validé.`);
            }

            const referenceId = webhookPayload.stateData || webhookPayload.state;

            if (!referenceId) {
                throw new BadRequestException('Aucun referenceId (stateData) trouvé dans le webhook Kkiapay. Impossible de lier à la base Wura.');
            }

            const wuraTx = await this.prisma.transaction.findUnique({
                where: { referenceId },
                include: { receiver: true, sender: true }
            });

            if (!wuraTx) {
                throw new NotFoundException(`Le referenceId ${referenceId} renvoyé par Kkiapay n'existe pas dans Wura.`);
            }

            if (wuraTx.status !== TransactionStatus.INITIATED && wuraTx.status !== TransactionStatus.PAYIN_PENDING) {
                this.logger.log(`Idempotence: La transaction ${referenceId} a déjà le statut ${wuraTx.status}. Webhook ignoré.`);
                return { status: 'already_processed', referenceId };
            }

            await this.prisma.transaction.update({
                where: { referenceId },
                data: {
                    status: TransactionStatus.PAYIN_SUCCESS,
                    kkiapayId: kkiapayTransactionId,
                    amountFiatIn: webhookPayload.amount
                }
            });

            this.logger.log(`✅ Transaction Wura [${referenceId}] mise à jour avec succès (PAYIN_SUCCESS). L'argent est sécurisé.`);

            // Notifier le receiver qu'il a reçu de l'argent
            const senderName = wuraTx.sender?.firstName
                ? `${wuraTx.sender.firstName} ${wuraTx.sender.lastName || ''}`
                : 'Un utilisateur';
            this.notificationService.notifyReceiverPaymentReceived(
                wuraTx.receiver?.userId,
                Number(webhookPayload.amount),
                senderName,
                referenceId,
            ).catch(err => this.logger.warn(`Push notification failed: ${err.message}`));

            // Si le receiver n'a pas de wallet, lui envoyer une notif pour se connecter
            if (!wuraTx.receiver?.web3AuthWalletAddress) {
                this.notificationService.notifyReceiverPendingFunds(
                    wuraTx.receiver?.userId,
                    Number(webhookPayload.amount),
                    senderName,
                ).catch(() => { });
            }

            this.polygonService.bridgeUsdtToReceiver(referenceId).catch(err => {
                this.logger.error(`Erreur critique non bloquante lors de l'appel au PolygonService: ${err.message}`);
                // Notifier le sender du bridge failed
                this.notificationService.notifySenderTransactionFailed(
                    wuraTx.sender?.userId,
                    referenceId,
                ).catch(() => { });
            });

            return { status: 'success', referenceId };

        } catch (error) {
            this.logger.error(`Fail Kkiapay Verification: ${error.message}`);
            throw error;
        }
    }

    async processFailedPayment(webhookPayload: any) {
        const kkiapayTransactionId = webhookPayload.transactionId;
        this.logger.log(`Processing failed Kkiapay transaction ${kkiapayTransactionId}`);

        try {
            const referenceId = webhookPayload.stateData || webhookPayload.state;
            if (!referenceId) throw new BadRequestException('Aucun referenceId');

            const wuraTx = await this.prisma.transaction.findUnique({ where: { referenceId } });
            if (!wuraTx) throw new NotFoundException(`Le referenceId ${referenceId} n'existe pas.`);

            if (wuraTx.status === TransactionStatus.INITIATED || wuraTx.status === TransactionStatus.PAYIN_PENDING) {
                await this.prisma.transaction.update({
                    where: { referenceId },
                    data: {
                        status: TransactionStatus.PAYIN_FAILED,
                        kkiapayId: kkiapayTransactionId
                    }
                });
                this.logger.log(`❌ Transaction [${referenceId}] marquée comme ECHEC suite au webhook.`);
            }

            return { status: 'failed_processed', referenceId };
        } catch (error) {
            this.logger.error(`Fail Kkiapay Failure processing: ${error.message}`);
            throw error;
        }
    }

    /**
     * Rembourser une transaction via l'API REST Kkiapay.
     * Ne peut rembourser que si le paiement Kkiapay a réussi mais que le transfert crypto a échoué.
     */
    async refundTransaction(transactionId: string) {
        this.logger.log(`Demande de remboursement pour la transaction ${transactionId}`);

        // 1. Récupérer la transaction en base
        const tx = await this.prisma.transaction.findUnique({ where: { id: transactionId } });
        if (!tx) throw new NotFoundException('Transaction non trouvée');

        // 2. Vérification métier : on ne rembourse que si le paiement a réussi mais le transfert a échoué
        const refundableStatuses: TransactionStatus[] = [
            TransactionStatus.PAYIN_SUCCESS,
            TransactionStatus.BRIDGE_FAILED,
            TransactionStatus.OFFRAMP_FAILED,
        ];

        if (!refundableStatuses.includes(tx.status)) {
            throw new BadRequestException(
                `Impossible de rembourser : la transaction est au statut ${tx.status}. ` +
                `Seuls les statuts PAYIN_SUCCESS, BRIDGE_FAILED ou OFFRAMP_FAILED sont remboursables.`
            );
        }

        // 3. Vérifier que la transaction a un ID Kkiapay
        if (!tx.kkiapayId) {
            throw new BadRequestException('Aucun ID Kkiapay associé à cette transaction. Remboursement impossible.');
        }

        // 4. Appel API REST Kkiapay pour le remboursement
        const kkiapayPrivateKey = process.env.KKIAPAY_PRIVATE_KEY;
        if (!kkiapayPrivateKey) {
            throw new BadRequestException('KKIAPAY_PRIVATE_KEY non configurée côté serveur.');
        }

        try {
            const response = await axios.post(
                'https://api.kkiapay.me/api/v1/transactions/refund',
                { transactionId: tx.kkiapayId },
                {
                    headers: {
                        'x-private-key': kkiapayPrivateKey,
                        'Content-Type': 'application/json'
                    }
                }
            );

            this.logger.log(`✅ Remboursement Kkiapay réussi pour ${tx.referenceId}: ${JSON.stringify(response.data)}`);
        } catch (error) {
            this.logger.error(`❌ Échec du remboursement Kkiapay: ${error.response?.data || error.message}`);
            throw new BadRequestException(`Échec du remboursement Kkiapay: ${error.response?.data?.message || error.message}`);
        }

        // 5. Mise à jour du statut en base
        await this.prisma.transaction.update({
            where: { id: transactionId },
            data: {
                status: TransactionStatus.REFUNDED,
                failureReason: 'Remboursement demandé par l\'utilisateur'
            }
        });

        this.logger.log(`✅ Transaction ${tx.referenceId} marquée comme REFUNDED dans la base.`);

        return { status: 'refunded', referenceId: tx.referenceId };
    }
}
