import { WEB3AUTH_NETWORK } from '@web3auth/auth';
import { EthereumPrivateKeyProvider } from '@web3auth/ethereum-provider';
import Web3Auth from '@web3auth/react-native-sdk';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import React, { createContext, useContext, useEffect, useState } from 'react';
// Polyfills are already imported in _layout.tsx

// Scheme from app.json
const scheme = "wuranative";
const resolvedRedirectUrl = `${scheme}://openlogin`;

// Replace with Web3Auth Client ID
const clientId = "BI4LxuDfZdoDO5CNTN0qiUJe3PQ7g24IDC-wm-3pXsZICtQMQlOY1OMIcK6mBH7vnfDoLhQSUwtIVfhHErmNIwo";

export interface Web3AuthContextType {
    web3auth: Web3Auth | null;
    provider: any;
    address: string | null;
    userInfo: any;
    loginWithGoogle: () => Promise<{ address: string; userInfo: any } | undefined>;
    logout: () => Promise<void>;
    isLoading: boolean;
    error: string | null;
}

const Web3AuthContext = createContext<Web3AuthContextType | undefined>(undefined);

export const Web3AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [web3auth, setWeb3auth] = useState<Web3Auth | null>(null);
    const [provider, setProvider] = useState<any>(null);
    const [address, setAddress] = useState<string | null>(null);
    const [userInfo, setUserInfo] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const init = async () => {
            try {
                const chainConfig = {
                    chainNamespace: "eip155" as any,
                    chainId: "0x89", // Polygon Mainnet
                    rpcTarget: "https://polygon-rpc.com",
                    displayName: "Polygon Mainnet",
                    blockExplorerUrl: "https://polygonscan.com",
                    ticker: "MATIC",
                    tickerName: "Polygon",
                    decimals: 18,
                };

                const privateKeyProvider = new EthereumPrivateKeyProvider({ config: { chainConfig } });

                const web3authInstance = new Web3Auth(WebBrowser, SecureStore, {
                    clientId,
                    network: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET, // Use SAPPHIRE_MAINNET for production
                    redirectUrl: resolvedRedirectUrl,
                    useCoreKitKey: false,
                    privateKeyProvider,
                });

                await web3authInstance.init();
                setWeb3auth(web3authInstance);

                if (web3authInstance.connected) {
                    await loadUserDetails(web3authInstance, web3authInstance.provider);
                }
            } catch (err: any) {
                console.error("Web3Auth init error:", err);
                setError(err.message || "Failed to initialize Web3Auth");
            } finally {
                setIsLoading(false);
            }
        };
        init();
    }, []);

    const loadUserDetails = async (instance: Web3Auth, currentProvider: any): Promise<{ address: string; userInfo: any } | undefined> => {
        if (!currentProvider) return undefined;
        try {
            setProvider(currentProvider);
            // In v8, we get the private key from the provider
            const privKey = await currentProvider.request({ method: "eth_private_key" });

            // Ethers v6 Wallet creation from private key
            const { Wallet } = require('ethers');
            const wallet = new Wallet(privKey);
            setAddress(wallet.address);

            const info = instance.userInfo();
            setUserInfo(info);
            // In a real app, you would dispatch this info to your backend to save the wallet address
            return { address: wallet.address, userInfo: info };
        } catch (e) {
            console.error("Failed to load user info from Web3Auth provider", e);
            throw e;
        }
    };

    const loginWithGoogle = async (): Promise<{ address: string; userInfo: any } | undefined> => {
        if (!web3auth) {
            setError("Web3Auth not initialized");
            return undefined;
        }
        try {
            setIsLoading(true);
            setError(null);

            const connectedProvider = await web3auth.login({
                loginProvider: "google",
                redirectUrl: resolvedRedirectUrl,
            });

            if (web3auth.connected && connectedProvider) {
                return await loadUserDetails(web3auth, connectedProvider);
            }
            return undefined;
        } catch (err: any) {
            console.error("Login Error:", err);
            setError(err.message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        if (!web3auth) return;
        try {
            await web3auth.logout();
            setProvider(null);
            setAddress(null);
            setUserInfo(null);
        } catch (err: any) {
            console.error("Logout Error:", err);
            setError(err.message);
        }
    };

    return (
        <Web3AuthContext.Provider value={{
            web3auth,
            provider,
            address,
            userInfo,
            loginWithGoogle,
            logout,
            isLoading,
            error
        }}>
            {children}
        </Web3AuthContext.Provider>
    );
};

export const useWeb3Auth = () => {
    const context = useContext(Web3AuthContext);
    if (context === undefined) {
        throw new Error('useWeb3Auth must be used within a Web3AuthProvider');
    }
    return context;
};
