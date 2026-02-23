import api from '../lib/api';
import { Recipient, TransactionInfo } from '../types/transaction';

export interface QuoteResult {
    montant_cfa_total_a_payer: number;
    montant_usdt_a_envoyer_polygon: number;
    montant_euro_recu_par_jean: number;
    frais_mobiles_cfa: number;
    taux_wura_cfa: number;
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
    }
};
