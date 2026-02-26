export type TransactionStatus = 'INITIATED' | 'PAYIN_PENDING' | 'PAYIN_SUCCESS' | 'BRIDGE_PROCESSING' | 'BRIDGE_SUCCESS' | 'WAITING_USER_OFFRAMP' | 'OFFRAMP_PROCESSING' | 'COMPLETED' | 'PAYIN_FAILED' | 'BRIDGE_FAILED' | 'OFFRAMP_FAILED' | 'REFUNDED';

export type RoutingStrategy = 'TRANSAK' | 'MT_PELERIN';

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
    routingStrategy?: RoutingStrategy;  // TRANSAK (SEPA Instant) ou MT_PELERIN (SEPA Standard 1-3j)
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
