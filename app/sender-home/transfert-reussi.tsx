import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, Image } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Check, Copy, Download, Home, SignalHigh, Wifi, BatteryFull, ArrowRight } from "lucide-react-native";
import { clsx } from "clsx";

export default function TransfertReussiScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();

    // Default mock values if params are missing
    const {
        amount = "50000",
        recipientName = "Jean Dupont",
        recipientHandle = "@JeanDu93",
        reference = "TRX-882910"
    } = params;

    const formattedAmount = Number(amount).toLocaleString('fr-FR');

    return (
        <SafeAreaView className="flex-1 bg-[#f8f7f5] dark:bg-[#221b10] items-center justify-center p-4">
            <View className="w-full h-full max-w-sm bg-white dark:bg-[#1f1a12] rounded-[2.5rem] shadow-2xl overflow-hidden border-[8px] border-gray-900 dark:border-gray-800 flex flex-col">

                {/* Status Bar */}
                <View className="w-full h-12 flex-row justify-between items-end px-7 pb-2 z-20">
                    <Text className="text-xs font-semibold text-gray-900 dark:text-white">9:41</Text>
                    <View className="flex-row gap-1.5 items-center">
                        <SignalHigh size={14} className="text-black dark:text-white" color="currentColor" />
                        <Wifi size={14} className="text-black dark:text-white" color="currentColor" />
                        <BatteryFull size={14} className="text-black dark:text-white" color="currentColor" />
                    </View>
                </View>

                {/* Confetti (Simulated with static views for now) */}
                <View className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                    <View className="absolute top-20 right-10 w-2 h-2 rounded-full bg-[#F59E0B]/60" />
                    <View className="absolute top-28 right-5 w-3 h-1 -rotate-12 bg-yellow-400" />
                    <View className="absolute top-14 right-20 w-1.5 h-1.5 rounded-sm bg-yellow-600" />
                    <View className="absolute top-24 left-10 w-2.5 h-2.5 rotate-45 bg-[#F59E0B]/40" />
                    <View className="absolute top-36 left-6 w-1.5 h-1.5 rounded-full bg-yellow-500" />
                </View>

                <View className="flex-1 flex flex-col items-center pt-8 px-6 relative z-10 pb-20">

                    {/* Checkmark Animation Section */}
                    <View className="mt-8 mb-6 relative items-center justify-center">
                        <View className="absolute w-32 h-32 bg-[#F59E0B]/30 rounded-full opacity-50" />
                        <View className="relative bg-white dark:bg-[#2A2216] w-32 h-32 rounded-full shadow-lg flex items-center justify-center border border-[#F59E0B]/20 z-10">
                            <Check size={48} className="text-[#F59E0B]" color="#F59E0B" strokeWidth={3} />
                        </View>
                    </View>

                    {/* Success Text */}
                    <View className="text-center w-full items-center space-y-4">
                        <Text className="text-[28px] font-bold text-gray-900 dark:text-white tracking-tight leading-tight text-center mb-4">
                            Transfert réussi !
                        </Text>

                        <View className="bg-[#FDFBF7] dark:bg-[#2A2216] rounded-2xl p-4 border border-gray-100 dark:border-gray-800/50 shadow-sm mx-2 w-full">
                            <Text className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed font-medium text-center">
                                Vous avez envoyé{"\n"}
                                <Text className="text-3xl font-extrabold text-[#F59E0B] dark:text-[#F59E0B] tracking-tight block mt-1 mb-1">
                                    {formattedAmount} FCFA
                                </Text>{"\n"}
                                à <Text className="font-bold text-gray-900 dark:text-white">{recipientHandle}</Text>
                            </Text>
                        </View>
                    </View>

                    {/* Details Card */}
                    <View className="w-full mt-8 bg-white dark:bg-[#2A2216] rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm">
                        <View className="gap-5">
                            {/* Reference */}
                            <View className="flex-row justify-between items-center">
                                <Text className="text-sm font-medium text-gray-500 dark:text-gray-400">Référence</Text>
                                <View className="flex-row items-center gap-2 bg-gray-50 dark:bg-gray-800/50 px-2 py-1 rounded-md">
                                    <Text className="text-sm font-bold text-gray-800 dark:text-gray-200 font-mono tracking-wide">{reference}</Text>
                                    <TouchableOpacity>
                                        <Copy size={14} className="text-gray-400" color="#9ca3af" />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View className="border-b border-dashed border-gray-200 dark:border-gray-700 h-[1px]" />

                            {/* Date */}
                            <View className="flex-row justify-between items-center">
                                <Text className="text-sm font-medium text-gray-500 dark:text-gray-400">Date</Text>
                                <Text className="text-sm font-semibold text-gray-900 dark:text-gray-100">24 Oct 2023, 14:30</Text>
                            </View>

                            <View className="border-b border-dashed border-gray-200 dark:border-gray-700 h-[1px]" />

                            {/* Source */}
                            <View className="flex-row justify-between items-center">
                                <Text className="text-sm font-medium text-gray-500 dark:text-gray-400">Source</Text>
                                <View className="flex-row items-center gap-2">
                                    <View className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                                    <Text className="text-sm font-semibold text-gray-900 dark:text-gray-100">Portefeuille Principal</Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Download Receipt */}
                    <TouchableOpacity className="mt-8 flex-row items-center justify-center gap-2 px-4 py-2 rounded-lg active:bg-[#F59E0B]/5">
                        <Download size={20} className="text-[#F59E0B]" color="#F59E0B" />
                        <Text className="text-[#F59E0B] font-semibold text-sm">Télécharger le reçu (PDF)</Text>
                    </TouchableOpacity>

                </View>

                {/* Footer Actions */}
                <View className="absolute bottom-0 w-full px-6 pb-8 pt-6 bg-white dark:bg-[#1f1a12] z-20">
                    <TouchableOpacity
                        onPress={() => router.push("/accueil")}
                        className="w-full bg-[#064E3B] py-4 rounded-2xl shadow-lg shadow-emerald-900/10 flex-row items-center justify-center gap-2 active:scale-[0.98]"
                    >
                        <Text className="text-white font-bold text-[17px]">Retour à l'accueil</Text>
                    </TouchableOpacity>
                    <View className="w-32 h-1 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mt-7" />
                </View>

            </View>
        </SafeAreaView>
    );
}
