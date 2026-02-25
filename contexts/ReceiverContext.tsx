import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../lib/api';
import { TransferService } from '../services/transfers';
import { TransactionInfo } from '../types/transaction';
import { useAuth } from './AuthContext';
import { useWeb3Auth } from './Web3AuthContext';

export interface ReceiverState {
    balanceEUR: number;
    recentTransactions: TransactionInfo[];
    isLoading: boolean;
}

interface ReceiverContextType {
    state: ReceiverState;
    initiateWithdrawal: (amountEUR: number) => Promise<boolean>;
    refreshBalance: () => Promise<void>;
}

// Initial state starts empty, with 0 balance
const defaultState: ReceiverState = {
    balanceEUR: 0.00,
    recentTransactions: [],
    isLoading: true
};

const ReceiverContext = createContext<ReceiverContextType | undefined>(undefined);

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
        // Only fetch if a user is authenticated
        if (!user) {
            setState(prev => ({ ...prev, isLoading: false }));
            return;
        }
        setState(prev => ({ ...prev, isLoading: true }));
        try {
            const history = await TransferService.getHistory();

            // Format API data to match the UI expected structure
            const formattedHistory: any[] = history.map((tx: any) => ({
                id: tx.referenceId || tx.id,
                amountEUR: Number(tx.amountFiatOutExpected || tx.amountEUR || 0),
                senderName: tx.sender?.prenom ? `${tx.sender.prenom} ${tx.sender.nom}` : "Utilisateur Wura",
                date: new Date(tx.createdAt || tx.date || Date.now()),
                status: tx.status
            }));

            // Calculate balance from fully completed transactions only
            const totalReceived = formattedHistory
                .filter((tx: any) => tx.status === 'COMPLETED')
                .reduce((sum: number, tx: any) => sum + tx.amountEUR, 0);

            setState(prev => ({
                ...prev,
                recentTransactions: formattedHistory,
                balanceEUR: totalReceived,
                isLoading: false
            }));
        } catch (error) {
            // Silently handle polling errors to avoid console spam
            console.warn("Receiver refresh failed (will retry)");
            setState(prev => ({ ...prev, isLoading: false }));
        }
    };

    useEffect(() => {
        refreshBalance();

        // Auto-refresh toutes les 15 secondes pour détecter les nouvelles transactions
        const interval = setInterval(() => {
            if (user) refreshBalance();
        }, 15000);

        return () => clearInterval(interval);
    }, [user]);


    const initiateWithdrawal = async (amount: number): Promise<boolean> => {
        // Mock API call to initiate the Off-Ramp process (Mt Pelerin / Ramp)
        return new Promise((resolve) => {
            setTimeout(() => {
                if (amount <= state.balanceEUR) {
                    // Update local state to reflect the withdrawal
                    setState(prev => ({
                        ...prev,
                        balanceEUR: prev.balanceEUR - amount // Deduct balance
                    }));
                    resolve(true); // Success
                } else {
                    resolve(false); // Insufficient funds
                }
            }, 1500); // Simulate network delay
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
