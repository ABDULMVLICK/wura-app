import api from '../lib/api';
import { Recipient, TransactionInfo } from '../types/transaction';

export const TransferService = {
    /**
     * Récupérer l'historique des transactions
     */
    getHistory: async (): Promise<TransactionInfo[]> => {
        const response = await api.get('/transactions');
        return response.data;
    },

    /**
     * Créer une nouvelle transaction
     */
    createTransaction: async (data: { amountFCFA: number, amountEUR: number, recipient: Recipient, paymentMethodId: string }) => {
        const response = await api.post('/transactions', data);
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
