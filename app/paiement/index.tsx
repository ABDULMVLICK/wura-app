import { useRouter } from "expo-router";
import { ArrowRight, ChevronLeft, ShieldCheck } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AnimatedPressable } from "../../components/AnimatedPressable";
import { useTransfer } from "../../contexts/TransferContext";
import { saveSecureData } from "../../lib/storage";

interface PaymentMethod {
    id: string;
    label: string;
    shortName: string;
    colors: {
        bg: string;
        text: string;
    };
}

const PAYMENT_METHODS: PaymentMethod[] = [
    {
        id: "mtn",
        label: "MTN Mobile Money",
        shortName: "MTN",
        colors: {
            bg: "bg-[#ffcc00]",
            text: "text-[#1a1a1a]",
        },
    },
    {
        id: "moov",
        label: "Moov Money",
        shortName: "MOOV",
        colors: {
            bg: "bg-[#5b86e5]", // Gradient approximation or simplified color for NativeWind if gradients not supported seamlessly without specific linear-gradient lib. Tailwind arbitrary gradients might not work perfectly in RN without expo-linear-gradient. I'll use a solid color fallback for Moov or check if NativeWind handles it. For now, solid color.
            text: "text-white",
        },
    },
    {
        id: "orange",
        label: "Orange Money",
        shortName: "OM",
        colors: {
            bg: "bg-[#ff6600]",
            text: "text-white",
        },
    },
    {
        id: "airtel",
        label: "Airtel Money",
        shortName: "Airtel",
        colors: {
            bg: "bg-[#ed1c24]",
            text: "text-white",
        },
    },
    {
        id: "wave",
        label: "Wave",
        shortName: "Wave",
        colors: {
            bg: "bg-[#1dc4f0]",
            text: "text-white",
        },
    },
];

function formatAmount(value: number): string {
    return Number(value || 0).toLocaleString("fr-FR").replace(/,/g, ".");
}

import { useKkiapay } from "@kkiapay-org/react-native-sdk";
import { TransferService } from "../../services/transfers";

const KKIAPAY_PUBLIC_KEY = process.env.EXPO_PUBLIC_KKIAPAY_PUBLIC_KEY || "98bcfc8010c511f191e717946c2b76f5";



export default function PaiementScreen() {
    const router = useRouter();
    const { state, getTotalXOF, getCalculatedEUR, setPaymentMethod } = useTransfer();
    const [selected, setSelected] = useState("mtn");
    const [loading, setLoading] = useState(false);
    const { openKkiapayWidget, addSuccessListener, addKkiapayCloseListener } = useKkiapay();
    const pendingTxRef = useRef<string | null>(null);
    const paymentSuccessRef = useRef(false);
    const [shouldNavigateId, setShouldNavigateId] = useState<string | null>(null);
    // Effet séparé pour la navigation afin d'éviter les crashs Expo Router
    useEffect(() => {
        if (!shouldNavigateId) return;
        const timer = setTimeout(() => {
            router.replace({
                pathname: "/sender-home/transfert-reussi",
                params: { transactionId: shouldNavigateId }
            });
            setShouldNavigateId(null);
        }, 400);
        return () => clearTimeout(timer);
    }, [shouldNavigateId, router]);

    useEffect(() => {
        addSuccessListener((data: any) => {
            console.log("Kkiapay Success Event:", data);
            paymentSuccessRef.current = true;
        });

        addKkiapayCloseListener(() => {
            console.log("Kkiapay Widget closed");
            setLoading(false);

            if (pendingTxRef.current) {
                setShouldNavigateId(pendingTxRef.current);
                pendingTxRef.current = null;
                paymentSuccessRef.current = false;
            }
        });
    }, []);

    const amount = parseInt(getTotalXOF(), 10) || 0;

    const handlePayment = async () => {
        const method = PAYMENT_METHODS.find(m => m.id === selected);
        console.log("[Payment] handlePayment called. method:", method?.id, "recipient:", state.recipient?.prenom, "amount:", amount);
        if (!method) {
            Alert.alert("Erreur", "Veuillez sélectionner un mode de paiement.");
            return;
        }
        if (!state.recipient) {
            Alert.alert("Erreur", "Aucun bénéficiaire sélectionné. Veuillez recommencer le transfert.");
            return;
        }

        setPaymentMethod({
            id: method.id,
            type: 'MOBILE_MONEY',
            provider: method.shortName
        });

        setLoading(true);
        try {
            console.log("[Payment] Step 1: Creating transaction...");
            // Création de la transaction en base de données (Statut INITIATED)
            const tx = await TransferService.createTransaction({
                amountFCFA: amount,
                amountEUR: Number(getCalculatedEUR()),
                recipient: state.recipient,
                paymentMethodId: method.id,
                deliverySpeed: state.deliverySpeed
            });

            console.log("[Payment] Step 2: Transaction created:", tx.id, tx.referenceId);
            pendingTxRef.current = tx.id;
            await saveSecureData('pendingKkiapayTx', tx.id);
            await saveSecureData('pendingKkiapayCountry', state.recipient.pays || "le pays du bénéficiaire");

            // Ouverture du widget Kkiapay pour valider le paiement mobile
            console.log("[Payment] Opening Kkiapay widget, key:", KKIAPAY_PUBLIC_KEY.substring(0, 8) + "...");
            openKkiapayWidget({
                amount: amount,
                key: KKIAPAY_PUBLIC_KEY,
                sandbox: true,
                reason: "Envoi Wura vers " + state.recipient.prenom,
                data: tx.referenceId
            });
            console.log("[Payment] Step 4: openKkiapayWidget called successfully");

        } catch (error: any) {
            console.error("[Payment] ❌ Error:", error?.message);
            console.error("[Payment] Error response:", error?.response?.data);
            setLoading(false);
            Alert.alert(
                "Erreur de paiement",
                error?.response?.data?.message || error?.message || "Impossible de créer la transaction. Réessayez."
            );
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#14533d' }}>
            <View style={{ flex: 1 }}>
                {/* Header */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, position: 'relative' }}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={{ position: 'absolute', left: 20, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' }}
                    >
                        <ChevronLeft size={22} color="#ffffff" />
                    </TouchableOpacity>
                    <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 17, color: '#ffffff' }}>Paiement</Text>
                </View>

                <ScrollView contentContainerStyle={{ paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
                    {/* Title */}
                    <View style={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 20, gap: 6 }}>
                        <Text style={{ fontFamily: 'Outfit_900Black', fontSize: 26, color: '#F59E0B' }}>
                            Mode de paiement
                        </Text>
                        <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 20 }}>
                            Sélectionnez le compte à débiter pour votre transaction.
                        </Text>
                    </View>

                    {/* Payment methods — white cards */}
                    <View style={{ gap: 10, paddingHorizontal: 20 }}>
                        {PAYMENT_METHODS.map((method) => {
                            const isSelected = selected === method.id;
                            const bgColors: Record<string, string> = {
                                mtn: '#ffcc00', moov: '#5b86e5', orange: '#ff6600',
                                airtel: '#ed1c24', wave: '#1dc4f0',
                            };
                            const textColors: Record<string, string> = {
                                mtn: '#1a1a1a', moov: '#ffffff', orange: '#ffffff',
                                airtel: '#ffffff', wave: '#ffffff',
                            };
                            return (
                                <TouchableOpacity
                                    key={method.id}
                                    onPress={() => setSelected(method.id)}
                                    activeOpacity={0.7}
                                    style={{
                                        flexDirection: 'row', alignItems: 'center', gap: 14,
                                        backgroundColor: '#ffffff', borderRadius: 20,
                                        padding: 16, borderWidth: 2,
                                        borderColor: isSelected ? '#F59E0B' : 'transparent',
                                        shadowColor: isSelected ? '#F59E0B' : '#000',
                                        shadowOffset: { width: 0, height: isSelected ? 4 : 2 },
                                        shadowOpacity: isSelected ? 0.2 : 0.06,
                                        shadowRadius: isSelected ? 16 : 8,
                                        elevation: isSelected ? 6 : 2,
                                    }}
                                >
                                    {/* Icon badge */}
                                    <View style={{
                                        width: 48, height: 48, borderRadius: 14,
                                        backgroundColor: bgColors[method.id] || '#e5e7eb',
                                        alignItems: 'center', justifyContent: 'center',
                                    }}>
                                        <Text style={{
                                            fontFamily: 'Outfit_700Bold', fontSize: 11,
                                            color: textColors[method.id] || '#111',
                                        }}>
                                            {method.shortName}
                                        </Text>
                                    </View>

                                    {/* Label */}
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ fontFamily: 'Outfit_600SemiBold', fontSize: 15, color: '#1a1a2e' }}>
                                            {method.label}
                                        </Text>
                                    </View>

                                    {/* Radio */}
                                    <View style={{
                                        width: 24, height: 24, borderRadius: 12,
                                        borderWidth: 2,
                                        borderColor: isSelected ? '#F59E0B' : '#d1d5db',
                                        backgroundColor: isSelected ? '#F59E0B' : 'transparent',
                                        alignItems: 'center', justifyContent: 'center',
                                    }}>
                                        {isSelected && (
                                            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#ffffff' }} />
                                        )}
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* Security notice */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 20, paddingTop: 24 }}>
                        <ShieldCheck size={14} color="rgba(255,255,255,0.4)" />
                        <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                            Paiement 100% sécurisé par Wura
                        </Text>
                    </View>
                </ScrollView>

                {/* Footer total + CTA */}
                <View style={{
                    marginTop: 'auto', paddingHorizontal: 20, paddingBottom: 24, paddingTop: 16,
                    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)',
                    backgroundColor: '#14533d', gap: 14,
                }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 14, color: 'rgba(255,255,255,0.55)' }}>Total à payer</Text>
                        <Text style={{ fontFamily: 'Outfit_900Black', fontSize: 24, color: '#ffffff' }}>
                            {formatAmount(amount)} FCFA
                        </Text>
                    </View>

                    <AnimatedPressable
                        onPress={handlePayment}
                        disabled={loading}
                        style={{
                            width: '100%', backgroundColor: '#064E3B', paddingVertical: 18,
                            borderRadius: 999, alignItems: 'center', justifyContent: 'center',
                            opacity: loading ? 0.7 : 1,
                            shadowColor: '#00F5A0', shadowOffset: { width: 0, height: 6 },
                            shadowOpacity: loading ? 0 : 0.3, shadowRadius: 20, elevation: loading ? 0 : 8,
                        }}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                            <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 17, color: '#ffffff' }}>
                                {loading ? "Création en cours..." : "Confirmer et Payer"}
                            </Text>
                            {!loading && <ArrowRight size={20} color="white" />}
                        </View>
                    </AnimatedPressable>
                </View>
            </View>
        </SafeAreaView>
    );
}
