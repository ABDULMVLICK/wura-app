import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface ExpoPushMessage {
    to: string;
    title: string;
    body: string;
    data?: Record<string, any>;
    sound?: string;
}

@Injectable()
export class NotificationService {
    private readonly logger = new Logger(NotificationService.name);

    constructor(private prisma: PrismaService) { }

    /**
     * Envoie une notification push via l'API Expo Push
     */
    async sendPushNotification(message: ExpoPushMessage): Promise<void> {
        try {
            const response = await fetch('https://exp.host/--/api/v2/push/send', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Accept-Encoding': 'gzip, deflate',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(message),
            });

            const result = await response.json();
            this.logger.log(`📱 Push notification envoyée: ${JSON.stringify(result)}`);
        } catch (error) {
            this.logger.error(`❌ Erreur envoi push: ${error.message}`);
        }
    }

    /**
     * Notifie le receiver qu'il a reçu de l'argent
     */
    async notifyReceiverPaymentReceived(
        receiverUserId: string,
        amountCfa: number,
        senderName: string,
        referenceId: string,
    ): Promise<void> {
        const user = await this.prisma.user.findUnique({
            where: { id: receiverUserId },
        });

        if (!user?.pushToken) {
            this.logger.warn(`⚠️ Pas de pushToken pour le receiver ${receiverUserId}`);
            return;
        }

        await this.sendPushNotification({
            to: user.pushToken,
            title: '💰 Argent reçu !',
            body: `Vous avez reçu ${amountCfa.toLocaleString('fr-FR')} FCFA de ${senderName}`,
            sound: 'default',
            data: { referenceId, type: 'PAYMENT_RECEIVED' },
        });
    }

    /**
     * Notifie le sender que sa transaction est terminée
     */
    async notifySenderTransactionCompleted(
        senderUserId: string,
        amountCfa: number,
        receiverName: string,
        referenceId: string,
    ): Promise<void> {
        const user = await this.prisma.user.findUnique({
            where: { id: senderUserId },
        });

        if (!user?.pushToken) {
            this.logger.warn(`⚠️ Pas de pushToken pour le sender ${senderUserId}`);
            return;
        }

        await this.sendPushNotification({
            to: user.pushToken,
            title: '✅ Transfert réussi !',
            body: `Votre envoi de ${amountCfa.toLocaleString('fr-FR')} FCFA à ${receiverName} est arrivé.`,
            sound: 'default',
            data: { referenceId, type: 'TRANSFER_COMPLETED' },
        });
    }

    /**
     * Notifie le sender qu'une erreur est survenue
     */
    async notifySenderTransactionFailed(
        senderUserId: string,
        referenceId: string,
    ): Promise<void> {
        const user = await this.prisma.user.findUnique({
            where: { id: senderUserId },
        });

        if (!user?.pushToken) return;

        await this.sendPushNotification({
            to: user.pushToken,
            title: '⚠️ Problème de transfert',
            body: `Un problème est survenu avec votre transfert ${referenceId}. Vous pouvez demander un remboursement.`,
            sound: 'default',
            data: { referenceId, type: 'TRANSFER_FAILED' },
        });
    }

    /**
     * Enregistre ou met à jour le pushToken d'un utilisateur
     */
    async registerPushToken(firebaseUid: string, pushToken: string): Promise<void> {
        await this.prisma.user.update({
            where: { firebaseUid },
            data: { pushToken },
        });
        this.logger.log(`📲 Push token enregistré pour ${firebaseUid}`);
    }

    /**
     * Notifie le receiver qu'il a des fonds en attente et doit se connecter
     */
    async notifyReceiverPendingFunds(
        receiverUserId: string,
        amountCfa: number,
        senderName: string,
    ): Promise<void> {
        const user = await this.prisma.user.findUnique({
            where: { id: receiverUserId },
        });

        if (!user?.pushToken) {
            this.logger.warn(`⚠️ Pas de pushToken pour le receiver ${receiverUserId} — impossible de le prévenir`);
            return;
        }

        await this.sendPushNotification({
            to: user.pushToken,
            title: '💸 Fonds en attente !',
            body: `${senderName} vous a envoyé ${amountCfa.toLocaleString('fr-FR')} FCFA. Connectez-vous à Wura pour retirer vos fonds.`,
            sound: 'default',
            data: { type: 'PENDING_FUNDS' },
        });
    }
}
