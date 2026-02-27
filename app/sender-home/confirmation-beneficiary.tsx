import { useRouter } from "expo-router";
import { ArrowRight, ChevronLeft, Link, MoreHorizontal, ShieldCheck, User } from "lucide-react-native";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTransfer } from "../../contexts/TransferContext";

export default function ConfirmationBeneficiaryScreen() {
    const router = useRouter();
    const { state } = useTransfer();

    const recipient = state.recipient || {
        nom: "Koffi",
        prenom: "Kouamé",
        pays: "France"
    };

    const { nom, prenom } = recipient;
    const fullName = `${prenom} ${nom}`;

    const handleConfirm = () => {
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
                        <ChevronLeft size={24} color="#1f2937" />
                    </TouchableOpacity>
                    <Text className="text-xs font-medium tracking-widest text-[#F59E0B] uppercase">Nouvel Envoi</Text>
                    <TouchableOpacity className="p-2 -mr-2 rounded-full active:bg-gray-100 dark:active:bg-[#3A3124]">
                        <MoreHorizontal size={24} color="#9ca3af" />
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 16 }} showsVerticalScrollIndicator={false}>
                    {/* Hero Header */}
                    <View className="mb-8 items-center">
                        <View className="items-center justify-center w-12 h-12 rounded-full bg-[#F59E0B]/10 mb-4">
                            <ShieldCheck size={24} color="#F59E0B" />
                        </View>
                        <Text className="text-3xl font-bold text-[#F59E0B] mb-2 text-center">Récapitulatif</Text>
                        <Text className="text-sm text-gray-500 dark:text-gray-400 max-w-[260px] text-center">
                            Vérifiez le nom du bénéficiaire avant de confirmer l'envoi.
                        </Text>
                    </View>

                    {/* Beneficiary Details Card */}
                    <View className="bg-gray-50 dark:bg-[#221b10] rounded-2xl border border-gray-100 dark:border-[#3A3124] shadow-sm overflow-hidden mb-6">
                        {/* Header of the card */}
                        <View className="px-5 py-4 border-b border-gray-100 dark:border-[#3A3124] flex-row items-center justify-between bg-white dark:bg-[#2A2318]">
                            <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider">Bénéficiaire</Text>
                            <TouchableOpacity onPress={() => router.back()}>
                                <Text className="text-xs font-semibold text-[#064E3B] dark:text-emerald-400">Modifier</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Row: Name */}
                        <View className="flex-row items-center px-5 py-4 bg-white dark:bg-[#221b10]">
                            <View className="w-10 h-10 rounded-xl bg-[#064E3B]/10 items-center justify-center mr-4">
                                <User size={20} color="#064E3B" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">Nom du bénéficiaire</Text>
                                <Text className="text-sm font-semibold text-gray-900 dark:text-gray-100" numberOfLines={1}>{fullName}</Text>
                            </View>
                        </View>

                        {/* Row: Retrait info */}
                        <View className="flex-row items-center px-5 py-4 bg-white dark:bg-[#221b10] border-t border-gray-100 dark:border-[#3A3124]">
                            <View className="w-10 h-10 rounded-xl bg-[#F59E0B]/10 items-center justify-center mr-4">
                                <Link size={20} color="#F59E0B" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">Retrait</Text>
                                {recipient.isNew ? (
                                    <>
                                        <Text className="text-sm font-semibold text-gray-900 dark:text-gray-100">Lien de retrait généré après paiement</Text>
                                        <Text className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Votre bénéficiaire entrera son IBAN depuis le lien</Text>
                                    </>
                                ) : (
                                    <>
                                        <Text className="text-sm font-semibold text-gray-900 dark:text-gray-100">Notification envoyée au bénéficiaire</Text>
                                        <Text className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Il sera notifié pour retirer ses fonds depuis son application Wura</Text>
                                    </>
                                )}
                            </View>
                        </View>
                    </View>

                    {/* Bottom Actions */}
                    <View className="mt-4 pb-8">
                        <TouchableOpacity
                            onPress={handleConfirm}
                            className="w-full bg-[#064E3B] py-4 rounded-2xl shadow-lg shadow-emerald-900/20 flex-row items-center justify-center gap-2 active:scale-[0.98]"
                        >
                            <Text className="text-white font-semibold text-base">Confirmer et choisir le montant</Text>
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
