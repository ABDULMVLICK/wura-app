export type TransactionStatus = 'INITIATED' | 'PAYIN_PENDING' | 'PAYIN_SUCCESS' | 'WAITING_FOR_RECEIVER' | 'WAITING_USER_OFFRAMP' | 'PAYOUT_PENDING' | 'PAYOUT_SUCCESS' | 'FAILED' | 'CANCELLED' | 'PAYIN_FAILED';

export interface TransactionInfo {
    id: string;
    amountFCFA?: number;
    amountEUR: number;
    amountUSDT?: number;
    senderId?: string;
    receiverId?: string;
    date: Date | string;
    status: TransactionStatus;
    senderName?: string;
    kkiapayTransactionId?: string;
    blockchainTxHash?: string;
}

export interface Recipient {
    id?: string;
    wuraId?: string;
    nom: string;
    prenom: string;
    iban: string;
    bic: string;
    banque: string;
    pays: string;
    isNew?: boolean;
}

export interface PaymentMethod {
    id: string;
    type: 'MOBILE_MONEY' | 'BANK_CARD';
    provider: string; // ex: "Kkiapay", "Visa"
    details?: string; // ex: "+229 97 XX XX XX"
}
