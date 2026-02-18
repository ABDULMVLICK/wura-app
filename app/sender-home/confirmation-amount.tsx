import { View, Text, TouchableOpacity, SafeAreaView, ScrollView } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ChevronLeft, ArrowRight, Check } from "lucide-react-native";

export default function ConfirmationAmountScreen() {
    const router = useRouter();
    const { amount } = useLocalSearchParams();

    // Default to 50000 if not provided, just for safety or dev testing
    const displayAmount = amount ? amount.toString() : "50000";

    // Calculate approximate Euro value (Example rate: 1 EUR = 655.95 FCFA)
    const numericAmount = parseInt(displayAmount.replace(/\s/g, ''), 10) || 0;
    const euroAmount = (numericAmount / 655.95).toFixed(2); // Mock value for display

    const handleConfirm = () => {
        // Navigate to Recipient Search (which allows selecting or adding beneficiary)
        // We pass the amount along just in case it's needed later
        router.push("/sender-home/recipient-search");
    };

    return (
        <SafeAreaView className="flex-1 bg-white dark:bg-[#221b10]">
            {/* Header */}
            <View className="relative px-6 py-4 flex-row items-center justify-center z-10">
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="absolute left-6 h-10 w-10 items-center justify-center rounded-full bg-slate-50 dark:bg-white/10"
                >
                    <ChevronLeft size={24} className="text-slate-900 dark:text-white" color="#0f172a" />
                </TouchableOpacity>
                <Text className="text-lg font-bold text-slate-900 dark:text-white">Confirmation</Text>
            </View>

            <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

                <View className="flex-1 items-center justify-center -mt-10">
                    <Text className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-6">
                        Montant à envoyer
                    </Text>

                    <View className="items-center">
                        <Text className="text-[3.5rem] font-bold tracking-tight text-[#F59E0B] leading-none text-center">
                            {Number(numericAmount).toLocaleString('fr-FR')}
                        </Text>
                        <Text className="text-2xl font-bold text-slate-300 dark:text-slate-600 mt-2">
                            FCFA
                        </Text>
                    </View>

                    <View className="mt-8 flex-row items-center justify-center gap-2 bg-slate-50 dark:bg-white/5 py-2 px-4 rounded-full">
                        <Text className="text-base font-medium text-slate-500 dark:text-slate-400">
                            ≈ {euroAmount} €
                        </Text>
                    </View>

                    <View className="mt-12 w-full bg-slate-50 dark:bg-white/5 rounded-2xl p-6 space-y-4">
                        <View className="flex-row justify-between items-center pb-4 border-b border-slate-100 dark:border-white/10">
                            <Text className="text-slate-500 dark:text-slate-400">Frais de transfert</Text>
                            <Text className="font-bold text-slate-900 dark:text-white">0 FCFA</Text>
                        </View>
                        <View className="flex-row justify-between items-center pb-4 border-b border-slate-100 dark:border-white/10">
                            <Text className="text-slate-500 dark:text-slate-400">Total à payer</Text>
                            <Text className="font-bold text-slate-900 dark:text-white">{Number(numericAmount).toLocaleString('fr-FR')} FCFA</Text>
                        </View>
                        <View className="flex-row justify-between items-center">
                            <Text className="text-slate-500 dark:text-slate-400">Taux de change</Text>
                            <Text className="font-bold text-slate-900 dark:text-white">1 € = 655.95 FCFA</Text>
                        </View>
                    </View>
                </View>

                {/* Bottom Action */}
                <View className="mt-auto pt-8 mb-8">
                    <TouchableOpacity
                        onPress={handleConfirm}
                        className="w-full bg-[#064E3B] py-5 rounded-full shadow-lg shadow-emerald-900/20 flex-row items-center justify-center gap-3 active:scale-[0.98]"
                    >
                        <Text className="text-white font-bold text-xl">Confirmer le montant</Text>
                        <ArrowRight size={24} color="white" />
                    </TouchableOpacity>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}
