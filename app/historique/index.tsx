import { useRouter } from "expo-router";
import { ArrowDownLeft, Clock, RefreshCw } from "lucide-react-native";
import { useState } from "react";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";
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

    return (
        <SafeAreaView className="flex-1 bg-background">
            <View className="flex-1">
                <ScrollView contentContainerStyle={{ paddingBottom: 100, flexGrow: 1 }}>
                    <View className="px-5 pt-8 pb-4">
                        {/* Header */}
                        <View className="mb-6 flex-row items-center justify-between">
                            <View>
                                <Text className="text-2xl font-bold text-foreground">Historique</Text>
                                <Text className="text-sm text-muted-foreground">Vos transactions récentes</Text>
                            </View>
                            <TouchableOpacity
                                onPress={handleRefresh}
                                disabled={refreshing}
                                className="flex h-10 w-10 items-center justify-center rounded-full bg-muted"
                            >
                                {refreshing ? (
                                    <ActivityIndicator size="small" color="#0f3d2e" />
                                ) : (
                                    <RefreshCw size={18} color="#6b7280" />
                                )}
                            </TouchableOpacity>
                        </View>

                        {/* Transaction List */}
                        {state.isLoading ? (
                            <View className="flex-1 items-center justify-center py-20">
                                <ActivityIndicator size="large" color="#0f3d2e" />
                                <Text className="mt-4 text-sm text-muted-foreground">Chargement...</Text>
                            </View>
                        ) : state.recentTransactions.length === 0 ? (
                            <View className="flex-1 items-center justify-center py-20">
                                <View className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                                    <Clock size={36} color="#9ca3af" />
                                </View>
                                <Text className="text-lg font-semibold text-foreground">Aucune transaction</Text>
                                <Text className="mt-2 text-sm text-muted-foreground text-center max-w-[250px]">
                                    Vos transactions apparaîtront ici une fois que vous aurez reçu de l'argent.
                                </Text>
                            </View>
                        ) : (
                            <View className="flex-col gap-3">
                                {state.recentTransactions.map((tx, index) => {
                                    const isReceived = true; // All receiver transactions are received
                                    const initial = (tx.senderName || "W").charAt(0).toUpperCase();

                                    return (
                                        <View
                                            key={tx.id || index}
                                            className="flex-row items-center justify-between rounded-2xl bg-card p-4 border border-border/50"
                                        >
                                            <View className="flex-row items-center gap-3">
                                                {/* Initial Avatar */}
                                                <View className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                                                    <Text className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                                                        {initial}
                                                    </Text>
                                                </View>
                                                <View className="flex-col">
                                                    <Text className="text-sm font-semibold text-foreground">
                                                        {tx.senderName || "Utilisateur Wura"}
                                                    </Text>
                                                    <Text className="text-xs text-muted-foreground">
                                                        {new Date(tx.date).toLocaleDateString('fr-FR', {
                                                            day: 'numeric',
                                                            month: 'long',
                                                            year: 'numeric'
                                                        })}
                                                    </Text>
                                                    <View className="mt-1 flex-row items-center gap-1">
                                                        <View className={`h-1.5 w-1.5 rounded-full ${tx.status === 'COMPLETED' ? 'bg-emerald-500' :
                                                                tx.status === 'WAITING_USER_OFFRAMP' || tx.status === 'BRIDGE_PROCESSING' || tx.status === 'PAYIN_PENDING' ? 'bg-yellow-500' :
                                                                    tx.status === 'INITIATED' ? 'bg-blue-500' : 'bg-gray-400'
                                                            }`} />
                                                        <Text className="text-[10px] text-muted-foreground uppercase">
                                                            {tx.status === 'COMPLETED' ? 'Terminé' :
                                                                tx.status === 'WAITING_USER_OFFRAMP' ? 'À retirer' :
                                                                    tx.status === 'BRIDGE_PROCESSING' || tx.status === 'PAYIN_PENDING' ? 'En cours' :
                                                                        tx.status === 'INITIATED' ? 'Initié' : tx.status}
                                                        </Text>
                                                    </View>
                                                </View>
                                            </View>
                                            <View className="items-end">
                                                <Text className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                                                    + {Number(tx.amountEUR || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €
                                                </Text>
                                                <ArrowDownLeft size={14} color="#059669" className="mt-1" />
                                            </View>
                                        </View>
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
