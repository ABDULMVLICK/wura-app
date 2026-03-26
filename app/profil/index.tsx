import { useRouter } from "expo-router";
import { Anchor, Award, Bell, CheckCircle, ChevronRight, Compass, CreditCard, Edit2, Globe, Heart, HelpCircle, Leaf, LogOut, Settings, Shield, Smile, Star, Sun, User, Zap } from "lucide-react-native";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BottomTabBar } from "../../components/BottomTabBar";
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

export default function ProfileScreen() {
    const router = useRouter();
    const { signOut, profile, user } = useAuth();
    const avatar = getAvatar(user?.uid || profile?.email || 'U');

    const menuItems = [
        {
            icon: User,
            label: "Informations personnelles",
            route: "/profil/edition",
            color: "#F59E0B"
        },
        {
            icon: CreditCard,
            label: "Moyens de paiement",
            route: "/profil/paiement", // To be implemented later or just a placeholder for now
            color: "#3B82F6"
        },
        {
            icon: Bell,
            label: "Notifications",
            route: "/profil/notifications",
            color: "#EF4444"
        },
        {
            icon: Shield,
            label: "Sécurité et confidentialité",
            route: "/profil/securite",
            color: "#10B981"
        },
        {
            icon: Settings,
            label: "Paramètres de l'application",
            route: "/profil/parametres",
            color: "#6B7280"
        },
        {
            icon: HelpCircle,
            label: "Aide et support",
            route: "/profil/support",
            color: "#F59E0B"
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
                <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
                    <View className="px-7 pt-8 pb-4">
                        <Text style={{ fontFamily: 'Outfit_900Black', fontSize: 30, color: '#F59E0B', marginBottom: 32 }}>Mon Profil</Text>

                        {/* Profile Card */}
                        <View className="items-center mb-10">
                            <View className="relative mb-5">
                                <View style={{
                                    width: 120, height: 120, borderRadius: 60,
                                    backgroundColor: avatar.bg,
                                    alignItems: 'center', justifyContent: 'center',
                                    borderWidth: 4, borderColor: 'rgba(255,255,255,0.2)',
                                    shadowColor: avatar.color, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 5,
                                }}>
                                    <avatar.Icon size={52} color={avatar.color} />
                                </View>
                                <TouchableOpacity
                                    onPress={() => router.push("/profil/edition")}
                                    className="absolute bottom-0 right-0 h-9 w-9 bg-primary items-center justify-center rounded-full border-4 border-background shadow-sm"
                                >
                                    <Edit2 size={14} color="white" />
                                </TouchableOpacity>
                            </View>
                            <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 22, color: '#ffffff' }}>
                                {profile?.prenom} {profile?.nom}
                            </Text>
                            <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 6 }}>
                                {profile?.email || profile?.telephone}
                            </Text>
                            <View style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#10B981' }}>
                                <CheckCircle size={13} color="#ffffff" />
                                <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 12, color: '#ffffff' }}>Compte Vérifié</Text>
                            </View>
                        </View>

                        {/* Menu Items */}
                        <View style={{ backgroundColor: '#ffffff', borderRadius: 28, padding: 12, marginBottom: 32, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 4 }}>
                            {menuItems.map((item, index) => (
                                <TouchableOpacity
                                    key={index}
                                    onPress={() => item.route ? router.push(item.route as any) : null}
                                    className={`flex-row items-center justify-between p-4 rounded-2xl ${index !== menuItems.length - 1 ? 'mb-1' : ''} active:bg-gray-50`}
                                >
                                    <View className="flex-row items-center gap-4">
                                        <View className="h-11 w-11 rounded-2xl items-center justify-center bg-gray-50">
                                            <item.icon size={20} color={item.color} />
                                        </View>
                                        <Text className="text-base font-semibold text-foreground">{item.label}</Text>
                                    </View>
                                    <ChevronRight size={20} className="text-muted-foreground opacity-50" />
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Logout Button */}
                        <TouchableOpacity
                            onPress={handleLogout}
                            className="flex-row items-center justify-center gap-3 p-5 rounded-3xl bg-red-50 active:opacity-80"
                        >
                            <LogOut size={20} className="text-red-500" />
                            <Text className="text-base font-bold text-red-500">Se déconnecter</Text>
                        </TouchableOpacity>

                        <Text className="text-center text-xs text-muted-foreground mt-8 opacity-50">
                            Version 1.0.0 • Wura App
                        </Text>
                    </View>
                </ScrollView >
                <BottomTabBar />
            </View >
        </SafeAreaView >
    );
}
