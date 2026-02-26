import { useRouter } from "expo-router";
import { ArrowLeft, ArrowUpRight, Clock, RefreshCw } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Dimensions, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TransferService } from "../../services/transfers";

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Map statuts Prisma → labels français + style inline pour Android
const STATUS_CONFIG: Record<string, { label: string; bgColor: string; textColor: string; dotColor: string }> = {
    INITIATED: { label: "Initiée", bgColor: "#EFF6FF", textColor: "#2563EB", dotColor: "#3B82F6" },
    PAYIN_PENDING: { label: "Paiement en cours", bgColor: "#FFFBEB", textColor: "#D97706", dotColor: "#F59E0B" },
    PAYIN_SUCCESS: { label: "Paiement reçu", bgColor: "#ECFDF5", textColor: "#059669", dotColor: "#10B981" },
    BRIDGE_PROCESSING: { label: "Transfert en cours", bgColor: "#F5F3FF", textColor: "#7C3AED", dotColor: "#8B5CF6" },
    BRIDGE_SUCCESS: { label: "Transfert finalisé", bgColor: "#ECFDF5", textColor: "#059669", dotColor: "#10B981" },
    WAITING_USER_OFFRAMP: { label: "En attente retrait", bgColor: "#FFF7ED", textColor: "#EA580C", dotColor: "#F97316" },
    OFFRAMP_PROCESSING: { label: "Conversion EUR", bgColor: "#F5F3FF", textColor: "#7C3AED", dotColor: "#8B5CF6" },
    COMPLETED: { label: "Terminé", bgColor: "#ECFDF5", textColor: "#059669", dotColor: "#10B981" },
    PAYIN_FAILED: { label: "Paiement échoué", bgColor: "#FEF2F2", textColor: "#DC2626", dotColor: "#EF4444" },
    BRIDGE_FAILED: { label: "Transfert échoué", bgColor: "#FEF2F2", textColor: "#DC2626", dotColor: "#EF4444" },
    OFFRAMP_FAILED: { label: "Conversion échouée", bgColor: "#FEF2F2", textColor: "#DC2626", dotColor: "#EF4444" },
    REFUNDED: { label: "Remboursé", bgColor: "#F3F4F6", textColor: "#6B7280", dotColor: "#9CA3AF" },
};

export default function SenderHistoriqueScreen() {
    const router = useRouter();
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchTransactions = useCallback(async () => {
        try {
            const data = await TransferService.getHistory();
            setTransactions(data);
        } catch (error) {
            console.warn("Erreur chargement historique");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchTransactions();
    }, [fetchTransactions]);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchTransactions();
    };

    // Grouper les transactions par mois
    const groupedTransactions = transactions.reduce((groups: Record<string, any[]>, tx) => {
        const date = new Date(tx.createdAt || tx.date || Date.now());
        const key = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
        if (!groups[key]) groups[key] = [];
        groups[key].push(tx);
        return groups;
    }, {});

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.flex}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={styles.backButton}
                        activeOpacity={0.7}
                    >
                        <ArrowLeft size={20} color="#1f2937" />
                    </TouchableOpacity>
                    <View style={styles.headerCenter}>
                        <Text style={styles.headerTitle}>Historique</Text>
                        <Text style={styles.headerSubtitle}>
                            {transactions.length} transfert{transactions.length !== 1 ? "s" : ""}
                        </Text>
                    </View>
                    <TouchableOpacity
                        onPress={handleRefresh}
                        disabled={refreshing}
                        style={styles.refreshButton}
                        activeOpacity={0.7}
                    >
                        {refreshing ? (
                            <ActivityIndicator size="small" color="#F59E0B" />
                        ) : (
                            <RefreshCw size={18} color="#6b7280" />
                        )}
                    </TouchableOpacity>
                </View>

                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {loading ? (
                        <View style={styles.emptyContainer}>
                            <View style={styles.loadingCircle}>
                                <ActivityIndicator size="large" color="#F59E0B" />
                            </View>
                            <Text style={styles.emptyText}>Chargement...</Text>
                        </View>
                    ) : transactions.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <View style={styles.emptyIcon}>
                                <Clock size={40} color="#d1d5db" />
                            </View>
                            <Text style={styles.emptyTitle}>Aucun transfert</Text>
                            <Text style={styles.emptyText}>
                                Vos transferts apparaîtront ici{"\n"}après votre premier envoi.
                            </Text>
                        </View>
                    ) : (
                        Object.entries(groupedTransactions).map(([monthKey, txs]) => (
                            <View key={monthKey} style={styles.monthGroup}>
                                {/* Month Header */}
                                <Text style={styles.monthTitle}>
                                    {monthKey.charAt(0).toUpperCase() + monthKey.slice(1)}
                                </Text>

                                <View style={styles.cardContainer}>
                                    {(txs as any[]).map((tx: any, index: number) => {
                                        const receiverName = tx.receiver?.wuraId
                                            ? `@${tx.receiver.wuraId}`
                                            : "Bénéficiaire";
                                        const initial = receiverName.replace("@", "").charAt(0).toUpperCase();
                                        const amountCFA = Number(tx.amountFiatIn || 0);
                                        const amountEUR = Number(tx.amountFiatOutExpected || 0);
                                        const statusConfig = STATUS_CONFIG[tx.status] || {
                                            label: tx.status, bgColor: "#F3F4F6", textColor: "#6B7280", dotColor: "#9CA3AF"
                                        };
                                        const isFailed = tx.status?.includes("FAILED");
                                        const isRefunded = tx.status === "REFUNDED";
                                        const isCompleted = tx.status === "COMPLETED";
                                        const isLast = index === (txs as any[]).length - 1;

                                        return (
                                            <TouchableOpacity
                                                key={tx.id || index}
                                                onPress={() => router.push({
                                                    pathname: "/sender-home/transfert-reussi",
                                                    params: { transactionId: tx.id }
                                                })}
                                                style={[
                                                    styles.txRow,
                                                    !isLast && styles.txRowBorder
                                                ]}
                                                activeOpacity={0.6}
                                            >
                                                {/* Avatar */}
                                                <View style={[
                                                    styles.avatar,
                                                    {
                                                        backgroundColor: isFailed || isRefunded
                                                            ? "#FEE2E2"
                                                            : isCompleted ? "#D1FAE5" : "#FEF3C7"
                                                    }
                                                ]}>
                                                    <Text style={[
                                                        styles.avatarText,
                                                        {
                                                            color: isFailed || isRefunded
                                                                ? "#DC2626"
                                                                : isCompleted ? "#059669" : "#D97706"
                                                        }
                                                    ]}>
                                                        {initial}
                                                    </Text>
                                                </View>

                                                {/* Info */}
                                                <View style={styles.txInfo}>
                                                    <Text style={styles.txName} numberOfLines={1}>
                                                        {receiverName}
                                                    </Text>
                                                    <Text style={styles.txDate}>
                                                        {new Date(tx.createdAt || tx.date).toLocaleDateString('fr-FR', {
                                                            day: 'numeric',
                                                            month: 'short',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </Text>
                                                    {/* Status Badge */}
                                                    <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
                                                        <View style={[styles.statusDot, { backgroundColor: statusConfig.dotColor }]} />
                                                        <Text style={[styles.statusText, { color: statusConfig.textColor }]}>
                                                            {statusConfig.label}
                                                        </Text>
                                                    </View>
                                                </View>

                                                {/* Amount */}
                                                <View style={styles.txAmountSection}>
                                                    <Text style={[
                                                        styles.txAmountMain,
                                                        { color: isFailed || isRefunded ? "#EF4444" : "#111827" }
                                                    ]}>
                                                        {isFailed || isRefunded ? "−" : ""}{amountCFA.toLocaleString("fr-FR")} F
                                                    </Text>
                                                    <Text style={styles.txAmountSub}>
                                                        ≈ {amountEUR.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €
                                                    </Text>
                                                    <ArrowUpRight
                                                        size={12}
                                                        color={isFailed || isRefunded ? "#EF4444" : "#F59E0B"}
                                                        style={{ marginTop: 2 }}
                                                    />
                                                </View>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>
                        ))
                    )}
                </ScrollView>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F9FAFB",
    },
    flex: {
        flex: 1,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#FFFFFF",
        alignItems: "center",
        justifyContent: "center",
        ...Platform.select({
            android: { elevation: 2 },
            ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3 },
        }),
    },
    headerCenter: {
        flex: 1,
        alignItems: "center",
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#111827",
    },
    headerSubtitle: {
        fontSize: 12,
        color: "#9CA3AF",
        marginTop: 2,
    },
    refreshButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#FFFFFF",
        alignItems: "center",
        justifyContent: "center",
        ...Platform.select({
            android: { elevation: 2 },
            ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3 },
        }),
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
        flexGrow: 1,
    },
    emptyContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 80,
    },
    loadingCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: "#FEF3C7",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 16,
    },
    emptyIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: "#F3F4F6",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#111827",
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        color: "#9CA3AF",
        textAlign: "center",
        lineHeight: 20,
    },
    monthGroup: {
        marginBottom: 24,
    },
    monthTitle: {
        fontSize: 14,
        fontWeight: "600",
        color: "#6B7280",
        marginBottom: 12,
        paddingLeft: 4,
        letterSpacing: 0.3,
    },
    cardContainer: {
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        overflow: "hidden",
        ...Platform.select({
            android: { elevation: 3 },
            ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 12 },
        }),
    },
    txRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    txRowBorder: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: "#F3F4F6",
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    avatarText: {
        fontSize: 16,
        fontWeight: "700",
    },
    txInfo: {
        flex: 1,
        marginRight: 12,
    },
    txName: {
        fontSize: 15,
        fontWeight: "600",
        color: "#111827",
        marginBottom: 2,
    },
    txDate: {
        fontSize: 12,
        color: "#9CA3AF",
        marginBottom: 4,
    },
    statusBadge: {
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "flex-start",
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
        gap: 4,
    },
    statusDot: {
        width: 5,
        height: 5,
        borderRadius: 2.5,
    },
    statusText: {
        fontSize: 10,
        fontWeight: "600",
    },
    txAmountSection: {
        alignItems: "flex-end",
    },
    txAmountMain: {
        fontSize: 14,
        fontWeight: "700",
    },
    txAmountSub: {
        fontSize: 11,
        color: "#9CA3AF",
        marginTop: 1,
    },
});
