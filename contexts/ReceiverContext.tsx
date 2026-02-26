import Constants from 'expo-constants';
import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../lib/api';
import { TransferService } from '../services/transfers';
import { TransactionInfo } from '../types/transaction';
import { useAuth } from './AuthContext';
import { useWeb3Auth } from './Web3AuthContext';

const USDT_CONTRACT_POLYGON = '0xc2132D05D31c914a87C6611C10748AEb04B58e8F';
const POLYGON_RPCS = [
    'https://rpc.ankr.com/polygon',
    'https://polygon.llamarpc.com',
    'https://polygon-bor-rpc.publicnode.com',
    'https://polygon-rpc.com',
];

export interface ReceiverState {
    balanceEUR: number;   // EUR nets que Transak versera (calculé depuis le solde on-chain)
    balanceUSDT: number;  // Solde USDT réel sur Polygon — source de vérité
    recentTransactions: TransactionInfo[];
    isLoading: boolean;
}

interface ReceiverContextType {
    state: ReceiverState;
    initiateWithdrawal: (amountEUR: number) => Promise<boolean>;
    refreshBalance: () => Promise<void>;
}

const defaultState: ReceiverState = {
    balanceEUR: 0.00,
    balanceUSDT: 0,
    recentTransactions: [],
    isLoading: true
};

const ReceiverContext = createContext<ReceiverContextType | undefined>(undefined);

// ---------------------------------------------------------------------------
// Lit le solde USDT on-chain du wallet via ethers.js + RPC Polygon
// ---------------------------------------------------------------------------
async function readOnChainUSDT(walletAddress: string): Promise<number> {
    const { JsonRpcProvider, Contract, formatUnits } = require('ethers');
    for (const rpc of POLYGON_RPCS) {
        try {
            const provider = new JsonRpcProvider(rpc);
            await Promise.race([
                provider.getBlockNumber(),
                new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000)),
            ]);
            const contract = new Contract(
                USDT_CONTRACT_POLYGON,
                ['function balanceOf(address owner) view returns (uint256)'],
                provider
            );
            const raw = await contract.balanceOf(walletAddress);
            return parseFloat(formatUnits(raw, 6));
        } catch { /* essai RPC suivant */ }
    }
    return 0;
}

export const ReceiverProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, setState] = useState<ReceiverState>(defaultState);
    const { user, profile } = useAuth();
    const { address } = useWeb3Auth();

    // Sync wallet address to backend on login (triggers escrow auto-release)
    useEffect(() => {
        if (user && address && profile?.role === 'RECEIVER') {
            api.patch('/users/me/wallet', { walletAddress: address })
                .then(() => console.log('[Receiver] Wallet synced to backend:', address.substring(0, 10) + '...'))
                .catch(() => { }); // Silently fail if already set
        }
    }, [user, address, profile]);

    const refreshBalance = async () => {
        if (!user) {
            setState(prev => ({ ...prev, isLoading: false }));
            return;
        }
        setState(prev => ({ ...prev, isLoading: true }));
        // 1. Historique des transactions (erreur non-bloquante)
        let formattedHistory: any[] = [];
        try {
            const history = await TransferService.getHistory();
            formattedHistory = history.map((tx: any) => ({
                id: tx.referenceId || tx.id,
                amountEUR: Number(tx.amountFiatOutExpected || tx.amountEUR || 0),
                senderName: tx.sender?.prenom ? `${tx.sender.prenom} ${tx.sender.nom}` : "Utilisateur Wura",
                date: new Date(tx.createdAt || tx.date || Date.now()),
                status: tx.status
            }));
        } catch { /* historique indisponible — le solde s'affiche quand même */ }

        // 2. Solde (source de vérité)
        let balanceUSDT = 0;
        let balanceEUR = 0;

        try {
            // Le mock ne nécessite pas d'adresse — vérifié avant le guard if (address)
            const mockBalance = Number(Constants.expoConfig?.extra?.mockUsdtBalance ?? 0);
            if (mockBalance > 0) {
                // Mode test : calcul local, pas d'appel API (indépendant du backend)
                balanceUSDT = mockBalance;
                balanceEUR = parseFloat((balanceUSDT * 0.97).toFixed(2));
            } else if (address) {
                balanceUSDT = await readOnChainUSDT(address);

                // Minimum ~10 USDT (en dessous, les frais fixes dépassent le montant)
                const TRANSAK_MIN_USDT = 10;
                if (balanceUSDT >= TRANSAK_MIN_USDT) {
                    try {
                        // Combien d'EUR versera réellement le service pour ce montant
                        const { data } = await api.get<{ fiatAmount: number }>(
                            '/quotes/sell',
                            { params: { cryptoAmount: balanceUSDT.toFixed(6) } }
                        );
                        // Clamp à 0 : un fiatAmount négatif (frais > montant) = solde non retirable
                        balanceEUR = Math.max(0, data.fiatAmount);
                    } catch {
                        // Fallback : ~3% frais estimés
                        balanceEUR = parseFloat((balanceUSDT * 0.97).toFixed(2));
                    }
                }
            }
        } catch (error) {
            console.warn("Receiver balance refresh failed");
        }

        setState(prev => ({
            ...prev,
            recentTransactions: formattedHistory,
            balanceUSDT,
            balanceEUR,
            isLoading: false
        }));
    };

    useEffect(() => {
        refreshBalance();

        // Auto-refresh toutes les 15 secondes pour détecter les nouvelles transactions
        const interval = setInterval(() => {
            if (user) refreshBalance();
        }, 15000);

        return () => clearInterval(interval);
    // address ajouté : relance quand le wallet Web3Auth est résolu après le login
    }, [user, address]);


    const initiateWithdrawal = async (amount: number): Promise<boolean> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                if (amount <= state.balanceEUR) {
                    setState(prev => ({
                        ...prev,
                        balanceEUR: prev.balanceEUR - amount
                    }));
                    resolve(true);
                } else {
                    resolve(false);
                }
            }, 1500);
        });
    };

    return (
        <ReceiverContext.Provider value={{
            state,
            initiateWithdrawal,
            refreshBalance
        }}>
            {children}
        </ReceiverContext.Provider>
    );
};

export const useReceiver = () => {
    const context = useContext(ReceiverContext);
    if (context === undefined) {
        throw new Error('useReceiver must be used within a ReceiverProvider');
    }
    return context;
};
