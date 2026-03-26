import { useRouter } from "expo-router";
import { ArrowLeft, ArrowUpRight, Clock, RefreshCw } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TransferService } from "../../services/transfers";

// Map statuts Prisma → labels français + style
const STATUS_CONFIG: Record<string, { label: string; bgColor: string; textColor: string; dotColor: string }> = {
    INITIATED: { label: "Initiée", bgColor: "#EFF6FF", textColor: "#2563EB", dotColor: "#3B82F6" },
    PAYIN_PENDING: { label: "Paiement en cours", bgColor: "#FFFBEB", textColor: "#D97706", dotColor: "#F59E0B" },
    PAYIN_SUCCESS: { label: "Paiement reçu", bgColor: "#ECFDF5", textColor: "#059669", dotColor: "#10B981" },
    BRIDGE_PROCESSING: { label: "Transfert en cours", bgColor: "rgba(245,158,11,0.15)", textColor: "#F59E0B", dotColor: "#F59E0B" },
    BRIDGE_SUCCESS: { label: "Transfert finalisé", bgColor: "#ECFDF5", textColor: "#059669", dotColor: "#10B981" },
    WAITING_USER_OFFRAMP: { label: "En attente retrait", bgColor: "#FFF7ED", textColor: "#EA580C", dotColor: "#F97316" },
    OFFRAMP_PROCESSING: { label: "Conversion EUR", bgColor: "rgba(245,158,11,0.15)", textColor: "#F59E0B", dotColor: "#F59E0B" },
    COMPLETED: { label: "Terminé", bgColor: "#ECFDF5", textColor: "#059669", dotColor: "#10B981" },
    PAYIN_FAILED: { label: "Paiement échoué", bgColor: "#FEF2F2", textColor: "#DC2626", dotColor: "#EF4444" },
    BRIDGE_FAILED: { label: "Transfert échoué", bgColor: "#FEF2F2", textColor: "#DC2626", dotColor: "#EF4444" },
    OFFRAMP_FAILED: { label: "Conversion échouée", bgColor: "#FEF2F2", textColor: "#DC2626", dotColor: "#EF4444" },
    REFUNDED: { label: "Remboursé", bgColor: "rgba(255,255,255,0.1)", textColor: "#9CA3AF", dotColor: "#9CA3AF" },
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
        <SafeAreaView style={{ flex: 1, backgroundColor: '#14533d' }}>
            <View style={{ flex: 1 }}>
                {/* Header */}
                <View style={{
                    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                    paddingHorizontal: 20, paddingVertical: 16,
                }}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={{
                            width: 42, height: 42, borderRadius: 21,
                            backgroundColor: 'rgba(255,255,255,0.12)',
                            alignItems: 'center', justifyContent: 'center',
                        }}
                        activeOpacity={0.7}
                    >
                        <ArrowLeft size={20} color="#ffffff" />
                    </TouchableOpacity>
                    <View style={{ flex: 1, alignItems: 'center' }}>
                        <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 17, color: '#ffffff' }}>Historique</Text>
                        <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>
                            {transactions.length} transfert{transactions.length !== 1 ? "s" : ""}
                        </Text>
                    </View>
                    <TouchableOpacity
                        onPress={handleRefresh}
                        disabled={refreshing}
                        style={{
                            width: 42, height: 42, borderRadius: 21,
                            backgroundColor: 'rgba(255,255,255,0.12)',
                            alignItems: 'center', justifyContent: 'center',
                        }}
                        activeOpacity={0.7}
                    >
                        {refreshing ? (
                            <ActivityIndicator size="small" color="#F59E0B" />
                        ) : (
                            <RefreshCw size={18} color="rgba(255,255,255,0.7)" />
                        )}
                    </TouchableOpacity>
                </View>

                <ScrollView
                    contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, flexGrow: 1 }}
                    showsVerticalScrollIndicator={false}
                >
                    {loading ? (
                        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 80 }}>
                            <View style={{
                                width: 80, height: 80, borderRadius: 40,
                                backgroundColor: 'rgba(245,158,11,0.15)',
                                alignItems: 'center', justifyContent: 'center', marginBottom: 16,
                            }}>
                                <ActivityIndicator size="large" color="#F59E0B" />
                            </View>
                            <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>Chargement...</Text>
                        </View>
                    ) : transactions.length === 0 ? (
                        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 80 }}>
                            <View style={{
                                width: 80, height: 80, borderRadius: 40,
                                backgroundColor: 'rgba(255,255,255,0.08)',
                                alignItems: 'center', justifyContent: 'center', marginBottom: 16,
                            }}>
                                <Clock size={36} color="rgba(255,255,255,0.3)" />
                            </View>
                            <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 18, color: '#ffffff', marginBottom: 8 }}>
                                Aucun transfert
                            </Text>
                            <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 14, color: 'rgba(255,255,255,0.45)', textAlign: 'center', lineHeight: 20 }}>
                                Vos transferts apparaîtront ici{"\n"}après votre premier envoi.
                            </Text>
                        </View>
                    ) : (
                        Object.entries(groupedTransactions).map(([monthKey, txs]) => (
                            <View key={monthKey} style={{ marginBottom: 28 }}>
                                {/* Month Header */}
                                <Text style={{
                                    fontFamily: 'Outfit_600SemiBold', fontSize: 13,
                                    color: 'rgba(255,255,255,0.45)', marginBottom: 12,
                                    paddingLeft: 4, letterSpacing: 0.5, textTransform: 'uppercase',
                                }}>
                                    {monthKey.charAt(0).toUpperCase() + monthKey.slice(1)}
                                </Text>

                                <View style={{
                                    backgroundColor: '#ffffff', borderRadius: 24,
                                    overflow: 'hidden',
                                    ...Platform.select({
                                        android: { elevation: 4 },
                                        ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 16 },
                                    }),
                                }}>
                                    {(txs as any[]).map((tx: any, index: number) => {
                                        const receiverName = tx.receiver?.wuraId
                                            ? `@${tx.receiver.wuraId}`
                                            : "Bénéficiaire";
                                        const initial = receiverName.replace("@", "").charAt(0).toUpperCase();
                                        const amountCFA = Number(tx.amountFiatIn || 0);
                                        const amountEUR = Number(tx.amountFiatOutExpected || 0);
                                        const statusConfig = STATUS_CONFIG[tx.status] || {
                                            label: tx.status, bgColor: "rgba(255,255,255,0.1)", textColor: "#9CA3AF", dotColor: "#9CA3AF"
                                        };
                                        const isFailed = tx.status?.includes("FAILED");
                                        const isRefunded = tx.status === "REFUNDED";
                                        const isCompleted = tx.status === "COMPLETED";
                                        const isLast = index === (txs as any[]).length - 1;

                                        return (
                                            <TouchableOpacity
                                                key={tx.id || index}
                                                onPress={() => router.push({
                                                    pathname: "/transaction-details",
                                                    params: { id: tx.id }
                                                })}
                                                style={[
                                                    {
                                                        flexDirection: 'row', alignItems: 'center',
                                                        paddingHorizontal: 18, paddingVertical: 16,
                                                    },
                                                    !isLast && {
                                                        borderBottomWidth: StyleSheet.hairlineWidth,
                                                        borderBottomColor: '#F3F4F6',
                                                    }
                                                ]}
                                                activeOpacity={0.6}
                                            >
                                                {/* Avatar */}
                                                <View style={{
                                                    width: 46, height: 46, borderRadius: 23,
                                                    alignItems: 'center', justifyContent: 'center',
                                                    marginRight: 14,
                                                    backgroundColor: isFailed || isRefunded
                                                        ? "#FEE2E2"
                                                        : isCompleted ? "#D1FAE5" : "#FEF3C7",
                                                }}>
                                                    <Text style={{
                                                        fontFamily: 'Outfit_700Bold', fontSize: 17,
                                                        color: isFailed || isRefunded
                                                            ? "#DC2626"
                                                            : isCompleted ? "#059669" : "#D97706",
                                                    }}>
                                                        {initial}
                                                    </Text>
                                                </View>

                                                {/* Info */}
                                                <View style={{ flex: 1, marginRight: 12 }}>
                                                    <Text style={{
                                                        fontFamily: 'Outfit_600SemiBold', fontSize: 15,
                                                        color: '#111827', marginBottom: 3,
                                                    }} numberOfLines={1}>
                                                        {receiverName}
                                                    </Text>
                                                    <Text style={{
                                                        fontFamily: 'Outfit_400Regular', fontSize: 12,
                                                        color: '#9CA3AF', marginBottom: 5,
                                                    }}>
                                                        {new Date(tx.createdAt || tx.date).toLocaleDateString('fr-FR', {
                                                            day: 'numeric',
                                                            month: 'short',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </Text>
                                                    {/* Status Badge */}
                                                    <View style={{
                                                        flexDirection: 'row', alignItems: 'center',
                                                        alignSelf: 'flex-start',
                                                        paddingHorizontal: 10, paddingVertical: 4,
                                                        borderRadius: 12, gap: 5,
                                                        backgroundColor: statusConfig.bgColor,
                                                    }}>
                                                        <View style={{
                                                            width: 5, height: 5, borderRadius: 2.5,
                                                            backgroundColor: statusConfig.dotColor,
                                                        }} />
                                                        <Text style={{
                                                            fontFamily: 'Outfit_600SemiBold', fontSize: 10,
                                                            color: statusConfig.textColor,
                                                        }}>
                                                            {statusConfig.label}
                                                        </Text>
                                                    </View>
                                                </View>

                                                {/* Amount */}
                                                <View style={{ alignItems: 'flex-end' }}>
                                                    <Text style={{
                                                        fontFamily: 'Outfit_700Bold', fontSize: 15,
                                                        color: isFailed || isRefunded ? "#EF4444" : "#111827",
                                                    }}>
                                                        {isFailed || isRefunded ? "−" : ""}{amountCFA.toLocaleString("fr-FR")} F
                                                    </Text>
                                                    <Text style={{
                                                        fontFamily: 'Outfit_400Regular', fontSize: 11,
                                                        color: '#9CA3AF', marginTop: 2,
                                                    }}>
                                                        ≈ {amountEUR.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €
                                                    </Text>
                                                    <ArrowUpRight
                                                        size={12}
                                                        color={isFailed || isRefunded ? "#EF4444" : "#F59E0B"}
                                                        style={{ marginTop: 3 }}
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
