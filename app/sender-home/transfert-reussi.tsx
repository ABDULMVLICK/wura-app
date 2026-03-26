import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams, useRouter } from "expo-router";
import { AlertTriangle, Check, ChevronLeft, Copy, Download, RefreshCw, Share2 } from "lucide-react-native";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, Share, Text, TouchableOpacity, View } from "react-native";
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

    const recipientHandle = (txData?.receiver?.firstName || txData?.receiver?.lastName)
        ? `${txData.receiver.firstName ?? ''} ${txData.receiver.lastName ?? ''}`.trim()
        : (state.recipient?.prenom || state.recipient?.nom)
            ? `${state.recipient.prenom ?? ''} ${state.recipient.nom ?? ''}`.trim()
            : state.recipient?.wuraId
                ? `@${state.recipient.wuraId}`
                : txData?.receiver?.wuraId
                    ? `@${txData.receiver.wuraId}`
                    : "@...";

    const [destinationCountry, setDestinationCountry] = useState<string>(
        txData?.receiver?.country || state.recipient?.pays || "le pays du bénéficiaire"
    );

    const reference = txData?.referenceId || (params.reference as string) || (transactionId ? transactionId.substring(0, 8).toUpperCase() : "TRX-...");

    const formattedAmount = Number(amount).toLocaleString('fr-FR');

    useEffect(() => {
        if (!transactionId) return;

        getSecureData('pendingKkiapayCountry').then(pays => {
            if (pays) setDestinationCountry(pays);
            deleteSecureData('pendingKkiapayCountry').catch(() => { });
        });

        deleteSecureData('pendingKkiapayTx').catch(() => { });

        let intervalId: ReturnType<typeof setInterval>;

        const pollStatus = async () => {
            try {
                const tx = await TransferService.getTransaction(transactionId);
                setStatus(tx.status);
                setTxData(tx);

                if (tx.status === "COMPLETED" || tx.status === "PAYIN_FAILED" || tx.status === "BRIDGE_FAILED" || tx.status === "OFFRAMP_FAILED") {
                    clearInterval(intervalId);
                }
            } catch (error) {
                console.error("Erreur de polling:", error);
            }
        };

        pollStatus();
        intervalId = setInterval(pollStatus, 3000);

        return () => clearInterval(intervalId);
    }, [transactionId]);

    const handleReturnHome = () => {
        resetTransfer();
        router.push("/sender-home");
    };

    const isNewBeneficiary = txData?.isNewBeneficiary === true || state.recipient?.isNew === true;

    const claimLink = `https://wura-claim.vercel.app/claim/${reference}`;

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

    const isError = status === "PAYIN_FAILED" || status === "BRIDGE_FAILED" || status === "OFFRAMP_FAILED";
    const isCompleted = status === "COMPLETED";

    const statusLabel = status === "INITIATED" || status === "PAYIN_PENDING"
        ? "Attente du paiement mobile..."
        : status === "PAYIN_SUCCESS" || status === "BRIDGE_PROCESSING"
            ? `Transfert vers ${destinationCountry} en cours...`
            : status === "BRIDGE_SUCCESS" || status === "WAITING_USER_OFFRAMP"
                ? "Transfert en transit"
                : status === "OFFRAMP_PROCESSING"
                    ? "Conversion en cours..."
                    : isCompleted
                        ? "Transfert réussi !"
                        : status === "REFUNDED"
                            ? "Transaction remboursée"
                            : "Échec du transfert.";

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#0A0A0C' }}>

            {/* Confetti subtil si COMPLETED */}
            {isCompleted && (
                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', zIndex: 0 }} pointerEvents="none">
                    <View style={{ position: 'absolute', top: 80, right: 40, width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(245,158,11,0.7)' }} />
                    <View style={{ position: 'absolute', top: 110, right: 20, width: 10, height: 4, borderRadius: 2, backgroundColor: '#fbbf24', transform: [{ rotate: '-12deg' }] }} />
                    <View style={{ position: 'absolute', top: 56, right: 80, width: 6, height: 6, borderRadius: 3, backgroundColor: '#fde68a' }} />
                    <View style={{ position: 'absolute', top: 96, left: 40, width: 10, height: 10, borderRadius: 2, backgroundColor: 'rgba(245,158,11,0.45)', transform: [{ rotate: '45deg' }] }} />
                    <View style={{ position: 'absolute', top: 144, left: 24, width: 6, height: 6, borderRadius: 3, backgroundColor: '#f59e0b' }} />
                    <View style={{ position: 'absolute', top: 64, left: 100, width: 4, height: 12, borderRadius: 2, backgroundColor: '#fcd34d', transform: [{ rotate: '20deg' }] }} />
                </View>
            )}

            <View style={{ flex: 1, flexDirection: 'column', zIndex: 1 }}>
                <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={{ flex: 1, alignItems: 'center', paddingTop: 16, paddingHorizontal: 28, paddingBottom: 16 }}>

                        {/* Status Icon — w-24 h-24 */}
                        <View style={{ marginTop: 8, marginBottom: 16, position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
                            <View style={{
                                position: 'absolute', width: 88, height: 88, borderRadius: 44,
                                backgroundColor: isError ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.15)',
                            }} />
                            <View style={{
                                width: 80, height: 80, borderRadius: 40,
                                backgroundColor: 'rgba(15,61,46,0.8)',
                                alignItems: 'center', justifyContent: 'center',
                                borderWidth: 1.5, borderColor: isError ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)',
                                shadowColor: isError ? '#ef4444' : '#F59E0B',
                                shadowOffset: { width: 0, height: 6 },
                                shadowOpacity: 0.3, shadowRadius: 16, elevation: 8,
                                zIndex: 1,
                            }}>
                                {isCompleted ? (
                                    <Check size={34} color="#F59E0B" strokeWidth={3} />
                                ) : isError ? (
                                    <AlertTriangle size={34} color="#EF4444" />
                                ) : (
                                    <ActivityIndicator size="large" color="#F59E0B" />
                                )}
                            </View>
                        </View>

                        {/* Status Title — text-[22px] mb-3 */}
                        <Text style={{
                            fontFamily: 'Outfit_900Black', fontSize: 22, color: '#ffffff',
                            textAlign: 'center', letterSpacing: -0.5, lineHeight: 28, marginBottom: 12,
                        }}>
                            {statusLabel}
                        </Text>

                        {/* Amount card — text-2xl p-4 */}
                        <View style={{
                            backgroundColor: 'rgba(255,255,255,0.06)',
                            borderRadius: 20, padding: 16,
                            borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
                            marginHorizontal: 4, width: '100%',
                        }}>
                            <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 14, color: 'rgba(255,255,255,0.55)', textAlign: 'center', lineHeight: 20 }}>
                                {isCompleted ? "Vous avez envoyé" : status === "REFUNDED" ? "Remboursé" : "Envoi de"}
                            </Text>
                            <Text style={{
                                fontFamily: 'Outfit_900Black', fontSize: 26, color: '#F59E0B',
                                textAlign: 'center', letterSpacing: -1, marginVertical: 6,
                            }}>
                                {formattedAmount} FCFA
                            </Text>
                            <Text style={{ fontFamily: 'Outfit_600SemiBold', fontSize: 14, color: 'rgba(255,255,255,0.65)', textAlign: 'center' }}>
                                à <Text style={{ fontFamily: 'Outfit_700Bold', color: '#ffffff' }}>{recipientHandle}</Text>
                            </Text>
                        </View>

                        {/* Transit info */}
                        {(status === "BRIDGE_SUCCESS" || status === "WAITING_USER_OFFRAMP") && (
                            <View style={{
                                width: '100%', marginTop: 12,
                                backgroundColor: 'rgba(59,130,246,0.12)',
                                borderRadius: 16, padding: 16,
                                borderWidth: 1, borderColor: 'rgba(59,130,246,0.3)',
                            }}>
                                <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 14, color: 'rgba(147,197,253,0.9)', textAlign: 'center', lineHeight: 20 }}>
                                    Les fonds sont arrivés. Le bénéficiaire les retirera vers son compte bancaire depuis son application Wura.
                                </Text>
                            </View>
                        )}

                        {/* Error Actions */}
                        {isError && (
                            <View style={{ width: '100%', marginTop: 16, gap: 12 }}>
                                <TouchableOpacity
                                    onPress={async () => {
                                        try {
                                            Alert.alert("Remboursement", "Envoi de la demande en cours...");
                                            await TransferService.requestRefund(transactionId);
                                            setStatus("REFUNDED");
                                            Alert.alert("✅ Remboursé", "Votre remboursement a été traité avec succès. L'argent sera recrédité sur votre compte mobile.");
                                        } catch (error: any) {
                                            Alert.alert("Erreur", error.response?.data?.message || "Impossible de traiter le remboursement.");
                                        }
                                    }}
                                    style={{
                                        width: '100%', backgroundColor: 'rgba(239,68,68,0.12)',
                                        borderWidth: 1, borderColor: 'rgba(239,68,68,0.35)',
                                        paddingVertical: 16, borderRadius: 24,
                                        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
                                    }}
                                    activeOpacity={0.8}
                                >
                                    <AlertTriangle size={18} color="#ef4444" />
                                    <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 15, color: '#ef4444' }}>Demander un remboursement</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={() => { resetTransfer(); router.replace("/sender-home"); }}
                                    style={{
                                        width: '100%', backgroundColor: '#064E3B', paddingVertical: 16,
                                        borderRadius: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
                                        shadowColor: '#064E3B', shadowOffset: { width: 0, height: 6 },
                                        shadowOpacity: 0.3, shadowRadius: 16, elevation: 6,
                                    }}
                                    activeOpacity={0.8}
                                >
                                    <RefreshCw size={18} color="white" />
                                    <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 15, color: '#ffffff' }}>Réessayer le transfert</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* Claim Link Section — mt-4 p-5 */}
                        {isNewBeneficiary && txData?.referenceId && !["PAYIN_FAILED", "BRIDGE_FAILED", "OFFRAMP_FAILED", "REFUNDED"].includes(status) && (
                            <View style={{
                                width: '100%', marginTop: 14,
                                backgroundColor: 'rgba(255,255,255,0.05)',
                                borderRadius: 20, padding: 20,
                                borderWidth: 1, borderColor: 'rgba(245,158,11,0.25)',
                                overflow: 'hidden', position: 'relative',
                            }}>
                                <View style={{
                                    position: 'absolute', top: 0, right: 0,
                                    width: 120, height: 120,
                                    backgroundColor: 'rgba(245,158,11,0.06)',
                                    borderBottomLeftRadius: 120,
                                }} />

                                <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 17, color: '#ffffff', marginBottom: 6 }}>
                                    Partagez le lien de retrait ! 🔗
                                </Text>
                                <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 16, lineHeight: 18 }}>
                                    Envoyez ce lien unique au bénéficiaire. Il pourra récupérer les fonds directement sur son IBAN en un clic.
                                </Text>

                                <View style={{
                                    flexDirection: 'row', alignItems: 'center',
                                    backgroundColor: 'rgba(0,0,0,0.25)',
                                    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
                                    borderRadius: 16, padding: 12, marginBottom: 16,
                                }}>
                                    <Text style={{ flex: 1, fontFamily: 'Outfit_400Regular', fontSize: 12, color: 'rgba(255,255,255,0.6)' }} numberOfLines={1} ellipsizeMode="tail">
                                        {claimLink}
                                    </Text>
                                    <TouchableOpacity onPress={handleCopyLink} style={{
                                        padding: 8, marginLeft: 8,
                                        backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 10,
                                    }}>
                                        <Copy size={16} color="rgba(255,255,255,0.7)" />
                                    </TouchableOpacity>
                                </View>

                                <TouchableOpacity
                                    onPress={handleShareLink}
                                    style={{
                                        width: '100%', backgroundColor: '#128C7E', paddingVertical: 16,
                                        borderRadius: 999, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
                                        shadowColor: '#128C7E', shadowOffset: { width: 0, height: 6 },
                                        shadowOpacity: 0.35, shadowRadius: 16, elevation: 6,
                                    }}
                                    activeOpacity={0.85}
                                >
                                    <Share2 size={18} color="white" />
                                    <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 16, color: '#ffffff' }}>Partager sur WhatsApp</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* Details Card — glass mt-4 p-5 gap-4 */}
                        <View style={{
                            width: '100%', marginTop: 14,
                            backgroundColor: 'rgba(255,255,255,0.05)',
                            borderRadius: 20, padding: 20,
                            borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
                        }}>
                            <View style={{ gap: 14 }}>
                                {/* Reference */}
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>Référence</Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                                        <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 13, color: '#ffffff' }}>{reference}</Text>
                                        <TouchableOpacity onPress={async () => {
                                            await Clipboard.setStringAsync(reference);
                                            Alert.alert("Copié !", "Référence copiée dans le presse-papiers.");
                                        }}>
                                            <Copy size={14} color="rgba(255,255,255,0.45)" />
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                <View style={{ borderBottomWidth: 1, borderStyle: 'dashed', borderBottomColor: 'rgba(255,255,255,0.1)' }} />

                                {/* Date */}
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>Date</Text>
                                    <Text style={{ fontFamily: 'Outfit_600SemiBold', fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>
                                        {txData?.createdAt
                                            ? new Date(txData.createdAt).toLocaleString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                                            : new Date().toLocaleString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </Text>
                                </View>

                                <View style={{ borderBottomWidth: 1, borderStyle: 'dashed', borderBottomColor: 'rgba(255,255,255,0.1)' }} />

                                {/* Source */}
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>Source</Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#10b981' }} />
                                        <Text style={{ fontFamily: 'Outfit_600SemiBold', fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>Portefeuille Principal</Text>
                                    </View>
                                </View>
                            </View>
                        </View>

                        {/* Download receipt */}
                        <TouchableOpacity
                            onPress={async () => {
                                try {
                                    await Share.share({
                                        message: `Reçu Wura\nRéférence : ${reference}\nMontant : ${formattedAmount} FCFA\nBénéficiaire : ${recipientHandle}\nDate : ${txData?.createdAt ? new Date(txData.createdAt).toLocaleString('fr-FR') : new Date().toLocaleString('fr-FR')}`,
                                        title: `Reçu Wura — ${reference}`,
                                    });
                                } catch (error: any) {
                                    console.error("Erreur partage reçu:", error.message);
                                }
                            }}
                            style={{ marginTop: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 }}
                            activeOpacity={0.7}
                        >
                            <Download size={20} color="#F59E0B" />
                            <Text style={{ fontFamily: 'Outfit_600SemiBold', fontSize: 14, color: '#F59E0B' }}>Télécharger le reçu (PDF)</Text>
                        </TouchableOpacity>

                        {/* Return home — mt-6 */}
                        <TouchableOpacity
                            onPress={handleReturnHome}
                            style={{
                                marginTop: 24, paddingHorizontal: 24, paddingVertical: 12,
                                borderRadius: 999,
                                borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
                                flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
                            }}
                            activeOpacity={0.7}
                        >
                            <ChevronLeft size={16} color="rgba(255,255,255,0.55)" />
                            <Text style={{ fontFamily: 'Outfit_600SemiBold', fontSize: 14, color: 'rgba(255,255,255,0.55)' }}>
                                Retour à l'accueil
                            </Text>
                        </TouchableOpacity>

                    </View>
                </ScrollView>
            </View>
        </SafeAreaView>
    );
}
