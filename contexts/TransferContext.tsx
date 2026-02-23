import React, { createContext, useContext, useState } from 'react';

import { PaymentMethod, Recipient } from '../types/transaction';

export interface TransferState {
    amountXOF: string; // Montant saisi en FCFA
    recipient: Recipient | null;
    paymentMethod: PaymentMethod | null;
}

interface TransferContextType {
    state: TransferState;
    setAmountXOF: (amount: string) => void;
    setRecipient: (recipient: Recipient) => void;
    setPaymentMethod: (method: PaymentMethod) => void;
    resetTransfer: () => void;

    // Helpers (Business Logic Mockup)
    getEstimatedEUR: () => string;
    getFeesXOF: () => string;
    getTotalXOF: () => string;
}

const defaultState: TransferState = {
    amountXOF: "",
    recipient: null,
    paymentMethod: null,
};

const TransferContext = createContext<TransferContextType | undefined>(undefined);

const EXCHANGE_RATE_XOF_TO_EUR = 655.95;

export const TransferProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, setState] = useState<TransferState>(defaultState);

    const setAmountXOF = (amount: string) => setState(prev => ({ ...prev, amountXOF: amount }));
    const setRecipient = (recipient: Recipient) => setState(prev => ({ ...prev, recipient }));
    const setPaymentMethod = (paymentMethod: PaymentMethod) => setState(prev => ({ ...prev, paymentMethod }));
    const resetTransfer = () => setState(defaultState);

    // Business Logic Calculators
    const getEstimatedEUR = () => {
        const numeric = parseInt(state.amountXOF.replace(/\s/g, ''), 10) || 0;
        return (numeric / EXCHANGE_RATE_XOF_TO_EUR).toFixed(2);
    };

    const getFeesXOF = () => {
        // Mock business logic: 0 fees for now as per design
        return "0";
    };

    const getTotalXOF = () => {
        const numeric = parseInt(state.amountXOF.replace(/\s/g, ''), 10) || 0;
        const fees = parseInt(getFeesXOF(), 10) || 0;
        return (numeric + fees).toString();
    };

    return (
        <TransferContext.Provider value={{
            state,
            setAmountXOF,
            setRecipient,
            setPaymentMethod,
            resetTransfer,
            getEstimatedEUR,
            getFeesXOF,
            getTotalXOF
        }}>
            {children}
        </TransferContext.Provider>
    );
};

export const useTransfer = () => {
    const context = useContext(TransferContext);
    if (context === undefined) {
        throw new Error('useTransfer must be used within a TransferProvider');
    }
    return context;
};
