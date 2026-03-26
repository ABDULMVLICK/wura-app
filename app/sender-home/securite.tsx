import { useRouter } from "expo-router";
import { AlertTriangle, ArrowLeft, ChevronRight, Eye, Fingerprint, Key, Lock, LogOut, Smartphone } from "lucide-react-native";
import { useState } from "react";
import { Alert, ScrollView, Switch, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SenderSecuriteScreen() {
    const router = useRouter();
    const [biometric, setBiometric] = useState(true);
    const [twoFactor, setTwoFactor] = useState(false);

    const handleDeleteAccount = () => {
        Alert.alert(
            "Supprimer le compte",
            "Cette action est irréversible. Toutes vos données et transactions seront définitivement supprimées.",
            [
                { text: "Annuler", style: "cancel" },
                { text: "Supprimer", style: "destructive", onPress: () => {} },
            ]
        );
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#14533d' }}>
            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16 }}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' }}
                    activeOpacity={0.7}
                >
                    <ArrowLeft size={20} color="#ffffff" />
                </TouchableOpacity>
                <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 17, color: '#ffffff' }}>Sécurité</Text>
                <View style={{ width: 42 }} />
            </View>

            <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

                {/* Connexion */}
                <Text style={{ fontFamily: 'Outfit_600SemiBold', fontSize: 12, color: 'rgba(255,255,255,0.45)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10, paddingLeft: 4 }}>
                    Connexion
                </Text>
                <View style={{ backgroundColor: '#ffffff', borderRadius: 24, overflow: 'hidden', marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 4 }}>
                    <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }} activeOpacity={0.6}>
                        <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: '#FEF3C718', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                            <Key size={20} color="#D97706" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontFamily: 'Outfit_600SemiBold', fontSize: 15, color: '#111827' }}>Changer le mot de passe</Text>
                            <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>Dernière modification il y a 30 jours</Text>
                        </View>
                        <ChevronRight size={18} color="#D1D5DB" />
                    </TouchableOpacity>

                    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
                        <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: '#DBEAFE18', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                            <Fingerprint size={20} color="#2563EB" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontFamily: 'Outfit_600SemiBold', fontSize: 15, color: '#111827' }}>Authentification biométrique</Text>
                            <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>Face ID / Empreinte digitale</Text>
                        </View>
                        <Switch
                            value={biometric}
                            onValueChange={setBiometric}
                            trackColor={{ false: '#E5E7EB', true: '#064E3B' }}
                            thumbColor={biometric ? '#F59E0B' : '#ffffff'}
                        />
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 16 }}>
                        <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: '#EDE9FE18', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                            <Smartphone size={20} color="#7C3AED" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontFamily: 'Outfit_600SemiBold', fontSize: 15, color: '#111827' }}>Double authentification (2FA)</Text>
                            <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>Sécurité renforcée par SMS</Text>
                        </View>
                        <Switch
                            value={twoFactor}
                            onValueChange={setTwoFactor}
                            trackColor={{ false: '#E5E7EB', true: '#064E3B' }}
                            thumbColor={twoFactor ? '#F59E0B' : '#ffffff'}
                        />
                    </View>
                </View>

                {/* Activité */}
                <Text style={{ fontFamily: 'Outfit_600SemiBold', fontSize: 12, color: 'rgba(255,255,255,0.45)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10, paddingLeft: 4 }}>
                    Activité
                </Text>
                <View style={{ backgroundColor: '#ffffff', borderRadius: 24, overflow: 'hidden', marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 4 }}>
                    <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }} activeOpacity={0.6}>
                        <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: '#D1FAE518', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                            <Eye size={20} color="#059669" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontFamily: 'Outfit_600SemiBold', fontSize: 15, color: '#111827' }}>Historique des connexions</Text>
                            <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>Appareils et sessions récentes</Text>
                        </View>
                        <ChevronRight size={18} color="#D1D5DB" />
                    </TouchableOpacity>
                    <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 16 }} activeOpacity={0.6}>
                        <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: '#FEE2E218', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                            <Lock size={20} color="#DC2626" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontFamily: 'Outfit_600SemiBold', fontSize: 15, color: '#111827' }}>Bloquer toutes les sessions</Text>
                            <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>Se déconnecter de tous les appareils</Text>
                        </View>
                        <ChevronRight size={18} color="#D1D5DB" />
                    </TouchableOpacity>
                </View>

                {/* Zone de danger */}
                <Text style={{ fontFamily: 'Outfit_600SemiBold', fontSize: 12, color: 'rgba(255,255,255,0.45)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10, paddingLeft: 4 }}>
                    Zone de danger
                </Text>
                <TouchableOpacity
                    onPress={handleDeleteAccount}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FEF2F2', borderRadius: 20, padding: 18, borderWidth: 1, borderColor: '#FECACA' }}
                    activeOpacity={0.7}
                >
                    <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center' }}>
                        <AlertTriangle size={20} color="#DC2626" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 15, color: '#DC2626' }}>Supprimer mon compte</Text>
                        <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 12, color: '#EF4444', marginTop: 2 }}>Action irréversible</Text>
                    </View>
                    <LogOut size={18} color="#EF4444" />
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}
