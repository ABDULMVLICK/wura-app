import { AlertCircle, ArrowRight, CheckCircle, X } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
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
// Constants (internes — jamais affichées à l'utilisateur)
// ---------------------------------------------------------------------------

const TRANSAK_BASE_URL = 'https://global-stg.transak.com';
const TRANSAK_API_KEY = process.env.EXPO_PUBLIC_TRANSAK_API_KEY ?? '';

const USDT_ADDRESS_POLYGON = '0xc2132D05D31c914a87C6611C10748AEb04B58e8F';

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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildTransakUrl(walletAddress: string | null, usdtAmount: number): string {
    const params = new URLSearchParams({
        apiKey: TRANSAK_API_KEY,
        environment: 'STAGING',
        productsAvailed: 'SELL',
        cryptoCurrencyCode: 'USDT',
        network: 'polygon',
        fiatCurrency: 'EUR',
        paymentMethod: 'sepa_bank_transfer_instant', // SEPA Instant — règlement en quelques secondes
        disableWalletAddressForm: 'true',
        isFeeCalculationHidden: 'true',
        defaultCryptoAmount: usdtAmount.toFixed(6),
        ...(walletAddress ? { walletAddress } : {}),
    });
    return `${TRANSAK_BASE_URL}?${params.toString()}`;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Step = 'loading' | 'confirm' | 'widget';
type TxStatus = 'idle' | 'sending' | 'success' | 'error';

export interface TransakOffRampProps {
    visible: boolean;
    onClose: () => void;
    /** EUR nets que Transak versera (calculé depuis le solde on-chain dans ReceiverContext) */
    balanceEUR: number;
    /** Solde USDT réel sur Polygon — source de vérité pour defaultCryptoAmount */
    balanceUSDT: number;
}

// ---------------------------------------------------------------------------
// Injected JS
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

export function TransakOffRamp({ visible, onClose, balanceEUR, balanceUSDT }: TransakOffRampProps) {
    const { provider, address } = useWeb3Auth();
    const webViewRef = useRef<WebView>(null);

    const [step, setStep] = useState<Step>('confirm');
    // Montant USDT interne (jamais affiché à l'utilisateur)
    const [usdtAmount, setUsdtAmount] = useState(0);

    const [txStatus, setTxStatus] = useState<TxStatus>('idle');
    const [txHash, setTxHash] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // -----------------------------------------------------------------------
    // balanceUSDT vient directement du solde on-chain (ReceiverContext)
    // Pas de conversion : on envoie exactement ce que le wallet contient
    // -----------------------------------------------------------------------
    useEffect(() => {
        if (visible) {
            setUsdtAmount(balanceUSDT);
            setStep('confirm');
        }
    }, [visible, balanceUSDT]);

    // -----------------------------------------------------------------------
    // Envoi automatique vers Transak (déclenché par ORDER_CREATED)
    // -----------------------------------------------------------------------
    const sendUsdt = useCallback(
        async (transakDepositAddress: string, cryptoAmount: number) => {
            // Mock mode : bypass blockchain pour les tests (EXPO_PUBLIC_MOCK_USDT_BALANCE > 0)
            const isMock = parseFloat(process.env.EXPO_PUBLIC_MOCK_USDT_BALANCE ?? '0') > 0;
            if (isMock) {
                console.log(`[TransakOffRamp] 🧪 Mock mode: simulation TX vers ${transakDepositAddress} (${cryptoAmount} USDT)`);
                setTxStatus('sending');
                await new Promise(r => setTimeout(r, 1500)); // simule latence réseau
                setTxHash('0xMOCK_TEST_' + Date.now().toString(16));
                setTxStatus('success');
                return;
            }

            if (!provider) {
                setErrorMsg('Wallet non connecté. Reconnectez-vous.');
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
                    } catch { /* essai suivant */ }
                }
                if (!rpcProvider) throw new Error('Aucun réseau disponible pour signer la transaction.');

                const wallet = new Wallet(privKey, rpcProvider);
                const usdtContract = new Contract(USDT_ADDRESS_POLYGON, ERC20_ABI, wallet);
                const amountWei = parseUnits(cryptoAmount.toFixed(6), 6);

                const tx = await usdtContract.transfer(transakDepositAddress, amountWei);
                console.log('[TransakOffRamp] TX broadcast:', tx.hash);
                await tx.wait();
                console.log('[TransakOffRamp] TX confirmée:', tx.hash);

                setTxHash(tx.hash);
                setTxStatus('success');
            } catch (err: any) {
                console.error('[TransakOffRamp] Erreur TX:', err);
                setErrorMsg(err?.reason ?? err?.message ?? 'Erreur lors du virement.');
                setTxStatus('error');
            }
        },
        [provider],
    );

    // -----------------------------------------------------------------------
    // Écoute des événements Transak
    // -----------------------------------------------------------------------
    const handleWebViewMessage = useCallback(
        (event: WebViewMessageEvent) => {
            try {
                const raw = event.nativeEvent.data;
                const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
                console.log('[TransakOffRamp] Event:', parsed?.event_id);

                if (
                    parsed?.event_id === 'TRANSAK_ORDER_CREATED' ||
                    parsed?.event_id === 'ORDER_CREATED'
                ) {
                    const order = parsed?.data;
                    const depositAddress: string | undefined = order?.walletAddress;
                    const cryptoAmount: number | undefined =
                        order?.cryptoAmount ?? order?.crypto_amount;

                    if (!depositAddress || !cryptoAmount) return;

                    Alert.alert(
                        'Virement en cours',
                        'Votre retrait est en cours de traitement…',
                        [{ text: 'OK' }],
                        { cancelable: false },
                    );

                    sendUsdt(depositAddress, Number(cryptoAmount));
                }
            } catch (_) {}
        },
        [sendUsdt],
    );

    // -----------------------------------------------------------------------
    // Reset à la fermeture
    // -----------------------------------------------------------------------
    const handleClose = () => {
        setStep('confirm');
        setUsdtAmount(0);
        setTxStatus('idle');
        setTxHash(null);
        setErrorMsg(null);
        onClose();
    };

    const transakUrl = buildTransakUrl(address, usdtAmount);

    // -----------------------------------------------------------------------
    // Render
    // -----------------------------------------------------------------------
    return (
        <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
            <SafeAreaView style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Retrait vers ma banque</Text>
                    <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
                        <X size={18} color="#1a1a2e" />
                    </TouchableOpacity>
                </View>

                {/* ── Confirmation ────────────────────────────────────────── */}
                {step === 'confirm' && (
                    <View style={styles.confirmScreen}>
                        {balanceUSDT <= 0 ? (
                            /* Solde vide */
                            <View style={styles.stateCard}>
                                <Text style={styles.emptyEmoji}>💰</Text>
                                <Text style={styles.stateTitle}>Aucun fonds disponible</Text>
                                <Text style={styles.stateText}>
                                    Vous n'avez pas encore de fonds à retirer.{'\n'}
                                    Attendez qu'un envoi soit effectué en votre nom.
                                </Text>
                                <TouchableOpacity onPress={handleClose} style={styles.secondaryBtn}>
                                    <Text style={styles.secondaryBtnText}>Retour à l'accueil</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            /* Solde disponible */
                            <>
                                <View style={styles.balanceCard}>
                                    <Text style={styles.balanceLabel}>Vous allez recevoir</Text>
                                    <Text style={styles.balanceEur}>
                                        {balanceEUR.toLocaleString('fr-FR', {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        })} €
                                    </Text>
                                    <View style={styles.badge}>
                                        <Text style={styles.badgeText}>Virement SEPA Instant · quelques secondes</Text>
                                    </View>
                                </View>

                                <Text style={styles.infoText}>
                                    Ce montant sera viré directement sur votre compte bancaire.
                                    Vous aurez juste besoin de renseigner votre IBAN.
                                </Text>

                                <TouchableOpacity
                                    onPress={() => setStep('widget')}
                                    style={styles.primaryBtn}
                                >
                                    <Text style={styles.primaryBtnText}>Retirer vers ma banque</Text>
                                    <ArrowRight size={20} color="#ffffff" />
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                )}

                {/* ── Widget Transak ───────────────────────────────────────── */}
                {step === 'widget' && (
                    <>
                        {txStatus !== 'idle' && (
                            <View style={styles.overlay}>
                                {txStatus === 'sending' && <SendingView />}
                                {txStatus === 'success' && (
                                    <SuccessView
                                        eurAmount={balanceEUR}
                                        txHash={txHash}
                                        onClose={handleClose}
                                    />
                                )}
                                {txStatus === 'error' && (
                                    <ErrorView
                                        message={errorMsg}
                                        onRetry={() => setTxStatus('idle')}
                                    />
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
                            style={styles.webview}
                            startInLoadingState
                            renderLoading={() => (
                                <View style={styles.loadingContainer}>
                                    <ActivityIndicator size="large" color="#1a1a2e" />
                                    <Text style={styles.loadingSubText}>Chargement…</Text>
                                </View>
                            )}
                        />
                    </>
                )}
            </SafeAreaView>
        </Modal>
    );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SendingView() {
    return (
        <View style={styles.statusContent}>
            <ActivityIndicator size="large" color="#1a1a2e" style={{ marginBottom: 20 }} />
            <Text style={styles.statusTitle}>Traitement en cours…</Text>
            <Text style={styles.statusSub}>
                Votre retrait est en cours de traitement. Patientez quelques secondes.
            </Text>
        </View>
    );
}

function SuccessView({
    eurAmount,
    txHash,
    onClose,
}: {
    eurAmount: number;
    txHash: string | null;
    onClose: () => void;
}) {
    return (
        <View style={styles.statusContent}>
            <CheckCircle size={64} color="#059669" style={{ marginBottom: 16 }} />
            <Text style={styles.statusTitle}>Retrait initié !</Text>
            <Text style={styles.statusSub}>
                {eurAmount > 0
                    ? `${eurAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} € seront virés instantanément sur votre compte bancaire.`
                    : 'Les fonds seront virés instantanément sur votre compte bancaire.'
                }
            </Text>
            {txHash && (
                <Text style={styles.txHash} numberOfLines={2}>
                    Réf. : {txHash.slice(0, 22)}…
                </Text>
            )}
            <TouchableOpacity onPress={onClose} style={[styles.primaryBtn, { marginTop: 28 }]}>
                <Text style={styles.primaryBtnText}>Fermer</Text>
            </TouchableOpacity>
        </View>
    );
}

function ErrorView({ message, onRetry }: { message: string | null; onRetry: () => void }) {
    return (
        <View style={styles.statusContent}>
            <AlertCircle size={64} color="#dc2626" style={{ marginBottom: 16 }} />
            <Text style={styles.statusTitle}>Une erreur est survenue</Text>
            <Text style={[styles.statusSub, { color: '#dc2626' }]}>
                {message ?? 'Veuillez réessayer.'}
            </Text>
            <TouchableOpacity onPress={onRetry} style={[styles.primaryBtn, { marginTop: 28 }]}>
                <Text style={styles.primaryBtnText}>Réessayer</Text>
            </TouchableOpacity>
        </View>
    );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#ffffff' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    headerTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a2e' },
    closeBtn: {
        height: 32, width: 32, borderRadius: 16,
        backgroundColor: '#f3f4f6',
        alignItems: 'center', justifyContent: 'center',
    },
    // Loading
    centeredScreen: {
        flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40,
    },
    loadingTitle: { fontSize: 17, fontWeight: '700', color: '#1a1a2e', marginBottom: 8 },
    loadingSubText: { fontSize: 14, color: '#6b7280', textAlign: 'center', lineHeight: 20 },
    loadingContainer: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff',
    },
    // Confirm
    confirmScreen: {
        flex: 1, alignItems: 'center', justifyContent: 'center',
        paddingHorizontal: 28, paddingBottom: 40,
    },
    balanceCard: {
        width: '100%', backgroundColor: '#1a1a2e',
        borderRadius: 24, padding: 32,
        alignItems: 'center', marginBottom: 24,
    },
    balanceLabel: {
        fontSize: 13, color: 'rgba(255,255,255,0.6)',
        marginBottom: 8, fontWeight: '500',
    },
    balanceEur: {
        fontSize: 48, fontWeight: '800',
        color: '#ffffff', letterSpacing: -1, marginBottom: 14,
    },
    badge: {
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6,
    },
    badgeText: { fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
    infoText: {
        fontSize: 13, color: '#6b7280', textAlign: 'center',
        lineHeight: 20, marginBottom: 28, paddingHorizontal: 8,
    },
    primaryBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
        backgroundColor: '#1a1a2e', borderRadius: 24,
        paddingHorizontal: 28, paddingVertical: 16, width: '100%',
    },
    primaryBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 16 },
    secondaryBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        borderWidth: 1.5, borderColor: '#1a1a2e',
        borderRadius: 20, paddingHorizontal: 20, paddingVertical: 10,
        marginTop: 20,
    },
    secondaryBtnText: { fontSize: 14, fontWeight: '600', color: '#1a1a2e' },
    // State cards (empty / error)
    stateCard: { alignItems: 'center', paddingHorizontal: 16 },
    stateTitle: { fontSize: 20, fontWeight: '700', color: '#1a1a2e', marginBottom: 10 },
    stateText: {
        fontSize: 14, color: '#6b7280', textAlign: 'center',
        lineHeight: 22, marginBottom: 4,
    },
    emptyEmoji: { fontSize: 56, marginBottom: 16 },
    // Widget
    webview: { flex: 1 },
    overlay: {
        ...StyleSheet.absoluteFillObject, zIndex: 10,
        backgroundColor: 'rgba(255,255,255,0.96)',
        alignItems: 'center', justifyContent: 'center',
        paddingHorizontal: 32, top: 60,
    },
    statusContent: { alignItems: 'center', width: '100%' },
    statusTitle: {
        fontSize: 20, fontWeight: '700', color: '#1a1a2e',
        textAlign: 'center', marginBottom: 12,
    },
    statusSub: { fontSize: 14, color: '#6b7280', textAlign: 'center', lineHeight: 20 },
    txHash: {
        marginTop: 12, fontSize: 11, color: '#9ca3af',
        fontFamily: 'monospace', textAlign: 'center',
    },
});
