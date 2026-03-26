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
        <SafeAreaView className="flex-1 bg-gray-50">
            <View className="flex-1">
                {/* Header */}
                <View className="px-7 py-5 flex-row items-center gap-4">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="h-11 w-11 items-center justify-center rounded-2xl bg-white"
                        style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}
                    >
                        <ArrowLeft size={20} color="#1f2937" />
                    </TouchableOpacity>
                    <Text className="text-xl font-bold text-gray-900 flex-1">
                        Bénéficiaires récents
                    </Text>
                </View>

                {/* Search */}
                <View className="px-7 mb-5">
                    <View className="flex-row items-center bg-white rounded-3xl border border-gray-200/80 px-5 py-4 gap-3"
                        style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 1 }}>
                        <Search size={18} color="#9ca3af" />
                        <TextInput
                            value={search}
                            onChangeText={setSearch}
                            placeholder="Rechercher un bénéficiaire..."
                            placeholderTextColor="#9ca3af"
                            className="flex-1 text-sm text-gray-900"
                        />
                    </View>
                </View>

                <ScrollView contentContainerStyle={{ paddingBottom: 40, flexGrow: 1 }} className="px-7">
                    {loading ? (
                        <View className="flex-1 items-center justify-center py-20">
                            <ActivityIndicator size="large" color="#F59E0B" />
                            <Text className="mt-4 text-sm text-gray-500">Chargement...</Text>
                        </View>
                    ) : filtered.length === 0 ? (
                        <View className="flex-1 items-center justify-center py-20">
                            <View className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
                                <User size={36} color="#9ca3af" />
                            </View>
                            <Text className="text-lg font-semibold text-gray-900">
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
                                        className="flex-row items-center justify-between rounded-3xl bg-white p-5 border border-gray-100/80 active:opacity-80"
                                        style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 1 }}
                                    >
                                        <View className="flex-row items-center gap-4">
                                            <View className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
                                                <Text className="text-lg font-bold text-amber-600">
                                                    {initial}
                                                </Text>
                                            </View>
                                            <View className="flex-col">
                                                <Text className="text-sm font-semibold text-gray-900">
                                                    {b.name}
                                                </Text>
                                                <Text className="text-xs text-gray-500">
                                                    {b.txCount} transfert{b.txCount > 1 ? "s" : ""} • Dernier le {b.lastDate.toLocaleDateString('fr-FR', {
                                                        day: 'numeric',
                                                        month: 'short'
                                                    })}
                                                </Text>
                                            </View>
                                        </View>
                                        <View className="items-end">
                                            <Text className="text-sm font-bold text-gray-900">
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
