import { useRouter } from "expo-router";
import { ArrowLeft, Bell, Edit2, FileText, HelpCircle, LogOut, Moon, Shield, Sun, User } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { Image, ScrollView, Switch, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../contexts/AuthContext";

export default function SenderProfileScreen() {
    const router = useRouter();
    const { colorScheme, toggleColorScheme } = useColorScheme();
    const isDark = colorScheme === "dark";
    const { signOut, profile } = useAuth();

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
        <SafeAreaView className="flex-1 bg-gray-50 dark:bg-[#221b10]">
            <View className="flex-1">
                {/* Header */}
                <View className="px-6 py-4 flex-row items-center justify-between">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-white/10 shadow-sm"
                    >
                        <ArrowLeft size={20} className="text-gray-800 dark:text-white" color="#1f2937" />
                    </TouchableOpacity>
                    <Text className="text-lg font-bold text-gray-900 dark:text-white">Mon Profil</Text>
                    <View className="w-10" />
                </View>

                <ScrollView contentContainerStyle={{ paddingBottom: 40 }} className="px-6 pt-4">
                    {/* Profile Card */}
                    <View className="items-center mb-8">
                        <View className="relative mb-4">
                            <View className="h-28 w-28 rounded-full bg-gray-200 overflow-hidden border-4 border-white dark:border-white/10 shadow-sm">
                                <Image
                                    source={{ uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuBSjJ-nEaQvx0w3s2-UzHGdRJQK9RZtt1p_gYxL3GurM8c-7fxRXvMy7RtFemPXZkCfD40LA8zTfVvZlFDwQk83So-cMN4vuG4tHkhrQW3E09zNENGNi9aiAbQAqtNsvH6xAB04XSe9E8_NtRv2bh7w_hRM8Zm7VjwIMVdi4Vk8EMCZqU98TDk9h07ZFgdDKOyW9QNeKKGQZMsxboYOF5ibxYnI2hfsR0DmyxZbz4NjoFGcuxm0yTecNuI5VyJX21XF1zeMXWf5gxY" }}
                                    className="h-full w-full"
                                    resizeMode="cover"
                                />
                            </View>
                            <TouchableOpacity
                                onPress={() => router.push("/sender-home/edition")}
                                className="absolute bottom-0 right-0 h-9 w-9 bg-[#064E3B] items-center justify-center rounded-full border-4 border-white dark:border-[#221b10] shadow-sm"
                            >
                                <Edit2 size={14} color="white" />
                            </TouchableOpacity>
                        </View>
                        <Text className="text-xl font-bold text-gray-900 dark:text-white">
                            {profile?.sender?.firstName || profile?.prenom} {profile?.sender?.lastName || profile?.nom}
                        </Text>
                        <Text className="text-sm text-gray-500 dark:text-gray-400">
                            {profile?.telephone || profile?.phone || profile?.email}
                        </Text>
                        <View className="mt-2 px-3 py-1 rounded-full bg-[#ecfdf5] dark:bg-[#064E3B]/20 border border-[#10b981]/20">
                            <Text className="text-xs font-medium text-[#059669] dark:text-[#34d399]">Compte Vérifié</Text>
                        </View>
                    </View>

                    {/* Menu Items */}
                    <View className="bg-white dark:bg-white/5 rounded-3xl p-2 shadow-sm border border-gray-100 dark:border-white/5 mb-6">
                        {menuItems.map((item, index) => (
                            <TouchableOpacity
                                key={index}
                                onPress={() => router.push(item.route as any)}
                                className={`flex-row items-center justify-between p-4 ${index !== menuItems.length - 1 ? 'border-b border-gray-100 dark:border-white/5' : ''}`}
                            >
                                <View className="flex-row items-center gap-4">
                                    <View className={`h-10 w-10 rounded-xl items-center justify-center bg-gray-50 dark:bg-white/10`}>
                                        <item.icon size={20} color={item.color} />
                                    </View>
                                    <Text className="text-base font-medium text-gray-800 dark:text-gray-100">{item.label}</Text>
                                </View>
                                <ArrowLeft size={20} className="text-gray-300 rotate-180" />
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Dark Mode Toggle */}
                    <View className="bg-white dark:bg-white/5 rounded-3xl p-2 shadow-sm border border-gray-100 dark:border-white/5 mb-6">
                        <View className="flex-row items-center justify-between p-4">
                            <View className="flex-row items-center gap-4">
                                <View className="h-10 w-10 rounded-xl items-center justify-center bg-gray-50 dark:bg-white/10">
                                    {isDark ? (
                                        <Moon size={20} color="#8B5CF6" />
                                    ) : (
                                        <Sun size={20} color="#F59E0B" />
                                    )}
                                </View>
                                <Text className="text-base font-medium text-gray-800 dark:text-gray-100">
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
                        className="flex-row items-center justify-center gap-2 p-4 rounded-2xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 active:opacity-80"
                    >
                        <LogOut size={20} className="text-red-500" />
                        <Text className="text-base font-semibold text-red-500">Se déconnecter</Text>
                    </TouchableOpacity>

                    <Text className="text-center text-xs text-gray-400 mt-8 opacity-60">
                        Version 1.0.0 • Wura Sender
                    </Text>
                </ScrollView>
            </View>
        </SafeAreaView>
    );
}
