import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TransferService } from "../../services/transfers";

export default function ClaimTransactionScreen() {
    const router = useRouter();
    const { transactionId } = useLocalSearchParams();
    const [isLoading, setIsLoading] = useState(true);
    const [txData, setTxData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!transactionId) return;

        const loadTransaction = async () => {
            try {
                // Fetch basic public info (amount, sender name) without needing auth
                const tx = await TransferService.getClaimInfo(transactionId as string);
                setTxData(tx);
            } catch (err) {
                console.error("Link expired or invalid:", err);
                setError("Ce lien est invalide ou expiré.");
            } finally {
                setIsLoading(false);
            }
        };

        loadTransaction();
    }, [transactionId]);

    const handleGoogleAuth = () => {
        // We will plug the Web3Auth logic here. For now, route to Receiver Home.
        router.replace('/accueil');
    }

    if (isLoading) {
        return (
            <SafeAreaView className="flex-1 bg-[#f8f7f5] dark:bg-[#221b10] justify-center items-center">
                <ActivityIndicator size="large" color="#F59E0B" />
                <Text className="mt-4 text-gray-500 font-medium">Recherche de la transaction...</Text>
            </SafeAreaView>
        );
    }

    if (error) {
        return (
            <SafeAreaView className="flex-1 bg-[#f8f7f5] dark:bg-[#221b10] justify-center items-center px-6">
                <Text className="text-2xl font-bold text-red-500 mb-4">Erreur</Text>
                <Text className="text-gray-600 text-center">{error}</Text>
                <TouchableOpacity
                    onPress={() => router.replace('/')}
                    className="mt-8 bg-[#064E3B] px-8 py-3 rounded-xl"
                >
                    <Text className="text-white font-bold">Retour à l'accueil</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    const amountFiatOut = txData?.amountFiatOutExpected || "0";

    return (
        <SafeAreaView className="flex-1 bg-[#f8f7f5] dark:bg-[#221b10]">
            <View className="flex-1 px-6 pt-12 items-center">
                <View className="w-16 h-16 bg-[#F59E0B]/20 rounded-full items-center justify-center mb-6">
                    <Text className="text-3xl">🤑</Text>
                </View>

                <Text className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-2">
                    Vous avez reçu de l'argent !
                </Text>
                <Text className="text-gray-500 dark:text-gray-400 text-center mb-8 px-4">
                    {txData?.senderFirstName} vous a envoyé des fonds via Wura. Connectez-vous pour les récupérer sur votre compte bancaire.
                </Text>

                <View className="w-full bg-white dark:bg-[#2A2216] rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm items-center mb-8">
                    <Text className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">Montant à récupérer</Text>
                    <Text className="text-4xl font-extrabold text-[#F59E0B]">
                        {amountFiatOut} €
                    </Text>
                </View>

                {/* Google Sign-In & Web3Auth Trigger */}
                <TouchableOpacity
                    onPress={handleGoogleAuth}
                    className="w-full bg-white dark:bg-black border border-gray-200 dark:border-gray-800 py-4 rounded-xl flex-row items-center justify-center gap-3 shadow-sm active:opacity-80"
                >
                    <Text className="text-lg">🇬</Text>
                    <Text className="text-gray-900 dark:text-white font-semibold text-[16px]">
                        Continuer avec Google
                    </Text>
                </TouchableOpacity>

                <Text className="text-xs text-gray-400 dark:text-gray-500 text-center mt-6 px-4">
                    En continuant, un portefeuille Wura sécurisé sera automatiquement créé pour vous.
                </Text>
            </View>
        </SafeAreaView>
    );
}
