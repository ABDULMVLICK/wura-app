import { useRouter } from "expo-router";
import { ArrowLeft, Search, User } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TransferService } from "../../services/transfers";

interface BeneficiaryInfo {
    wuraId: string;
    name: string;
    lastDate: Date;
    totalSent: number;
    txCount: number;
}

export default function BeneficiariesScreen() {
    const router = useRouter();
    const [beneficiaries, setBeneficiaries] = useState<BeneficiaryInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    const fetchBeneficiaries = useCallback(async () => {
        try {
            const transactions = await TransferService.getHistory();

            // Extraire les bénéficiaires uniques depuis les transactions
            const beneficiaryMap = new Map<string, BeneficiaryInfo>();

            transactions.forEach((tx: any) => {
                const wuraId = tx.receiver?.wuraId || tx.receiverId || "unknown";
                const name = tx.receiver?.wuraId
                    ? `@${tx.receiver.wuraId}`
                    : "Bénéficiaire";

                if (beneficiaryMap.has(wuraId)) {
                    const existing = beneficiaryMap.get(wuraId)!;
                    existing.txCount++;
                    existing.totalSent += Number(tx.amountFiatIn || 0);
                    if (new Date(tx.createdAt) > existing.lastDate) {
                        existing.lastDate = new Date(tx.createdAt);
                    }
                } else {
                    beneficiaryMap.set(wuraId, {
                        wuraId,
                        name,
                        lastDate: new Date(tx.createdAt || Date.now()),
                        totalSent: Number(tx.amountFiatIn || 0),
                        txCount: 1,
                    });
                }
            });

            // Trier par date du dernier envoi (plus récent en premier)
            const sorted = Array.from(beneficiaryMap.values())
                .sort((a, b) => b.lastDate.getTime() - a.lastDate.getTime());

            setBeneficiaries(sorted);
        } catch (error) {
            console.error("Erreur chargement bénéficiaires:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchBeneficiaries();
    }, [fetchBeneficiaries]);

    const filtered = beneficiaries.filter(b =>
        b.name.toLowerCase().includes(search.toLowerCase()) ||
        b.wuraId.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <SafeAreaView className="flex-1 bg-gray-50 dark:bg-[#221b10]">
            <View className="flex-1">
                {/* Header */}
                <View className="px-6 py-4 flex-row items-center gap-4">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-white/10 shadow-sm"
                    >
                        <ArrowLeft size={20} color="#1f2937" />
                    </TouchableOpacity>
                    <Text className="text-lg font-bold text-gray-900 dark:text-white flex-1">
                        Bénéficiaires récents
                    </Text>
                </View>

                {/* Search */}
                <View className="px-6 mb-4">
                    <View className="flex-row items-center bg-white dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 px-4 py-3 gap-3">
                        <Search size={18} color="#9ca3af" />
                        <TextInput
                            value={search}
                            onChangeText={setSearch}
                            placeholder="Rechercher un bénéficiaire..."
                            placeholderTextColor="#9ca3af"
                            className="flex-1 text-sm text-gray-900 dark:text-white"
                        />
                    </View>
                </View>

                <ScrollView contentContainerStyle={{ paddingBottom: 40, flexGrow: 1 }} className="px-6">
                    {loading ? (
                        <View className="flex-1 items-center justify-center py-20">
                            <ActivityIndicator size="large" color="#F59E0B" />
                            <Text className="mt-4 text-sm text-gray-500">Chargement...</Text>
                        </View>
                    ) : filtered.length === 0 ? (
                        <View className="flex-1 items-center justify-center py-20">
                            <View className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 dark:bg-white/5">
                                <User size={36} color="#9ca3af" />
                            </View>
                            <Text className="text-lg font-semibold text-gray-900 dark:text-white">
                                {search ? "Aucun résultat" : "Aucun bénéficiaire"}
                            </Text>
                            <Text className="mt-2 text-sm text-gray-500 text-center max-w-[250px]">
                                {search
                                    ? "Essayez un autre terme de recherche."
                                    : "Vos bénéficiaires apparaîtront ici après votre premier transfert."
                                }
                            </Text>
                        </View>
                    ) : (
                        <View className="flex-col gap-3">
                            {filtered.map((b) => {
                                const initial = b.name.replace("@", "").charAt(0).toUpperCase();
                                return (
                                    <TouchableOpacity
                                        key={b.wuraId}
                                        className="flex-row items-center justify-between rounded-2xl bg-white dark:bg-white/5 p-4 border border-gray-100 dark:border-white/5 shadow-sm active:opacity-80"
                                    >
                                        <View className="flex-row items-center gap-3">
                                            <View className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                                                <Text className="text-base font-bold text-amber-600">
                                                    {initial}
                                                </Text>
                                            </View>
                                            <View className="flex-col">
                                                <Text className="text-sm font-semibold text-gray-900 dark:text-white">
                                                    {b.name}
                                                </Text>
                                                <Text className="text-xs text-gray-500 dark:text-gray-400">
                                                    {b.txCount} transfert{b.txCount > 1 ? "s" : ""} • Dernier le {b.lastDate.toLocaleDateString('fr-FR', {
                                                        day: 'numeric',
                                                        month: 'short'
                                                    })}
                                                </Text>
                                            </View>
                                        </View>
                                        <View className="items-end">
                                            <Text className="text-sm font-bold text-gray-900 dark:text-white">
                                                {b.totalSent.toLocaleString("fr-FR")} F
                                            </Text>
                                            <Text className="text-[10px] text-gray-400">total envoyé</Text>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    )}
                </ScrollView>
            </View>
        </SafeAreaView>
    );
}
