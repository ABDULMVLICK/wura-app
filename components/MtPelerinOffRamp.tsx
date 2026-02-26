import Constants from 'expo-constants';
import { AlertCircle, CheckCircle, Clock, X } from 'lucide-react-native';
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
// Constants
// ---------------------------------------------------------------------------

// Clé de test fournie par Mt Pelerin (fonctionne sur localhost & staging)
// En production, utiliser EXPO_PUBLIC_MT_PELERIN_API_KEY depuis .env
const MT_PELERIN_TEST_KEY = 'bec6626e-8913-497d-9835-6e6ae9edb144';

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
// Construit l'URL Mt Pelerin avec validation d'adresse automatique.
//
// Mt Pelerin exige addr + code + hash pour valider le wallet sans KYC manuel :
//   code = entier aléatoire 1000-9999
//   hash = base64( signature ECDSA de "MtPelerin-{code}" par la clé du wallet )
// Ref: https://developers.mtpelerin.com/integration-guides/parameters-and-customization/automating-the-end-user-address-validation
// ---------------------------------------------------------------------------
async function buildMtPelerinUrl(
    walletAddress: string,
    usdtAmount: number,
    provider: any,
): Promise<string> {
    const apiKey = process.env.EXPO_PUBLIC_MT_PELERIN_API_KEY ?? MT_PELERIN_TEST_KEY;
    const code = Math.floor(1000 + Math.random() * 9000);

    let hash = '';
    try {
        const { Wallet } = require('ethers');
        const privKey: string = await provider.request({ method: 'eth_private_key' });
        const wallet = new Wallet(privKey);
        const rawSignature: string = await wallet.signMessage(`MtPelerin-${code}`);
        // Convertir la signature hex (sans 0x) en base64
        hash = Buffer.from(rawSignature.slice(2), 'hex').toString('base64');
    } catch (err) {
        console.warn('[MtPelerin] Impossible de générer le hash — validation manuelle requise:', err);
    }

    const params = new URLSearchParams({
        _ctkn: apiKey,
        type: 'webview',   // mode mobile
        lang: 'fr',
        tab: 'sell',       // onglet vente par défaut
        tabs: 'sell',      // seul l'onglet vente est disponible
        ssc: 'USDT',       // source crypto (ce que l'utilisateur vend)
        sdc: 'EUR',        // destination fiat (ce que l'utilisateur reçoit)
        snet: 'matic_mainnet',  // réseau Polygon
        ssa: usdtAmount.toFixed(6),  // montant USDT pré-rempli
        addr: walletAddress,
        code: code.toString(),
    });

    if (hash) {
        params.append('hash', encodeURIComponent(hash));
    }

    return `https://widget.mtpelerin.com/?${params.toString()}`;
}

// ---------------------------------------------------------------------------
// Injected JS — relaie tous les postMessage du widget vers React Native
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
// Types
// ---------------------------------------------------------------------------

type Step = 'loading' | 'widget' | 'confirm';
type TxStatus = 'idle' | 'sending' | 'success' | 'error';

export interface MtPelerinOffRampProps {
    visible: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    balanceEUR: number;
    balanceUSDT: number;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MtPelerinOffRamp({ visible, onClose, onSuccess, balanceEUR, balanceUSDT }: MtPelerinOffRampProps) {
    const { provider, address } = useWeb3Auth();
    const webViewRef = useRef<WebView>(null);

    const [step, setStep] = useState<Step>('loading');
    const [widgetUrl, setWidgetUrl] = useState<string | null>(null);
    const [usdtAmount, setUsdtAmount] = useState(0);
    const [txStatus, setTxStatus] = useState<TxStatus>('idle');
    const [txHash, setTxHash] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Construire l'URL (avec signature) à l'ouverture du modal
    useEffect(() => {
        if (!visible) return;

        setUsdtAmount(balanceUSDT);

        if (balanceUSDT <= 0 || balanceEUR <= 0) {
            setStep('confirm');
            return;
        }

        setStep('loading');

        if (!address || !provider) {
            setStep('confirm');
            return;
        }

        buildMtPelerinUrl(address, balanceUSDT, provider)
            .then(url => {
                setWidgetUrl(url);
                setStep('widget');
            })
            .catch(() => setStep('confirm'));
    }, [visible, balanceUSDT, balanceEUR, address, provider]);

    // -----------------------------------------------------------------------
    // Envoi USDT vers l'adresse de dépôt Mt Pelerin
    // Déclenché par l'événement "orderCreated" → data.offRampAddress
    // -----------------------------------------------------------------------
    const sendUsdt = useCallback(
        async (depositAddress: string, cryptoAmount: number) => {
            const isMock = Number(Constants.expoConfig?.extra?.mockUsdtBalance ?? 0) > 0;
            if (isMock) {
                console.log(`[MtPelerin] 🧪 Mock: simulation TX vers ${depositAddress} (${cryptoAmount} USDT)`);
                setTxStatus('sending');
                await new Promise(r => setTimeout(r, 1500));
                setTxHash('0xMOCK_MTP_' + Date.now().toString(16));
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
                    } catch { /* essai suivant */ }
                }
                if (!rpcProvider) throw new Error('Aucun réseau disponible.');

                const wallet = new Wallet(privKey, rpcProvider);
                const usdtContract = new Contract(USDT_ADDRESS_POLYGON, ERC20_ABI, wallet);
                const amountWei = parseUnits(cryptoAmount.toFixed(6), 6);

                const tx = await usdtContract.transfer(depositAddress, amountWei);
                console.log('[MtPelerin] TX broadcast:', tx.hash);
                await tx.wait();
                console.log('[MtPelerin] TX confirmée:', tx.hash);

                setTxHash(tx.hash);
                setTxStatus('success');
            } catch (err: any) {
                console.error('[MtPelerin] Erreur TX:', err);
                setErrorMsg(err?.reason ?? err?.message ?? 'Erreur lors du virement.');
                setTxStatus('error');
            }
        },
        [provider],
    );

    // -----------------------------------------------------------------------
    // Écoute des événements Mt Pelerin
    //
    // "orderCreated" : l'utilisateur a confirmé — data.offRampAddress = adresse
    //                  de dépôt Mt Pelerin, data.valueIn = montant USDT à envoyer
    // "paymentSubmitted" : Mt Pelerin a reçu la transaction (confirmation de leur côté)
    // Ref: https://developers.mtpelerin.com/integration-guides/events
    // -----------------------------------------------------------------------
    const handleWebViewMessage = useCallback(
        (event: WebViewMessageEvent) => {
            try {
                const raw = event.nativeEvent.data;
                const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
                console.log('[MtPelerin] Event:', parsed?.type, JSON.stringify(parsed?.data ?? {}).slice(0, 100));

                if (parsed?.type === 'orderCreated' && parsed?.data?.type === 'sell') {
                    const depositAddress: string | undefined = parsed.data.offRampAddress;
                    const cryptoAmount: number | undefined = parsed.data.valueIn;

                    if (!depositAddress || !cryptoAmount) return;

                    Alert.alert(
                        'Virement en cours',
                        'Votre retrait SEPA (1-3 jours ouvrés) est en cours de traitement…',
                        [{ text: 'OK' }],
                        { cancelable: false },
                    );

                    sendUsdt(depositAddress, Number(cryptoAmount));
                }
            } catch (_) {}
        },
        [sendUsdt],
    );

    const handleClose = () => {
        if (txStatus === 'success') onSuccess?.();
        setStep('loading');
        setWidgetUrl(null);
        setUsdtAmount(0);
        setTxStatus('idle');
        setTxHash(null);
        setErrorMsg(null);
        onClose();
    };

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
            <SafeAreaView style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.headerTitle}>Retrait vers ma banque</Text>
                        <Text style={styles.headerSubtitle}>SEPA Standard · 1-3 jours ouvrés</Text>
                    </View>
                    <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
                        <X size={18} color="#1a1a2e" />
                    </TouchableOpacity>
                </View>

                {/* ── Chargement de l'URL (génération de la signature) ─────── */}
                {step === 'loading' && (
                    <View style={styles.centered}>
                        <ActivityIndicator size="large" color="#1a1a2e" />
                        <Text style={styles.loadingText}>Préparation du retrait…</Text>
                    </View>
                )}

                {/* ── Aucun fonds / solde insuffisant ─────────────────────── */}
                {step === 'confirm' && (
                    <View style={styles.centered}>
                        {balanceUSDT <= 0 ? (
                            <View style={styles.stateCard}>
                                <Text style={styles.emptyEmoji}>💰</Text>
                                <Text style={styles.stateTitle}>Aucun fonds disponible</Text>
                                <Text style={styles.stateText}>
                                    Vous n'avez pas encore de fonds à retirer.
                                </Text>
                                <TouchableOpacity onPress={handleClose} style={styles.secondaryBtn}>
                                    <Text style={styles.secondaryBtnText}>Retour à l'accueil</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View style={styles.stateCard}>
                                <Text style={styles.emptyEmoji}>⚠️</Text>
                                <Text style={styles.stateTitle}>Solde insuffisant</Text>
                                <Text style={styles.stateText}>
                                    Votre solde est trop faible pour couvrir les frais de virement.
                                </Text>
                                <TouchableOpacity onPress={handleClose} style={styles.secondaryBtn}>
                                    <Text style={styles.secondaryBtnText}>Retour à l'accueil</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                )}

                {/* ── Widget Mt Pelerin ────────────────────────────────────── */}
                {step === 'widget' && widgetUrl && (
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
                            key={address ?? 'no-wallet'}
                            ref={webViewRef}
                            source={{ uri: widgetUrl }}
                            injectedJavaScript={INJECTED_JS}
                            onMessage={handleWebViewMessage}
                            javaScriptEnabled
                            domStorageEnabled
                            incognito
                            style={styles.webview}
                            startInLoadingState
                            renderLoading={() => (
                                <View style={styles.loadingContainer}>
                                    <ActivityIndicator size="large" color="#1a1a2e" />
                                    <Text style={styles.loadingText}>Chargement Mt Pelerin…</Text>
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
                Envoi des fonds à Mt Pelerin. Patientez quelques secondes.
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
            <View style={styles.sepaNotice}>
                <Clock size={14} color="#6b7280" />
                <Text style={styles.sepaNoticeText}>Virement SEPA Standard · 1-3 jours ouvrés</Text>
            </View>
            <Text style={styles.statusSub}>
                {eurAmount > 0
                    ? `${eurAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} € seront virés sur votre compte bancaire dans 1 à 3 jours ouvrés.`
                    : 'Les fonds seront virés sur votre compte bancaire dans 1 à 3 jours ouvrés.'
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
    headerSubtitle: { fontSize: 11, color: '#6b7280', marginTop: 2 },
    closeBtn: {
        height: 32, width: 32, borderRadius: 16,
        backgroundColor: '#f3f4f6',
        alignItems: 'center', justifyContent: 'center',
    },
    centered: {
        flex: 1, alignItems: 'center', justifyContent: 'center',
        paddingHorizontal: 28, paddingBottom: 40,
    },
    loadingText: { fontSize: 14, color: '#6b7280', marginTop: 16 },
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
    stateCard: { alignItems: 'center', paddingHorizontal: 16 },
    stateTitle: { fontSize: 20, fontWeight: '700', color: '#1a1a2e', marginBottom: 10 },
    stateText: {
        fontSize: 14, color: '#6b7280', textAlign: 'center',
        lineHeight: 22, marginBottom: 4,
    },
    emptyEmoji: { fontSize: 56, marginBottom: 16 },
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
    sepaNotice: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: '#f3f4f6', borderRadius: 20,
        paddingHorizontal: 12, paddingVertical: 6,
        marginBottom: 12,
    },
    sepaNoticeText: { fontSize: 12, color: '#6b7280' },
    txHash: {
        marginTop: 12, fontSize: 11, color: '#9ca3af',
        fontFamily: 'monospace', textAlign: 'center',
    },
    loadingContainer: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff',
    },
});
