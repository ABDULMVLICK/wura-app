import React, { createContext, useContext, useEffect, useState } from 'react';
import { TransferService } from '../services/transfers';
import { TransactionInfo } from '../types/transaction';

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

    const refreshBalance = async () => {
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

            // Optional: calculate balance from history if needed, 
            // for now balance is forced to 0 as requested by user.
            setState(prev => ({
                ...prev,
                recentTransactions: formattedHistory,
                balanceEUR: 0.00, // Force balance to 0 EUR 
                isLoading: false
            }));
        } catch (error) {
            console.error("Failed to fetch receiver history:", error);
            setState(prev => ({ ...prev, isLoading: false }));
        }
    };

    useEffect(() => {
        refreshBalance();
    }, []);

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
