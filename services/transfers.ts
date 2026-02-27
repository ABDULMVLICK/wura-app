import api from '../lib/api';
import { Recipient, TransactionInfo } from '../types/transaction';

export interface QuoteResult {
    baseAmountCfa: number;
    commercialAmountCfa: number;
    kkiapayFeeCfa: number;
    partnerFeesCfa: number;
    wuraFeesCfa: number;
    totalToPayCfa: number;
    montant_usdt_a_envoyer_polygon: number;
    montant_euro_recu_par_jean: number;
    taux_wura_cfa: number;
    taux_officiel_cfa: number;
}

export const TransferService = {
    /**
     * Récupérer l'historique des transactions
     */
    getHistory: async (): Promise<TransactionInfo[]> => {
        const response = await api.get('/transactions');
        return response.data;
    },

    /**
     * Obtenir un devis dynamique
     */
    getQuote: async (amount: number, currency: 'XOF' | 'EUR', speed: 'INSTANT' | 'STANDARD'): Promise<QuoteResult> => {
        const response = await api.get('/quotation', {
            params: { amount, currency, speed }
        });
        return response.data;
    },

    /**
     * Créer un bénéficiaire provisoire en base de données (depuis le flux sender).
     * N'utilise pas le Firebase UID du sender — crée un receiver avec un UID système.
     */
    createRecipient: async (data: { nom: string; prenom: string; email?: string; telephone?: string }) => {
        const payload = {
            firstName: data.prenom,
            lastName: data.nom,
            email: data.email || undefined,
        };
        const response = await api.post('/users/register/provisional-receiver', payload);
        return response.data;
    },

    /**
     * Créer une nouvelle transaction
     */
    createTransaction: async (data: { amountFCFA: number, amountEUR: number, recipient: Recipient, paymentMethodId: string, deliverySpeed: string }) => {
        const payload = {
            receiverWuraId: data.recipient.wuraId,
            amountFiatIn: data.amountFCFA,
            amountUsdtBridged: data.amountEUR * 1.02, // Mock estimation for USDT footprint
            amountFiatOutExpected: data.amountEUR,
            deliverySpeed: data.deliverySpeed
        };
        const response = await api.post('/transactions', payload);
        return response.data;
    },

    /**
     * Récupérer le statut en temps réel d'une transaction (Polling)
     */
    getTransaction: async (id: string): Promise<TransactionInfo> => {
        const response = await api.get(`/transactions/${id}`);
        return response.data;
    },

    /**
     * Récupérer les infos publiques d'une transaction via son lien de claim (Sans Auth)
     */
    getClaimInfo: async (referenceId: string) => {
        const response = await api.get(`/public-transactions/claim/${referenceId}`);
        return response.data;
    },

    /**
     * Déclenche l'envoi USDT depuis la trésorerie Wura vers l'adresse de dépôt Transak.
     * Utilisé dans le flux claim link (receiver sans wallet). Sans Auth.
     */
    claimOfframp: async (referenceId: string, transakDepositAddress: string, cryptoAmount: number) => {
        const response = await api.post(`/public-transactions/claim/${referenceId}/offramp`, {
            transakDepositAddress,
            cryptoAmount,
        });
        return response.data;
    },

    /**
     * Demander un remboursement pour une transaction échouée
     */
    requestRefund: async (transactionId: string) => {
        const response = await api.post(`/transactions/${transactionId}/refund`);
        return response.data;
    },

    /**
     * Notifier le backend que le retrait off-ramp a démarré (USDT envoyé à Transak/Mt Pelerin)
     * Passe la transaction en OFFRAMP_PROCESSING et sauvegarde le hash Polygon
     */
    reportOfframp: async (txId: string, polygonTxHash: string) => {
        const response = await api.patch(`/transactions/${txId}/offramp`, { polygonTxHash });
        return response.data;
    },
};
