import { useRouter } from "expo-router";
import { ArrowDownLeft, Clock, RefreshCw } from "lucide-react-native";
import { useState } from "react";
import { ActivityIndicator, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BottomTabBar } from "../../components/BottomTabBar";
import { useReceiver } from "../../contexts/ReceiverContext";

export default function HistoriqueScreen() {
    const router = useRouter();
    const { state, refreshBalance } = useReceiver();
    const [refreshing, setRefreshing] = useState(false);

    const handleRefresh = async () => {
        setRefreshing(true);
        await refreshBalance();
        setRefreshing(false);
    };

    const getStatusInfo = (status: string) => {
        switch (status) {
            case 'COMPLETED': return { label: 'Terminé', bgColor: '#ECFDF5', textColor: '#059669', dotColor: '#10B981' };
            case 'WAITING_USER_OFFRAMP': return { label: 'À retirer', bgColor: '#FFF7ED', textColor: '#EA580C', dotColor: '#F97316' };
            case 'BRIDGE_PROCESSING':
            case 'PAYIN_PENDING': return { label: 'En cours', bgColor: 'rgba(245,158,11,0.15)', textColor: '#F59E0B', dotColor: '#F59E0B' };
            case 'INITIATED': return { label: 'Initié', bgColor: '#EFF6FF', textColor: '#2563EB', dotColor: '#3B82F6' };
            default: return { label: status, bgColor: 'rgba(255,255,255,0.1)', textColor: '#9CA3AF', dotColor: '#9CA3AF' };
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#14533d' }}>
            <View style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={{ paddingBottom: 100, flexGrow: 1 }} showsVerticalScrollIndicator={false}>
                    <View style={{ paddingHorizontal: 20, paddingTop: 28, paddingBottom: 16 }}>
                        {/* Header */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                            <View>
                                <Text style={{ fontFamily: 'Outfit_900Black', fontSize: 28, color: '#F59E0B' }}>Historique</Text>
                                <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>
                                    Vos transactions récentes
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

                        {/* Transaction List */}
                        {state.isLoading && state.recentTransactions.length === 0 ? (
                            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 80 }}>
                                <View style={{
                                    width: 80, height: 80, borderRadius: 40,
                                    backgroundColor: 'rgba(245,158,11,0.15)',
                                    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
                                }}>
                                    <ActivityIndicator size="large" color="#F59E0B" />
                                </View>
                                <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>
                                    Chargement...
                                </Text>
                            </View>
                        ) : state.recentTransactions.length === 0 ? (
                            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 80 }}>
                                <View style={{
                                    width: 80, height: 80, borderRadius: 40,
                                    backgroundColor: 'rgba(255,255,255,0.08)',
                                    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
                                }}>
                                    <Clock size={36} color="rgba(255,255,255,0.3)" />
                                </View>
                                <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 18, color: '#ffffff', marginBottom: 8 }}>
                                    Aucune transaction
                                </Text>
                                <Text style={{
                                    fontFamily: 'Outfit_400Regular', fontSize: 14,
                                    color: 'rgba(255,255,255,0.45)', textAlign: 'center', lineHeight: 20, maxWidth: 260,
                                }}>
                                    Vos transactions apparaîtront ici une fois que vous aurez reçu de l'argent.
                                </Text>
                            </View>
                        ) : (
                            <View style={{
                                backgroundColor: '#ffffff', borderRadius: 24,
                                overflow: 'hidden',
                                ...Platform.select({
                                    android: { elevation: 4 },
                                    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 16 },
                                }),
                            }}>
                                {state.recentTransactions.map((tx, index) => {
                                    const initial = (tx.senderName || "W").charAt(0).toUpperCase();
                                    const statusInfo = getStatusInfo(tx.status);
                                    const isLast = index === state.recentTransactions.length - 1;

                                    return (
                                        <TouchableOpacity
                                            key={tx.id || index}
                                            onPress={() => router.push({
                                                pathname: "/transaction-details",
                                                params: { id: tx.id },
                                            })}
                                            activeOpacity={0.6}
                                            style={[
                                                {
                                                    flexDirection: 'row', alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    paddingHorizontal: 18, paddingVertical: 16,
                                                },
                                                !isLast && {
                                                    borderBottomWidth: StyleSheet.hairlineWidth,
                                                    borderBottomColor: '#F3F4F6',
                                                }
                                            ]}
                                        >
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 }}>
                                                {/* Initial Avatar */}
                                                <View style={{
                                                    width: 48, height: 48, borderRadius: 24,
                                                    backgroundColor: '#D1FAE5',
                                                    alignItems: 'center', justifyContent: 'center',
                                                }}>
                                                    <Text style={{
                                                        fontFamily: 'Outfit_700Bold', fontSize: 17, color: '#059669',
                                                    }}>
                                                        {initial}
                                                    </Text>
                                                </View>
                                                <View style={{ flex: 1 }}>
                                                    <Text style={{
                                                        fontFamily: 'Outfit_600SemiBold', fontSize: 15, color: '#111827', marginBottom: 3,
                                                    }}>
                                                        {tx.senderName || "Utilisateur Wura"}
                                                    </Text>
                                                    <Text style={{
                                                        fontFamily: 'Outfit_400Regular', fontSize: 12, color: '#9CA3AF', marginBottom: 5,
                                                    }}>
                                                        {new Date(tx.date).toLocaleDateString('fr-FR', {
                                                            day: 'numeric',
                                                            month: 'long',
                                                            year: 'numeric'
                                                        })}
                                                    </Text>
                                                    {/* Status Badge */}
                                                    <View style={{
                                                        flexDirection: 'row', alignItems: 'center',
                                                        alignSelf: 'flex-start',
                                                        paddingHorizontal: 10, paddingVertical: 4,
                                                        borderRadius: 12, gap: 5,
                                                        backgroundColor: statusInfo.bgColor,
                                                    }}>
                                                        <View style={{
                                                            width: 5, height: 5, borderRadius: 2.5,
                                                            backgroundColor: statusInfo.dotColor,
                                                        }} />
                                                        <Text style={{
                                                            fontFamily: 'Outfit_600SemiBold', fontSize: 10,
                                                            color: statusInfo.textColor, textTransform: 'uppercase',
                                                        }}>
                                                            {statusInfo.label}
                                                        </Text>
                                                    </View>
                                                </View>
                                            </View>
                                            <View style={{ alignItems: 'flex-end' }}>
                                                <Text style={{
                                                    fontFamily: 'Outfit_700Bold', fontSize: 15, color: '#059669',
                                                }}>
                                                    + {Number(tx.amountEUR || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €
                                                </Text>
                                                <ArrowDownLeft size={14} color="#059669" style={{ marginTop: 4 }} />
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        )}
                    </View>
                </ScrollView>

                <BottomTabBar />
            </View>
        </SafeAreaView>
    );
}
