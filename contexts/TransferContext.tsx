import React, { createContext, useContext, useEffect, useState } from 'react';
import { QuoteResult, TransferService } from '../services/transfers';
import { PaymentMethod, Recipient } from '../types/transaction';

export interface TransferState {
    inputValue: string; // Montant saisi (brut text)
    inputCurrency: 'XOF' | 'EUR'; // Devise saisie actuelle
    recipient: Recipient | null;
    paymentMethod: PaymentMethod | null;
    deliverySpeed: 'INSTANT' | 'STANDARD';
    quote: QuoteResult | null;
    isQuoting: boolean;
}

interface TransferContextType {
    state: TransferState;
    setInputValue: (amount: string) => void;
    toggleCurrency: () => void;
    setRecipient: (recipient: Recipient) => void;
    setPaymentMethod: (method: PaymentMethod) => void;
    setDeliverySpeed: (speed: 'INSTANT' | 'STANDARD') => void;
    resetTransfer: () => void;

    // Helpers (Business Logic Mockup)
    getCalculatedXOF: () => string; // Retourne toujours le montant en XOF (saisi ou converti)
    getCalculatedEUR: () => string; // Retourne toujours le montant en EUR (saisi ou converti)
    getFeesXOF: () => string;
    getTotalXOF: () => string;
}

const defaultState: TransferState = {
    inputValue: "",
    inputCurrency: 'XOF',
    recipient: null,
    paymentMethod: null,
    deliverySpeed: 'INSTANT',
    quote: null,
    isQuoting: false
};

const TransferContext = createContext<TransferContextType | undefined>(undefined);

const EXCHANGE_RATE_XOF_TO_EUR = 655.96;

export const TransferProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, setState] = useState<TransferState>(defaultState);

    const setInputValue = (amount: string) => setState(prev => ({ ...prev, inputValue: amount }));
    const toggleCurrency = () => {
        setState(prev => {
            if (!prev.quote) return prev; // Cannot swap safely without a quote

            // Revert back roughly
            const numericValue = parseFloat(prev.inputValue.replace(/,/g, '.').replace(/\s/g, '')) || 0;
            let newValue = "";
            if (prev.inputCurrency === 'XOF') {
                newValue = (numericValue / EXCHANGE_RATE_XOF_TO_EUR).toFixed(2);
            } else {
                newValue = Math.round(numericValue * EXCHANGE_RATE_XOF_TO_EUR).toString();
            }

            if (newValue === "0.00" || newValue === "0") newValue = "";

            return {
                ...prev,
                inputCurrency: prev.inputCurrency === 'XOF' ? 'EUR' : 'XOF',
                inputValue: newValue
            };
        });
    };

    const setRecipient = (recipient: Recipient) => setState(prev => ({ ...prev, recipient }));
    const setPaymentMethod = (paymentMethod: PaymentMethod) => setState(prev => ({ ...prev, paymentMethod }));
    const setDeliverySpeed = (speed: 'INSTANT' | 'STANDARD') => setState(prev => ({ ...prev, deliverySpeed: speed }));
    const resetTransfer = () => setState(defaultState);

    // Fetch live quote from backend when inputs change
    useEffect(() => {
        const fetchQuote = async () => {
            const numericValue = parseFloat(state.inputValue.replace(/,/g, '.').replace(/\s/g, '')) || 0;
            if (numericValue <= 0) {
                setState(prev => ({ ...prev, quote: null, isQuoting: false }));
                return;
            }

            setState(prev => ({ ...prev, isQuoting: true }));
            try {
                const quote = await TransferService.getQuote(numericValue, state.inputCurrency, state.deliverySpeed);
                setState(prev => ({ ...prev, quote, isQuoting: false }));
            } catch (error) {
                console.error("Failed to fetch quote:", error);
                setState(prev => ({ ...prev, quote: null, isQuoting: false }));
            }
        };

        const timeoutId = setTimeout(fetchQuote, 500); // 500ms debounce
        return () => clearTimeout(timeoutId);
    }, [state.inputValue, state.inputCurrency, state.deliverySpeed]);

    // Business Logic Calculators (Now using the fetched quote)
    const getCalculatedXOF = () => {
        if (!state.quote) return "0";
        // If they input XOF, return exactly what they typed. If EUR, return base amount before fees.
        const baseAmount = Number(state.quote.baseAmountCfa || 0);
        return baseAmount.toString();
    };

    const getCalculatedEUR = () => {
        if (!state.quote) return "0.00";
        return Number(state.quote.montant_euro_recu_par_jean || 0).toFixed(2);
    };

    const getFeesXOF = () => {
        if (!state.quote) return "0";
        return state.quote.kkiapayFeeCfa.toString();
    };

    const getTotalXOF = () => {
        if (!state.quote) return "0";
        return Number(state.quote.totalToPayCfa || 0).toString();
    };

    return (
        <TransferContext.Provider value={{
            state,
            setInputValue,
            toggleCurrency,
            setRecipient,
            setPaymentMethod,
            setDeliverySpeed,
            resetTransfer,
            getCalculatedXOF,
            getCalculatedEUR,
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
