export interface UserProfile {
    id: string; // Backend UUID
    uid: string; // Firebase UID
    nom: string;
    prenom: string;
    telephone?: string;
    email: string;
    role: "sender" | "receiver";
    wuraId?: string;
    iban?: string;
    bic?: string;
    banque?: string;
    pays?: string;
    web3AuthWalletAddress?: string; // Polygon Embedded Wallet
    createdAt?: Date | string;
    updatedAt?: Date | string;
}
