import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams, useRouter } from "expo-router";
import {
    AlertTriangle, ArrowLeft, Building2, Calendar,
    CheckCircle2, Clock, Copy, CreditCard, ExternalLink,
    Globe, Hash, MessageSquare, RefreshCw, Send, Share2,
    User, XCircle, Zap,
} from "lucide-react-native";
import { useEffect, useState } from "react";
import {
    ActivityIndicator, Alert, KeyboardAvoidingView, Linking, Modal,
    Platform, ScrollView, Share, Text, TextInput,
    TouchableOpacity, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TransferService } from "../../services/transfers";

// ─── STATUS CONFIG ────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, {
    label: string; color: string; bg: string; border: string; description: string;
}> = {
    INITIATED: {
        label: "Initiée", color: "#6B7280", bg: "#F9FAFB", border: "#E5E7EB",
        description: "La transaction a été créée",
    },
    PAYIN_PENDING: {
        label: "Paiement en attente", color: "#D97706", bg: "#FFFBEB", border: "#FDE68A",
        description: "En attente de confirmation du paiement mobile",
    },
    PAYIN_SUCCESS: {
        label: "Paiement confirmé", color: "#059669", bg: "#ECFDF5", border: "#6EE7B7",
        description: "Le paiement mobile a bien été reçu",
    },
    BRIDGE_PROCESSING: {
        label: "Conversion en cours", color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE",
        description: "Conversion des fonds via bridge blockchain",
    },
    BRIDGE_SUCCESS: {
        label: "Conversion réussie", color: "#059669", bg: "#ECFDF5", border: "#6EE7B7",
        description: "Les fonds ont été convertis avec succès",
    },
    WAITING_USER_OFFRAMP: {
        label: "Retrait disponible", color: "#EA580C", bg: "#FFF7ED", border: "#FED7AA",
        description: "Les fonds sont prêts — le bénéficiaire peut retirer",
    },
    OFFRAMP_PROCESSING: {
        label: "Virement en cours", color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE",
        description: "Virement bancaire SEPA en cours de traitement",
    },
    COMPLETED: {
        label: "Terminée", color: "#059669", bg: "#ECFDF5", border: "#6EE7B7",
        description: "Transaction complétée avec succès ✓",
    },
    PAYIN_FAILED: {
        label: "Paiement échoué", color: "#DC2626", bg: "#FEF2F2", border: "#FECACA",
        description: "Le paiement mobile n'a pas abouti",
    },
    BRIDGE_FAILED: {
        label: "Conversion échouée", color: "#DC2626", bg: "#FEF2F2", border: "#FECACA",
        description: "Erreur lors de la conversion blockchain",
    },
    OFFRAMP_FAILED: {
        label: "Virement échoué", color: "#DC2626", bg: "#FEF2F2", border: "#FECACA",
        description: "Le virement bancaire a échoué",
    },
    REFUNDED: {
        label: "Remboursée", color: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE",
        description: "Le montant a été remboursé à l'expéditeur",
    },
};

// ─── ORDERED TIMELINE ─────────────────────────────────────────────────────────
const TIMELINE = [
    { key: "INITIATED",           label: "Transaction créée" },
    { key: "PAYIN_PENDING",       label: "Paiement mobile initié" },
    { key: "PAYIN_SUCCESS",       label: "Paiement confirmé" },
    { key: "BRIDGE_PROCESSING",   label: "Conversion blockchain" },
    { key: "BRIDGE_SUCCESS",      label: "Fonds convertis" },
    { key: "WAITING_USER_OFFRAMP",label: "Retrait disponible" },
    { key: "OFFRAMP_PROCESSING",  label: "Virement bancaire" },
    { key: "COMPLETED",           label: "Transaction terminée" },
];

const FAILED_STATUSES = new Set(["PAYIN_FAILED", "BRIDGE_FAILED", "OFFRAMP_FAILED"]);

function getStepIndex(status: string): number {
    return TIMELINE.findIndex(s => s.key === status);
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function getMobileMoneyBg(provider: string): string {
    const p = (provider || "").toLowerCase();
    if (p.includes("mtn"))    return "#FFCC00";
    if (p.includes("moov"))   return "#5B86E5";
    if (p.includes("orange")) return "#FF6600";
    if (p.includes("airtel")) return "#ED1C24";
    if (p.includes("wave"))   return "#1DC4F0";
    return "#064E3B";
}

function formatDate(d?: string): string {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("fr-FR", {
        day: "2-digit", month: "long", year: "numeric",
        hour: "2-digit", minute: "2-digit",
    });
}

function fmt(n?: number | string | null, decimals = 0): string {
    const v = Number(n ?? 0);
    return v.toLocaleString("fr-FR", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    });
}

// ─── MICRO COMPONENTS ────────────────────────────────────────────────────────
function Card({ children, style }: { children: React.ReactNode; style?: object }) {
    return (
        <View style={{
            backgroundColor: "#ffffff", borderRadius: 28,
            padding: 22, marginBottom: 14,
            shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.06, shadowRadius: 16, elevation: 4,
            ...style,
        }}>
            {children}
        </View>
    );
}

function CardTitle({ children }: { children: React.ReactNode }) {
    return (
        <Text style={{
            fontFamily: "Outfit_700Bold", fontSize: 15,
            color: "#1a1a2e", marginBottom: 16, letterSpacing: 0.1,
        }}>
            {children}
        </Text>
    );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
        <Text style={{
            fontFamily: "Outfit_600SemiBold", fontSize: 11,
            color: "#9CA3AF", textTransform: "uppercase",
            letterSpacing: 1.2, marginBottom: 10,
        }}>
            {children}
        </Text>
    );
}

function DataRow({ label, value, highlight, last, copyable, onCopy, icon }: {
    label: string; value: string; highlight?: boolean; last?: boolean;
    copyable?: boolean; onCopy?: () => void; icon?: React.ReactNode;
}) {
    return (
        <TouchableOpacity
            onPress={copyable ? onCopy : undefined}
            activeOpacity={copyable ? 0.7 : 1}
            style={{
                flexDirection: "row", alignItems: "center",
                justifyContent: "space-between", paddingVertical: 12,
                borderBottomWidth: last ? 0 : 1, borderBottomColor: "#F3F4F6",
            }}
        >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flex: 1 }}>
                {icon}
                <Text style={{ fontFamily: "Outfit_400Regular", fontSize: 13, color: "#6B7280" }}>
                    {label}
                </Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flex: 1.5, justifyContent: "flex-end" }}>
                <Text style={{
                    fontFamily: highlight ? "Outfit_700Bold" : "Outfit_600SemiBold",
                    fontSize: highlight ? 15 : 13,
                    color: highlight ? "#1a1a2e" : "#374151",
                    textAlign: "right",
                }} numberOfLines={1}>
                    {value || "—"}
                </Text>
                {copyable && <Copy size={12} color="#9CA3AF" />}
            </View>
        </TouchableOpacity>
    );
}

function IdRow({ label, value, onCopy }: { label: string; value?: string; onCopy: () => void }) {
    if (!value) return null;
    const display = value.length > 26 ? `${value.slice(0, 13)}…${value.slice(-8)}` : value;
    return (
        <TouchableOpacity
            onPress={onCopy}
            style={{
                flexDirection: "row", alignItems: "center",
                justifyContent: "space-between", paddingVertical: 12,
                borderBottomWidth: 1, borderBottomColor: "#F3F4F6",
            }}
        >
            <Text style={{ fontFamily: "Outfit_400Regular", fontSize: 13, color: "#6B7280", flex: 1 }}>
                {label}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 2, justifyContent: "flex-end" }}>
                <Text style={{
                    fontFamily: "Outfit_600SemiBold", fontSize: 12,
                    color: "#374151", letterSpacing: 0.3,
                }} numberOfLines={1}>
                    {display}
                </Text>
                <Copy size={12} color="#9CA3AF" />
            </View>
        </TouchableOpacity>
    );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function TransactionDetailsScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const [tx, setTx] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // ── Report modal state ────────────────────────────────────────────────────
    const [reportVisible, setReportVisible] = useState(false);
    const [reportCategory, setReportCategory] = useState<string | null>(null);
    const [reportDescription, setReportDescription] = useState("");
    const [reportSending, setReportSending] = useState(false);
    const [reportSent, setReportSent] = useState(false);

    useEffect(() => {
        if (!id) return;
        const load = async () => {
            try {
                // 1. Essai sender : GET /transactions/{id} (UUID, auth sender)
                const data = await TransferService.getTransaction(id);
                setTx(data);
            } catch {
                try {
                    // 2. Fallback receiver : GET /public-transactions/claim/{referenceId}
                    // Utilisé quand l'id est en réalité un referenceId (cas ReceiverContext)
                    const claimData = await TransferService.getClaimInfo(id);
                    // L'endpoint peut retourner { transaction: {...} } ou l'objet directement
                    setTx(claimData?.transaction ?? claimData);
                } catch (e: any) {
                    setError(e?.message || "Transaction introuvable");
                }
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id]);

    const copy = async (val: string, label: string) => {
        await Clipboard.setStringAsync(val);
        Alert.alert("Copié !", `${label} copié dans le presse-papier.`);
    };

    // ── Loading ───────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: "#14533d" }}>
                <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 16 }}>
                    <ActivityIndicator size="large" color="#F59E0B" />
                    <Text style={{ fontFamily: "Outfit_400Regular", fontSize: 14, color: "rgba(255,255,255,0.55)" }}>
                        Chargement...
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    // ── Error ─────────────────────────────────────────────────────────────────
    if (error || !tx) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: "#14533d" }}>
                <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, gap: 16 }}>
                    <XCircle size={52} color="#EF4444" />
                    <Text style={{ fontFamily: "Outfit_700Bold", color: "#ffffff", fontSize: 18, textAlign: "center" }}>
                        {error || "Transaction introuvable"}
                    </Text>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={{ backgroundColor: "#064E3B", paddingHorizontal: 28, paddingVertical: 14, borderRadius: 18 }}
                    >
                        <Text style={{ fontFamily: "Outfit_700Bold", color: "#ffffff", fontSize: 15 }}>Retour</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    // ── Extract data ──────────────────────────────────────────────────────────
    const status = tx.status || "INITIATED";
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.INITIATED;
    const isFailed  = FAILED_STATUSES.has(status);
    const isRefunded = status === "REFUNDED";
    const isCompleted = status === "COMPLETED";
    const currentStep = getStepIndex(status);

    const amountCFA  = tx.amountFiatIn       ?? tx.amountFCFA;
    const amountEUR  = tx.amountFiatOutExpected ?? tx.amountEUR;
    const amountUSDT = tx.amountUsdtBridged  ?? tx.amountUSDT;
    const referenceId = tx.referenceId;

    const receiverFirstName = tx.receiver?.firstName || tx.receiver?.prenom || "";
    const receiverLastName  = tx.receiver?.lastName  || tx.receiver?.nom    || "";
    const receiverName      = `${receiverFirstName} ${receiverLastName}`.trim() || tx.receiver?.wuraId || "—";
    const receiverWuraId    = tx.receiver?.wuraId;
    const receiverCountry   = tx.receiver?.country || tx.receiver?.pays;
    const receiverIBAN      = tx.receiver?.iban;
    const receiverBIC       = tx.receiver?.bic;
    const receiverBank      = tx.receiver?.banque || tx.receiver?.bank;

    const senderFirstName = tx.sender?.firstName || tx.senderName || "";
    const senderLastName  = tx.sender?.lastName  || "";
    const senderName      = `${senderFirstName} ${senderLastName}`.trim() || "—";

    const paymentProvider = tx.paymentMethod?.provider || tx.paymentMethodId || "";
    const paymentType     = tx.paymentMethod?.type     || "MOBILE_MONEY";

    const routing   = tx.routingStrategy || tx.deliverySpeed;
    const isInstant = routing === "TRANSAK" || tx.deliverySpeed === "INSTANT";
    const routingLabel = routing === "MT_PELERIN" ? "Mt Pelerin" : routing === "TRANSAK" ? "Transak" : routing || "—";
    const routingDesc  = routing === "MT_PELERIN"
        ? "SEPA Standard · 1 à 3 jours ouvrés"
        : routing === "TRANSAK"
            ? "SEPA Instant · Quelques minutes"
            : "—";

    // Nouveau bénéficiaire = pas de compte Wura → lien de claim nécessaire
    // On détecte via le flag isNewBeneficiary ou un UID provisoire (PROV-...)
    const isNewBeneficiary =
        tx.isNewBeneficiary === true ||
        tx.receiverId?.startsWith("PROV-") ||
        tx.receiver?.id?.startsWith("PROV-");

    const claimLink  = referenceId ? `https://wura-claim.vercel.app/claim/${referenceId}` : null;
    const dateCreated = tx.createdAt || tx.date;
    const dateUpdated = tx.updatedAt;

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: "#14533d" }}>

            {/* Header */}
            <View style={{
                flexDirection: "row", alignItems: "center",
                paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16,
            }}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center" }}
                >
                    <ArrowLeft size={24} color="rgba(255,255,255,0.8)" />
                </TouchableOpacity>
                <Text style={{
                    fontFamily: "Outfit_700Bold", fontSize: 20,
                    color: "#F59E0B", flex: 1, textAlign: "center",
                }}>
                    Détail de la transaction
                </Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 52 }}
                showsVerticalScrollIndicator={false}
            >

                {/* ── HERO STATUS ──────────────────────────────────────────── */}
                <Card style={{ alignItems: "center" }}>

                    {/* Icon */}
                    <View style={{
                        width: 88, height: 88, borderRadius: 44,
                        backgroundColor: cfg.bg,
                        alignItems: "center", justifyContent: "center",
                        marginBottom: 16,
                        borderWidth: 2, borderColor: cfg.border,
                        shadowColor: cfg.color, shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.2, shadowRadius: 12, elevation: 4,
                    }}>
                        {isCompleted  && <CheckCircle2 size={42} color="#059669" />}
                        {isFailed     && <XCircle      size={42} color="#DC2626" />}
                        {isRefunded   && <RefreshCw    size={38} color="#7C3AED" />}
                        {!isCompleted && !isFailed && !isRefunded && (
                            <Clock size={38} color={cfg.color} />
                        )}
                    </View>

                    {/* Status badge */}
                    <View style={{
                        paddingHorizontal: 20, paddingVertical: 8,
                        borderRadius: 999, backgroundColor: cfg.bg,
                        marginBottom: 8, borderWidth: 1, borderColor: cfg.border,
                    }}>
                        <Text style={{ fontFamily: "Outfit_700Bold", fontSize: 15, color: cfg.color }}>
                            {cfg.label}
                        </Text>
                    </View>

                    <Text style={{
                        fontFamily: "Outfit_400Regular", fontSize: 13,
                        color: "#6B7280", marginBottom: 24, textAlign: "center",
                    }}>
                        {cfg.description}
                    </Text>

                    {/* Amount hero */}
                    {amountCFA != null && (
                        <View style={{ alignItems: "center", marginBottom: 20 }}>
                            <Text style={{
                                fontFamily: "Outfit_900Black", fontSize: 38,
                                color: "#1a1a2e", letterSpacing: -1, lineHeight: 44,
                            }}>
                                {fmt(amountCFA)} FCFA
                            </Text>
                            {amountEUR != null && (
                                <Text style={{
                                    fontFamily: "Outfit_600SemiBold", fontSize: 18,
                                    color: "#F59E0B", marginTop: 6,
                                }}>
                                    ≈ {fmt(amountEUR, 2)} €
                                </Text>
                            )}
                        </View>
                    )}

                    {/* Reference badge */}
                    {referenceId && (
                        <TouchableOpacity
                            onPress={() => copy(referenceId, "Référence")}
                            style={{
                                flexDirection: "row", alignItems: "center", gap: 8,
                                backgroundColor: "#F9FAFB", borderRadius: 14,
                                paddingHorizontal: 16, paddingVertical: 10,
                                borderWidth: 1, borderColor: "#E5E7EB",
                            }}
                        >
                            <Hash size={13} color="#9CA3AF" />
                            <Text style={{
                                fontFamily: "Outfit_700Bold", fontSize: 13,
                                color: "#374151", letterSpacing: 0.5,
                            }}>
                                {referenceId}
                            </Text>
                            <Copy size={13} color="#9CA3AF" />
                        </TouchableOpacity>
                    )}
                </Card>

                {/* ── TIMELINE ─────────────────────────────────────────────── */}
                <Card>
                    <CardTitle>Progression</CardTitle>

                    {isFailed ? (
                        <View style={{
                            flexDirection: "row", alignItems: "center", gap: 14,
                            backgroundColor: "#FEF2F2", borderRadius: 18,
                            padding: 18, borderWidth: 1, borderColor: "#FECACA",
                        }}>
                            <AlertTriangle size={22} color="#DC2626" />
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontFamily: "Outfit_700Bold", fontSize: 14, color: "#DC2626" }}>
                                    {cfg.label}
                                </Text>
                                <Text style={{ fontFamily: "Outfit_400Regular", fontSize: 12, color: "#9CA3AF", marginTop: 3 }}>
                                    {cfg.description}
                                </Text>
                            </View>
                        </View>
                    ) : isRefunded ? (
                        <View style={{
                            flexDirection: "row", alignItems: "center", gap: 14,
                            backgroundColor: "#F5F3FF", borderRadius: 18,
                            padding: 18, borderWidth: 1, borderColor: "#DDD6FE",
                        }}>
                            <RefreshCw size={22} color="#7C3AED" />
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontFamily: "Outfit_700Bold", fontSize: 14, color: "#7C3AED" }}>
                                    {cfg.label}
                                </Text>
                                <Text style={{ fontFamily: "Outfit_400Regular", fontSize: 12, color: "#9CA3AF", marginTop: 3 }}>
                                    {cfg.description}
                                </Text>
                            </View>
                        </View>
                    ) : (
                        TIMELINE.map((step, i) => {
                            const done    = currentStep > i;
                            const active  = currentStep === i;
                            const isLast  = i === TIMELINE.length - 1;
                            return (
                                <View key={step.key} style={{ flexDirection: "row", alignItems: "flex-start" }}>
                                    {/* Dot + connector */}
                                    <View style={{ alignItems: "center", width: 28, marginTop: 2 }}>
                                        <View style={{
                                            width: 24, height: 24, borderRadius: 12,
                                            backgroundColor: done ? "#059669" : active ? "#F59E0B" : "#E5E7EB",
                                            alignItems: "center", justifyContent: "center",
                                            borderWidth: active ? 2.5 : 0,
                                            borderColor: active ? "#F59E0B" : "transparent",
                                        }}>
                                            {done && <CheckCircle2 size={14} color="#fff" strokeWidth={3} />}
                                            {(active || (!done && !active)) && (
                                                <View style={{
                                                    width: 8, height: 8, borderRadius: 4,
                                                    backgroundColor: active ? "#fff" : "#C4C4C4",
                                                }} />
                                            )}
                                        </View>
                                        {!isLast && (
                                            <View style={{
                                                width: 2, flex: 1, minHeight: 22,
                                                backgroundColor: done ? "#059669" : "#E5E7EB",
                                                marginTop: 2,
                                            }} />
                                        )}
                                    </View>
                                    {/* Label */}
                                    <View style={{ flex: 1, paddingLeft: 14, paddingBottom: isLast ? 0 : 22, paddingTop: 2 }}>
                                        <Text style={{
                                            fontFamily: active ? "Outfit_700Bold" : done ? "Outfit_600SemiBold" : "Outfit_400Regular",
                                            fontSize: 13,
                                            color: done ? "#059669" : active ? "#F59E0B" : "#C4C4C4",
                                        }}>
                                            {step.label}
                                        </Text>
                                    </View>
                                </View>
                            );
                        })
                    )}
                </Card>

                {/* ── MONTANTS ─────────────────────────────────────────────── */}
                <Card>
                    <CardTitle>Montants</CardTitle>
                    {amountCFA != null && (
                        <DataRow label="Montant envoyé" value={`${fmt(amountCFA)} FCFA`} highlight />
                    )}
                    {amountEUR != null && (
                        <DataRow label="Montant reçu" value={`${fmt(amountEUR, 2)} €`} highlight />
                    )}
                    {amountUSDT != null && (
                        <DataRow label="Bridge (USDT)" value={`${Number(amountUSDT).toFixed(4)} USDT`} />
                    )}
                    {tx.kkiapayFeeCfa != null && (
                        <DataRow label="Frais Kkiapay" value={`${fmt(tx.kkiapayFeeCfa)} FCFA`} />
                    )}
                    {tx.wuraFeesCfa != null && (
                        <DataRow label="Frais Wura" value={`${fmt(tx.wuraFeesCfa)} FCFA`} />
                    )}
                    {tx.totalToPayCfa != null ? (
                        <DataRow label="Total débité" value={`${fmt(tx.totalToPayCfa)} FCFA`} highlight last />
                    ) : amountCFA != null ? (
                        <DataRow label="Total débité" value={`${fmt(amountCFA)} FCFA`} last />
                    ) : null}
                </Card>

                {/* ── PARTIES ──────────────────────────────────────────────── */}
                <Card>
                    <CardTitle>Parties impliquées</CardTitle>

                    {/* Expéditeur */}
                    <SectionLabel>Expéditeur</SectionLabel>
                    <View style={{
                        flexDirection: "row", alignItems: "center", gap: 14,
                        backgroundColor: "#F0FDF4", borderRadius: 18,
                        padding: 14, marginBottom: 22,
                        borderWidth: 1, borderColor: "#D1FAE5",
                    }}>
                        <View style={{
                            width: 48, height: 48, borderRadius: 24,
                            backgroundColor: "#D1FAE5", alignItems: "center", justifyContent: "center",
                        }}>
                            <User size={22} color="#059669" />
                        </View>
                        <View>
                            <Text style={{ fontFamily: "Outfit_700Bold", fontSize: 15, color: "#1a1a2e" }}>
                                {senderName}
                            </Text>
                            {tx.senderId && (
                                <Text style={{ fontFamily: "Outfit_400Regular", fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>
                                    ID : {tx.senderId.slice(0, 16)}…
                                </Text>
                            )}
                        </View>
                    </View>

                    {/* Bénéficiaire */}
                    <SectionLabel>Bénéficiaire</SectionLabel>
                    <View style={{
                        flexDirection: "row", alignItems: "center", gap: 14,
                        backgroundColor: "#FFFBEB", borderRadius: 18,
                        padding: 14, marginBottom: 16,
                        borderWidth: 1, borderColor: "#FDE68A",
                    }}>
                        <View style={{
                            width: 48, height: 48, borderRadius: 24,
                            backgroundColor: "#FDE68A", alignItems: "center", justifyContent: "center",
                        }}>
                            <Text style={{ fontFamily: "Outfit_700Bold", fontSize: 20, color: "#92400E" }}>
                                {receiverName.charAt(0).toUpperCase()}
                            </Text>
                        </View>
                        <View>
                            <Text style={{ fontFamily: "Outfit_700Bold", fontSize: 15, color: "#1a1a2e" }}>
                                {receiverName}
                            </Text>
                            {receiverWuraId && (
                                <Text style={{ fontFamily: "Outfit_600SemiBold", fontSize: 13, color: "#F59E0B", marginTop: 2 }}>
                                    @{receiverWuraId}
                                </Text>
                            )}
                        </View>
                    </View>

                    {receiverCountry && (
                        <DataRow label="Pays" value={receiverCountry}
                            icon={<Globe size={13} color="#9CA3AF" />}
                        />
                    )}
                    {receiverBank && (
                        <DataRow label="Banque" value={receiverBank}
                            icon={<Building2 size={13} color="#9CA3AF" />}
                        />
                    )}
                    {receiverIBAN && (
                        <DataRow label="IBAN" value={receiverIBAN}
                            copyable onCopy={() => copy(receiverIBAN, "IBAN")}
                        />
                    )}
                    {receiverBIC && (
                        <DataRow label="BIC / SWIFT" value={receiverBIC} last />
                    )}
                </Card>

                {/* ── MODES ────────────────────────────────────────────────── */}
                {(paymentProvider || routing) && (
                    <Card>
                        <CardTitle>Modes</CardTitle>

                        {paymentProvider && (
                            <>
                                <SectionLabel>Paiement mobile</SectionLabel>
                                <View style={{
                                    flexDirection: "row", alignItems: "center", gap: 14,
                                    backgroundColor: "#F9FAFB", borderRadius: 18,
                                    padding: 14, marginBottom: routing ? 22 : 0,
                                    borderWidth: 1, borderColor: "#E5E7EB",
                                }}>
                                    <View style={{
                                        width: 50, height: 50, borderRadius: 16,
                                        backgroundColor: getMobileMoneyBg(paymentProvider),
                                        alignItems: "center", justifyContent: "center",
                                    }}>
                                        <CreditCard size={22} color="white" />
                                    </View>
                                    <View>
                                        <Text style={{ fontFamily: "Outfit_700Bold", fontSize: 15, color: "#1a1a2e" }}>
                                            {paymentProvider}
                                        </Text>
                                        <Text style={{ fontFamily: "Outfit_400Regular", fontSize: 12, color: "#6B7280", marginTop: 2 }}>
                                            {paymentType.replace(/_/g, " ")}
                                        </Text>
                                    </View>
                                </View>
                            </>
                        )}

                        {routing && (
                            <>
                                <SectionLabel>Transfert & retrait</SectionLabel>
                                <View style={{
                                    flexDirection: "row", alignItems: "center", gap: 14,
                                    backgroundColor: isInstant ? "#EFF6FF" : "#FFFBEB",
                                    borderRadius: 18, padding: 14,
                                    borderWidth: 1, borderColor: isInstant ? "#BFDBFE" : "#FDE68A",
                                }}>
                                    <View style={{
                                        width: 50, height: 50, borderRadius: 16,
                                        backgroundColor: isInstant ? "#3B82F6" : "#D97706",
                                        alignItems: "center", justifyContent: "center",
                                    }}>
                                        <Zap size={22} color="white" />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 3 }}>
                                            <Text style={{ fontFamily: "Outfit_700Bold", fontSize: 15, color: "#1a1a2e" }}>
                                                {routingLabel}
                                            </Text>
                                            <View style={{
                                                paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
                                                backgroundColor: isInstant ? "#DBEAFE" : "#FEF3C7",
                                            }}>
                                                <Text style={{
                                                    fontFamily: "Outfit_700Bold", fontSize: 10,
                                                    color: isInstant ? "#2563EB" : "#D97706",
                                                }}>
                                                    {isInstant ? "INSTANT" : "STANDARD"}
                                                </Text>
                                            </View>
                                        </View>
                                        <Text style={{ fontFamily: "Outfit_400Regular", fontSize: 12, color: "#6B7280" }}>
                                            {routingDesc}
                                        </Text>
                                    </View>
                                </View>
                            </>
                        )}
                    </Card>
                )}

                {/* ── IDENTIFIANTS ─────────────────────────────────────────── */}
                <Card>
                    <CardTitle>Identifiants techniques</CardTitle>
                    <IdRow label="ID Transaction"  value={tx.id}                   onCopy={() => copy(tx.id, "ID Transaction")} />
                    <IdRow label="Référence Wura"  value={referenceId}             onCopy={() => copy(referenceId, "Référence Wura")} />
                    <IdRow label="ID Kkiapay"       value={tx.kkiapayTransactionId} onCopy={() => copy(tx.kkiapayTransactionId, "ID Kkiapay")} />
                    <IdRow label="Hash Blockchain"  value={tx.blockchainTxHash}     onCopy={() => copy(tx.blockchainTxHash, "Hash blockchain")} />
                    <IdRow label="ID Expéditeur"    value={tx.senderId}             onCopy={() => copy(tx.senderId, "ID Expéditeur")} />
                    <IdRow label="ID Bénéficiaire"  value={tx.receiverId}           onCopy={() => copy(tx.receiverId, "ID Bénéficiaire")} />
                    {/* Empty state if no IDs at all */}
                    {!tx.id && !referenceId && !tx.kkiapayTransactionId && !tx.blockchainTxHash && (
                        <Text style={{ fontFamily: "Outfit_400Regular", fontSize: 13, color: "#9CA3AF", textAlign: "center", paddingVertical: 8 }}>
                            Aucun identifiant disponible
                        </Text>
                    )}
                </Card>

                {/* ── DATES ────────────────────────────────────────────────── */}
                <Card>
                    <CardTitle>Dates</CardTitle>
                    <DataRow
                        label="Créée le"
                        value={formatDate(dateCreated)}
                        icon={<Calendar size={13} color="#9CA3AF" />}
                        last={!dateUpdated || dateUpdated === dateCreated}
                    />
                    {dateUpdated && dateUpdated !== dateCreated && (
                        <DataRow
                            label="Mise à jour"
                            value={formatDate(dateUpdated)}
                            icon={<Calendar size={13} color="#9CA3AF" />}
                            last
                        />
                    )}
                </Card>

                {/* ── ACTIONS ──────────────────────────────────────────────── */}
                <View style={{ gap: 12, marginBottom: 8 }}>

                    {/* Partager le reçu */}
                    <TouchableOpacity
                        onPress={async () => {
                            try {
                                await Share.share({
                                    message: `Reçu Wura\nRéférence : ${referenceId || tx.id}\nMontant : ${fmt(amountCFA)} FCFA ≈ ${fmt(amountEUR, 2)} €\nBénéficiaire : ${receiverName}\nStatut : ${cfg.label}\nDate : ${formatDate(dateCreated)}`,
                                    title: `Reçu Wura — ${referenceId || tx.id}`,
                                });
                            } catch { /* ignore */ }
                        }}
                        style={{
                            flexDirection: "row", alignItems: "center",
                            justifyContent: "center", gap: 10,
                            backgroundColor: "#064E3B", paddingVertical: 18, borderRadius: 22,
                            shadowColor: "#00F5A0", shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.2, shadowRadius: 12, elevation: 4,
                        }}
                        activeOpacity={0.8}
                    >
                        <Share2 size={18} color="white" />
                        <Text style={{ fontFamily: "Outfit_700Bold", fontSize: 15, color: "#ffffff" }}>
                            Partager le reçu
                        </Text>
                    </TouchableOpacity>

                    {/* Copier le lien de claim — seulement pour nouveaux bénéficiaires (sans app Wura) */}
                    {claimLink && isNewBeneficiary && (
                        <TouchableOpacity
                            onPress={() => copy(claimLink, "Lien de claim")}
                            style={{
                                flexDirection: "row", alignItems: "center",
                                justifyContent: "center", gap: 10,
                                backgroundColor: "rgba(255,255,255,0.12)",
                                paddingVertical: 18, borderRadius: 22,
                                borderWidth: 1, borderColor: "rgba(255,255,255,0.2)",
                            }}
                            activeOpacity={0.8}
                        >
                            <ExternalLink size={18} color="rgba(255,255,255,0.9)" />
                            <Text style={{ fontFamily: "Outfit_700Bold", fontSize: 15, color: "rgba(255,255,255,0.9)" }}>
                                Copier le lien de réclamation
                            </Text>
                        </TouchableOpacity>
                    )}

                    {/* Signaler un problème */}
                    <TouchableOpacity
                        onPress={() => {
                            setReportCategory(null);
                            setReportDescription("");
                            setReportSent(false);
                            setReportVisible(true);
                        }}
                        style={{
                            flexDirection: "row", alignItems: "center",
                            justifyContent: "center", gap: 10,
                            backgroundColor: "rgba(255,255,255,0.08)",
                            paddingVertical: 18, borderRadius: 22,
                            borderWidth: 1, borderColor: "rgba(255,255,255,0.15)",
                        }}
                        activeOpacity={0.8}
                    >
                        <MessageSquare size={18} color="rgba(255,255,255,0.8)" />
                        <Text style={{ fontFamily: "Outfit_700Bold", fontSize: 15, color: "rgba(255,255,255,0.8)" }}>
                            Signaler un problème
                        </Text>
                    </TouchableOpacity>
                </View>

            </ScrollView>

            {/* ── MODAL SIGNALEMENT ────────────────────────────────────────── */}
            <Modal
                visible={reportVisible}
                animationType="slide"
                transparent
                onRequestClose={() => setReportVisible(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={{ flex: 1, justifyContent: "flex-end" }}
                >
                    <TouchableOpacity
                        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)" }}
                        activeOpacity={1}
                        onPress={() => setReportVisible(false)}
                    />
                    <View style={{
                        backgroundColor: "#ffffff",
                        borderTopLeftRadius: 32, borderTopRightRadius: 32,
                        paddingHorizontal: 24, paddingTop: 8, paddingBottom: 36,
                        maxHeight: "88%",
                    }}>
                        {/* Handle */}
                        <View style={{
                            width: 40, height: 4, borderRadius: 2,
                            backgroundColor: "#E5E7EB", alignSelf: "center", marginBottom: 20,
                        }} />

                        {reportSent ? (
                            /* ── Success state ── */
                            <View style={{ alignItems: "center", paddingVertical: 32, gap: 16 }}>
                                <View style={{
                                    width: 80, height: 80, borderRadius: 40,
                                    backgroundColor: "#ECFDF5", alignItems: "center", justifyContent: "center",
                                    borderWidth: 2, borderColor: "#6EE7B7",
                                }}>
                                    <CheckCircle2 size={40} color="#059669" />
                                </View>
                                <Text style={{ fontFamily: "Outfit_700Bold", fontSize: 20, color: "#1a1a2e", textAlign: "center" }}>
                                    Signalement envoyé
                                </Text>
                                <Text style={{ fontFamily: "Outfit_400Regular", fontSize: 14, color: "#6B7280", textAlign: "center", lineHeight: 22 }}>
                                    Notre équipe prendra en charge votre problème dans les plus brefs délais.
                                </Text>
                                <TouchableOpacity
                                    onPress={() => setReportVisible(false)}
                                    style={{
                                        backgroundColor: "#064E3B", paddingVertical: 16,
                                        paddingHorizontal: 32, borderRadius: 20, marginTop: 8,
                                    }}
                                >
                                    <Text style={{ fontFamily: "Outfit_700Bold", fontSize: 15, color: "#ffffff" }}>
                                        Fermer
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                                {/* Title */}
                                <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 6 }}>
                                    <View style={{
                                        width: 40, height: 40, borderRadius: 14,
                                        backgroundColor: "#FFF7ED", alignItems: "center", justifyContent: "center",
                                    }}>
                                        <MessageSquare size={20} color="#EA580C" />
                                    </View>
                                    <Text style={{ fontFamily: "Outfit_700Bold", fontSize: 20, color: "#1a1a2e" }}>
                                        Signaler un problème
                                    </Text>
                                </View>
                                <Text style={{ fontFamily: "Outfit_400Regular", fontSize: 13, color: "#6B7280", marginBottom: 24, lineHeight: 20 }}>
                                    Décrivez le problème lié à cette transaction. Nous vous répondrons rapidement.
                                </Text>

                                {/* Référence */}
                                <View style={{
                                    flexDirection: "row", alignItems: "center", gap: 8,
                                    backgroundColor: "#F9FAFB", borderRadius: 12,
                                    paddingHorizontal: 14, paddingVertical: 10, marginBottom: 22,
                                    borderWidth: 1, borderColor: "#E5E7EB",
                                }}>
                                    <Hash size={13} color="#9CA3AF" />
                                    <Text style={{ fontFamily: "Outfit_600SemiBold", fontSize: 12, color: "#374151" }}>
                                        {referenceId || tx.id}
                                    </Text>
                                </View>

                                {/* Catégories */}
                                <Text style={{ fontFamily: "Outfit_700Bold", fontSize: 14, color: "#1a1a2e", marginBottom: 12 }}>
                                    Type de problème
                                </Text>
                                <View style={{ gap: 8, marginBottom: 22 }}>
                                    {[
                                        { id: "wrong_amount",   label: "Montant incorrect",       emoji: "💰" },
                                        { id: "not_received",   label: "Fonds non reçus",          emoji: "📭" },
                                        { id: "stuck",          label: "Transaction bloquée",      emoji: "⏳" },
                                        { id: "wrong_recipient",label: "Mauvais destinataire",     emoji: "👤" },
                                        { id: "other",          label: "Autre problème",           emoji: "📋" },
                                    ].map(cat => {
                                        const isSelected = reportCategory === cat.id;
                                        return (
                                            <TouchableOpacity
                                                key={cat.id}
                                                onPress={() => setReportCategory(cat.id)}
                                                style={{
                                                    flexDirection: "row", alignItems: "center", gap: 12,
                                                    paddingHorizontal: 16, paddingVertical: 14,
                                                    borderRadius: 16, borderWidth: 1.5,
                                                    borderColor: isSelected ? "#14533d" : "#E5E7EB",
                                                    backgroundColor: isSelected ? "#F0FDF4" : "#ffffff",
                                                }}
                                                activeOpacity={0.7}
                                            >
                                                <Text style={{ fontSize: 18 }}>{cat.emoji}</Text>
                                                <Text style={{
                                                    fontFamily: isSelected ? "Outfit_700Bold" : "Outfit_400Regular",
                                                    fontSize: 14,
                                                    color: isSelected ? "#14533d" : "#374151",
                                                    flex: 1,
                                                }}>
                                                    {cat.label}
                                                </Text>
                                                <View style={{
                                                    width: 20, height: 20, borderRadius: 10,
                                                    borderWidth: 2,
                                                    borderColor: isSelected ? "#14533d" : "#D1D5DB",
                                                    backgroundColor: isSelected ? "#14533d" : "transparent",
                                                    alignItems: "center", justifyContent: "center",
                                                }}>
                                                    {isSelected && (
                                                        <View style={{
                                                            width: 8, height: 8, borderRadius: 4,
                                                            backgroundColor: "#ffffff",
                                                        }} />
                                                    )}
                                                </View>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>

                                {/* Description */}
                                <Text style={{ fontFamily: "Outfit_700Bold", fontSize: 14, color: "#1a1a2e", marginBottom: 10 }}>
                                    Décrivez le problème
                                </Text>
                                <TextInput
                                    value={reportDescription}
                                    onChangeText={setReportDescription}
                                    placeholder="Expliquez en détail ce qui s'est passé..."
                                    placeholderTextColor="#9CA3AF"
                                    multiline
                                    numberOfLines={4}
                                    style={{
                                        fontFamily: "Outfit_400Regular", fontSize: 14,
                                        color: "#1a1a2e", lineHeight: 22,
                                        backgroundColor: "#F9FAFB", borderRadius: 16,
                                        borderWidth: 1, borderColor: "#E5E7EB",
                                        paddingHorizontal: 16, paddingVertical: 14,
                                        minHeight: 110, textAlignVertical: "top",
                                        marginBottom: 24,
                                    }}
                                />

                                {/* Boutons */}
                                <View style={{ flexDirection: "row", gap: 12 }}>
                                    <TouchableOpacity
                                        onPress={() => setReportVisible(false)}
                                        style={{
                                            flex: 1, paddingVertical: 16, borderRadius: 18,
                                            borderWidth: 1, borderColor: "#E5E7EB",
                                            alignItems: "center", justifyContent: "center",
                                        }}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={{ fontFamily: "Outfit_700Bold", fontSize: 15, color: "#6B7280" }}>
                                            Annuler
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        disabled={!reportCategory || reportDescription.trim().length < 5 || reportSending}
                                        onPress={async () => {
                                            if (!reportCategory || reportDescription.trim().length < 5) return;
                                            setReportSending(true);
                                            try {
                                                const subject = encodeURIComponent(
                                                    `[Wura] Signalement – ${reportCategory} – Transaction ${tx?.id || id}`
                                                );
                                                const body = encodeURIComponent(
                                                    `Catégorie : ${reportCategory}\n\nDescription :\n${reportDescription}\n\n---\nID transaction : ${tx?.id || id}\nStatut : ${tx?.status || "—"}\nMontant : ${tx?.amountFiatIn ?? tx?.amountFCFA ?? "—"} F → ${tx?.amountFiatOutExpected ?? tx?.amountEUR ?? "—"} €`
                                                );
                                                await Linking.openURL(
                                                    `mailto:abdulbusiness0@gmail.com?subject=${subject}&body=${body}`
                                                );
                                                setReportSent(true);
                                            } catch {
                                                Alert.alert("Erreur", "Impossible d'ouvrir l'application email. Vérifiez qu'un client mail est configuré.");
                                            } finally {
                                                setReportSending(false);
                                            }
                                        }}
                                        style={{
                                            flex: 2, paddingVertical: 16, borderRadius: 18,
                                            backgroundColor: (!reportCategory || reportDescription.trim().length < 5)
                                                ? "#D1D5DB" : "#064E3B",
                                            alignItems: "center", justifyContent: "center",
                                            flexDirection: "row", gap: 8,
                                            shadowColor: "#00F5A0", shadowOffset: { width: 0, height: 4 },
                                            shadowOpacity: (!reportCategory || reportDescription.trim().length < 5) ? 0 : 0.2,
                                            shadowRadius: 10, elevation: 3,
                                        }}
                                        activeOpacity={0.8}
                                    >
                                        {reportSending ? (
                                            <ActivityIndicator size="small" color="#ffffff" />
                                        ) : (
                                            <>
                                                <Send size={16} color="#ffffff" />
                                                <Text style={{ fontFamily: "Outfit_700Bold", fontSize: 15, color: "#ffffff" }}>
                                                    Envoyer
                                                </Text>
                                            </>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </ScrollView>
                        )}
                    </View>
                </KeyboardAvoidingView>
            </Modal>

        </SafeAreaView>
    );
}
