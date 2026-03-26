import { useRouter } from "expo-router";
import { ArrowRight, ChevronLeft, Clock, Zap } from "lucide-react-native";
import { useState } from "react";
import { ScrollView, Switch, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AnimatedPressable } from "../../components/AnimatedPressable";
import { SenderGradient } from "../../components/SenderGradient";
import { useTransfer } from "../../contexts/TransferContext";

export default function ConfirmationAmountScreen() {
    const router = useRouter();
    const { state, setDeliverySpeed, setInputValue, getCalculatedXOF, getCalculatedEUR, getTotalXOF } = useTransfer();

    const [includeFees, setIncludeFees] = useState(false);
    const [originalInput] = useState(state.inputValue);

    const numericAmount = parseInt(getCalculatedXOF(), 10) || 0;
    const euroAmount = getCalculatedEUR() || "0.00";
    const isLoading = state.isQuoting;

    const handleToggleIncludeFees = (value: boolean) => {
        setIncludeFees(value);
        if (value && state.quote) {
            // Calculer la base ajustée pour que totalToPayCfa = montant original tapé
            const ratio = state.quote.baseAmountCfa / state.quote.totalToPayCfa;
            const adjustedBase = Math.round(numericAmount * ratio);
            setInputValue(adjustedBase.toString());
        } else {
            setInputValue(originalInput);
        }
    };

    const handleConfirm = () => {
        router.push("/sender-home/recipient-search");
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#14533d' }}>
            <SenderGradient heightRatio={0.48} />

            {/* Header */}
            <View style={{
                position: 'relative', paddingHorizontal: 28, paddingVertical: 20,
                flexDirection: 'row', alignItems: 'center', justifyContent: 'center', zIndex: 1,
            }}>
                <TouchableOpacity
                    onPress={() => { if (includeFees) setInputValue(originalInput); router.back(); }}
                    style={{
                        position: 'absolute', left: 28,
                        height: 44, width: 44, alignItems: 'center', justifyContent: 'center',
                        borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.12)',
                        borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
                    }}
                >
                    <ChevronLeft size={24} color="#ffffff" />
                </TouchableOpacity>
                <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 20, color: '#ffffff' }}>
                    Confirmation
                </Text>
            </View>

            <ScrollView
                contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 28, paddingBottom: 20 }}
                showsVerticalScrollIndicator={false}
            >
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>

                    {/* Amount display */}
                    <View style={{ zIndex: 1, alignItems: 'center', marginBottom: 4, marginTop: 4 }}>
                        <Text style={{
                            fontFamily: 'Outfit_400Regular', fontSize: 13, color: 'rgba(255,255,255,0.55)',
                            textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12,
                        }}>
                            {includeFees ? 'Montant reçu (net)' : 'Montant à envoyer'}
                        </Text>

                        <View style={{ alignItems: 'center' }}>
                            <Text style={{
                                fontFamily: 'Outfit_900Black', fontSize: 48, letterSpacing: -1,
                                color: '#F59E0B', lineHeight: 52, textAlign: 'center',
                                opacity: isLoading ? 0.45 : 1,
                            }}>
                                {isLoading ? "..." : Number(numericAmount || 0).toLocaleString('fr-FR')}
                            </Text>
                            <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 18, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
                                FCFA
                            </Text>
                        </View>

                        <View style={{
                            marginTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                            backgroundColor: 'rgba(255,255,255,0.1)', paddingVertical: 6, paddingHorizontal: 18,
                            borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
                        }}>
                            <Text style={{ fontFamily: 'Outfit_600SemiBold', fontSize: 14, color: 'rgba(255,255,255,0.65)' }}>
                                ≈ {isLoading ? "..." : euroAmount} €
                            </Text>
                        </View>
                    </View>

                    {/* Toggle — inclure les frais dans le montant */}
                    <TouchableOpacity
                        onPress={() => handleToggleIncludeFees(!includeFees)}
                        activeOpacity={0.8}
                        style={{
                            marginTop: 16, width: '100%',
                            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                            backgroundColor: includeFees ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.06)',
                            borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12,
                            borderWidth: 1,
                            borderColor: includeFees ? 'rgba(16,185,129,0.35)' : 'rgba(255,255,255,0.1)',
                        }}
                    >
                        <View style={{ flex: 1, marginRight: 12 }}>
                            <Text style={{
                                fontFamily: 'Outfit_600SemiBold', fontSize: 14,
                                color: includeFees ? '#10B981' : 'rgba(255,255,255,0.8)',
                            }}>
                                Inclure les frais dans le montant
                            </Text>
                            <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                                {includeFees
                                    ? `Total à payer : ${Number(getTotalXOF() || 0).toLocaleString('fr-FR')} FCFA`
                                    : 'Les frais s\'ajouteront au montant saisi'}
                            </Text>
                        </View>
                        <Switch
                            value={includeFees}
                            onValueChange={handleToggleIncludeFees}
                            trackColor={{ false: 'rgba(255,255,255,0.15)', true: '#10B981' }}
                            thumbColor={includeFees ? '#ffffff' : 'rgba(255,255,255,0.7)'}
                            ios_backgroundColor="rgba(255,255,255,0.15)"
                        />
                    </TouchableOpacity>

                    {/* Vitesse de transfert */}
                    <View style={{ marginTop: 16, width: '100%', gap: 8 }}>
                        <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 14, color: 'rgba(255,255,255,0.7)', paddingHorizontal: 4, marginBottom: 4 }}>
                            Vitesse de transfert
                        </Text>

                        <TouchableOpacity
                            onPress={() => setDeliverySpeed('INSTANT')}
                            style={{
                                flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                                padding: 14, borderRadius: 20, borderWidth: 2,
                                backgroundColor: state.deliverySpeed === 'INSTANT' ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.06)',
                                borderColor: state.deliverySpeed === 'INSTANT' ? '#F59E0B' : 'rgba(255,255,255,0.12)',
                            }}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                                <View style={{
                                    padding: 12, borderRadius: 16,
                                    backgroundColor: state.deliverySpeed === 'INSTANT' ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.08)',
                                }}>
                                    <Zap size={20} color={state.deliverySpeed === 'INSTANT' ? '#F59E0B' : 'rgba(255,255,255,0.45)'} />
                                </View>
                                <View>
                                    <Text style={{
                                        fontFamily: 'Outfit_700Bold', fontSize: 16,
                                        color: state.deliverySpeed === 'INSTANT' ? '#F59E0B' : '#ffffff',
                                    }}>Instantané</Text>
                                    <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>Arrive en ~30 secondes</Text>
                                </View>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => setDeliverySpeed('STANDARD')}
                            style={{
                                flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                                padding: 14, borderRadius: 20, borderWidth: 2,
                                backgroundColor: state.deliverySpeed === 'STANDARD' ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.06)',
                                borderColor: state.deliverySpeed === 'STANDARD' ? '#F59E0B' : 'rgba(255,255,255,0.12)',
                            }}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                                <View style={{
                                    padding: 12, borderRadius: 16,
                                    backgroundColor: state.deliverySpeed === 'STANDARD' ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.08)',
                                }}>
                                    <Clock size={20} color={state.deliverySpeed === 'STANDARD' ? '#F59E0B' : 'rgba(255,255,255,0.45)'} />
                                </View>
                                <View>
                                    <Text style={{
                                        fontFamily: 'Outfit_700Bold', fontSize: 16,
                                        color: state.deliverySpeed === 'STANDARD' ? '#F59E0B' : '#ffffff',
                                    }}>Standard</Text>
                                    <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>Livré sous 1 à 3 jours</Text>
                                </View>
                            </View>
                            <Text style={{
                                fontFamily: 'Outfit_700Bold', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1,
                                color: state.deliverySpeed === 'STANDARD' ? '#F59E0B' : 'rgba(255,255,255,0.35)',
                            }}>Moins cher</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Fees breakdown card */}
                    <View style={{
                        marginTop: 14, width: '100%',
                        backgroundColor: 'rgba(255,255,255,0.07)',
                        borderRadius: 20, padding: 16,
                        borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
                    }}>
                        {/* Frais de service fixes (petits montants < 30k CFA) */}
                        {!isLoading && (state.quote?.fixedFeesCfa ?? 0) > 0 && (
                            <View style={{
                                flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                                backgroundColor: 'rgba(245,158,11,0.12)', borderRadius: 12,
                                paddingHorizontal: 12, paddingVertical: 8, marginBottom: 12,
                                borderWidth: 1, borderColor: 'rgba(245,158,11,0.25)',
                            }}>
                                <View style={{ flex: 1, marginRight: 8 }}>
                                    <Text style={{ fontFamily: 'Outfit_600SemiBold', fontSize: 13, color: '#F59E0B' }}>Frais de service</Text>
                                    <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>
                                        Appliqués aux petits montants pour couvrir les frais bancaires fixes
                                    </Text>
                                </View>
                                <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 14, color: '#F59E0B' }}>
                                    +{Number(state.quote?.fixedFeesCfa || 0).toLocaleString('fr-FR')} FCFA
                                </Text>
                            </View>
                        )}

                        {[
                            { label: 'Montant net envoyé', value: `${Number(state.quote?.baseAmountCfa || 0).toLocaleString('fr-FR')} FCFA` },
                            { label: 'Frais réseau partenaires', value: `${Number(state.quote?.partnerFeesCfa || 0).toLocaleString('fr-FR')} FCFA` },
                            { label: 'Frais WURA', value: `${Number(state.quote?.wuraFeesCfa || 0).toLocaleString('fr-FR')} FCFA` },
                        ].map((row) => (
                            <View key={row.label} style={{
                                flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                                paddingBottom: 10, marginBottom: 10,
                                borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)',
                            }}>
                                <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 14, color: 'rgba(255,255,255,0.55)' }}>{row.label}</Text>
                                <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 14, color: '#ffffff' }}>
                                    {isLoading ? "..." : row.value}
                                </Text>
                            </View>
                        ))}

                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text style={{ fontFamily: 'Outfit_600SemiBold', fontSize: 14, color: 'rgba(255,255,255,0.55)' }}>Total à payer</Text>
                            <Text style={{ fontFamily: 'Outfit_900Black', fontSize: 18, color: '#F59E0B' }}>
                                {isLoading ? "..." : `${Number(getTotalXOF() || 0).toLocaleString('fr-FR')} FCFA`}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Bottom Action */}
                <View style={{ marginTop: 'auto', paddingTop: 12, marginBottom: 12 }}>
                    <AnimatedPressable
                        onPress={handleConfirm}
                        style={{
                            width: '100%', backgroundColor: '#064E3B', paddingVertical: 18,
                            borderRadius: 999, alignItems: 'center', justifyContent: 'center',
                            shadowColor: '#00F5A0', shadowOffset: { width: 0, height: 8 },
                            shadowOpacity: 0.35, shadowRadius: 24, elevation: 10,
                        }}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                            <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 20, color: '#ffffff' }}>Confirmer le montant</Text>
                            <ArrowRight size={22} color="white" />
                        </View>
                    </AnimatedPressable>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}
