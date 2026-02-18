import { View, Text, TouchableOpacity } from "react-native";
import { Link, usePathname } from "expo-router";
import { Clock, User } from "lucide-react-native";
import Svg, { Path } from "react-native-svg";
import { clsx } from "clsx";

function SendIcon({ active, color }: { active: boolean; color: string }) {
    return (
        <View
            className={clsx(
                "flex h-10 w-10 items-center justify-center rounded-xl",
                active ? "bg-primary/10" : ""
            )}
        >
            <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <Path
                    d="M22 2L11 13"
                    stroke={color}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <Path
                    d="M22 2L15 22L11 13L2 9L22 2Z"
                    stroke={color}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill={active ? color : "none"}
                    fillOpacity={active ? 0.15 : 0}
                />
            </Svg>
        </View>
    );
}

const tabs = [
    {
        label: "Envoyer",
        href: "/accueil",
        matchPaths: ["/accueil", "/confirmation"],
        icon: "send" as const,
    },
    {
        label: "Historique",
        href: "/historique", // This route doesn't exist yet but keeping for consistency
        matchPaths: ["/historique"],
        icon: "history" as const,
    },
    {
        label: "Profil",
        href: "/profil", // This route doesn't exist yet
        matchPaths: ["/profil"],
        icon: "profile" as const,
    },
];

export function BottomTabBar() {
    const pathname = usePathname();

    return (
        <View className="border-t border-border bg-card pb-6 pt-2">
            <View className="flex-row items-center justify-around">
                {tabs.map((tab) => {
                    const isActive = tab.matchPaths.some((p) => pathname.startsWith(p));
                    const color = isActive ? "#0f3d2e" : "#9ca3af"; // primary vs muted-foreground

                    return (
                        <Link key={tab.label} href={tab.href as any} asChild>
                            <TouchableOpacity
                                className="items-center gap-0.5 px-4 py-1"
                            >
                                {tab.icon === "send" && <SendIcon active={isActive} color={color} />}
                                {tab.icon === "history" && (
                                    <View className="flex h-10 w-10 items-center justify-center">
                                        <Clock size={24} color={color} />
                                    </View>
                                )}
                                {tab.icon === "profile" && (
                                    <View className="flex h-10 w-10 items-center justify-center">
                                        <User size={24} color={color} />
                                    </View>
                                )}
                                <Text
                                    className={clsx(
                                        "text-xs font-medium",
                                        isActive ? "text-primary" : "text-muted-foreground"
                                    )}
                                >
                                    {tab.label}
                                </Text>
                            </TouchableOpacity>
                        </Link>
                    );
                })}
            </View>
        </View>
    );
}
