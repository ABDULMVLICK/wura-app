import { useRouter } from "expo-router";
import { ArrowUpRight, Bell, QrCode, User } from "lucide-react-native";
import { Dimensions, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BottomTabBar } from "../../components/BottomTabBar";
import { useAuth } from "../../contexts/AuthContext";
import { useReceiver } from "../../contexts/ReceiverContext";

// Mock Data for Transactions
const TRANSACTIONS = [
    {
        id: 1,
        name: "Moussa Diop",
        type: "received",
        amount: "+ 150.00 €",
        date: "Aujourd'hui, 14:30",
        wuraId: "@MoussaD",
        avatarColor: "bg-blue-100",
        avatarInitialColor: "text-blue-600"
    },
    {
        id: 2,
        name: "Carrefour Market",
        type: "spent",
        amount: "- 42.50 €",
        date: "Aujourd'hui, 10:15",
        wuraId: "Carte **** 4212",
        avatarColor: "bg-orange-100",
        avatarInitialColor: "text-orange-600"
    },
    {
        id: 3,
        name: "Fatou Ndiaye",
        type: "received",
        amount: "+ 500.00 €",
        date: "Hier, 18:45",
        wuraId: "@FatouN",
        avatarColor: "bg-purple-100",
        avatarInitialColor: "text-purple-600"
    },
    {
        id: 4,
        name: "Netflix",
        type: "spent",
        amount: "- 17.99 €",
        date: "Hier, 09:00",
        wuraId: "Abonnement",
        avatarColor: "bg-red-100",
        avatarInitialColor: "text-red-600"
    }
];

const { width } = Dimensions.get('window');

export default function HomeScreen() {
    const router = useRouter();
    const { state } = useReceiver();
    const { profile } = useAuth();
    const balance = state.balanceEUR;

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
                                <Text className="mb-4 text-4xl font-bold tracking-tight text-white">
                                    {balance.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €
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
                                        onPress={() => router.push("/retrait-banque")}
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
                            <Text className="mb-4 text-lg font-bold text-foreground">Activité Récents</Text>
                            <View className="flex-col gap-4">
                                {state.recentTransactions.length === 0 ? (
                                    <Text className="text-muted-foreground text-center py-4">Aucune transaction pour le moment.</Text>
                                ) : (
                                    state.recentTransactions.map((tx) => (
                                        <TouchableOpacity
                                            key={tx.id}
                                            className="flex-row items-center justify-between rounded-2xl bg-card p-4"
                                        >
                                            <View className="flex-row items-center gap-4">
                                                <View className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                                                    <Text className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{tx.senderName.charAt(0)}</Text>
                                                </View>
                                                <View className="flex-col">
                                                    <Text className="text-sm font-semibold text-foreground">{tx.senderName}</Text>
                                                    <Text className="text-xs text-muted-foreground">Reçu • {tx.date.toLocaleDateString('fr-FR')}</Text>
                                                </View>
                                            </View>
                                            <Text className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                                                + {tx.amountEUR.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €
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
        </SafeAreaView>
    );
}
