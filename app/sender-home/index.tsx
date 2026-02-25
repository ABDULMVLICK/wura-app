import { useRouter } from "expo-router";
import { ArrowRight, ArrowUpDown, ChevronDown, Plus } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { useCallback, useEffect, useState } from "react";
import { Keyboard, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CountrySelector, WESTERN_COUNTRIES } from "../../components/CountrySelector";
import { useTransfer } from "../../contexts/TransferContext";
import { deleteSecureData, getSecureData } from "../../lib/storage";
import { TransferService } from "../../services/transfers";

interface RecentBeneficiary {
    id: string;
    name: string;
    initial: string;
}

export default function SenderHomeScreen() {
    const router = useRouter();
    const { state: transferState, setInputValue, toggleCurrency, getCalculatedXOF, getCalculatedEUR } = useTransfer();
    const [recentBeneficiaries, setRecentBeneficiaries] = useState<RecentBeneficiary[]>([]);

    const fetchRecentBeneficiaries = useCallback(async () => {
        try {
            const transactions = await TransferService.getHistory();
            const seen = new Map<string, RecentBeneficiary>();

            transactions.forEach((tx: any) => {
                const id = tx.receiver?.wuraId || tx.receiverId || "unknown";
                if (!seen.has(id)) {
                    const wuraId = tx.receiver?.wuraId || "";
                    const displayName = wuraId || "Bénéficiaire";
                    seen.set(id, {
                        id,
                        name: displayName,
                        initial: displayName.replace("@", "").charAt(0).toUpperCase() || "?",
                    });
                }
            });

            setRecentBeneficiaries(Array.from(seen.values()).slice(0, 6));
        } catch {
            // Silently fail — beneficiaries are not critical
        }
    }, []);

    useEffect(() => {
        if (!transferState.inputValue) {
            setInputValue("50000");
        }

        const cleanupPendingPayment = async () => {
            const pendingTx = await getSecureData('pendingKkiapayTx');
            if (pendingTx) {
                console.log("[SenderHome] Cleaning stale pendingKkiapayTx:", pendingTx);
                await deleteSecureData('pendingKkiapayTx');
                await deleteSecureData('pendingKkiapayCountry');
            }
        };
        cleanupPendingPayment();
        fetchRecentBeneficiaries();
    }, []);

    const amount = transferState.inputValue;
    const isXofInput = transferState.inputCurrency === 'XOF';
    const [isCountryModalVisible, setIsCountryModalVisible] = useState(false);
    const [selectedCountry, setSelectedCountry] = useState(WESTERN_COUNTRIES[0]); // France
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === "dark";

    // Colors for beneficiary circles
    const COLORS = [
        { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-600" },
        { bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-600" },
        { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-600" },
        { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-600" },
        { bg: "bg-rose-100 dark:bg-rose-900/30", text: "text-rose-600" },
        { bg: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-600" },
    ];

    return (
        <SafeAreaView edges={['top']} className="flex-1 bg-white dark:bg-[#221b10]">
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                className="flex-1"
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <View className="flex-1">
                        {/* Header: Profile icon right */}
                        <View className="flex-row justify-end px-4 pt-4">
                            <TouchableOpacity
                                onPress={() => router.push("/sender-home/profil")}
                                activeOpacity={0.7}
                            >
                                <View className="w-10 h-10 rounded-full bg-[#F59E0B]/20 items-center justify-center border border-[#F59E0B]/30">
                                    <Text className="text-base font-bold text-[#F59E0B]">
                                        {(transferState as any)?.senderName?.charAt(0)?.toUpperCase() || "W"}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        </View>

                        {/* Country Selector */}
                        <View className="items-center px-6 mt-6">
                            <View className="w-full max-w-xs">
                                <TouchableOpacity onPress={() => setIsCountryModalVisible(true)} className="w-full bg-[#F9FAFB] dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-3 flex-row items-center justify-between shadow-sm active:scale-[0.98]">
                                    <View className="flex-row items-center gap-9">
                                        <Text className="text-xs font-medium text-gray-500 uppercase tracking-wide absolute -top-3 left-4 bg-white dark:bg-[#221b10] px-1">
                                            Pays du bénéficiaire
                                        </Text>
                                        <View className="w-6 h-4 rounded-sm overflow-hidden border border-gray-100 dark:border-white/10 flex-row">
                                            {selectedCountry.flag}
                                        </View>
                                        <Text className="font-semibold text-gray-800 dark:text-gray-100">{selectedCountry.name}</Text>
                                    </View>
                                    <ChevronDown size={20} className="text-gray-400" color="#9ca3af" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Main Content: AMOUNT INPUT */}
                        <View className="flex-1 items-center justify-center px-6 mt-4">
                            <View className="items-center gap-1 w-full max-w-sm">
                                <View className="relative w-full flex-row items-center justify-center">
                                    <TextInput
                                        value={amount}
                                        onChangeText={(text) => setInputValue(text.replace(/[^0-9.,]/g, ''))}
                                        keyboardType="decimal-pad"
                                        className="w-full bg-transparent text-center text-[3.5rem] font-bold tracking-tight text-gray-900 dark:text-white leading-none p-0"
                                        placeholder="0"
                                        placeholderTextColor="#cbd5e1"
                                        selectionColor="#F59E0B"
                                    />
                                    <Text className="absolute right-0 top-1/2 -translate-y-1/2 text-lg font-bold text-gray-400 dark:text-gray-500 hidden sm:flex">
                                        {isXofInput ? 'FCFA' : '€'}
                                    </Text>
                                </View>
                                <Text className="text-lg font-bold text-gray-400 dark:text-gray-500 sm:hidden">
                                    {isXofInput ? 'FCFA' : '€'}
                                </Text>

                                <View className="flex-row items-center justify-center gap-3 mt-4">
                                    <View className="flex-1 h-[1px] bg-gray-200 dark:bg-white/10" />
                                    <TouchableOpacity
                                        onPress={toggleCurrency}
                                        className="bg-gray-100 dark:bg-white/10 p-2 rounded-full active:scale-95"
                                    >
                                        <ArrowUpDown size={20} color={isDark ? "#F59E0B" : "#064E3B"} className="text-[#064E3B] dark:text-[#F59E0B]" />
                                    </TouchableOpacity>
                                    <View className="flex-1 h-[1px] bg-gray-200 dark:bg-white/10" />
                                </View>

                                <View className="flex-row items-center justify-center gap-2 mt-4">
                                    <Text className="text-xl font-semibold text-[#064E3B] dark:text-[#F59E0B]">
                                        ≈ {isXofInput ? getCalculatedEUR() : getCalculatedXOF()} {isXofInput ? '€' : 'FCFA'}
                                    </Text>
                                </View>

                                <View className="mt-2 px-3 py-1 rounded-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                                    <Text className="text-xs font-medium text-gray-400 dark:text-gray-500">
                                        1 € = 655.96 FCFA
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Bottom Section */}
                        <View className="w-full bg-white dark:bg-[#221b10] z-20 flex-col pb-8">
                            <View className="w-full px-6 mb-6">
                                <View className="flex-row justify-between items-center mb-4">
                                    <Text className="text-sm font-semibold text-gray-900 dark:text-white">Récents</Text>
                                    <TouchableOpacity onPress={() => router.push("/sender-home/beneficiaires")}>
                                        <Text className="text-xs font-medium text-[#064E3B]">Voir tout</Text>
                                    </TouchableOpacity>
                                </View>

                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16, paddingHorizontal: 0 }}>
                                    {/* New Button */}
                                    <View className="items-center gap-2 w-16">
                                        <TouchableOpacity
                                            onPress={() => router.push("/sender-home/add-beneficiary")}
                                            className="w-14 h-14 rounded-full border-2 border-dashed border-gray-300 items-center justify-center"
                                        >
                                            <Plus size={24} className="text-gray-400" color="#9ca3af" />
                                        </TouchableOpacity>
                                        <Text className="text-xs text-gray-500 font-medium text-center" numberOfLines={1}>Nouveau</Text>
                                    </View>

                                    {/* Recents List */}
                                    {recentBeneficiaries.length === 0 ? (
                                        <View className="items-center justify-center px-4 py-2">
                                            <Text className="text-xs text-gray-400 dark:text-gray-500 italic">
                                                Vos bénéficiaires récents apparaîtront ici
                                            </Text>
                                        </View>
                                    ) : (
                                        recentBeneficiaries.map((contact, idx) => {
                                            const colorSet = COLORS[idx % COLORS.length];
                                            return (
                                                <TouchableOpacity key={contact.id} className="items-center gap-2 w-16">
                                                    <View className={`w-14 h-14 rounded-full items-center justify-center ${colorSet.bg}`}>
                                                        <Text className={`font-bold text-lg ${colorSet.text}`}>{contact.initial}</Text>
                                                    </View>
                                                    <Text className="text-xs text-gray-600 dark:text-gray-300 font-medium text-center" numberOfLines={1}>
                                                        {contact.name}
                                                    </Text>
                                                </TouchableOpacity>
                                            );
                                        })
                                    )}
                                </ScrollView>
                            </View>

                            <View className="px-6 pt-2">
                                <TouchableOpacity
                                    onPress={() => router.push("/sender-home/confirmation-amount")}
                                    className="w-full bg-[#064E3B] py-4 rounded-xl shadow-lg shadow-emerald-900/10 flex-row items-center justify-center gap-3 active:scale-[0.98]"
                                >
                                    <Text className="text-white font-bold text-lg">Transférer</Text>
                                    <ArrowRight size={24} color="white" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>

            <CountrySelector
                visible={isCountryModalVisible}
                onClose={() => setIsCountryModalVisible(false)}
                onSelect={setSelectedCountry}
                selectedCode={selectedCountry.code}
            />
        </SafeAreaView>
    );
}
