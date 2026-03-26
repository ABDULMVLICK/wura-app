import { useRouter } from "expo-router";
import { Anchor, ArrowLeft, Award, Bell, Compass, Edit2, FileText, Globe, Heart, HelpCircle, Leaf, LogOut, Shield, Smile, Star, Sun, User, Zap } from "lucide-react-native";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AnimatedPressable } from "../../components/AnimatedPressable";
import { FadeInView } from "../../components/FadeInView";
import { useAuth } from "../../contexts/AuthContext";

const AVATAR_ICONS = [Smile, Star, Zap, Sun, Leaf, Globe, Heart, Anchor, Award, Compass];
const AVATAR_PALETTES = [
    { bg: '#FEF3C7', color: '#D97706' },
    { bg: '#D1FAE5', color: '#059669' },
    { bg: '#DBEAFE', color: '#2563EB' },
    { bg: '#FCE7F3', color: '#DB2777' },
    { bg: '#EDE9FE', color: '#7C3AED' },
    { bg: '#FEE2E2', color: '#DC2626' },
    { bg: '#E0F2FE', color: '#0284C7' },
];

function getAvatar(seed: string) {
    const n = (seed || 'U').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    return { Icon: AVATAR_ICONS[n % AVATAR_ICONS.length], ...AVATAR_PALETTES[n % AVATAR_PALETTES.length] };
}

export default function SenderProfileScreen() {
    const router = useRouter();
    const { signOut, profile, user } = useAuth();

    const avatar = getAvatar(user?.uid || profile?.email || 'U');

    const menuItems = [
        {
            icon: User,
            label: "Informations personnelles",
            route: "/sender-home/edition",
            color: "#F59E0B"
        },
        {
            icon: FileText,
            label: "Historique des transactions",
            route: "/sender-home/historique",
            color: "#059669"
        },
        {
            icon: Bell,
            label: "Notifications",
            route: "/sender-home/notifications",
            color: "#EF4444"
        },
        {
            icon: Shield,
            label: "Sécurité",
            route: "/sender-home/securite",
            color: "#1d4ed8"
        },
        {
            icon: HelpCircle,
            label: "Aide et support",
            route: "/sender-home/support",
            color: "#6B7280"
        }
    ];

    const handleLogout = async () => {
        try {
            await signOut();
            router.replace("/choix");
        } catch (error) {
            console.error("Erreur déconnexion:", error);
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#14533d' }}>
            <View className="flex-1">
                {/* Header */}
                <View className="px-7 py-5 flex-row items-center justify-between">
                    <AnimatedPressable
                        onPress={() => router.back()}
                        className="h-11 w-11 items-center justify-center rounded-2xl bg-white"
                        style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}
                    >
                        <ArrowLeft size={20} className="text-gray-800" color="#1f2937" />
                    </AnimatedPressable>
                    <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 20, color: '#F59E0B' }}>Mon Profil</Text>
                    <View className="w-11" />
                </View>

                <ScrollView contentContainerStyle={{ paddingBottom: 40 }} className="px-7 pt-6">
                    {/* Profile Card */}
                    <FadeInView delay={0} className="items-center mb-10">
                        <View className="relative mb-5">
                            <View style={{
                                width: 120, height: 120, borderRadius: 60,
                                backgroundColor: avatar.bg,
                                alignItems: 'center', justifyContent: 'center',
                                borderWidth: 4, borderColor: '#ffffff',
                                shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 16, elevation: 5,
                            }}>
                                <avatar.Icon size={52} color={avatar.color} />
                            </View>
                            <TouchableOpacity
                                onPress={() => router.push("/sender-home/edition")}
                                className="absolute bottom-0 right-0 h-10 w-10 bg-[#064E3B] items-center justify-center rounded-full border-4 border-white"
                                style={{ shadowColor: '#064E3B', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 3 }}
                            >
                                <Edit2 size={16} color="white" />
                            </TouchableOpacity>
                        </View>
                        <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 22, color: '#ffffff' }}>
                            {profile?.sender?.firstName || profile?.prenom} {profile?.sender?.lastName || profile?.nom}
                        </Text>
                        <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 6 }}>
                            {profile?.telephone || profile?.phone || profile?.email}
                        </Text>
                        <View className="mt-3 px-4 py-1.5 rounded-full bg-[#ecfdf5] border border-[#10b981]/20">
                            <Text className="text-xs font-semibold text-[#059669]">Compte Vérifié</Text>
                        </View>
                    </FadeInView>

                    {/* Menu Items */}
                    <View style={{ backgroundColor: '#ffffff', borderRadius: 28, padding: 12, marginBottom: 32, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 4 }}>
                        {menuItems.map((item, index) => (
                            <TouchableOpacity
                                key={index}
                                onPress={() => router.push(item.route as any)}
                                className={`flex-row items-center justify-between p-4 rounded-2xl ${index !== menuItems.length - 1 ? 'mb-1' : ''} active:bg-gray-50`}
                            >
                                <View className="flex-row items-center gap-4">
                                    <View className="h-11 w-11 rounded-2xl items-center justify-center" style={{ backgroundColor: item.color + '15' }}>
                                        <item.icon size={20} color={item.color} />
                                    </View>
                                    <Text className="text-base font-semibold text-gray-800">{item.label}</Text>
                                </View>
                                <ArrowLeft size={20} className="text-gray-300 rotate-180" />
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Logout Button */}
                    <TouchableOpacity
                        onPress={handleLogout}
                        className="flex-row items-center justify-center gap-3 p-5 rounded-3xl bg-red-50 border border-red-100 active:opacity-80"
                    >
                        <LogOut size={20} className="text-red-500" color="#EF4444" />
                        <Text className="text-base font-bold text-red-500">Se déconnecter</Text>
                    </TouchableOpacity>

                    <Text className="text-center text-xs text-gray-400 mt-8 opacity-60">
                        Version 1.0.0 • Wura Sender
                    </Text>
                </ScrollView>
            </View>
        </SafeAreaView>
    );
}
