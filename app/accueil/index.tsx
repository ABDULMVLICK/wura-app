import { useRouter } from "expo-router";
import { ArrowUpRight, Bell, QrCode, User } from "lucide-react-native";
import { useState } from "react";
import { Dimensions, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BottomTabBar } from "../../components/BottomTabBar";
import { TransakOffRamp } from "../../components/TransakOffRamp";
import { useAuth } from "../../contexts/AuthContext";
import { useReceiver } from "../../contexts/ReceiverContext";

const { width } = Dimensions.get('window');


export default function HomeScreen() {
    const router = useRouter();
    const { state } = useReceiver();
    const { profile } = useAuth();
    const [transakVisible, setTransakVisible] = useState(false);
    const balance = state.balanceEUR;
    const balanceUSDT = state.balanceUSDT;

    return (
        <SafeAreaView className="flex-1 bg-background">
            <View className="flex-1">
                <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
                    <View className="px-5 pt-8 pb-4">
                        {/* Header */}
                        <View className="mb-8 flex-row items-center justify-between">
                            <View className="flex-row items-center gap-3">
                                <View className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                                    <User size={20} className="text-foreground" color="#1a1a2e" />
                                </View>
                                <View>
                                    <Text className="text-xs text-muted-foreground">Bonjour,</Text>
                                    <Text className="text-sm font-bold text-foreground">
                                        {profile?.sender?.firstName || profile?.prenom || 'Utilisateur'}
                                    </Text>
                                </View>
                            </View>
                            <TouchableOpacity className="relative flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                                <Bell size={20} className="text-foreground" color="#1a1a2e" />
                                <View className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-red-500 border-2 border-background" />
                            </TouchableOpacity>
                        </View>

                        {/* Balance Card */}
                        <View className="relative mb-8 overflow-hidden rounded-[32px] bg-primary p-6 shadow-xl shadow-primary/20">
                            {/* Background pattern */}
                            <View className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
                            <View className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-accent/20" />

                            <View className="relative z-10 flex-col items-center">
                                <Text className="mb-2 text-sm font-medium text-primary-foreground opacity-80">
                                    Solde disponible
                                </Text>
                                <Text className="text-4xl font-bold tracking-tight text-white mb-4">
                                    {Number(balance || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €
                                </Text>

                                {/* WuraID Badge */}
                                <View className="mb-6 flex-row items-center gap-2 rounded-full bg-white/10 px-4 py-1.5">
                                    <Text className="text-sm font-semibold text-accent" style={{ color: '#f59e0b' }}>
                                        {profile?.receiver?.wuraId || profile?.wuraId || '@Wura'}
                                    </Text>
                                    <View className="h-1 w-1 rounded-full bg-white/40" />
                                    <QrCode size={14} color="white" className="opacity-80" />
                                </View>

                                <View className="w-full flex-row items-center justify-center gap-4">
                                    <TouchableOpacity
                                        onPress={() => setTransakVisible(true)}
                                        className="flex-row w-full items-center justify-center gap-2 rounded-2xl bg-white/20 py-3"
                                    >
                                        <ArrowUpRight size={20} color="white" />
                                        <Text className="text-sm font-bold text-white">Retirer vers ma banque</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>

                        {/* Transactions */}
                        <View className="flex-1 flex-col mt-4">
                            <View className="mb-4 flex-row items-center justify-between">
                                <Text className="text-lg font-bold text-foreground">Activité Récente</Text>
                                {state.recentTransactions.length > 0 && (
                                    <TouchableOpacity onPress={() => router.push("/historique")}>
                                        <Text className="text-sm font-semibold text-primary">Voir tout</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                            <View className="flex-col gap-3">
                                {state.recentTransactions.length === 0 ? (
                                    <Text className="text-muted-foreground text-center py-4">Aucune transaction pour le moment.</Text>
                                ) : (
                                    state.recentTransactions.slice(0, 3).map((tx) => (
                                        <TouchableOpacity
                                            key={tx.id}
                                            className="flex-row items-center justify-between rounded-2xl bg-card p-4"
                                        >
                                            <View className="flex-col">
                                                <Text className="text-sm font-semibold text-foreground">{tx.senderName || "Utilisateur Wura"}</Text>
                                                <Text className="text-xs text-muted-foreground">Reçu • {new Date(tx.date).toLocaleDateString('fr-FR')}</Text>
                                            </View>
                                            <Text className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                                                + {Number(tx.amountEUR || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €
                                            </Text>
                                        </TouchableOpacity>
                                    ))
                                )}
                            </View>
                        </View>
                    </View>
                </ScrollView>

                <BottomTabBar />
            </View>

            <TransakOffRamp
                visible={transakVisible}
                onClose={() => setTransakVisible(false)}
                balanceEUR={balance}
                balanceUSDT={balanceUSDT}
            />
        </SafeAreaView>
    );
}
