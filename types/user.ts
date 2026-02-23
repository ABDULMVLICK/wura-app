export interface UserProfile {
    id: string; // Backend UUID
    uid: string; // Firebase UID
    nom: string;
    prenom: string;
    telephone?: string;
    phone?: string;
    email?: string;
    role: "sender" | "receiver" | "SENDER" | "RECEIVER";
    wuraId?: string;
    iban?: string;
    bic?: string;
    banque?: string;
    pays?: string;
    web3AuthWalletAddress?: string; // Polygon Embedded Wallet
    createdAt?: Date | string;
    updatedAt?: Date | string;
    sender?: {
        firstName: string;
        lastName: string;
        country: string;
    };
    receiver?: {
        wuraId: string;
    };
}
