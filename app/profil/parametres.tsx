import { useRouter } from "expo-router";
import { ArrowLeft, ChevronRight, FileText, Globe, Info, Moon, Shield, Trash2 } from "lucide-react-native";
import { useState } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BottomTabBar } from "../../components/BottomTabBar";

export default function ParametresScreen() {
    const router = useRouter();
    const [langue, setLangue] = useState("Français");
    const [theme, setTheme] = useState("Automatique");

    const cycleLangue = () => {
        const opts = ["Français", "English", "Wolof"];
        setLangue((prev) => opts[(opts.indexOf(prev) + 1) % opts.length]);
    };

    const cycleTheme = () => {
        const opts = ["Automatique", "Clair", "Sombre"];
        setTheme((prev) => opts[(opts.indexOf(prev) + 1) % opts.length]);
    };

    const handleDeleteData = () => {
        Alert.alert(
            "Télécharger mes données",
            "Un email contenant l'export de vos données vous sera envoyé dans les 72 heures.",
            [{ text: "OK" }]
        );
    };

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
                    <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 17, color: '#ffffff' }}>Paramètres</Text>
                    <View style={{ width: 42 }} />
                </View>

                <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>

                    {/* Préférences */}
                    <Text style={{ fontFamily: 'Outfit_600SemiBold', fontSize: 12, color: 'rgba(255,255,255,0.45)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10, paddingLeft: 4 }}>
                        Préférences
                    </Text>
                    <View style={{ backgroundColor: '#ffffff', borderRadius: 24, overflow: 'hidden', marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 4 }}>
                        <TouchableOpacity
                            onPress={cycleLangue}
                            style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}
                            activeOpacity={0.6}
                        >
                            <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: '#FEF3C718', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                                <Globe size={20} color="#D97706" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontFamily: 'Outfit_600SemiBold', fontSize: 15, color: '#111827' }}>Langue</Text>
                                <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>Appuyez pour changer</Text>
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <Text style={{ fontFamily: 'Outfit_600SemiBold', fontSize: 14, color: '#064E3B' }}>{langue}</Text>
                                <ChevronRight size={16} color="#D1D5DB" />
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={cycleTheme}
                            style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 16 }}
                            activeOpacity={0.6}
                        >
                            <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: '#EDE9FE18', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                                <Moon size={20} color="#7C3AED" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontFamily: 'Outfit_600SemiBold', fontSize: 15, color: '#111827' }}>Thème</Text>
                                <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>Apparence de l'application</Text>
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <Text style={{ fontFamily: 'Outfit_600SemiBold', fontSize: 14, color: '#064E3B' }}>{theme}</Text>
                                <ChevronRight size={16} color="#D1D5DB" />
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* Légal */}
                    <Text style={{ fontFamily: 'Outfit_600SemiBold', fontSize: 12, color: 'rgba(255,255,255,0.45)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10, paddingLeft: 4 }}>
                        Légal
                    </Text>
                    <View style={{ backgroundColor: '#ffffff', borderRadius: 24, overflow: 'hidden', marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 4 }}>
                        {[
                            { icon: FileText, color: '#2563EB', label: "Conditions d'utilisation", desc: "CGU et mentions légales" },
                            { icon: Shield, color: '#059669', label: "Politique de confidentialité", desc: "Comment vos données sont traitées" },
                            { icon: Info, color: '#6B7280', label: "À propos de Wura", desc: "Version 1.0.0" },
                        ].map((item, index, arr) => (
                            <TouchableOpacity
                                key={item.label}
                                style={[
                                    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 16 },
                                    index !== arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }
                                ]}
                                activeOpacity={0.6}
                            >
                                <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: item.color + '18', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                                    <item.icon size={20} color={item.color} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontFamily: 'Outfit_600SemiBold', fontSize: 15, color: '#111827' }}>{item.label}</Text>
                                    <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{item.desc}</Text>
                                </View>
                                <ChevronRight size={18} color="#D1D5DB" />
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Données */}
                    <Text style={{ fontFamily: 'Outfit_600SemiBold', fontSize: 12, color: 'rgba(255,255,255,0.45)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10, paddingLeft: 4 }}>
                        Mes données
                    </Text>
                    <View style={{ backgroundColor: '#ffffff', borderRadius: 24, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 4 }}>
                        <TouchableOpacity
                            onPress={handleDeleteData}
                            style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}
                            activeOpacity={0.6}
                        >
                            <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: '#DBEAFE18', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                                <FileText size={20} color="#2563EB" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontFamily: 'Outfit_600SemiBold', fontSize: 15, color: '#111827' }}>Télécharger mes données</Text>
                                <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>Export au format JSON / CSV</Text>
                            </View>
                            <ChevronRight size={18} color="#D1D5DB" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => Alert.alert("Effacer le cache", "Cache local effacé avec succès.", [{ text: "OK" }])}
                            style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 16 }}
                            activeOpacity={0.6}
                        >
                            <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: '#FEE2E218', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                                <Trash2 size={20} color="#DC2626" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontFamily: 'Outfit_600SemiBold', fontSize: 15, color: '#111827' }}>Effacer le cache</Text>
                                <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>Libérer de l'espace sur l'appareil</Text>
                            </View>
                            <ChevronRight size={18} color="#D1D5DB" />
                        </TouchableOpacity>
                    </View>
                </ScrollView>

                <BottomTabBar />
            </View>
        </SafeAreaView>
    );
}
