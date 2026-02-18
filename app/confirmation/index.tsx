import { useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, Animated } from "react-native";
import { useRouter } from "expo-router";
import { Check, Copy, Wallet } from "lucide-react-native";

export default function ConfirmationScreen() {
    const router = useRouter();

    // Simple pulse animation for the background ring
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.2,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, [pulseAnim]);

    return (
        <SafeAreaView className="flex-1 bg-background">
            <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
                <View className="flex-1 items-center px-6 py-12">
                    {/* Spacer top */}
                    <View className="flex-1 min-h-[32px]" />

                    {/* Success Animation */}
                    <View className="relative mb-8 items-center justify-center">
                        {/* Pulsing rings */}
                        <Animated.View
                            style={{ transform: [{ scale: pulseAnim }] }}
                            className="absolute h-32 w-32 rounded-full bg-accent/20"
                        />
                        <View className="absolute h-32 w-32 scale-125 rounded-full bg-accent/10" />

                        {/* Main circle */}
                        <View className="relative flex h-32 w-32 items-center justify-center rounded-full border-[4px] border-accent bg-background shadow-lg">
                            <Check className="text-accent" size={48} strokeWidth={3} color="#f59e0b" />
                        </View>

                        {/* Decorative particles */}
                        <View className="absolute -right-8 top-0 h-3 w-3 rounded-sm bg-accent/40 rotate-12" />
                        <View className="absolute -left-6 bottom-8 h-2 w-2 rounded-full bg-accent/30" />
                        <View className="absolute right-0 -bottom-4 h-1.5 w-4 rounded-full bg-accent/50 rotate-45" />
                    </View>

                    {/* Title */}
                    <Text className="mb-8 text-center text-3xl font-bold text-foreground">
                        Transfert réussi !
                    </Text>

                    {/* Amount Card */}
                    <View className="mb-6 w-full rounded-3xl bg-muted/50 p-8 items-center">
                        <Text className="mb-2 text-sm font-medium text-muted-foreground">
                            Vous avez envoyé
                        </Text>
                        <Text className="mb-2 text-4xl font-extrabold text-accent text-center">
                            50,000 FCFA
                        </Text>
                        <Text className="text-base font-bold text-foreground">
                            à @JeanDu93
                        </Text>
                    </View>

                    {/* Details Card */}
                    <View className="mb-8 w-full rounded-3xl border border-border bg-card p-6 shadow-sm">
                        {/* Reference */}
                        <View className="mb-6 flex-row items-center justify-between border-b border-border/50 pb-6">
                            <Text className="text-sm font-medium text-muted-foreground">Référence</Text>
                            <View className="flex-row items-center gap-2">
                                <Text className="font-bold text-foreground">TRX - 882910</Text>
                                <TouchableOpacity>
                                    <Copy size={16} className="text-muted-foreground" color="#6b7280" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Date */}
                        <View className="mb-6 flex-row items-center justify-between border-b border-border/50 pb-6">
                            <Text className="text-sm font-medium text-muted-foreground">Date</Text>
                            <Text className="font-bold text-foreground">24 Oct 2023, 14:30</Text>
                        </View>

                        {/* Source */}
                        <View className="flex-row items-center justify-between">
                            <Text className="text-sm font-medium text-muted-foreground">Source</Text>
                            <View className="flex-row items-center gap-2">
                                <View className="h-2.5 w-2.5 rounded-full bg-green-500" />
                                <Text className="font-bold text-foreground">Portefeuille Principal</Text>
                            </View>
                        </View>
                    </View>

                    {/* Spacer */}
                    <View className="flex-1 min-h-[16px]" />

                    {/* Return Button */}
                    <TouchableOpacity
                        onPress={() => router.push("/accueil")}
                        className="mb-8 w-full items-center justify-center rounded-2xl bg-primary py-4 active:scale-95 transition-transform"
                    >
                        <Text className="text-base font-bold text-primary-foreground text-white">
                            Retour à l'accueil
                        </Text>
                    </TouchableOpacity>

                    {/* Bottom handle */}
                    <View className="h-1 w-32 rounded-full bg-muted-foreground/20 mb-2" />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
