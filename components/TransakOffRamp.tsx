import { AlertCircle, CheckCircle, X } from 'lucide-react-native';
import { useCallback, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { useWeb3Auth } from '../contexts/Web3AuthContext';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TRANSAK_BASE_URL = 'https://global-stg.transak.com';
const TRANSAK_API_KEY = process.env.EXPO_PUBLIC_TRANSAK_API_KEY ?? '';

// USDT sur Polygon Mainnet — 6 décimales
// En staging Transak utilise le réseau Polygon Mainnet pour USDT
const USDT_ADDRESS_POLYGON = '0xc2132D05D31c914a87C6611C10748AEb04B58e8F';
const POLYGON_MAINNET_RPC = 'https://polygon-rpc.com';

// ABI minimal ERC-20 (transfer + balanceOf)
const ERC20_TRANSFER_ABI = [
    'function transfer(address to, uint256 amount) returns (bool)',
    'function balanceOf(address owner) view returns (uint256)',
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildTransakUrl(walletAddress: string | null): string {
    const params = new URLSearchParams({
        apiKey: TRANSAK_API_KEY,
        environment: 'STAGING',
        productsAvailed: 'SELL',       // Off-ramp uniquement
        cryptoCurrencyCode: 'USDT',
        network: 'polygon',
        fiatCurrency: 'EUR',
        isFeeCalculationHidden: 'true',
        disableWalletAddressForm: 'true',
        ...(walletAddress ? { walletAddress } : {}),
    });
    return `${TRANSAK_BASE_URL}?${params.toString()}`;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TxStatus = 'idle' | 'sending' | 'success' | 'error';

export interface TransakOffRampProps {
    visible: boolean;
    onClose: () => void;
}

// ---------------------------------------------------------------------------
// Injected JS — intercepte les événements postMessage de Transak
// et les relaie vers React Native via window.ReactNativeWebView.postMessage
// ---------------------------------------------------------------------------
const INJECTED_JS = `
(function() {
  window.addEventListener('message', function(e) {
    try {
      var payload = typeof e.data === 'string' ? e.data : JSON.stringify(e.data);
      window.ReactNativeWebView.postMessage(payload);
    } catch (_) {}
  });
  true;
})();
`;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TransakOffRamp({ visible, onClose }: TransakOffRampProps) {
    const { provider, address } = useWeb3Auth();
    const webViewRef = useRef<WebView>(null);

    const [txStatus, setTxStatus] = useState<TxStatus>('idle');
    const [txHash, setTxHash] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const transakUrl = buildTransakUrl(address);

    // -----------------------------------------------------------------------
    // Envoi automatique des USDT vers l'adresse de dépôt Transak
    // -----------------------------------------------------------------------
    const sendUsdt = useCallback(
        async (transakDepositAddress: string, cryptoAmount: number) => {
            if (!provider) {
                setErrorMsg('Wallet non connecté. Reconnectez-vous.');
                setTxStatus('error');
                return;
            }

            try {
                setTxStatus('sending');
                setErrorMsg(null);

                const { Wallet, JsonRpcProvider, Contract, parseUnits } = require('ethers');

                // 1. Récupère la clé privée depuis le provider Web3Auth
                const privKey: string = await provider.request({ method: 'eth_private_key' });

                // 2. Connecte le wallet à Polygon Mainnet (où vit l'USDT)
                //    Note : la clé privée Web3Auth fonctionne sur tous les réseaux EVM
                const rpcProvider = new JsonRpcProvider(POLYGON_MAINNET_RPC);
                const wallet = new Wallet(privKey, rpcProvider);

                // 3. Instancie le contrat USDT Polygon
                const usdtContract = new Contract(USDT_ADDRESS_POLYGON, ERC20_TRANSFER_ABI, wallet);

                // 4. Convertit le montant en unités de base (6 décimales pour USDT)
                const amountWei = parseUnits(cryptoAmount.toFixed(6), 6);

                // 5. Envoie la transaction
                const tx = await usdtContract.transfer(transakDepositAddress, amountWei);
                console.log('[TransakOffRamp] TX broadcast:', tx.hash);

                // 6. Attend la confirmation on-chain
                await tx.wait();
                console.log('[TransakOffRamp] TX confirmée:', tx.hash);

                setTxHash(tx.hash);
                setTxStatus('success');
            } catch (err: any) {
                console.error('[TransakOffRamp] Erreur TX:', err);
                setErrorMsg(err?.reason ?? err?.message ?? 'Erreur lors de l\'envoi des USDT');
                setTxStatus('error');
            }
        },
        [provider],
    );

    // -----------------------------------------------------------------------
    // Écoute les événements émis par le widget Transak via postMessage
    // -----------------------------------------------------------------------
    const handleWebViewMessage = useCallback(
        (event: WebViewMessageEvent) => {
            try {
                const raw = event.nativeEvent.data;
                const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;

                console.log('[TransakOffRamp] Event reçu:', parsed?.event_id);

                // Transak order créé → l'utilisateur a confirmé son retrait côté Transak
                if (
                    parsed?.event_id === 'TRANSAK_ORDER_CREATED' ||
                    parsed?.event_id === 'ORDER_CREATED'
                ) {
                    const order = parsed?.data;

                    // Adresse de dépôt Transak (où envoyer les USDT)
                    const depositAddress: string | undefined = order?.walletAddress;
                    // Montant USDT à envoyer
                    const cryptoAmount: number | undefined =
                        order?.cryptoAmount ?? order?.crypto_amount;

                    if (!depositAddress || !cryptoAmount) {
                        console.warn('[TransakOffRamp] Payload ORDER_CREATED incomplet', order);
                        return;
                    }

                    Alert.alert(
                        'Envoi automatique',
                        `Signature et envoi de ${cryptoAmount} USDT vers Transak en cours…`,
                        [{ text: 'OK' }],
                        { cancelable: false },
                    );

                    sendUsdt(depositAddress, Number(cryptoAmount));
                }
            } catch (_) {
                // Message non-JSON (ex : analytics internes du widget) — on ignore
            }
        },
        [sendUsdt],
    );

    // -----------------------------------------------------------------------
    // Fermeture et reset
    // -----------------------------------------------------------------------
    const handleClose = () => {
        setTxStatus('idle');
        setTxHash(null);
        setErrorMsg(null);
        onClose();
    };

    // -----------------------------------------------------------------------
    // Render
    // -----------------------------------------------------------------------
    return (
        <Modal
            visible={visible}
            animationType="slide"
            onRequestClose={handleClose}
        >
            <SafeAreaView style={styles.container}>
                {/* ── Header ─────────────────────────────────────────────── */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Retrait vers ma banque</Text>
                    <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
                        <X size={18} color="#1a1a2e" />
                    </TouchableOpacity>
                </View>

                {/* ── Overlay de statut TX ────────────────────────────────── */}
                {txStatus !== 'idle' && (
                    <View style={styles.overlay}>
                        {txStatus === 'sending' && <SendingView />}
                        {txStatus === 'success' && (
                            <SuccessView txHash={txHash} onClose={handleClose} />
                        )}
                        {txStatus === 'error' && (
                            <ErrorView
                                message={errorMsg}
                                onRetry={() => setTxStatus('idle')}
                            />
                        )}
                    </View>
                )}

                {/* ── Widget Transak ──────────────────────────────────────── */}
                <WebView
                    ref={webViewRef}
                    source={{ uri: transakUrl }}
                    injectedJavaScript={INJECTED_JS}
                    onMessage={handleWebViewMessage}
                    javaScriptEnabled
                    domStorageEnabled
                    style={styles.webview}
                    startInLoadingState
                    renderLoading={() => (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#1a1a2e" />
                            <Text style={styles.loadingText}>Chargement du widget…</Text>
                        </View>
                    )}
                />
            </SafeAreaView>
        </Modal>
    );
}

// ---------------------------------------------------------------------------
// Sub-components (status views)
// ---------------------------------------------------------------------------

function SendingView() {
    return (
        <View style={styles.statusContent}>
            <ActivityIndicator size="large" color="#1a1a2e" style={{ marginBottom: 20 }} />
            <Text style={styles.statusTitle}>Envoi des USDT en cours…</Text>
            <Text style={styles.statusSub}>
                Votre transaction est signée et diffusée sur Polygon. Patientez quelques secondes.
            </Text>
        </View>
    );
}

function SuccessView({ txHash, onClose }: { txHash: string | null; onClose: () => void }) {
    return (
        <View style={styles.statusContent}>
            <CheckCircle size={64} color="#059669" style={{ marginBottom: 16 }} />
            <Text style={styles.statusTitle}>USDT envoyés !</Text>
            <Text style={styles.statusSub}>
                Transak traite votre retrait. Les euros seront virés sur votre compte sous 1–3 jours ouvrés.
            </Text>
            {txHash && (
                <Text style={styles.txHash} numberOfLines={2}>
                    TX : {txHash.slice(0, 22)}…
                </Text>
            )}
            <TouchableOpacity onPress={onClose} style={styles.primaryBtn}>
                <Text style={styles.primaryBtnText}>Fermer</Text>
            </TouchableOpacity>
        </View>
    );
}

function ErrorView({
    message,
    onRetry,
}: {
    message: string | null;
    onRetry: () => void;
}) {
    return (
        <View style={styles.statusContent}>
            <AlertCircle size={64} color="#dc2626" style={{ marginBottom: 16 }} />
            <Text style={styles.statusTitle}>Une erreur est survenue</Text>
            <Text style={[styles.statusSub, { color: '#dc2626' }]}>{message ?? 'Erreur inconnue'}</Text>
            <TouchableOpacity onPress={onRetry} style={styles.primaryBtn}>
                <Text style={styles.primaryBtnText}>Réessayer</Text>
            </TouchableOpacity>
        </View>
    );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1a1a2e',
    },
    closeBtn: {
        height: 32,
        width: 32,
        borderRadius: 16,
        backgroundColor: '#f3f4f6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    webview: {
        flex: 1,
    },
    loadingContainer: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffffff',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#6b7280',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 10,
        backgroundColor: 'rgba(255,255,255,0.96)',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
        // Pousse l'overlay sous le header
        top: 60,
    },
    statusContent: {
        alignItems: 'center',
        width: '100%',
    },
    statusTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1a1a2e',
        textAlign: 'center',
        marginBottom: 12,
    },
    statusSub: {
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'center',
        lineHeight: 20,
    },
    txHash: {
        marginTop: 12,
        fontSize: 11,
        color: '#9ca3af',
        fontFamily: 'monospace',
        textAlign: 'center',
    },
    primaryBtn: {
        marginTop: 28,
        backgroundColor: '#1a1a2e',
        borderRadius: 24,
        paddingHorizontal: 36,
        paddingVertical: 14,
    },
    primaryBtnText: {
        color: '#ffffff',
        fontWeight: '700',
        fontSize: 15,
    },
});
