import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams, useRouter } from "expo-router";
import { Check, ChevronLeft, Copy, Download, Share2 } from "lucide-react-native";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Share, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTransfer } from "../../contexts/TransferContext";
import { deleteSecureData, getSecureData } from "../../lib/storage";
import { TransferService } from "../../services/transfers";
import { TransactionStatus } from "../../types/transaction";

export default function TransfertReussiScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { state, resetTransfer, getTotalXOF } = useTransfer();

    const transactionId = params.transactionId as string;
    const [status, setStatus] = useState<TransactionStatus>("INITIATED");
    const [txData, setTxData] = useState<any>(null);

    const amount = txData?.amountFiatIn ? txData.amountFiatIn : getTotalXOF() || "0";

    // Resolve handle safely: Try DB wuraId first, then State wuraId, then State context names
    const recipientHandle = txData?.receiver?.wuraId
        ? `@${txData.receiver.wuraId}`
        : state.recipient?.wuraId
            ? `@${state.recipient.wuraId}`
            : state.recipient?.prenom
                ? `@${state.recipient.prenom}${state.recipient.nom?.charAt(0) || ''}`
                : "@...";

    const [destinationCountry, setDestinationCountry] = useState<string>(
        txData?.receiver?.country || state.recipient?.pays || "le pays du bénéficiaire"
    );

    const reference = txData?.referenceId || (params.reference as string) || (transactionId ? transactionId.substring(0, 8).toUpperCase() : "TRX-...");

    const formattedAmount = Number(amount).toLocaleString('fr-FR');

    useEffect(() => {
        if (!transactionId) return;

        // On est arrivé sur la page avec succès, on tente de récupérer le pays sauvegardé en cache
        getSecureData('pendingKkiapayCountry').then(pays => {
            if (pays) setDestinationCountry(pays);
            deleteSecureData('pendingKkiapayCountry').catch(() => { });
        });

        // Et on peut purger le cache de sauvetage transaction
        deleteSecureData('pendingKkiapayTx').catch(() => { });

        let intervalId: ReturnType<typeof setInterval>;

        const pollStatus = async () => {
            try {
                const tx = await TransferService.getTransaction(transactionId);
                setStatus(tx.status);
                setTxData(tx);

                // Si la transaction est dans un état final, on arrête le polling
                if (tx.status === "PAYOUT_SUCCESS" || tx.status === "FAILED" || tx.status === "CANCELLED") {
                    clearInterval(intervalId);
                }
            } catch (error) {
                console.error("Erreur de polling:", error);
            }
        };

        // Polling initial
        pollStatus();
        // Polling toutes les 3 secondes
        intervalId = setInterval(pollStatus, 3000);

        return () => clearInterval(intervalId);
    }, [transactionId]);

    const handleReturnHome = () => {
        resetTransfer();
        router.push("/sender-home");
    };

    const isNewBeneficiary = state.recipient?.isNew === true;

    const claimLink = `https://wura.app/claim/${reference}`;

    const handleCopyLink = async () => {
        await Clipboard.setStringAsync(claimLink);
        alert("Lien copié dans le presse-papiers !");
    };

    const handleShareLink = async () => {
        try {
            await Share.share({
                message: `Bonjour ! Vous avez reçu ${formattedAmount} FCFA via Wura. Cliquez sur ce lien sécurisé pour récupérer vos fonds vers votre compte bancaire : ${claimLink}`,
            });
        } catch (error: any) {
            console.error("Erreur de partage:", error.message);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-[#f8f7f5] dark:bg-[#221b10]">
            <View className="flex-1 flex flex-col">

                {/* Confetti (Simulated with static views for now) */}
                {status === "PAYOUT_SUCCESS" && (
                    <View className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                        <View className="absolute top-20 right-10 w-2 h-2 rounded-full bg-[#F59E0B]/60" />
                        <View className="absolute top-28 right-5 w-3 h-1 -rotate-12 bg-yellow-400" />
                        <View className="absolute top-14 right-20 w-1.5 h-1.5 rounded-sm bg-yellow-600" />
                        <View className="absolute top-24 left-10 w-2.5 h-2.5 rotate-45 bg-[#F59E0B]/40" />
                        <View className="absolute top-36 left-6 w-1.5 h-1.5 rounded-full bg-yellow-500" />
                    </View>
                )}

                <ScrollView
                    className="flex-1"
                    contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
                    showsVerticalScrollIndicator={false}
                >
                    <View className="flex-1 flex flex-col items-center pt-8 px-6 relative z-10 pb-6">

                        {/* Checkmark Animation Section or Spinner */}
                        <View className="mt-8 mb-6 relative items-center justify-center">
                            <View className="absolute w-32 h-32 bg-[#F59E0B]/30 rounded-full opacity-50" />
                            <View className="relative bg-white dark:bg-[#2A2216] w-32 h-32 rounded-full shadow-lg flex items-center justify-center border border-[#F59E0B]/20 z-10">
                                {status === "PAYOUT_SUCCESS" ? (
                                    <Check size={48} className="text-[#F59E0B]" color="#F59E0B" strokeWidth={3} />
                                ) : status === "FAILED" || status === "CANCELLED" || status === "PAYIN_FAILED" ? (
                                    <Text className="text-[#EF4444] font-bold text-4xl">X</Text>
                                ) : (
                                    <ActivityIndicator size="large" color="#F59E0B" />
                                )}
                            </View>
                        </View>

                        {/* Dynamic Status Text */}
                        <View className="text-center w-full items-center space-y-4">
                            <Text className="text-[24px] font-bold text-gray-900 dark:text-white tracking-tight leading-tight text-center mb-4">
                                {status === "INITIATED" || status === "PAYIN_PENDING" ? "Attente du paiement mobile..."
                                    : status === "PAYIN_SUCCESS" || status === "PAYOUT_PENDING" ? `Transfert vers ${destinationCountry} en cours...`
                                        : status === "PAYOUT_SUCCESS" ? "Transfert réussi !"
                                            : "Échec du transfert."
                                }
                            </Text>

                            <View className="bg-[#FDFBF7] dark:bg-[#2A2216] rounded-2xl p-4 border border-gray-100 dark:border-gray-800/50 shadow-sm mx-2 w-full">
                                <Text className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed font-medium text-center">
                                    {status === "PAYOUT_SUCCESS" ? "Vous avez envoyé" : "Envoi de"} {"\n"}
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

                        {/* Share Shareable Link Section (Primary Action) */}
                        {(status === "PAYOUT_SUCCESS" || status === "PAYIN_SUCCESS" || status === "WAITING_USER_OFFRAMP" || status === "WAITING_FOR_RECEIVER") && isNewBeneficiary && (
                            <View className="w-full mt-6 bg-[#FDFBF7] dark:bg-[#2A2216] rounded-2xl p-5 border border-[#F59E0B]/30 shadow-sm relative overflow-hidden">
                                <View className="absolute top-0 right-0 w-32 h-32 bg-[#F59E0B]/5 rounded-bl-full" />

                                <Text className="text-gray-900 dark:text-white font-bold text-lg mb-1">
                                    Partagez le lien de retrait ! 🔗
                                </Text>
                                <Text className="text-gray-500 dark:text-gray-400 text-sm mb-4 leading-relaxed">
                                    Envoyez ce lien unique au bénéficiaire. Il pourra récupérer les fonds directement sur son IBAN en un clic.
                                </Text>

                                <View className="flex-row items-center bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl p-3 mb-4">
                                    <Text className="flex-1 text-gray-700 dark:text-gray-300 font-mono text-xs" numberOfLines={1} ellipsizeMode="tail">
                                        {claimLink}
                                    </Text>
                                    <TouchableOpacity onPress={handleCopyLink} className="p-2 ml-2 bg-gray-100 dark:bg-white/10 rounded-lg">
                                        <Copy size={16} className="text-gray-600 dark:text-gray-300" />
                                    </TouchableOpacity>
                                </View>

                                <TouchableOpacity
                                    onPress={handleShareLink}
                                    className="w-full bg-[#128C7E] py-3.5 rounded-xl shadow-lg shadow-[#128C7E]/20 flex-row items-center justify-center gap-2 active:scale-[0.98]"
                                >
                                    <Share2 size={18} color="white" />
                                    <Text className="text-white font-bold text-base">Partager sur WhatsApp</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* Download Receipt */}
                        <TouchableOpacity className="mt-6 flex-row items-center justify-center gap-2 px-4 py-2 rounded-lg active:bg-[#F59E0B]/5">
                            <Download size={20} className="text-[#F59E0B]" color="#F59E0B" />
                            <Text className="text-[#F59E0B] font-semibold text-sm">Télécharger le reçu (PDF)</Text>
                        </TouchableOpacity>

                        {/* Compact Footer Action */}
                        <TouchableOpacity
                            onPress={handleReturnHome}
                            className="mt-10 px-6 py-3 rounded-full border border-gray-200 dark:border-gray-800 flex-row items-center justify-center gap-2 active:bg-gray-50 dark:active:bg-white/5"
                        >
                            <ChevronLeft size={16} className="text-gray-600 dark:text-gray-400" color="#4b5563" />
                            <Text className="text-gray-700 dark:text-gray-300 font-medium text-sm">Retour à l'accueil</Text>
                        </TouchableOpacity>

                    </View>
                </ScrollView>

            </View>
        </SafeAreaView>
    );
}
