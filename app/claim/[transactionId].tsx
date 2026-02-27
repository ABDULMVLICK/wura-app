import { signInWithCustomToken } from "@react-native-firebase/auth";
import Constants from 'expo-constants';
import { useLocalSearchParams, useRouter } from "expo-router";
import { AlertCircle, CheckCircle } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView, WebViewMessageEvent } from "react-native-webview";
import { useWeb3Auth } from "../../contexts/Web3AuthContext";
import api from "../../lib/api";
import { auth } from "../../lib/firebase";
import { AuthService } from "../../services/auth";
import { TransferService } from "../../services/transfers";

// ---------------------------------------------------------------------------
// Helpers Polygon (lecture solde USDT on-chain, identique à ReceiverContext)
// ---------------------------------------------------------------------------

const USDT_CONTRACT_POLYGON = '0xc2132D05D31c914a87C6611C10748AEb04B58e8F';
const POLYGON_RPCS = [
    'https://rpc.ankr.com/polygon',
    'https://polygon.llamarpc.com',
    'https://polygon-bor-rpc.publicnode.com',
    'https://polygon-rpc.com',
];
const ERC20_ABI = [
    'function transfer(address to, uint256 amount) returns (bool)',
    'function balanceOf(address owner) view returns (uint256)',
];

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
                provider,
            );
            const raw = await contract.balanceOf(walletAddress);
            return parseFloat(formatUnits(raw, 6));
        } catch { }
    }
    return 0;
}

// ---------------------------------------------------------------------------
// Transak URL builder (wallet perso du receiver — conforme KYC Transak)
// ---------------------------------------------------------------------------

const TRANSAK_BASE_URL = 'https://global-stg.transak.com';
const TRANSAK_API_KEY = process.env.EXPO_PUBLIC_TRANSAK_API_KEY ?? '';

function buildTransakUrl(walletAddress: string, usdtAmount: number): string {
    const params = new URLSearchParams({
        apiKey: TRANSAK_API_KEY,
        environment: 'STAGING',
        productsAvailed: 'SELL',
        cryptoCurrencyCode: 'USDT',
        network: 'polygon',
        fiatCurrency: 'EUR',
        disableWalletAddressForm: 'true',
        isFeeCalculationHidden: 'true',
        defaultCryptoAmount: usdtAmount.toFixed(6),
        walletAddress,
        paymentMethod: 'sepa_bank_transfer_instant',
    });
    return `${TRANSAK_BASE_URL}?${params.toString()}`;
}

// ---------------------------------------------------------------------------
// Injected JS — relay événements + auto-compliance (identique TransakOffRamp)
// ---------------------------------------------------------------------------

const INJECTED_JS = `
(function() {
  window.addEventListener('message', function(e) {
    try {
      var payload = typeof e.data === 'string' ? e.data : JSON.stringify(e.data);
      window.ReactNativeWebView.postMessage(payload);
    } catch (_) {}
  });
  function tryAutoCompliance() {
    var inputs = document.querySelectorAll('input[type="radio"], input[type="checkbox"]');
    for (var i = 0; i < inputs.length; i++) {
      var input = inputs[i];
      if (input.checked) continue;
      var label = document.querySelector('label[for="' + input.id + '"]')
                  || input.closest('label') || input.parentElement;
      var text = (label ? label.innerText || label.textContent : '').toLowerCase();
      if (text.indexOf('invest') !== -1) {
        input.click();
        setTimeout(function() {
          var btns = document.querySelectorAll('button');
          for (var j = 0; j < btns.length; j++) {
            var t = (btns[j].innerText || btns[j].textContent).toLowerCase();
            if (t.indexOf('continue') !== -1 || t.indexOf('next') !== -1 || t.indexOf('confirm') !== -1) {
              btns[j].click(); break;
            }
          }
        }, 400);
        return;
      }
    }
  }
  var observer = new MutationObserver(tryAutoCompliance);
  function startObserver() {
    if (document.body) { observer.observe(document.body, { childList: true, subtree: true }); tryAutoCompliance(); }
    else { setTimeout(startObserver, 100); }
  }
  startObserver();
  true;
})();
`;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Screen = 'loading' | 'info' | 'connecting' | 'bridging' | 'widget';
type TxStatus = 'idle' | 'sending' | 'success' | 'error';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ClaimTransactionScreen() {
    const router = useRouter();
    const { transactionId } = useLocalSearchParams();
    const { loginWithGoogle, provider } = useWeb3Auth();
    const webViewRef = useRef<WebView>(null);

    const [screen, setScreen] = useState<Screen>('loading');
    const [txData, setTxData] = useState<any>(null);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [connectError, setConnectError] = useState<string | null>(null);

    const [walletAddress, setWalletAddress] = useState<string | null>(null);
    const [balanceUSDT, setBalanceUSDT] = useState(0);
    const [balanceEUR, setBalanceEUR] = useState(0);

    const [txStatus, setTxStatus] = useState<TxStatus>('idle');
    const [txHash, setTxHash] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const isMock = Number(Constants.expoConfig?.extra?.mockUsdtBalance ?? 0) > 0;

    // -----------------------------------------------------------------------
    // Chargement des infos publiques de la transaction
    // -----------------------------------------------------------------------
    useEffect(() => {
        if (!transactionId) return;
        (async () => {
            try {
                const tx = await TransferService.getClaimInfo(transactionId as string);
                setTxData(tx);
                setScreen('info');
            } catch {
                setLoadError("Ce lien est invalide ou expiré.");
                setScreen('info');
            }
        })();
    }, [transactionId]);

    // -----------------------------------------------------------------------
    // Google Sign-In → création de compte → sync wallet → bridge automatique
    // -----------------------------------------------------------------------
    const handleGoogleLogin = async () => {
        setConnectError(null);
        setScreen('connecting');
        try {
            // 1. Web3Auth Google login → wallet individuel créé
            const result = await loginWithGoogle();
            if (!result) throw new Error("Connexion annulée.");
            const { address: newAddress, userInfo } = result;
            setWalletAddress(newAddress);

            // 2. Échange JWT Web3Auth contre Firebase Custom Token
            const web3AuthIdToken = userInfo?.idToken;
            if (!web3AuthIdToken) throw new Error("Token Web3Auth introuvable.");
            const { data } = await api.post<{ firebaseToken: string }>(
                '/auth/firebase-custom-token',
                { idToken: web3AuthIdToken },
            );
            await signInWithCustomToken(auth, data.firebaseToken);

            // 3. Création du compte Receiver (409 = déjà existant → on continue)
            try {
                await AuthService.registerReceiver({
                    firstName: userInfo?.name?.split(" ")[0] || "",
                    lastName: userInfo?.name?.split(" ").slice(1).join(" ") || "",
                    web3AuthWalletAddress: newAddress,
                });
            } catch (err: any) {
                if (err?.response?.status !== 409) throw err;
            }

            // 4. Sync wallet → déclenche le bridge automatique (USDT trésorerie → wallet)
            await api.patch('/users/me/wallet', { walletAddress: newAddress });

            // 5. Attendre que les USDT arrivent dans le wallet
            setScreen('bridging');
            await pollUntilFunded(newAddress);

        } catch (err: any) {
            if (err.code !== "SIGN_IN_CANCELLED" && err.code !== "12501") {
                setConnectError(err?.message || "Impossible de se connecter. Réessayez.");
            }
            setScreen('info');
        }
    };

    // -----------------------------------------------------------------------
    // Polling du solde on-chain jusqu'à ce que les USDT arrivent (~1-2 min)
    // -----------------------------------------------------------------------
    const pollUntilFunded = async (address: string) => {
        const MAX_ATTEMPTS = 60; // 5 minutes max (60 × 5s)
        const INTERVAL = 5000;

        if (isMock) {
            const mockBalance = Number(Constants.expoConfig?.extra?.mockUsdtBalance ?? 0);
            setBalanceUSDT(mockBalance);
            try {
                const { data } = await api.get('/quotes/sell', { params: { cryptoAmount: mockBalance.toFixed(6) } });
                setBalanceEUR(Math.max(0, data.fiatAmount));
            } catch {
                setBalanceEUR(Math.round(mockBalance * 0.92 * 100) / 100);
            }
            setScreen('widget');
            return;
        }

        for (let i = 0; i < MAX_ATTEMPTS; i++) {
            const balance = await readOnChainUSDT(address);
            if (balance > 0) {
                setBalanceUSDT(balance);
                try {
                    const { data } = await api.get('/quotes/sell', { params: { cryptoAmount: balance.toFixed(6) } });
                    setBalanceEUR(Math.max(0, data.fiatAmount));
                } catch {
                    setBalanceEUR(Math.round(balance * 0.92 * 100) / 100);
                }
                setScreen('widget');
                return;
            }
            await new Promise(r => setTimeout(r, INTERVAL));
        }

        // Timeout : fonds non détectés après 5 minutes
        setConnectError("Les fonds n'ont pas pu être détectés après 5 minutes. Réessayez plus tard ou contactez le support.");
        setScreen('info');
    };

    // -----------------------------------------------------------------------
    // Envoi USDT depuis le wallet perso du receiver vers Transak
    // (déclenché par TRANSAK_ORDER_CREATED — conforme KYC Transak)
    // -----------------------------------------------------------------------
    const sendUsdt = useCallback(
        async (transakDepositAddress: string, cryptoAmount: number) => {
            if (isMock) {
                setTxStatus('sending');
                await new Promise(r => setTimeout(r, 1500));
                const mockHash = '0xMOCK_CLAIM_' + Date.now().toString(16);
                setTxHash(mockHash);
                if (txData?.txId) {
                    TransferService.reportOfframp(txData.txId, mockHash).catch(() => { });
                }
                setTxStatus('success');
                return;
            }

            if (!provider) {
                setErrorMsg('Session expirée. Veuillez vous reconnecter.');
                setTxStatus('error');
                return;
            }

            try {
                setTxStatus('sending');
                setErrorMsg(null);

                const { Wallet, JsonRpcProvider, Contract, parseUnits } = require('ethers');
                const privKey: string = await provider.request({ method: 'eth_private_key' });

                let rpcProvider = null;
                for (const rpc of POLYGON_RPCS) {
                    try {
                        const p = new JsonRpcProvider(rpc);
                        await Promise.race([
                            p.getBlockNumber(),
                            new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000)),
                        ]);
                        rpcProvider = p;
                        break;
                    } catch { }
                }
                if (!rpcProvider) throw new Error('Aucun réseau disponible.');

                const wallet = new Wallet(privKey, rpcProvider);
                const usdtContract = new Contract(USDT_CONTRACT_POLYGON, ERC20_ABI, wallet);
                const amountWei = parseUnits(cryptoAmount.toFixed(6), 6);
                const tx = await usdtContract.transfer(transakDepositAddress, amountWei);
                await tx.wait();

                setTxHash(tx.hash);
                setTxStatus('success');

                if (txData?.txId) {
                    TransferService.reportOfframp(txData.txId, tx.hash).catch(() => { });
                }
            } catch (err: any) {
                setErrorMsg(err?.reason ?? err?.message ?? 'Erreur lors du virement.');
                setTxStatus('error');
            }
        },
        [provider, isMock, txData],
    );

    // -----------------------------------------------------------------------
    // Écoute des événements Transak
    // -----------------------------------------------------------------------
    const handleWebViewMessage = useCallback(
        (event: WebViewMessageEvent) => {
            try {
                const raw = event.nativeEvent.data;
                const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
                if (
                    parsed?.event_id === 'TRANSAK_ORDER_CREATED' ||
                    parsed?.event_id === 'ORDER_CREATED'
                ) {
                    const order = parsed?.data;
                    const depositAddress: string | undefined = order?.walletAddress;
                    const cryptoAmount: number | undefined = order?.cryptoAmount ?? order?.crypto_amount;
                    if (!depositAddress || !cryptoAmount) return;
                    Alert.alert('Virement en cours', 'Votre retrait est en cours de traitement…', [{ text: 'OK' }], { cancelable: false });
                    sendUsdt(depositAddress, Number(cryptoAmount));
                }
            } catch (_) { }
        },
        [sendUsdt],
    );

    const transakUrl = walletAddress ? buildTransakUrl(walletAddress, balanceUSDT) : '';

    // -----------------------------------------------------------------------
    // Render — Loading
    // -----------------------------------------------------------------------
    if (screen === 'loading') {
        return (
            <SafeAreaView style={styles.centered}>
                <ActivityIndicator size="large" color="#F59E0B" />
                <Text style={styles.subText}>Chargement…</Text>
            </SafeAreaView>
        );
    }

    // -----------------------------------------------------------------------
    // Render — Erreur lien invalide
    // -----------------------------------------------------------------------
    if (loadError) {
        return (
            <SafeAreaView style={styles.centered}>
                <AlertCircle size={56} color="#dc2626" />
                <Text style={styles.errorTitle}>Lien invalide</Text>
                <Text style={styles.errorText}>{loadError}</Text>
            </SafeAreaView>
        );
    }

    // -----------------------------------------------------------------------
    // Render — Info + Google Sign-In
    // -----------------------------------------------------------------------
    if (screen === 'info') {
        const amountEur = txData?.amountFiatOutExpected ?? '0';
        const senderName = txData?.senderFirstName ?? "Quelqu'un";
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.infoWrapper}>
                    <View style={styles.iconCircle}>
                        <Text style={styles.iconEmoji}>🎁</Text>
                    </View>

                    <Text style={styles.infoTitle}>Vous avez reçu de l'argent !</Text>
                    <Text style={styles.infoSub}>
                        {senderName} vous a envoyé des fonds via Wura.{'\n'}
                        Connectez-vous pour recevoir votre virement bancaire.
                    </Text>

                    <View style={styles.amountCard}>
                        <Text style={styles.amountLabel}>Montant à recevoir</Text>
                        <Text style={styles.amountValue}>{amountEur} €</Text>
                    </View>

                    {connectError && (
                        <Text style={styles.connectError}>{connectError}</Text>
                    )}

                    <TouchableOpacity onPress={handleGoogleLogin} style={styles.googleBtn}>
                        <Image
                            source={{ uri: "https://developers.google.com/identity/images/g-logo.png" }}
                            style={{ width: 20, height: 20 }}
                            resizeMode="contain"
                        />
                        <Text style={styles.googleBtnLabel}>Continuer avec Google</Text>
                    </TouchableOpacity>

                    <Text style={styles.legalNote}>
                        Un compte sécurisé sera automatiquement créé.{'\n'}
                        Virement SEPA vers votre compte bancaire.
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    // -----------------------------------------------------------------------
    // Render — Connexion en cours
    // -----------------------------------------------------------------------
    if (screen === 'connecting') {
        return (
            <SafeAreaView style={styles.centered}>
                <ActivityIndicator size="large" color="#1a1a2e" />
                <Text style={styles.statusTitle}>Connexion en cours…</Text>
                <Text style={styles.subText}>Création de votre espace sécurisé.</Text>
            </SafeAreaView>
        );
    }

    // -----------------------------------------------------------------------
    // Render — Attente du bridge (USDT trésorerie → wallet personnel)
    // -----------------------------------------------------------------------
    if (screen === 'bridging') {
        return (
            <SafeAreaView style={styles.centered}>
                <ActivityIndicator size="large" color="#F59E0B" />
                <Text style={styles.statusTitle}>Préparation de vos fonds…</Text>
                <Text style={styles.subText}>
                    Cette étape peut prendre 1 à 2 minutes.{'\n'}Ne fermez pas cette page.
                </Text>
            </SafeAreaView>
        );
    }

    // -----------------------------------------------------------------------
    // Render — Widget Transak (depuis le wallet perso du receiver)
    // -----------------------------------------------------------------------
    return (
        <SafeAreaView style={styles.container}>
            {txStatus !== 'idle' && (
                <View style={styles.overlay}>
                    {txStatus === 'sending' && (
                        <View style={styles.statusContent}>
                            <ActivityIndicator size="large" color="#1a1a2e" style={{ marginBottom: 20 }} />
                            <Text style={styles.statusTitle}>Traitement en cours…</Text>
                            <Text style={styles.statusSub}>
                                Votre virement est en cours de traitement. Patientez quelques secondes.
                            </Text>
                        </View>
                    )}

                    {txStatus === 'success' && (
                        <View style={styles.statusContent}>
                            <CheckCircle size={64} color="#059669" style={{ marginBottom: 16 }} />
                            <Text style={styles.statusTitle}>Virement initié !</Text>
                            <Text style={styles.statusSub}>
                                {balanceEUR > 0
                                    ? `${balanceEUR.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} € seront virés sur votre compte bancaire.`
                                    : 'Les fonds seront virés sur votre compte bancaire.'
                                }
                            </Text>
                            {txHash && (
                                <Text style={styles.txRef} numberOfLines={2}>
                                    Réf. : {txHash.slice(0, 22)}…
                                </Text>
                            )}
                            <TouchableOpacity
                                onPress={() => router.replace('/accueil')}
                                style={[styles.primaryBtn, { marginTop: 28, width: '100%' }]}
                            >
                                <Text style={styles.primaryBtnText}>Voir mon espace Wura</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {txStatus === 'error' && (
                        <View style={styles.statusContent}>
                            <AlertCircle size={64} color="#dc2626" style={{ marginBottom: 16 }} />
                            <Text style={styles.statusTitle}>Une erreur est survenue</Text>
                            <Text style={[styles.statusSub, { color: '#dc2626' }]}>
                                {errorMsg ?? 'Veuillez réessayer.'}
                            </Text>
                            <TouchableOpacity
                                onPress={() => setTxStatus('idle')}
                                style={[styles.primaryBtn, { marginTop: 28, width: '100%' }]}
                            >
                                <Text style={styles.primaryBtnText}>Réessayer</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            )}

            <WebView
                ref={webViewRef}
                source={{ uri: transakUrl }}
                injectedJavaScript={INJECTED_JS}
                onMessage={handleWebViewMessage}
                javaScriptEnabled
                domStorageEnabled
                incognito
                style={{ flex: 1 }}
                startInLoadingState
                renderLoading={() => (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#1a1a2e" />
                        <Text style={styles.subText}>Chargement…</Text>
                    </View>
                )}
            />
        </SafeAreaView>
    );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#ffffff' },
    centered: {
        flex: 1, alignItems: 'center', justifyContent: 'center',
        backgroundColor: '#f8f7f5', paddingHorizontal: 32,
    },
    subText: { marginTop: 16, fontSize: 14, color: '#6b7280', textAlign: 'center', lineHeight: 20 },
    errorTitle: { fontSize: 22, fontWeight: '700', color: '#dc2626', marginTop: 16, marginBottom: 8 },
    errorText: { fontSize: 14, color: '#6b7280', textAlign: 'center', lineHeight: 22 },
    // Info screen
    infoWrapper: {
        flex: 1, alignItems: 'center', justifyContent: 'center',
        paddingHorizontal: 28, paddingBottom: 40,
    },
    iconCircle: {
        width: 80, height: 80, borderRadius: 40,
        backgroundColor: '#FEF3C7',
        alignItems: 'center', justifyContent: 'center', marginBottom: 24,
    },
    iconEmoji: { fontSize: 40 },
    infoTitle: {
        fontSize: 24, fontWeight: '800', color: '#1a1a2e',
        textAlign: 'center', marginBottom: 12,
    },
    infoSub: {
        fontSize: 15, color: '#6b7280', textAlign: 'center',
        lineHeight: 22, marginBottom: 32,
    },
    amountCard: {
        width: '100%', backgroundColor: '#f9fafb',
        borderRadius: 20, padding: 28,
        alignItems: 'center', marginBottom: 24,
        borderWidth: 1, borderColor: '#e5e7eb',
    },
    amountLabel: { fontSize: 13, color: '#9ca3af', fontWeight: '500', marginBottom: 6 },
    amountValue: { fontSize: 44, fontWeight: '900', color: '#F59E0B' },
    connectError: {
        fontSize: 13, color: '#dc2626', textAlign: 'center',
        marginBottom: 16, lineHeight: 18,
    },
    googleBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12,
        width: '100%', backgroundColor: '#ffffff',
        borderWidth: 1.5, borderColor: '#e5e7eb',
        borderRadius: 24, paddingVertical: 16,
        shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
    },
    googleBtnLabel: { fontSize: 16, fontWeight: '600', color: '#1a1a2e' },
    legalNote: {
        fontSize: 12, color: '#9ca3af', textAlign: 'center',
        marginTop: 20, lineHeight: 18,
    },
    // Status screens
    statusTitle: {
        fontSize: 20, fontWeight: '700', color: '#1a1a2e',
        textAlign: 'center', marginTop: 16, marginBottom: 8,
    },
    primaryBtn: {
        backgroundColor: '#1a1a2e', borderRadius: 24,
        paddingHorizontal: 28, paddingVertical: 16,
        alignItems: 'center', justifyContent: 'center', width: '100%',
    },
    primaryBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 16 },
    // Overlay widget
    overlay: {
        ...StyleSheet.absoluteFillObject, zIndex: 10,
        backgroundColor: 'rgba(255,255,255,0.97)',
        alignItems: 'center', justifyContent: 'center',
        paddingHorizontal: 32,
    },
    statusContent: { alignItems: 'center', width: '100%' },
    statusSub: { fontSize: 15, color: '#6b7280', textAlign: 'center', lineHeight: 22 },
    txRef: {
        marginTop: 12, fontSize: 11, color: '#9ca3af',
        fontFamily: 'monospace', textAlign: 'center',
    },
    loadingContainer: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff',
    },
});
