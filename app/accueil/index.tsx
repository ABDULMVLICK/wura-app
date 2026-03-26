import { useRouter } from "expo-router";
import { Bell, QrCode, User } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { Animated, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AnimatedPressable } from "../../components/AnimatedPressable";
import { BottomTabBar } from "../../components/BottomTabBar";
import { FadeInView } from "../../components/FadeInView";
import { TransakOffRamp } from "../../components/TransakOffRamp";
import { useAuth } from "../../contexts/AuthContext";
import { useReceiver } from "../../contexts/ReceiverContext";

// Statuts qui signifient que le retrait a déjà été traité côté backend
const WITHDRAWN_STATUSES = new Set(['COMPLETED', 'OFFRAMP_PROCESSING', 'REFUNDED']);

export default function HomeScreen() {
    const router = useRouter();
    const { state, markWithdrawn } = useReceiver();
    const { profile } = useAuth();

    const [selectedTxId, setSelectedTxId] = useState<string | null>(null);
    const [transakVisible, setTransakVisible] = useState(false);

    const balance = state.balanceEUR;

    // Transactions en attente de retrait
    const pendingTxs = state.recentTransactions.filter(
        tx => !WITHDRAWN_STATUSES.has(tx.status) && !state.withdrawnTxIds.includes(tx.id)
    );

    // Ouvrir le widget Transak avec la bonne méthode selon routingStrategy
    const openWithdrawal = (txId: string) => {
        const tx = pendingTxs.find(t => t.id === txId);
        if (!tx) return;
        setSelectedTxId(txId);
        setTransakVisible(true);
    };

    const handleWithdrawalSuccess = () => {
        if (selectedTxId) markWithdrawn(selectedTxId);
        setSelectedTxId(null);
    };

    // Solde réel du wallet (source de vérité) — amountUsdtBridged par transaction
    // peut être une valeur de test irréaliste. En production les deux convergent de toute façon.
    const withdrawalUsdt = state.balanceUSDT;
    const withdrawalEur = state.balanceEUR;

    // Pulsing glow for balance card shadow
    const cardGlow = useRef(new Animated.Value(0.25)).current;
    // Gradient breathing overlay
    const gradientPulse = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(cardGlow, { toValue: 0.45, duration: 3500, useNativeDriver: false }),
                Animated.timing(cardGlow, { toValue: 0.2, duration: 3500, useNativeDriver: false }),
            ])
        ).start();

        Animated.loop(
            Animated.sequence([
                Animated.timing(gradientPulse, { toValue: 1, duration: 3500, useNativeDriver: true }),
                Animated.timing(gradientPulse, { toValue: 0, duration: 3500, useNativeDriver: true }),
            ])
        ).start();
    }, []);

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#14533d' }}>
            <View className="flex-1">
                <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
                    <View className="px-7 pt-8 pb-4">
                        {/* Header */}
                        <FadeInView delay={0} className="mb-10 flex-row items-center justify-between">
                            <View className="flex-row items-center gap-4">
                                <AnimatedPressable
                                    className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F59E0B]/15"
                                    style={{ shadowColor: '#F59E0B', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 3 }}
                                >
                                    <User size={22} className="text-foreground" color="#F59E0B" />
                                </AnimatedPressable>
                                <View>
                                    <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>Bonjour,</Text>
                                    <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 16, color: '#ffffff' }}>
                                        {profile?.sender?.firstName || profile?.prenom || 'Utilisateur'}
                                    </Text>
                                </View>
                            </View>
                            <AnimatedPressable className="relative flex h-12 w-12 items-center justify-center rounded-2xl"
                                style={{ backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 2 }}>
                                <Bell size={22} color="rgba(255,255,255,0.9)" />
                                <View className="absolute top-2.5 right-2.5 h-2.5 w-2.5 rounded-full bg-red-500" />
                            </AnimatedPressable>
                        </FadeInView>

                        <FadeInView delay={150}>
                            {/* Glow ambiant derrière la carte */}
                            <View style={{ position: 'absolute', width: 300, height: 200, borderRadius: 100, backgroundColor: 'rgba(245,158,11,0.1)', top: -24, alignSelf: 'center', zIndex: 0 }} pointerEvents="none" />
                            <View style={{ position: 'absolute', width: 220, height: 140, borderRadius: 70, backgroundColor: 'rgba(20,83,61,0.25)', top: 10, alignSelf: 'center', zIndex: 0 }} pointerEvents="none" />

                            {/* Carte solde — gradient simulé pur RN, effet Apple Card */}
                            <Animated.View
                                style={{
                                    position: 'relative', marginBottom: 40, overflow: 'hidden',
                                    borderRadius: 32, padding: 32,
                                    shadowColor: '#F59E0B',
                                    shadowOffset: { width: 0, height: 10 },
                                    shadowOpacity: cardGlow,
                                    shadowRadius: 32, elevation: 12, zIndex: 1,
                                    backgroundColor: '#111c18',
                                }}
                            >
                                {/* Couche vert primaire — zone centrale */}
                                <View pointerEvents="none" style={{
                                    position: 'absolute', top: '25%', left: 0, right: 0, bottom: 0,
                                    backgroundColor: '#111c18',
                                }} />

                                {/* Couche vert clair — coin bas-droit (simule diagonal) */}
                                <View pointerEvents="none" style={{
                                    position: 'absolute', bottom: -30, right: -30,
                                    width: 200, height: 200, borderRadius: 100,
                                    backgroundColor: '#111c18',
                                    opacity: 0.8,
                                }} />

                                {/* Overlay breathing — pulse vers vert plus vif */}
                                <Animated.View
                                    pointerEvents="none"
                                    style={{
                                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                                        backgroundColor: '#1a6648',
                                        opacity: gradientPulse.interpolate({ inputRange: [0, 1], outputRange: [0, 0.55] }),
                                    }}
                                />

                                {/* Shimmer blanc haut-droit — relief */}
                                <Animated.View
                                    pointerEvents="none"
                                    style={{
                                        position: 'absolute', top: -40, right: -40,
                                        width: 160, height: 160, borderRadius: 80,
                                        backgroundColor: 'rgba(255,255,255,0.07)',
                                        opacity: gradientPulse.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.9] }),
                                    }}
                                />

                                {/* Lueur ambrée bas-gauche — identité receiver */}
                                <View pointerEvents="none" style={{
                                    position: 'absolute', bottom: -40, left: -40,
                                    width: 160, height: 160, borderRadius: 80,
                                    backgroundColor: 'rgba(245,158,11,0.15)',
                                }} />

                                {/* Contenu de la carte */}
                                <View style={{ position: 'relative', zIndex: 10, alignItems: 'center' }}>
                                    <Text style={{
                                        fontFamily: 'Outfit_600SemiBold', fontSize: 13,
                                        color: 'rgba(255,255,255,0.65)',
                                        textTransform: 'uppercase', letterSpacing: 2,
                                        marginBottom: 16,
                                    }}>
                                        Solde disponible
                                    </Text>
                                    <Text style={{
                                        fontFamily: 'Outfit_900Black', fontSize: 58, letterSpacing: -2,
                                        color: '#ffffff', marginBottom: 20, lineHeight: 62,
                                    }}>
                                        {Number(balance || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €
                                    </Text>

                                    {/* WuraID Badge */}
                                    <View style={{
                                        flexDirection: 'row', alignItems: 'center', gap: 8,
                                        borderRadius: 999,
                                        backgroundColor: 'rgba(255,255,255,0.1)',
                                        borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
                                        paddingHorizontal: 16, paddingVertical: 6,
                                    }}>
                                        <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 14, color: '#F59E0B' }}>
                                            {profile?.receiver?.wuraId || profile?.wuraId || '@Wura'}
                                        </Text>
                                        <View style={{ height: 4, width: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.4)' }} />
                                        <QrCode size={14} color="rgba(255,255,255,0.8)" />
                                    </View>
                                </View>
                            </Animated.View>
                        </FadeInView>

                        {/* Transactions */}
                        <FadeInView delay={300} className="flex-1 flex-col mt-2">
                            <View className="mb-5 flex-row items-center justify-between">
                                <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 20, color: '#F59E0B' }}>Activité Récente</Text>
                                {state.recentTransactions.length > 0 && (
                                    <TouchableOpacity onPress={() => router.push("/historique")}>
                                        <Text style={{ fontFamily: 'Outfit_600SemiBold', fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>Voir tout</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                            <View className="flex-col gap-3">
                                {state.recentTransactions.length === 0 ? (
                                    <Text style={{ fontFamily: 'Outfit_400Regular', color: 'rgba(255,255,255,0.5)', textAlign: 'center', paddingVertical: 16 }}>Aucune transaction pour le moment.</Text>
                                ) : (
                                    state.recentTransactions.slice(0, 3).map((tx) => {
                                        const isPending = pendingTxs.some(p => p.id === tx.id);
                                        const isStandard = tx.routingStrategy === 'MT_PELERIN';
                                        return (
                                            <View
                                                key={tx.id}
                                                className="flex-row items-center justify-between rounded-3xl bg-card p-5"
                                                style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 1 }}
                                            >
                                                <View className="flex-col flex-1 mr-3">
                                                    <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 14, color: '#1a1a2e' }}>
                                                        {tx.senderName || "Utilisateur Wura"}
                                                    </Text>
                                                    <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 12, color: '#78716c', marginTop: 2 }}>
                                                        Reçu • {new Date(tx.date).toLocaleDateString('fr-FR')}
                                                        {isStandard ? ' · SEPA 1-3j' : ' · SEPA Instant'}
                                                    </Text>
                                                </View>
                                                <View className="flex-row items-center gap-3">
                                                    <Text className="text-sm font-bold text-emerald-600">
                                                        + {Number(tx.amountEUR || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €
                                                    </Text>
                                                    {isPending && (
                                                        <AnimatedPressable
                                                            onPress={() => openWithdrawal(tx.id)}
                                                            className="rounded-2xl bg-primary px-4 py-2"
                                                            style={{ shadowColor: '#00F5A0', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 3 }}
                                                        >
                                                            <Text className="text-xs font-bold text-white">Retirer</Text>
                                                        </AnimatedPressable>
                                                    )}
                                                    {!isPending && (
                                                        <View className="rounded-2xl bg-emerald-100 px-4 py-2">
                                                            <Text className="text-xs font-semibold text-emerald-700">Retiré</Text>
                                                        </View>
                                                    )}
                                                </View>
                                            </View>
                                        );
                                    })
                                )}
                            </View>
                        </FadeInView>
                    </View>
                </ScrollView>

                <BottomTabBar />
            </View>

            {/* Widget Transak — méthode de paiement auto-sélectionnée par Transak en staging */}
            <TransakOffRamp
                visible={transakVisible}
                onClose={() => setTransakVisible(false)}
                onSuccess={handleWithdrawalSuccess}
                balanceEUR={withdrawalEur}
                balanceUSDT={withdrawalUsdt}
                txId={selectedTxId ?? undefined}
            />
        </SafeAreaView>
    );
}
