import React, { createContext, useContext, useState } from 'react';

import { TransactionInfo } from '../types/transaction';

export interface ReceiverState {
    balanceEUR: number;
    recentTransactions: TransactionInfo[];
}

interface ReceiverContextType {
    state: ReceiverState;
    initiateWithdrawal: (amountEUR: number) => Promise<boolean>;
    // In the future: refreshBalance(), etc.
}

// Fictional initial state for the MVP interactive demonstration
const defaultState: ReceiverState = {
    balanceEUR: 450.00,
    recentTransactions: [
        {
            id: 'TX-123',
            amountEUR: 200.00,
            senderName: "Moussa Diabaté",
            date: new Date(Date.now() - 86400000 * 2), // 2 days ago
            status: 'COMPLETED'
        },
        {
            id: 'TX-124',
            amountEUR: 250.00,
            senderName: "Amina Sylla",
            date: new Date(Date.now() - 86400000 * 5), // 5 days ago
            status: 'COMPLETED'
        }
    ]
};

const ReceiverContext = createContext<ReceiverContextType | undefined>(undefined);

export const ReceiverProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, setState] = useState<ReceiverState>(defaultState);

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
            initiateWithdrawal
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
