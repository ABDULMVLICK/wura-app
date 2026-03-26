import { useRouter } from "expo-router";
import { ArrowLeft, Building2, CreditCard, Plus } from "lucide-react-native";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BottomTabBar } from "../../components/BottomTabBar";

export default function PaiementScreen() {
    const router = useRouter();

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#14533d' }}>
            <View style={{ flex: 1 }}>
                {/* Header */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16 }}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' }}
                        activeOpacity={0.7}
                    >
                        <ArrowLeft size={20} color="#ffffff" />
                    </TouchableOpacity>
                    <View style={{ alignItems: 'center' }}>
                        <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 17, color: '#ffffff' }}>Moyens de paiement</Text>
                        <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>Comptes bancaires enregistrés</Text>
                    </View>
                    <View style={{ width: 42 }} />
                </View>

                <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>

                    {/* Carte IBAN illustrative */}
                    <View style={{
                        backgroundColor: '#064E3B', borderRadius: 24, padding: 24, marginBottom: 20,
                        shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 8,
                    }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
                            <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(245,158,11,0.2)', alignItems: 'center', justifyContent: 'center' }}>
                                <Building2 size={22} color="#F59E0B" />
                            </View>
                            <CreditCard size={28} color="rgba(255,255,255,0.3)" />
                        </View>
                        <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>Banque principale</Text>
                        <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 18, color: '#ffffff', letterSpacing: 2 }}>FR76 •••• •••• •••• 4321</Text>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 24 }}>
                            <View>
                                <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Titulaire</Text>
                                <Text style={{ fontFamily: 'Outfit_600SemiBold', fontSize: 13, color: '#ffffff', marginTop: 2 }}>Votre Nom</Text>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                                <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Statut</Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 }}>
                                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' }} />
                                    <Text style={{ fontFamily: 'Outfit_600SemiBold', fontSize: 13, color: '#10B981' }}>Vérifié</Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Section */}
                    <Text style={{ fontFamily: 'Outfit_600SemiBold', fontSize: 12, color: 'rgba(255,255,255,0.45)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10, paddingLeft: 4 }}>
                        Virement entrant
                    </Text>
                    <View style={{ backgroundColor: '#ffffff', borderRadius: 24, overflow: 'hidden', marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 4 }}>
                        <View style={{ paddingHorizontal: 18, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
                            <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 12, color: '#9CA3AF', marginBottom: 4 }}>IBAN</Text>
                            <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 14, color: '#111827' }}>FR76 3000 6000 0112 3456 7890 189</Text>
                        </View>
                        <View style={{ paddingHorizontal: 18, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
                            <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 12, color: '#9CA3AF', marginBottom: 4 }}>BIC / SWIFT</Text>
                            <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 14, color: '#111827' }}>BNPAFRPPXXX</Text>
                        </View>
                        <View style={{ paddingHorizontal: 18, paddingVertical: 16 }}>
                            <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 12, color: '#9CA3AF', marginBottom: 4 }}>Banque</Text>
                            <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 14, color: '#111827' }}>BNP Paribas — Paris, France</Text>
                        </View>
                    </View>

                    {/* Ajouter */}
                    <TouchableOpacity
                        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20, paddingVertical: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', borderStyle: 'dashed' }}
                        activeOpacity={0.7}
                    >
                        <Plus size={18} color="rgba(255,255,255,0.7)" />
                        <Text style={{ fontFamily: 'Outfit_600SemiBold', fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>Ajouter un compte bancaire</Text>
                    </TouchableOpacity>
                </ScrollView>

                <BottomTabBar />
            </View>
        </SafeAreaView>
    );
}
