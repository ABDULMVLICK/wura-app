export type TransactionStatus = 'INITIATED' | 'PAYIN_PENDING' | 'PAYIN_SUCCESS' | 'PAYOUT_PENDING' | 'PAYOUT_SUCCESS' | 'FAILED' | 'CANCELLED';

export interface TransactionInfo {
    id: string;
    amountFCFA?: number;
    amountEUR: number;
    amountUSDT?: number;
    senderId?: string;
    receiverId?: string;
    date: Date | string;
    status: TransactionStatus;
    kkiapayTransactionId?: string;
    blockchainTxHash?: string;
}

export interface Recipient {
    id?: string;
    nom: string;
    prenom: string;
    iban: string;
    bic: string;
    banque: string;
    pays: string;
}

export interface PaymentMethod {
    id: string;
    type: 'MOBILE_MONEY' | 'BANK_CARD';
    provider: string; // ex: "Kkiapay", "Visa"
    details?: string; // ex: "+229 97 XX XX XX"
}
