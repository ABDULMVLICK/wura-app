import { Injectable, Logger } from '@nestjs/common';
import { ethers } from 'ethers';

@Injectable()
export class BlockchainService {
    private readonly logger = new Logger(BlockchainService.name);
    private provider: ethers.JsonRpcProvider;
    private wallet: ethers.Wallet;

    // L'adresse du contrat USDT sur Polygon
    private readonly usdtContractAddress = "0xc2132D05D31c914a87C6611C10748AEb04B58e8F";
    // L'interface minimale pour dire "Transfert"
    private readonly usdtAbi = ["function transfer(address to, uint256 value)"];

    constructor() {
        const rpcUrl = process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com';
        const privateKey = process.env.WURA_TREASURY_PRIVATE_KEY;

        this.provider = new ethers.JsonRpcProvider(rpcUrl);

        if (privateKey) {
            this.wallet = new ethers.Wallet(privateKey, this.provider);
            this.logger.log(`Wallet Wura Treasury (Robot) chargé : ${this.wallet.address}`);
        } else {
            this.logger.warn("WURA_TREASURY_PRIVATE_KEY is missing. Blockchain features will not work.");
        }
    }

    /**
     * Envoie des USDT depuis la trésorerie Wura vers une adresse cible
     * @param receiverAddress L'adresse de destination (Embedded Wallet)
     * @param amount Le montant en USDT
     * @returns Le hash de la transaction
     */
    async sendUSDT(receiverAddress: string, amount: number): Promise<string> {
        if (!this.wallet) {
            throw new Error("Treasury Wallet not configured. Check WURA_TREASURY_PRIVATE_KEY.");
        }

        this.logger.log(`Préparation de l'envoi de ${amount} USDT vers ${receiverAddress}`);

        // Connexion au contrat
        const contract = new ethers.Contract(this.usdtContractAddress, this.usdtAbi, this.wallet);

        // Conversion du montant (USDT a 6 décimales !)
        const amountInUnits = ethers.parseUnits(amount.toString(), 6);

        try {
            // Envoi de la transaction
            const tx = await contract.transfer(receiverAddress, amountInUnits);
            this.logger.log(`Transaction Polygon envoyée : ${tx.hash}`);

            // Attente de la validation
            await tx.wait();
            this.logger.log(`Transaction Polygon confirmée pour ${tx.hash} !`);

            return tx.hash;
        } catch (error) {
            this.logger.error(`Erreur lors de l'envoi USDT sur Polygon: ${error.message}`);
            throw error;
        }
    }
}
