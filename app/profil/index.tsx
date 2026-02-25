import { useRouter } from "expo-router";
import { Bell, ChevronRight, CreditCard, Edit2, LogOut, Moon, Settings, Shield, Sun, User } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { ScrollView, Switch, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BottomTabBar } from "../../components/BottomTabBar";
import { useAuth } from "../../contexts/AuthContext";

export default function ProfileScreen() {
    const router = useRouter();
    const { colorScheme, toggleColorScheme } = useColorScheme();
    const isDark = colorScheme === "dark";
    const { signOut, profile } = useAuth();

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
        <SafeAreaView className="flex-1 bg-background dark:bg-slate-950">
            <View className="flex-1">
                <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
                    <View className="px-6 pt-8 pb-4">
                        <Text className="text-3xl font-bold text-foreground dark:text-white mb-6">Mon Profil</Text>

                        {/* Profile Card */}
                        <View className="items-center mb-8">
                            <View className="relative mb-4">
                                <View className="h-28 w-28 rounded-full bg-[#F59E0B]/20 items-center justify-center border-4 border-card shadow-sm">
                                    <Text className="text-5xl font-bold text-[#F59E0B]">
                                        {(profile?.email || profile?.prenom || "U").charAt(0).toUpperCase()}
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    onPress={() => router.push("/profil/edition")}
                                    className="absolute bottom-0 right-0 h-9 w-9 bg-primary items-center justify-center rounded-full border-4 border-background shadow-sm"
                                >
                                    <Edit2 size={14} color="white" />
                                </TouchableOpacity>
                            </View>
                            <Text className="text-xl font-bold text-foreground dark:text-white">
                                {profile?.prenom} {profile?.nom}
                            </Text>
                            <Text className="text-sm text-muted-foreground dark:text-slate-400">
                                {profile?.email || profile?.telephone}
                            </Text>
                            <View className="mt-2 px-3 py-1 rounded-full bg-primary/10">
                                <Text className="text-xs font-medium text-primary">Compte Vérifié</Text>
                            </View>
                        </View>

                        {/* Menu Items */}
                        <View className="bg-card dark:bg-slate-900 rounded-3xl p-2 shadow-sm border border-border dark:border-slate-800 mb-6">
                            {menuItems.map((item, index) => (
                                <TouchableOpacity
                                    key={index}
                                    onPress={() => item.route === "/profil/edition" ? router.push("/profil/edition") : null}
                                    className={`flex-row items-center justify-between p-4 ${index !== menuItems.length - 1 ? 'border-b border-border/50' : ''}`}
                                >
                                    <View className="flex-row items-center gap-4">
                                        <View className={`h-10 w-10 rounded-xl items-center justify-center bg-gray-50 dark:bg-slate-800`}>
                                            <item.icon size={20} color={item.color} />
                                        </View>
                                        <Text className="text-base font-medium text-foreground dark:text-white">{item.label}</Text>
                                    </View>
                                    <ChevronRight size={20} className="text-muted-foreground dark:text-slate-500 opacity-50" />
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Dark Mode Toggle */}
                        <View className="bg-card dark:bg-slate-900 rounded-3xl p-2 shadow-sm border border-border dark:border-slate-800 mb-6">
                            <View className="flex-row items-center justify-between p-4">
                                <View className="flex-row items-center gap-4">
                                    <View className="h-10 w-10 rounded-xl items-center justify-center bg-gray-50 dark:bg-slate-800">
                                        {isDark ? (
                                            <Moon size={20} color="#8B5CF6" />
                                        ) : (
                                            <Sun size={20} color="#F59E0B" />
                                        )}
                                    </View>
                                    <Text className="text-base font-medium text-foreground dark:text-white">
                                        Mode sombre
                                    </Text>
                                </View>
                                <Switch
                                    value={isDark}
                                    onValueChange={toggleColorScheme}
                                    trackColor={{ false: "#E5E7EB", true: "#064E3B" }}
                                    thumbColor={isDark ? "#10B981" : "#f4f3f4"}
                                />
                            </View>
                        </View>

                        {/* Logout Button */}
                        <TouchableOpacity
                            onPress={handleLogout}
                            className="flex-row items-center justify-center gap-2 p-4 rounded-2xl bg-red-50 dark:bg-red-900/10 active:opacity-80"
                        >
                            <LogOut size={20} className="text-red-500" />
                            <Text className="text-base font-semibold text-red-500">Se déconnecter</Text>
                        </TouchableOpacity>

                        <Text className="text-center text-xs text-muted-foreground mt-8 opacity-50">
                            Version 1.0.0 • Wura App
                        </Text>
                    </View>
                </ScrollView>
                <BottomTabBar />
            </View>
        </SafeAreaView>
    );
}
