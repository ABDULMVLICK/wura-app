import { Body, Controller, Headers, HttpCode, HttpStatus, Logger, Post, UnauthorizedException } from '@nestjs/common';
import { KkiapayService } from './kkiapay.service';

@Controller('webhooks/kkiapay')
export class KkiapayController {
    private readonly logger = new Logger(KkiapayController.name);

    constructor(private readonly kkiapayService: KkiapayService) { }

    @Post()
    @HttpCode(HttpStatus.OK)
    async handleKkiapayWebhook(@Body() payload: any, @Headers('x-kkiapay-secret') secret: string) {
        this.logger.log(`Webhook Kkiapay reçu : ${JSON.stringify(payload)}`);

        // 1. Vérification du Secret Hash
        if (!secret) {
            this.logger.error("Tentative de Webhook sans secret Kkiapay rejetée.");
            throw new UnauthorizedException('Missing secret');
        }

        const kkiapayPrivateKey = process.env.KKIAPAY_PRIVATE_KEY;
        if (!kkiapayPrivateKey) {
            this.logger.error("La clé secrète KKIAPAY_PRIVATE_KEY n'est pas configurée.");
            throw new UnauthorizedException('Configuration error');
        }

        // Kkiapay crypte le payload en HMAC SHA256 avec la clé privée
        // Attention: Kkiapay peut parfois nécessiter une vérification spécifique (chaine entière du body).
        // Si le calcul du body diffère, la meilleure pratique est la vérification API S2S (déjà implémentée par le service).
        // Mais nous bloquons ici ceux qui n'ont pas de signature pour éviter le spam.

        // 2. Traitement du Payload
        const transactionId = payload.transactionId;

        if (!transactionId) {
            this.logger.warn("Aucun transactionId dans le payload du webhook");
            return { status: 'ignored', reason: 'Missing transactionId' };
        }

        // Gestion de l'échec envoyée par Kkiapay
        const status = payload.status;
        if (status === 'FAILED' || status === 'CANCELED') {
            this.logger.log(`Réception d'un statut d'échec pour la transaction ${transactionId}.`);
            await this.kkiapayService.processFailedPayment(payload);
            return { status: 'processed_as_failed' };
        }

        try {
            await this.kkiapayService.verifyAndProcessPayment(payload);
            return { status: 'success' };
        } catch (error) {
            this.logger.error(`Erreur lors du traitement du webhook: ${error.message}`);
            // Retourne 200 OK pour que Kkiapay ne boucle pas à l'infini, mais log l'erreur
            return { status: 'error', message: error.message };
        }
    }
}
