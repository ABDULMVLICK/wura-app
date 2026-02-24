import { clsx } from "clsx";
import { useRouter } from "expo-router";
import { ArrowRight, ChevronLeft, Clock, Zap } from "lucide-react-native";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTransfer } from "../../contexts/TransferContext";

export default function ConfirmationAmountScreen() {
    const router = useRouter();
    const { state, setDeliverySpeed, getCalculatedXOF, getCalculatedEUR, getFeesXOF, getTotalXOF } = useTransfer();

    const numericAmount = parseInt(getCalculatedXOF(), 10) || 0;
    const euroAmount = getCalculatedEUR() || "0.00";
    const isLoading = state.isQuoting;

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
                        <Text className={clsx("text-[3.5rem] font-bold tracking-tight text-[#F59E0B] leading-none text-center", isLoading && "opacity-50")}>
                            {isLoading ? "..." : Number(numericAmount || 0).toLocaleString('fr-FR')}
                        </Text>
                        <Text className="text-2xl font-bold text-slate-300 dark:text-slate-600 mt-2">
                            FCFA
                        </Text>
                    </View>

                    <View className="mt-8 flex-row items-center justify-center gap-2 bg-slate-50 dark:bg-white/5 py-2 px-4 rounded-full">
                        <Text className="text-base font-medium text-slate-500 dark:text-slate-400">
                            ≈ {isLoading ? "..." : euroAmount} €
                        </Text>
                    </View>

                    {/* Vitesse de transfert */}
                    <View className="mt-8 w-full gap-3">
                        <Text className="text-sm font-semibold text-slate-900 dark:text-white px-2">Vitesse de transfert</Text>

                        <TouchableOpacity
                            onPress={() => setDeliverySpeed('INSTANT')}
                            className={clsx(
                                "flex-row items-center justify-between p-4 rounded-2xl border-2 transition-all",
                                state.deliverySpeed === 'INSTANT'
                                    ? "bg-[#064E3B]/5 border-[#064E3B] dark:bg-[#F59E0B]/10 dark:border-[#F59E0B]"
                                    : "bg-white border-slate-100 dark:bg-white/5 dark:border-white/10"
                            )}
                        >
                            <View className="flex-row items-center gap-4">
                                <View className={clsx(
                                    "p-3 rounded-full",
                                    state.deliverySpeed === 'INSTANT' ? "bg-[#064E3B]/10 dark:bg-[#F59E0B]/20" : "bg-slate-100 dark:bg-white/10"
                                )}>
                                    <Zap size={20} className={state.deliverySpeed === 'INSTANT' ? "text-[#064E3B] dark:text-[#F59E0B]" : "text-slate-500 dark:text-slate-400"} />
                                </View>
                                <View>
                                    <Text className={clsx("font-bold text-base", state.deliverySpeed === 'INSTANT' ? "text-[#064E3B] dark:text-white" : "text-slate-900 dark:text-white")}>Instantané</Text>
                                    <Text className="text-sm text-slate-500">Arrive en ~30 secondes</Text>
                                </View>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => setDeliverySpeed('STANDARD')}
                            className={clsx(
                                "flex-row items-center justify-between p-4 rounded-2xl border-2 transition-all",
                                state.deliverySpeed === 'STANDARD'
                                    ? "bg-[#064E3B]/5 border-[#064E3B] dark:bg-[#F59E0B]/10 dark:border-[#F59E0B]"
                                    : "bg-white border-slate-100 dark:bg-white/5 dark:border-white/10"
                            )}
                        >
                            <View className="flex-row items-center gap-4">
                                <View className={clsx(
                                    "p-3 rounded-full",
                                    state.deliverySpeed === 'STANDARD' ? "bg-[#064E3B]/10 dark:bg-[#F59E0B]/20" : "bg-slate-100 dark:bg-white/10"
                                )}>
                                    <Clock size={20} className={state.deliverySpeed === 'STANDARD' ? "text-[#064E3B] dark:text-[#F59E0B]" : "text-slate-500 dark:text-slate-400"} />
                                </View>
                                <View>
                                    <Text className={clsx("font-bold text-base", state.deliverySpeed === 'STANDARD' ? "text-[#064E3B] dark:text-white" : "text-slate-900 dark:text-white")}>Standard</Text>
                                    <Text className="text-sm text-slate-500">Livré sous 1 à 3 jours</Text>
                                </View>
                            </View>
                            <Text className={clsx("font-bold text-xs uppercase tracking-wider", state.deliverySpeed === 'STANDARD' ? "text-[#064E3B] dark:text-[#F59E0B]" : "text-slate-500")}>Moins cher</Text>
                        </TouchableOpacity>
                    </View>

                    <View className="mt-8 w-full bg-slate-50 dark:bg-white/5 rounded-2xl p-6 space-y-4">
                        <View className="flex-row justify-between items-center pb-4 border-b border-slate-100 dark:border-white/10">
                            <Text className="text-slate-500 dark:text-slate-400">Montant net envoyé</Text>
                            <Text className="font-bold text-slate-900 dark:text-white">
                                {isLoading ? "..." : Number(state.quote?.baseAmountCfa || 0).toLocaleString('fr-FR')} FCFA
                            </Text>
                        </View>
                        <View className="flex-row justify-between items-center pb-4 border-b border-slate-100 dark:border-white/10">
                            <Text className="text-slate-500 dark:text-slate-400">Frais réseau partenaires</Text>
                            <Text className="font-bold text-slate-900 dark:text-white">
                                {isLoading ? "..." : Number(state.quote?.partnerFeesCfa || 0).toLocaleString('fr-FR')} FCFA
                            </Text>
                        </View>
                        <View className="flex-row justify-between items-center pb-4 border-b border-slate-100 dark:border-white/10">
                            <Text className="text-slate-500 dark:text-slate-400">Frais WURA</Text>
                            <Text className="font-bold text-slate-900 dark:text-white">
                                {isLoading ? "..." : Number(state.quote?.wuraFeesCfa || 0).toLocaleString('fr-FR')} FCFA
                            </Text>
                        </View>

                        <View className="flex-row justify-between items-center">
                            <Text className="text-slate-500 dark:text-slate-400">Total à payer</Text>
                            <Text className="font-bold text-emerald-600 dark:text-emerald-400 text-lg">
                                {isLoading ? "..." : Number(getTotalXOF() || 0).toLocaleString('fr-FR')} FCFA
                            </Text>
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
