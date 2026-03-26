import { useRouter } from "expo-router";
import { ArrowLeft, Bell, BellOff, MessageSquare, Shield, Tag } from "lucide-react-native";
import { useState } from "react";
import { ScrollView, Switch, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BottomTabBar } from "../../components/BottomTabBar";

export default function ReceiverNotificationsScreen() {
    const router = useRouter();

    const [notifs, setNotifs] = useState({
        retraits: true,
        rappels: true,
        promos: false,
        securite: true,
    });

    const toggle = (key: keyof typeof notifs) =>
        setNotifs((prev) => ({ ...prev, [key]: !prev[key] }));

    const items = [
        {
            key: "retraits" as const,
            icon: Bell,
            color: "#F59E0B",
            label: "Fonds disponibles",
            desc: "Alertes quand de l'argent est à retirer",
        },
        {
            key: "rappels" as const,
            icon: MessageSquare,
            color: "#3B82F6",
            label: "Rappels de retrait",
            desc: "Rappels pour les fonds non encore retirés",
        },
        {
            key: "promos" as const,
            icon: Tag,
            color: "#8B5CF6",
            label: "Offres & actualités",
            desc: "Nouveautés et avantages Wura",
        },
        {
            key: "securite" as const,
            icon: Shield,
            color: "#EF4444",
            label: "Alertes sécurité",
            desc: "Nouvelles connexions et activités suspectes",
        },
    ];

    const activeCount = Object.values(notifs).filter(Boolean).length;

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
                        <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 17, color: '#ffffff' }}>Notifications</Text>
                        <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>
                            {activeCount} activée{activeCount !== 1 ? 's' : ''}
                        </Text>
                    </View>
                    <View style={{ width: 42 }} />
                </View>

                <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
                    <View style={{ alignItems: 'center', paddingVertical: 28 }}>
                        <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(245,158,11,0.15)', alignItems: 'center', justifyContent: 'center' }}>
                            {activeCount > 0
                                ? <Bell size={32} color="#F59E0B" />
                                : <BellOff size={32} color="rgba(255,255,255,0.3)" />}
                        </View>
                        <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 12, textAlign: 'center' }}>
                            Choisissez les alertes que vous souhaitez recevoir
                        </Text>
                    </View>

                    <View style={{ backgroundColor: '#ffffff', borderRadius: 24, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 4 }}>
                        {items.map((item, index) => (
                            <View
                                key={item.key}
                                style={[
                                    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 16 },
                                    index !== items.length - 1 && { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }
                                ]}
                            >
                                <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: item.color + '18', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                                    <item.icon size={20} color={item.color} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontFamily: 'Outfit_600SemiBold', fontSize: 15, color: '#111827' }}>{item.label}</Text>
                                    <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{item.desc}</Text>
                                </View>
                                <Switch
                                    value={notifs[item.key]}
                                    onValueChange={() => toggle(item.key)}
                                    trackColor={{ false: '#E5E7EB', true: '#064E3B' }}
                                    thumbColor={notifs[item.key] ? '#F59E0B' : '#ffffff'}
                                />
                            </View>
                        ))}
                    </View>

                    <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 12, color: 'rgba(255,255,255,0.35)', textAlign: 'center', marginTop: 20, lineHeight: 18 }}>
                        Les notifications de sécurité sont fortement recommandées{'\n'}pour protéger votre compte.
                    </Text>
                </ScrollView>

                <BottomTabBar />
            </View>
        </SafeAreaView>
    );
}
