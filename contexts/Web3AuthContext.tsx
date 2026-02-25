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
const clientId = "BMKEDVG7rqxmT9qA4ZWkHd0EhK37tbeToSkJEDaYHFkHA0R5OPWKZtvlKBM_f2p-t3qD1EAHEd6482a4IrmQ9V8";

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
                console.log("[Web3Auth] Initializing with clientId:", clientId.substring(0, 20) + "...");
                console.log("[Web3Auth] Network: SAPPHIRE_DEVNET");
                console.log("[Web3Auth] RedirectUrl:", resolvedRedirectUrl);

                const chainConfig = {
                    chainNamespace: "eip155" as any,
                    chainId: "0x13882", // Polygon Amoy Testnet
                    rpcTarget: "https://rpc-amoy.polygon.technology",
                    displayName: "Polygon Amoy Testnet",
                    blockExplorerUrl: "https://amoy.polygonscan.com",
                    ticker: "MATIC",
                    tickerName: "Polygon",
                    decimals: 18,
                };

                const privateKeyProvider = new EthereumPrivateKeyProvider({ config: { chainConfig } });

                const web3authInstance = new Web3Auth(WebBrowser, SecureStore, {
                    clientId,
                    network: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
                    redirectUrl: resolvedRedirectUrl,
                    useCoreKitKey: false,
                    privateKeyProvider,
                });

                await web3authInstance.init();
                console.log("[Web3Auth] ✅ Init successful, connected:", web3authInstance.connected);
                setWeb3auth(web3authInstance);

                if (web3authInstance.connected) {
                    await loadUserDetails(web3authInstance, web3authInstance.provider);
                }
            } catch (err: any) {
                console.error("[Web3Auth] ❌ Init FAILED");
                console.error("[Web3Auth] Error message:", err.message);
                console.error("[Web3Auth] Error code:", err.code);
                console.error("[Web3Auth] Error data:", JSON.stringify(err.data || err.response || {}, null, 2));
                console.error("[Web3Auth] Full error:", JSON.stringify(err, null, 2));
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
            console.log("[Web3Auth] userInfo keys:", Object.keys(info || {}));
            console.log("[Web3Auth] userInfo.email:", info?.email);
            console.log("[Web3Auth] has oAuthIdToken:", !!info?.oAuthIdToken);
            console.log("[Web3Auth] has idToken:", !!info?.idToken);
            setUserInfo(info);
            return { address: wallet.address, userInfo: info };
        } catch (e) {
            console.error("[Web3Auth] Failed to load user info from provider", e);
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

            // If already connected from a cached session, check if we have a valid oAuthIdToken
            if (web3auth.connected && web3auth.provider) {
                console.log("[Web3Auth] Already connected, checking cached session...");
                const cachedInfo = web3auth.userInfo();
                if (cachedInfo?.oAuthIdToken) {
                    // Cached session has a valid Google token, reuse it
                    console.log("[Web3Auth] Cached session has valid oAuthIdToken, reusing");
                    return await loadUserDetails(web3auth, web3auth.provider);
                } else {
                    // Cached session has no Google token (expired), logout and re-login
                    console.log("[Web3Auth] Cached session has no oAuthIdToken, logging out to get fresh token...");
                    await web3auth.logout();
                }
            }

            const connectedProvider = await web3auth.login({
                loginProvider: "google",
                redirectUrl: resolvedRedirectUrl,
            });

            if (web3auth.connected && connectedProvider) {
                return await loadUserDetails(web3auth, connectedProvider);
            }
            return undefined;
        } catch (err: any) {
            console.error("[Web3Auth] Login Error:", err);
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
