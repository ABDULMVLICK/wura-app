import { useRouter } from "expo-router";
import { Bell, ChevronRight, CreditCard, Edit2, LogOut, Settings, Shield, User } from "lucide-react-native";
import { Image, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { BottomTabBar } from "../../components/BottomTabBar";

export default function ProfileScreen() {
    const router = useRouter();

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

    const handleLogout = () => {
        // Implement actual logout logic here (clear tokens, etc.)
        router.replace("/choix");
    };

    return (
        <SafeAreaView className="flex-1 bg-background">
            <View className="flex-1">
                <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
                    <View className="px-6 pt-8 pb-4">
                        <Text className="text-3xl font-bold text-foreground mb-6">Mon Profil</Text>

                        {/* Profile Card */}
                        <View className="items-center mb-8">
                            <View className="relative mb-4">
                                <View className="h-28 w-28 rounded-full bg-muted items-center justify-center overflow-hidden border-4 border-card shadow-sm">
                                    <Image
                                        source={{ uri: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" }}
                                        className="h-full w-full"
                                        resizeMode="cover"
                                    />
                                </View>
                                <TouchableOpacity
                                    onPress={() => router.push("/profil/edition")}
                                    className="absolute bottom-0 right-0 h-9 w-9 bg-primary items-center justify-center rounded-full border-4 border-background shadow-sm"
                                >
                                    <Edit2 size={14} color="white" />
                                </TouchableOpacity>
                            </View>
                            <Text className="text-xl font-bold text-foreground">Jean Dupont</Text>
                            <Text className="text-sm text-muted-foreground">jean.dupont@example.com</Text>
                            <View className="mt-2 px-3 py-1 rounded-full bg-primary/10">
                                <Text className="text-xs font-medium text-primary">Compte Vérifié</Text>
                            </View>
                        </View>

                        {/* Menu Items */}
                        <View className="bg-card rounded-3xl p-2 shadow-sm border border-border mb-6">
                            {menuItems.map((item, index) => (
                                <TouchableOpacity
                                    key={index}
                                    onPress={() => item.route === "/profil/edition" ? router.push("/profil/edition") : null}
                                    className={`flex-row items-center justify-between p-4 ${index !== menuItems.length - 1 ? 'border-b border-border/50' : ''}`}
                                >
                                    <View className="flex-row items-center gap-4">
                                        <View className={`h-10 w-10 rounded-xl items-center justify-center bg-gray-50 dark:bg-gray-800`}>
                                            <item.icon size={20} color={item.color} />
                                        </View>
                                        <Text className="text-base font-medium text-foreground">{item.label}</Text>
                                    </View>
                                    <ChevronRight size={20} className="text-muted-foreground opacity-50" />
                                </TouchableOpacity>
                            ))}
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
