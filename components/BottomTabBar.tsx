import { Link, usePathname } from "expo-router";
import { Clock, Home, User } from "lucide-react-native";
import { Text, View } from "react-native";
import { AnimatedPressable } from "./AnimatedPressable";

const tabs = [
    {
        label: "Home",
        href: "/accueil",
        matchPaths: ["/accueil"],
        icon: "home" as const,
    },
    {
        label: "Historique",
        href: "/historique",
        matchPaths: ["/historique"],
        icon: "history" as const,
    },
    {
        label: "Profil",
        href: "/profil",
        matchPaths: ["/profil"],
        icon: "profile" as const,
    },
];

export function BottomTabBar() {
    const pathname = usePathname();

    return (
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingBottom: 28, paddingHorizontal: 24 }}>
            {/* Liquid glass pill */}
            <View style={{
                borderRadius: 32,
                overflow: 'hidden',
                // Shadow multicouche pour profondeur
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.22,
                shadowRadius: 24,
                elevation: 16,
            }}>
                {/* Couche de fond semi-transparente — verre dépoli blanc */}
                <View style={{
                    backgroundColor: 'rgba(10,36,24,0.55)',
                    borderRadius: 32,
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.18)',
                }}>
                    {/* Reflet spéculaire haut — ligne lumineuse */}
                    <View style={{
                        position: 'absolute', top: 0, left: 16, right: 16, height: 1,
                        backgroundColor: 'rgba(255,255,255,0.28)',
                        borderRadius: 1,
                    }} />

                    {/* Lueur ambrée diffuse — identité Wura */}
                    <View style={{
                        position: 'absolute', bottom: -20, left: '30%', right: '30%',
                        height: 40, borderRadius: 20,
                        backgroundColor: 'rgba(245,158,11,0.10)',
                    }} />

                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingVertical: 10, paddingHorizontal: 8 }}>
                        {tabs.map((tab) => {
                            const isActive = tab.matchPaths.some((p) => pathname.startsWith(p));
                            const iconColor = isActive ? "#F59E0B" : "rgba(255,255,255,0.45)";

                            return (
                                <Link key={tab.label} href={tab.href as any} asChild>
                                    <AnimatedPressable
                                        style={{ alignItems: 'center', paddingHorizontal: 20, paddingVertical: 6 }}
                                        scaleValue={0.9}
                                    >
                                        {/* Halo actif */}
                                        {isActive && (
                                            <View style={{
                                                position: 'absolute', top: 2, width: 44, height: 44,
                                                borderRadius: 22,
                                                backgroundColor: 'rgba(245,158,11,0.15)',
                                            }} />
                                        )}
                                        {tab.icon === "home" && (
                                            <View style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
                                                <Home size={26} color={iconColor} />
                                            </View>
                                        )}
                                        {tab.icon === "history" && (
                                            <View style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
                                                <Clock size={26} color={iconColor} />
                                            </View>
                                        )}
                                        {tab.icon === "profile" && (
                                            <View style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
                                                <User size={26} color={iconColor} />
                                            </View>
                                        )}
                                        <Text style={{
                                            fontSize: 11,
                                            fontFamily: isActive ? 'Outfit_700Bold' : 'Outfit_400Regular',
                                            color: isActive ? "#F59E0B" : "rgba(255,255,255,0.45)",
                                            marginTop: 2,
                                        }}>
                                            {tab.label}
                                        </Text>
                                    </AnimatedPressable>
                                </Link>
                            );
                        })}
                    </View>
                </View>
            </View>
        </View>
    );
}

