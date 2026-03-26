import { useRouter } from "expo-router";
import { ArrowRight, ChevronLeft, Link, MoreHorizontal, ShieldCheck, User } from "lucide-react-native";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AnimatedPressable } from "../../components/AnimatedPressable";
import { SenderGradient } from "../../components/SenderGradient";
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
        <SafeAreaView style={{ flex: 1, backgroundColor: '#14533d' }}>
            {/* Gradient animé — identité sender */}
            <SenderGradient heightRatio={0.45} />

            <View style={{ flex: 1, zIndex: 1 }}>
                {/* Navigation Header */}
                <View style={{
                    paddingHorizontal: 24, paddingVertical: 8,
                    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                }}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={{
                            padding: 8, marginLeft: -8, borderRadius: 999,
                            backgroundColor: 'rgba(255,255,255,0.1)',
                        }}
                    >
                        <ChevronLeft size={24} color="#ffffff" />
                    </TouchableOpacity>
                    <Text style={{ fontFamily: 'Outfit_600SemiBold', fontSize: 12, color: '#F59E0B', textTransform: 'uppercase', letterSpacing: 2 }}>
                        Nouvel Envoi
                    </Text>
                    <TouchableOpacity style={{ padding: 8, marginRight: -8, borderRadius: 999 }}>
                        <MoreHorizontal size={24} color="rgba(255,255,255,0.5)" />
                    </TouchableOpacity>
                </View>

                <ScrollView
                    contentContainerStyle={{ paddingHorizontal: 28, paddingVertical: 16, flexGrow: 1 }}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Hero Header — sur le gradient */}
                    <View style={{ marginBottom: 24, alignItems: 'center' }}>
                        <View style={{
                            alignItems: 'center', justifyContent: 'center',
                            width: 56, height: 56, borderRadius: 18,
                            backgroundColor: 'rgba(245,158,11,0.15)',
                            marginBottom: 16,
                            shadowColor: '#F59E0B', shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.25, shadowRadius: 12, elevation: 5,
                            borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)',
                        }}>
                            <ShieldCheck size={28} color="#F59E0B" />
                        </View>
                        <Text style={{ fontFamily: 'Outfit_900Black', fontSize: 26, color: '#F59E0B', marginBottom: 8, textAlign: 'center', letterSpacing: -0.5 }}>
                            Récapitulatif
                        </Text>
                        <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 13, color: 'rgba(255,255,255,0.5)', maxWidth: 260, textAlign: 'center', lineHeight: 20 }}>
                            Vérifiez le nom du bénéficiaire avant de confirmer l'envoi.
                        </Text>
                    </View>

                    {/* Beneficiary Details Card — carte blanche sur gradient */}
                    <View style={{
                        backgroundColor: '#ffffff', borderRadius: 24,
                        overflow: 'hidden', marginBottom: 16,
                        shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
                        shadowOpacity: 0.2, shadowRadius: 24, elevation: 10,
                    }}>
                        {/* Card header */}
                        <View style={{
                            paddingHorizontal: 20, paddingVertical: 16,
                            borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
                            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                            backgroundColor: '#fafaf8',
                        }}>
                            <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 11, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1.5 }}>
                                Bénéficiaire
                            </Text>
                            <TouchableOpacity onPress={() => router.back()}>
                                <Text style={{ fontFamily: 'Outfit_600SemiBold', fontSize: 13, color: '#064E3B' }}>Modifier</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Row: Name */}
                        <View style={{
                            flexDirection: 'row', alignItems: 'center',
                            paddingHorizontal: 20, paddingVertical: 18,
                        }}>
                            <View style={{
                                width: 44, height: 44, borderRadius: 16,
                                backgroundColor: 'rgba(6,78,59,0.08)',
                                alignItems: 'center', justifyContent: 'center', marginRight: 16,
                            }}>
                                <User size={20} color="#064E3B" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>
                                    Nom du bénéficiaire
                                </Text>
                                <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 15, color: '#1a1a2e' }} numberOfLines={1}>
                                    {fullName}
                                </Text>
                            </View>
                        </View>

                        {/* Row: Retrait info */}
                        <View style={{
                            flexDirection: 'row', alignItems: 'center',
                            paddingHorizontal: 20, paddingVertical: 18,
                            borderTopWidth: 1, borderTopColor: '#f3f4f6',
                        }}>
                            <View style={{
                                width: 44, height: 44, borderRadius: 16,
                                backgroundColor: 'rgba(245,158,11,0.1)',
                                alignItems: 'center', justifyContent: 'center', marginRight: 16,
                            }}>
                                <Link size={20} color="#F59E0B" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>
                                    Retrait
                                </Text>
                                {recipient.isNew ? (
                                    <>
                                        <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 14, color: '#1a1a2e' }}>
                                            Lien de retrait généré après paiement
                                        </Text>
                                        <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
                                            Votre bénéficiaire entrera son IBAN depuis le lien
                                        </Text>
                                    </>
                                ) : (
                                    <>
                                        <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 14, color: '#1a1a2e' }}>
                                            Retrait via l'application Wura
                                        </Text>
                                        <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
                                            Le bénéficiaire pourra retirer ses fonds depuis son application Wura
                                        </Text>
                                    </>
                                )}
                            </View>
                        </View>
                    </View>

                    {/* Bottom Actions */}
                    <View style={{ marginTop: 'auto', paddingTop: 8, paddingBottom: 16 }}>
                        <AnimatedPressable
                            onPress={handleConfirm}
                            style={{
                                width: '100%', backgroundColor: '#064E3B', paddingVertical: 20,
                                borderRadius: 999, alignItems: 'center', justifyContent: 'center',
                                shadowColor: '#00F5A0', shadowOffset: { width: 0, height: 8 },
                                shadowOpacity: 0.35, shadowRadius: 24, elevation: 10,
                            }}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 18, color: '#ffffff' }}>
                                    Confirmer et choisir le montant
                                </Text>
                                <ArrowRight size={20} color="white" />
                            </View>
                        </AnimatedPressable>

                        <TouchableOpacity
                            onPress={() => router.back()}
                            style={{ width: '100%', marginTop: 12, paddingVertical: 8, alignItems: 'center' }}
                        >
                            <Text style={{ fontFamily: 'Outfit_600SemiBold', fontSize: 14, color: 'rgba(255,255,255,0.45)' }}>
                                Annuler l'opération
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>

                {/* Bottom indicator */}
                <View style={{ alignItems: 'center', paddingBottom: 8 }}>
                    <View style={{ height: 4, width: 100, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 2 }} />
                </View>
            </View>
        </SafeAreaView>
    );
}
