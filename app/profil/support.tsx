import { useRouter } from "expo-router";
import { ArrowLeft, Book, Check, ChevronDown, ChevronRight, ChevronUp, Mail, MessageCircle, Phone, Send } from "lucide-react-native";
import { useState } from "react";
import { Alert, KeyboardAvoidingView, Linking, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BottomTabBar } from "../../components/BottomTabBar";

const SUPPORT_EMAIL = "abdulbusiness0@gmail.com";

const FAQ = [
    {
        q: "Comment retirer mon argent ?",
        a: "Depuis l'accueil, appuyez sur « Retirer » pour lancer le processus de virement vers votre compte bancaire via notre partenaire.",
    },
    {
        q: "Combien de temps prend le retrait ?",
        a: "Le virement bancaire arrive généralement en 1 à 3 jours ouvrables selon votre banque.",
    },
    {
        q: "Je n'ai pas reçu l'argent attendu",
        a: "Vérifiez le statut dans l'historique. Si la transaction est « Terminée » mais que le virement n'est pas arrivé, contactez notre support avec l'identifiant de la transaction.",
    },
    {
        q: "Comment sécuriser mon compte ?",
        a: "Activez la double authentification dans Sécurité & Confidentialité. Ne partagez jamais votre code de connexion.",
    },
    {
        q: "Comment me faire envoyer de l'argent ?",
        a: "Communiquez votre identifiant Wura (wuraId) à l'expéditeur. Il pourra vous trouver directement dans l'application Wura Sender.",
    },
];

export default function ReceiverSupportScreen() {
    const router = useRouter();
    const [openFaq, setOpenFaq] = useState<number | null>(null);
    const [sujet, setSujet] = useState("");
    const [message, setMessage] = useState("");
    const [sent, setSent] = useState(false);

    const handleSendEmail = () => {
        if (!sujet.trim() || !message.trim()) {
            Alert.alert("Champs manquants", "Veuillez remplir le sujet et le message.");
            return;
        }
        const subject = encodeURIComponent(`[Wura Receiver] ${sujet}`);
        const body = encodeURIComponent(`Bonjour,\n\n${message}\n\n---\nEnvoyé depuis l'application Wura`);
        Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`)
            .then(() => {
                setSent(true);
                setSujet("");
                setMessage("");
                setTimeout(() => setSent(false), 3000);
            })
            .catch(() => Alert.alert("Erreur", "Impossible d'ouvrir l'application email."));
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#14533d' }}>
            <View style={{ flex: 1 }}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={{ flex: 1 }}
                >
                    {/* Header */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16 }}>
                        <TouchableOpacity
                            onPress={() => router.back()}
                            style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' }}
                            activeOpacity={0.7}
                        >
                            <ArrowLeft size={20} color="#ffffff" />
                        </TouchableOpacity>
                        <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 17, color: '#ffffff' }}>Aide & Support</Text>
                        <View style={{ width: 42 }} />
                    </View>

                    <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

                        {/* Formulaire de contact */}
                        <Text style={{ fontFamily: 'Outfit_600SemiBold', fontSize: 12, color: 'rgba(255,255,255,0.45)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10, paddingLeft: 4 }}>
                            Contacter le support
                        </Text>
                        <View style={{ backgroundColor: '#ffffff', borderRadius: 24, padding: 18, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 4 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                                <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#FEF3C7', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                                    <Mail size={18} color="#D97706" />
                                </View>
                                <View>
                                    <Text style={{ fontFamily: 'Outfit_600SemiBold', fontSize: 14, color: '#111827' }}>Envoyer un message</Text>
                                    <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 11, color: '#9CA3AF' }}>{SUPPORT_EMAIL}</Text>
                                </View>
                            </View>

                            <Text style={{ fontFamily: 'Outfit_600SemiBold', fontSize: 12, color: '#6B7280', marginBottom: 6 }}>Sujet *</Text>
                            <View style={{ backgroundColor: '#F9FAFB', borderRadius: 14, borderWidth: 1, borderColor: '#E5E7EB', paddingHorizontal: 14, paddingVertical: 12, marginBottom: 14 }}>
                                <TextInput
                                    value={sujet}
                                    onChangeText={setSujet}
                                    placeholder="Ex: Retrait non reçu"
                                    placeholderTextColor="#9CA3AF"
                                    style={{ fontFamily: 'Outfit_400Regular', fontSize: 14, color: '#111827' }}
                                />
                            </View>

                            <Text style={{ fontFamily: 'Outfit_600SemiBold', fontSize: 12, color: '#6B7280', marginBottom: 6 }}>Message *</Text>
                            <View style={{ backgroundColor: '#F9FAFB', borderRadius: 14, borderWidth: 1, borderColor: '#E5E7EB', paddingHorizontal: 14, paddingVertical: 12, marginBottom: 18 }}>
                                <TextInput
                                    value={message}
                                    onChangeText={setMessage}
                                    placeholder="Décrivez votre problème en détail..."
                                    placeholderTextColor="#9CA3AF"
                                    multiline
                                    numberOfLines={5}
                                    textAlignVertical="top"
                                    style={{ fontFamily: 'Outfit_400Regular', fontSize: 14, color: '#111827', minHeight: 100 }}
                                />
                            </View>

                            <TouchableOpacity
                                onPress={handleSendEmail}
                                style={{
                                    backgroundColor: sent ? '#10B981' : '#064E3B',
                                    borderRadius: 16, paddingVertical: 14,
                                    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
                                }}
                                activeOpacity={0.8}
                            >
                                {sent ? <Check size={18} color="#ffffff" /> : <Send size={18} color="#ffffff" />}
                                <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 15, color: '#ffffff' }}>
                                    {sent ? "Client mail ouvert !" : "Envoyer le message"}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Autres canaux */}
                        <Text style={{ fontFamily: 'Outfit_600SemiBold', fontSize: 12, color: 'rgba(255,255,255,0.45)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10, paddingLeft: 4 }}>
                            Autres canaux
                        </Text>
                        <View style={{ backgroundColor: '#ffffff', borderRadius: 24, overflow: 'hidden', marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 4 }}>
                            {[
                                { icon: MessageCircle, color: '#059669', label: 'Chat en direct', desc: 'Disponible 9h – 18h', onPress: () => {} },
                                { icon: Phone, color: '#2563EB', label: 'Téléphone', desc: '+33 1 23 45 67 89', onPress: () => Linking.openURL('tel:+33123456789') },
                            ].map((item, index, arr) => (
                                <TouchableOpacity
                                    key={item.label}
                                    onPress={item.onPress}
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

                        {/* FAQ */}
                        <Text style={{ fontFamily: 'Outfit_600SemiBold', fontSize: 12, color: 'rgba(255,255,255,0.45)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10, paddingLeft: 4 }}>
                            Questions fréquentes
                        </Text>
                        <View style={{ backgroundColor: '#ffffff', borderRadius: 24, overflow: 'hidden', marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 4 }}>
                            {FAQ.map((item, index) => (
                                <TouchableOpacity
                                    key={index}
                                    onPress={() => setOpenFaq(openFaq === index ? null : index)}
                                    style={[
                                        { paddingHorizontal: 18, paddingVertical: 16 },
                                        index !== FAQ.length - 1 && { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }
                                    ]}
                                    activeOpacity={0.7}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <Text style={{ fontFamily: 'Outfit_600SemiBold', fontSize: 14, color: '#111827', flex: 1, marginRight: 10 }}>{item.q}</Text>
                                        {openFaq === index
                                            ? <ChevronUp size={18} color="#9CA3AF" />
                                            : <ChevronDown size={18} color="#9CA3AF" />}
                                    </View>
                                    {openFaq === index && (
                                        <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 13, color: '#6B7280', marginTop: 10, lineHeight: 20 }}>
                                            {item.a}
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* À propos */}
                        <View style={{ backgroundColor: '#ffffff', borderRadius: 24, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 4 }}>
                            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }} activeOpacity={0.6}>
                                <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: '#FEF3C718', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                                    <Book size={20} color="#D97706" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontFamily: 'Outfit_600SemiBold', fontSize: 15, color: '#111827' }}>Guide d'utilisation</Text>
                                    <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>Documentation complète</Text>
                                </View>
                                <ChevronRight size={18} color="#D1D5DB" />
                            </TouchableOpacity>
                            <View style={{ paddingHorizontal: 18, paddingVertical: 16 }}>
                                <Text style={{ fontFamily: 'Outfit_600SemiBold', fontSize: 15, color: '#111827' }}>Version</Text>
                                <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>1.0.0 • Wura App</Text>
                            </View>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>

                <BottomTabBar />
            </View>
        </SafeAreaView>
    );
}
