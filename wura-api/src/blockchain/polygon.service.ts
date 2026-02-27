import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TransactionStatus } from '@prisma/client';
import { ethers } from 'ethers';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PolygonService {
    private readonly logger = new Logger(PolygonService.name);
    private provider: ethers.JsonRpcProvider;
    private wallet: ethers.Wallet;

    // ABI minimaliste pour ERC-20 (transfer & decimals)
    private readonly erc20Abi = [
        "function transfer(address to, uint256 amount) returns (bool)",
        "function decimals() view returns (uint8)",
        "function balanceOf(address account) view returns (uint256)"
    ];

    constructor(
        private configService: ConfigService,
        private prisma: PrismaService
    ) {
        // Initialisation à partir des variables d'environnement via ConfigService
        const rpcUrl = this.configService.get<string>('POLYGON_RPC_URL') || 'https://polygon-rpc.com';
        const privateKey = this.configService.get<string>('WURA_TREASURY_PRIVATE_KEY');

        this.provider = new ethers.JsonRpcProvider(rpcUrl);

        if (privateKey) {
            this.wallet = new ethers.Wallet(privateKey, this.provider);
            this.logger.log(`🔗 Connecté à Polygon avec la Trésorerie: ${this.wallet.address}`);
        } else {
            this.logger.error('❌ WURA_TREASURY_PRIVATE_KEY is missing. Polygon transactions will fail.');
        }
    }

    /**
     * Pont automatique: Envoie les USDT au Receiver une fois le paiement CFA validé.
     * @param transactionId Le referenceId Wura (ex: TX-WURA-8201)
     */
    async bridgeUsdtToReceiver(transactionId: string): Promise<void> {
        this.logger.log(`⏳ Début du bridge USDT pour la transaction: ${transactionId}`);

        // Étape 1 : Récupérer la transaction (strictement en PAYIN_SUCCESS)
        const tx = await this.prisma.transaction.findUnique({
            where: { referenceId: transactionId },
            include: { receiver: true }
        });

        if (!tx) {
            throw new NotFoundException(`Transaction Wura ${transactionId} introuvable.`);
        }

        if (tx.status !== TransactionStatus.PAYIN_SUCCESS) {
            this.logger.warn(`Transaction ${transactionId} n'est pas en statut PAYIN_SUCCESS (actuel: ${tx.status}). Abandon du bridge.`);
            return;
        }

        const receiverAddress = tx.receiver?.web3AuthWalletAddress;
        if (!receiverAddress) {
            this.logger.warn(`⏸️ Receiver ${tx.receiver?.wuraId || tx.receiverId} n'a pas encore de wallet. USDT en escrow dans la trésorerie.`);
            // On ne throw PAS — la transaction reste en PAYIN_SUCCESS (mode escrow)
            // Le bridge sera automatiquement relancé quand le receiver créera son wallet
            return;
        }

        try {
            // Étape 2 : Lock de la ligne avec BRIDGE_PROCESSING (anti-double-spend)
            await this.prisma.transaction.update({
                where: { referenceId: transactionId },
                data: { status: TransactionStatus.BRIDGE_PROCESSING }
            });

            if (!this.wallet) {
                throw new Error("Trésorerie non configurée. Clé privée manquante.");
            }

            // Étape 3 (CRITIQUE) : Conversion du Decimal Prisma en BigInt pour Ethers v6 (6 décimales pour USDT)
            const usdtContractAddress = this.configService.get<string>('USDT_CONTRACT_ADDRESS') || '0xc2132D05D31c914a87C6611C10748AEb04B58e8F';
            const usdtDecimalValue = tx.amountUsdtBridged.toString(); // On convertit l'objet JS Prisma.Decimal en String
            const amountInWei = ethers.parseUnits(usdtDecimalValue, 6);

            // Étape 4 : Pre-flight check de la balance USDT et MATIC de la trésorerie
            const usdtContract = new ethers.Contract(usdtContractAddress, this.erc20Abi, this.wallet);
            const treasuryBalance = await usdtContract.balanceOf(this.wallet.address);

            if (treasuryBalance < amountInWei) {
                const balanceFormatted = ethers.formatUnits(treasuryBalance, 6);
                throw new Error(`Fonds USDT insuffisants dans la trésorerie. Balance: ${balanceFormatted} USDT, Requis: ${usdtDecimalValue} USDT`);
            }

            const maticSponsorshipAmount = ethers.parseEther("0.1");
            const treasuryMaticBalance = await this.provider.getBalance(this.wallet.address);

            if (treasuryMaticBalance < maticSponsorshipAmount) {
                const maticFormatted = ethers.formatEther(treasuryMaticBalance);
                throw new Error(`Fonds MATIC (Gas) insuffisants dans la trésorerie. Balance: ${maticFormatted} MATIC, Requis: 0.1 MATIC`);
            }

            this.logger.log(`💸 Envoi de ${usdtDecimalValue} USDT + 0.1 MATIC vers ${receiverAddress}...`);

            // Étapes 5-7 : Délégation à executePayout (MATIC d'abord, puis USDT)
            const { maticTxHash, usdtTxHash, totalGasFeeMatic } = await this.executePayout(receiverAddress, parseFloat(usdtDecimalValue));

            this.logger.log(`✅ Transferts USDT & MATIC validés !`);

            // Étape 8 : Mise à jour de la transaction (COMPLETION DE CETTE ETAPE)
            await this.prisma.transaction.update({
                where: { referenceId: transactionId },
                data: {
                    status: TransactionStatus.WAITING_USER_OFFRAMP,
                    polygonTxHash: `${usdtTxHash} | ${maticTxHash}`,
                    polygonGasFeeMatic: totalGasFeeMatic.toString()
                }
            });

        } catch (error) {
            this.logger.error(`❌ Échec du bridge Polygon pour ${transactionId} : ${error.message}`);

            await this.prisma.transaction.update({
                where: { referenceId: transactionId },
                data: {
                    status: TransactionStatus.BRIDGE_FAILED,
                    failureReason: error.message.substring(0, 200)
                }
            });
            throw error;
        }
    }

    getTreasuryAddress(): string {
        return this.wallet?.address ?? '';
    }

    /**
     * Envoie des USDT depuis la trésorerie Wura vers une adresse externe (ex: dépôt Transak).
     * Utilisé pour le flux claim link (receiver sans wallet).
     */
    async sendUsdtFromTreasury(toAddress: string, amountUsdt: number): Promise<string> {
        if (!this.wallet) {
            throw new Error('Trésorerie non configurée. Clé privée manquante.');
        }
        const usdtContractAddress = this.configService.get<string>('USDT_CONTRACT_ADDRESS') || '0xc2132D05D31c914a87C6611C10748AEb04B58e8F';
        const usdtContract = new ethers.Contract(usdtContractAddress, this.erc20Abi, this.wallet);
        const amountInWei = ethers.parseUnits(amountUsdt.toFixed(6), 6);
        const tx = await usdtContract.transfer(toAddress, amountInWei);
        this.logger.log(`📡 Claim USDT TX diffusée: ${tx.hash}`);
        await tx.wait();
        this.logger.log(`✅ Claim USDT TX confirmée: ${tx.hash}`);
        return tx.hash;
    }

    async executePayout(
        receiverAddress: string,
        amountUsdt: number
    ): Promise<{ maticTxHash: string; usdtTxHash: string; totalGasFeeMatic: number }> {
        if (!this.wallet) {
            throw new Error('Trésorerie non configurée. Clé privée manquante.');
        }

        const usdtContractAddress = this.configService.get<string>('USDT_CONTRACT_ADDRESS') || '0xc2132D05D31c914a87C6611C10748AEb04B58e8F';
        const usdtContract = new ethers.Contract(usdtContractAddress, this.erc20Abi, this.wallet);
        const amountInWei = ethers.parseUnits(amountUsdt.toString(), 6);
        const maticAmount = ethers.parseEther('0.1');

        // Pre-flight checks
        const [usdtBalance, maticBalance] = await Promise.all([
            usdtContract.balanceOf(this.wallet.address),
            this.provider.getBalance(this.wallet.address),
        ]);

        if (usdtBalance < amountInWei) {
            throw new Error(`USDT insuffisant: ${ethers.formatUnits(usdtBalance, 6)} disponible, ${amountUsdt} requis`);
        }
        if (maticBalance < maticAmount) {
            throw new Error(`MATIC insuffisant: ${ethers.formatEther(maticBalance)} disponible, 0.1 requis`);
        }

        // TX 1 : MATIC en premier (gas sponsoring) — on attend la confirmation pour éviter nonce collision
        const maticTx = await this.wallet.sendTransaction({
            to: receiverAddress,
            value: maticAmount,
        });
        this.logger.log(`📡 MATIC TX diffusée: ${maticTx.hash}`);
        const maticReceipt = await maticTx.wait();

        // TX 2 : USDT (nonce suivant garanti car TX 1 est minée)
        const usdtTx = await usdtContract.transfer(receiverAddress, amountInWei);
        this.logger.log(`📡 USDT TX diffusée: ${usdtTx.hash}`);
        const usdtReceipt = await usdtTx.wait();

        let totalGasFeeMatic = 0;
        if (maticReceipt?.gasUsed && maticReceipt?.gasPrice) {
            totalGasFeeMatic += parseFloat(ethers.formatEther(maticReceipt.gasUsed * maticReceipt.gasPrice));
        }
        if (usdtReceipt?.gasUsed && usdtReceipt?.gasPrice) {
            totalGasFeeMatic += parseFloat(ethers.formatEther(usdtReceipt.gasUsed * usdtReceipt.gasPrice));
        }

        return {
            maticTxHash: maticTx.hash,
            usdtTxHash: usdtTx.hash,
            totalGasFeeMatic,
        };
    }
}
