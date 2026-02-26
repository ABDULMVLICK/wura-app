import { useRouter } from "expo-router";
import { ArrowRight, ChevronLeft, Globe, Hash, Landmark, MoreHorizontal, QrCode, ShieldCheck, User } from "lucide-react-native";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTransfer } from "../../contexts/TransferContext";

export default function ConfirmationBeneficiaryScreen() {
    const router = useRouter();
    const { state } = useTransfer();

    // Destructure params with fallbacks if context is empty (direct dev navigation)
    const recipient = state.recipient || {
        nom: "Koffi",
        prenom: "Kouamé",
        iban: "CI65 **** **** **** 9821",
        bic: "ECOB CI AB",
        banque: "Ecobank Côte d'Ivoire",
        pays: "France"
    };

    const { nom, prenom, iban, bic, banque, pays } = recipient;
    const fullName = `${prenom} ${nom}`;

    const handleConfirm = () => {
        // Proceed to Payment selection
        router.push("/paiement");
    };

    return (
        <SafeAreaView className="flex-1 bg-[#f8f7f5] dark:bg-[#221b10]">
            <View className="flex-1">

                {/* Navigation Header */}
                <View className="px-6 py-2 flex-row items-center justify-between">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="p-2 -ml-2 rounded-full active:bg-gray-100 dark:active:bg-[#3A3124]"
                    >
                        <ChevronLeft size={24} className="text-gray-800 dark:text-gray-200" color="currentColor" />
                    </TouchableOpacity>
                    <Text className="text-xs font-medium tracking-widest text-[#F59E0B] uppercase">Nouvel Envoi</Text>
                    <TouchableOpacity className="p-2 -mr-2 rounded-full active:bg-gray-100 dark:active:bg-[#3A3124]">
                        <MoreHorizontal size={24} className="text-gray-800 dark:text-gray-200" color="currentColor" />
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 16 }} showsVerticalScrollIndicator={false}>
                    {/* Hero Header */}
                    <View className="mb-8 items-center">
                        <View className="items-center justify-center w-12 h-12 rounded-full bg-[#F59E0B]/10 mb-4">
                            <ShieldCheck size={24} className="text-[#F59E0B]" color="#F59E0B" />
                        </View>
                        <Text className="text-3xl font-bold text-[#F59E0B] mb-2 text-center">Récapitulatif</Text>
                        <Text className="text-sm text-gray-500 dark:text-gray-400 max-w-[260px] text-center">
                            Veuillez vérifier les informations du bénéficiaire avant de confirmer.
                        </Text>
                    </View>

                    {/* Beneficiary Details Card */}
                    <View className="bg-gray-50 dark:bg-[#221b10] rounded-2xl border border-gray-100 dark:border-[#3A3124] shadow-sm overflow-hidden mb-6">
                        {/* Header of the card */}
                        <View className="px-5 py-4 border-b border-gray-100 dark:border-[#3A3124] flex-row items-center justify-between bg-white dark:bg-[#2A2318]">
                            <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider">Détails du compte</Text>
                            <TouchableOpacity onPress={() => router.back()}>
                                <Text className="text-xs font-semibold text-[#064E3B] dark:text-emerald-400">Modifier</Text>
                            </TouchableOpacity>
                        </View>

                        <View className="divide-y divide-gray-100 dark:divide-[#3A3124]">
                            {/* Row: Country */}
                            <View className="flex-row items-center px-5 py-4 bg-white dark:bg-[#221b10]">
                                <View className="w-10 h-10 rounded-xl bg-[#064E3B]/10 items-center justify-center mr-4">
                                    <Globe size={20} className="text-[#064E3B] dark:text-emerald-400" color="#064E3B" />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">Pays</Text>
                                    <Text className="text-sm font-semibold text-gray-900 dark:text-gray-100" numberOfLines={1}>{pays}</Text>
                                </View>
                                {/* Flag Placeholder */}
                                <View className="w-6 h-4 rounded shadow-sm overflow-hidden bg-gray-200">
                                    <View className="flex-1 bg-orange-400" />
                                    <View className="flex-1 bg-white" />
                                    <View className="flex-1 bg-green-600" />
                                </View>
                            </View>

                            {/* Row: Name */}
                            <View className="flex-row items-center px-5 py-4 bg-white dark:bg-[#221b10]">
                                <View className="w-10 h-10 rounded-xl bg-[#064E3B]/10 items-center justify-center mr-4">
                                    <User size={20} className="text-[#064E3B] dark:text-emerald-400" color="#064E3B" />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">Nom du bénéficiaire</Text>
                                    <Text className="text-sm font-semibold text-gray-900 dark:text-gray-100" numberOfLines={1}>{fullName}</Text>
                                </View>
                            </View>

                            {/* Row: IBAN */}
                            <View className="flex-row items-center px-5 py-4 bg-white dark:bg-[#221b10]">
                                <View className="w-10 h-10 rounded-xl bg-[#064E3B]/10 items-center justify-center mr-4">
                                    <Hash size={20} className="text-[#064E3B] dark:text-emerald-400" color="#064E3B" />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">IBAN</Text>
                                    <Text className="text-sm font-semibold text-gray-900 dark:text-gray-100" numberOfLines={1}>{iban}</Text>
                                </View>
                            </View>

                            {/* Row: BIC */}
                            <View className="flex-row items-center px-5 py-4 bg-white dark:bg-[#221b10]">
                                <View className="w-10 h-10 rounded-xl bg-[#064E3B]/10 items-center justify-center mr-4">
                                    <QrCode size={20} className="text-[#064E3B] dark:text-emerald-400" color="#064E3B" />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">BIC / SWIFT</Text>
                                    <Text className="text-sm font-semibold text-gray-900 dark:text-gray-100">{bic}</Text>
                                </View>
                            </View>

                            {/* Row: Bank */}
                            <View className="flex-row items-center px-5 py-4 bg-white dark:bg-[#221b10]">
                                <View className="w-10 h-10 rounded-xl bg-[#064E3B]/10 items-center justify-center mr-4">
                                    <Landmark size={20} className="text-[#064E3B] dark:text-emerald-400" color="#064E3B" />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">Banque</Text>
                                    <Text className="text-sm font-semibold text-gray-900 dark:text-gray-100" numberOfLines={1}>{banque}</Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Bottom Actions */}
                    <View className="mt-4 pb-8">
                        <TouchableOpacity
                            onPress={handleConfirm}
                            className="w-full bg-[#064E3B] py-4 rounded-2xl shadow-lg shadow-emerald-900/20 flex-row items-center justify-center gap-2 active:scale-[0.98]"
                        >
                            <Text className="text-white font-semibold text-base">Confirmer et Générer le lien</Text>
                            <ArrowRight size={18} color="white" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => router.back()}
                            className="w-full mt-4 py-2 items-center"
                        >
                            <Text className="text-sm font-medium text-gray-500 dark:text-gray-400">Annuler l'opération</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>

                {/* Bottom Indicator (iOS) */}
                <View className="items-center pb-2">
                    <View className="h-1 w-1/3 bg-gray-300 dark:bg-gray-600 rounded-full" />
                </View>
            </View>
        </SafeAreaView>
    );
}
