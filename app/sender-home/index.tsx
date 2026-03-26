import { useRouter } from "expo-router";
import { ArrowRight, ArrowUpDown, ChevronDown, Plus } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Dimensions, Keyboard, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AnimatedPressable } from "../../components/AnimatedPressable";
import { CountrySelector, WESTERN_COUNTRIES } from "../../components/CountrySelector";
import { FadeInView } from "../../components/FadeInView";
import { SenderGradient } from "../../components/SenderGradient";
import { useTransfer } from "../../contexts/TransferContext";
import { deleteSecureData, getSecureData } from "../../lib/storage";
import { TransferService } from "../../services/transfers";

interface RecentBeneficiary {
    id: string;
    name: string;
    initial: string;
    wuraId: string;
}

export default function SenderHomeScreen() {
    const router = useRouter();
    const { state: transferState, setInputValue, toggleCurrency, getCalculatedXOF, getCalculatedEUR, setRecipient } = useTransfer();
    const [recentBeneficiaries, setRecentBeneficiaries] = useState<RecentBeneficiary[]>([]);
    const bottomCardY = useRef(new Animated.Value(0)).current;
    const insets = useSafeAreaInsets();
    const windowHeight = Dimensions.get('window').height;

    const fetchRecentBeneficiaries = useCallback(async () => {
        try {
            const transactions = await TransferService.getHistory();
            const seen = new Map<string, RecentBeneficiary>();

            transactions.forEach((tx: any) => {
                const id = tx.receiver?.wuraId || tx.receiverId || "unknown";
                if (!seen.has(id)) {
                    const wuraId = tx.receiver?.wuraId || "";
                    const displayName = wuraId || "Bénéficiaire";
                    seen.set(id, {
                        id,
                        name: displayName,
                        initial: displayName.replace("@", "").charAt(0).toUpperCase() || "?",
                        wuraId,
                    });
                }
            });

            setRecentBeneficiaries(Array.from(seen.values()).slice(0, 6));
        } catch {
            // Silently fail — beneficiaries are not critical
        }
    }, []);

    useEffect(() => {
        if (!transferState.inputValue) {
            setInputValue("50000");
        }

        const cleanupPendingPayment = async () => {
            const pendingTx = await getSecureData('pendingKkiapayTx');
            if (pendingTx) {
                console.log("[SenderHome] Cleaning stale pendingKkiapayTx:", pendingTx);
                await deleteSecureData('pendingKkiapayTx');
                await deleteSecureData('pendingKkiapayCountry');
            }
        };
        cleanupPendingPayment();
        fetchRecentBeneficiaries();
    }, []);

    // Faire glisser la carte blanche hors écran quand le clavier s'ouvre
    useEffect(() => {
        const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
        const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
        const show = Keyboard.addListener(showEvent, () => {
            Animated.timing(bottomCardY, { toValue: 400, duration: 150, useNativeDriver: true }).start();
        });
        const hide = Keyboard.addListener(hideEvent, () => {
            Animated.timing(bottomCardY, { toValue: 0, duration: 250, useNativeDriver: true }).start();
        });
        return () => { show.remove(); hide.remove(); };
    }, []);

    const MAX_XOF = 300_000;
    const amount = transferState.inputValue;
    const isXofInput = transferState.inputCurrency === 'XOF';
    const numericAmount = parseFloat(amount.replace(/,/g, '.').replace(/\s/g, '')) || 0;
    const isOverLimit = isXofInput ? numericAmount > MAX_XOF : numericAmount > MAX_XOF / 655.96;
    const [isCountryModalVisible, setIsCountryModalVisible] = useState(false);
    const [selectedCountry, setSelectedCountry] = useState(WESTERN_COUNTRIES[0]);

    // Colors for beneficiary circles
    const COLORS = [
        { bg: "bg-amber-100", text: "text-amber-600" },
        { bg: "bg-purple-100", text: "text-purple-600" },
        { bg: "bg-emerald-100", text: "text-emerald-600" },
        { bg: "bg-blue-100", text: "text-blue-600" },
        { bg: "bg-rose-100", text: "text-rose-600" },
        { bg: "bg-orange-100", text: "text-orange-600" },
    ];

    // Pulsing glow for profile avatar
    const glowAnim = useRef(new Animated.Value(0.15)).current;
    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(glowAnim, { toValue: 0.4, duration: 1800, useNativeDriver: false }),
                Animated.timing(glowAnim, { toValue: 0.15, duration: 1800, useNativeDriver: false }),
            ])
        ).start();
    }, []);

    return (
        <View style={{ flex: 1, backgroundColor: '#14533d' }}>
            {/* Conteneur fixe plein écran — iOS ne peut pas le redimensionner */}
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: windowHeight, backgroundColor: '#14533d' }}>
                {/* Gradient animé — atmosphère sender sur toute la partie haute */}
                <SenderGradient heightRatio={0.58} />

                {/* Avatar */}
                <FadeInView delay={0} style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 24, paddingTop: insets.top + 12, zIndex: 1 }}>
                    <AnimatedPressable onPress={() => router.push("/sender-home/profil")}>
                        <Animated.View style={{
                            width: 48, height: 48, borderRadius: 24,
                            backgroundColor: 'rgba(245,158,11,0.18)',
                            alignItems: 'center', justifyContent: 'center',
                            borderWidth: 2, borderColor: 'rgba(245,158,11,0.4)',
                            shadowColor: '#F59E0B', shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: glowAnim, shadowRadius: 14, elevation: 4,
                        }}>
                            <Text style={{ fontSize: 18, fontFamily: 'Outfit_700Bold', color: '#F59E0B' }}>
                                {(transferState as any)?.senderName?.charAt(0)?.toUpperCase() || "W"}
                            </Text>
                        </Animated.View>
                    </AnimatedPressable>
                </FadeInView>

                {/* Country Selector */}
                <FadeInView delay={100} style={{ alignItems: 'center', paddingHorizontal: 28, marginTop: 12, zIndex: 1 }}>
                    <Text style={{
                        fontSize: 11, fontFamily: 'Outfit_600SemiBold', color: 'rgba(255,255,255,0.5)',
                        textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12, textAlign: 'center',
                    }}>
                        Pays du bénéficiaire
                    </Text>
                    <View style={{ width: '100%', maxWidth: 360 }}>
                        <TouchableOpacity
                            onPress={() => setIsCountryModalVisible(true)}
                            style={{
                                width: '100%',
                                backgroundColor: 'rgba(255,255,255,0.1)',
                                borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
                                borderRadius: 24, paddingHorizontal: 24, paddingVertical: 18,
                                flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                                shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.25, shadowRadius: 12, elevation: 4,
                            }}
                            activeOpacity={0.8}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                                <View style={{ width: 32, height: 22, borderRadius: 4, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', flexDirection: 'row' }}>
                                    {selectedCountry.flag}
                                </View>
                                <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 17, color: '#ffffff' }}>
                                    {selectedCountry.name}
                                </Text>
                            </View>
                            <ChevronDown size={22} color="rgba(255,255,255,0.55)" />
                        </TouchableOpacity>
                    </View>
                </FadeInView>

                {/* Amount Input — hauteur fixe, reste visible quand le clavier s'ouvre */}
                <FadeInView delay={200} style={{ height: 220, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, marginTop: 16, zIndex: 1 }}>
                    <View style={{ alignItems: 'center', width: '100%', maxWidth: 360 }}>
                        <TextInput
                            value={amount}
                            onChangeText={(text) => {
                                const cleaned = text.replace(/[^0-9.,]/g, '');
                                setInputValue(cleaned);
                            }}
                            keyboardType="decimal-pad"
                            style={{
                                fontSize: 60, fontFamily: 'Outfit_900Black',
                                letterSpacing: -2, color: isOverLimit ? '#F87171' : '#ffffff',
                                textAlign: 'center', backgroundColor: 'transparent',
                                padding: 0, width: '100%',
                            }}
                            placeholder="0"
                            placeholderTextColor="rgba(255,255,255,0.3)"
                            selectionColor="#F59E0B"
                        />

                        {/* Currency label */}
                        <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 20, color: isOverLimit ? '#F87171' : 'rgba(255,255,255,0.35)', marginTop: 4 }}>
                            {isXofInput ? 'FCFA' : '€'}
                        </Text>

                        {/* Limit warning */}
                        {isOverLimit && (
                            <Text style={{ fontFamily: 'Outfit_600SemiBold', fontSize: 12, color: '#F87171', marginTop: 6, textAlign: 'center' }}>
                                Limite KYC : 300 000 FCFA par transaction
                            </Text>
                        )}

                        {/* Currency toggle */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 16 }}>
                            <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.12)' }} />
                            <TouchableOpacity
                                onPress={toggleCurrency}
                                style={{
                                    backgroundColor: 'rgba(255,255,255,0.1)', padding: 12, borderRadius: 16,
                                    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
                                }}
                            >
                                <ArrowUpDown size={22} color="#F59E0B" />
                            </TouchableOpacity>
                            <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.12)' }} />
                        </View>

                        {/* Equivalent amount */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 12 }}>
                            <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 22, color: '#F59E0B' }}>
                                ≈ {isXofInput ? getCalculatedEUR() : getCalculatedXOF()} {isXofInput ? '€' : 'FCFA'}
                            </Text>
                        </View>
                    </View>
                </FadeInView>

                {/* Bottom Section — carte blanche, glisse hors écran quand le clavier s'ouvre */}
                <Animated.View style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    backgroundColor: '#ffffff', zIndex: 20,
                    borderTopLeftRadius: 32, borderTopRightRadius: 32,
                    paddingBottom: 36, paddingTop: 8,
                    shadowColor: '#000', shadowOffset: { width: 0, height: -8 },
                    shadowOpacity: 0.12, shadowRadius: 24, elevation: 20,
                    transform: [{ translateY: bottomCardY }],
                }}>
                    <View style={{ width: '100%', paddingHorizontal: 28, marginBottom: 24, marginTop: 16 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 16, color: '#1a1a2e' }}>Récents</Text>
                            <TouchableOpacity onPress={() => router.push("/sender-home/beneficiaires")}>
                                <Text style={{ fontFamily: 'Outfit_600SemiBold', fontSize: 14, color: '#064E3B' }}>Voir tout</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 20, paddingHorizontal: 0 }}>
                            {/* New Button */}
                            <View style={{ alignItems: 'center', gap: 10, width: 68 }}>
                                <TouchableOpacity
                                    onPress={() => router.push("/sender-home/add-beneficiary")}
                                    style={{
                                        width: 60, height: 60, borderRadius: 30,
                                        borderWidth: 2, borderStyle: 'dashed',
                                        borderColor: '#d1d5db', alignItems: 'center', justifyContent: 'center',
                                    }}
                                >
                                    <Plus size={26} color="#a8a29e" />
                                </TouchableOpacity>
                                <Text style={{ fontFamily: 'Outfit_600SemiBold', fontSize: 12, color: '#6b7280', textAlign: 'center' }} numberOfLines={1}>Nouveau</Text>
                            </View>

                            {/* Recents List */}
                            {recentBeneficiaries.length === 0 ? (
                                <View style={{ alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, paddingVertical: 8 }}>
                                    <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 12, color: '#9ca3af', fontStyle: 'italic' }}>
                                        Vos bénéficiaires récents apparaîtront ici
                                    </Text>
                                </View>
                            ) : (
                                recentBeneficiaries.map((contact, idx) => {
                                    const colorSet = COLORS[idx % COLORS.length];
                                    return (
                                        <TouchableOpacity key={contact.id} onPress={() => {
                                            setRecipient({ id: contact.id, wuraId: contact.wuraId, nom: '', prenom: contact.name.replace('@', ''), iban: '', bic: '', banque: '', pays: '' });
                                            router.push('/sender-home/confirmation-beneficiary');
                                        }} style={{ alignItems: 'center', gap: 10, width: 68 }}>
                                            <View className={`w-[60px] h-[60px] rounded-full items-center justify-center ${colorSet.bg}`}>
                                                <Text className={`font-bold text-xl ${colorSet.text}`}>{contact.initial}</Text>
                                            </View>
                                            <Text style={{ fontFamily: 'Outfit_600SemiBold', fontSize: 12, color: '#4b5563', textAlign: 'center' }} numberOfLines={1}>
                                                {contact.name}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })
                            )}
                        </ScrollView>
                    </View>

                    <View style={{ paddingHorizontal: 28, paddingTop: 4 }}>
                        <AnimatedPressable
                            onPress={() => !isOverLimit && router.push("/sender-home/confirmation-amount")}
                            style={{
                                width: '100%', backgroundColor: '#064E3B', paddingVertical: 20,
                                borderRadius: 999, alignItems: 'center', justifyContent: 'center',
                                shadowColor: '#00F5A0', shadowOffset: { width: 0, height: 8 },
                                shadowOpacity: 0.35, shadowRadius: 24, elevation: 10,
                            }}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 20, color: '#ffffff' }}>Transférer</Text>
                                <ArrowRight size={22} color="white" />
                            </View>
                        </AnimatedPressable>
                    </View>
                </Animated.View>

                <CountrySelector
                    visible={isCountryModalVisible}
                    onClose={() => setIsCountryModalVisible(false)}
                    onSelect={setSelectedCountry}
                    selectedCode={selectedCountry.code}
                />
            </View>
        </View>
    );
}
