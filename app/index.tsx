import { useEffect, useRef } from "react";
import { View, Text, Animated, SafeAreaView } from "react-native";
import { useRouter } from "expo-router";

export default function SplashScreen() {
    const router = useRouter();
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;

    useEffect(() => {
        // Fade in + scale up animation
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 8,
                tension: 40,
                useNativeDriver: true,
            }),
        ]).start();

        // Navigate to choice screen after 2 seconds
        const timer = setTimeout(() => {
            router.replace("/choix");
        }, 2000);

        return () => clearTimeout(timer);
    }, []);

    return (
        <SafeAreaView className="flex-1 bg-[#064E3B]">
            <View className="flex-1 items-center justify-center">
                <Animated.View
                    style={{
                        opacity: fadeAnim,
                        transform: [{ scale: scaleAnim }],
                    }}
                    className="items-center gap-4"
                >
                    <Text className="text-6xl font-extrabold tracking-tight text-white italic lowercase">
                        wura<Text className="text-[#F59E0B]">.</Text>
                    </Text>
                    <Text className="text-base text-white/60 font-medium">
                        Transferts d'argent premium
                    </Text>

                    {/* Loading indicator */}
                    <View className="mt-8 flex-row gap-2">
                        <View className="w-2 h-2 rounded-full bg-[#F59E0B] opacity-60" />
                        <View className="w-2 h-2 rounded-full bg-[#F59E0B] opacity-80" />
                        <View className="w-2 h-2 rounded-full bg-[#F59E0B]" />
                    </View>
                </Animated.View>
            </View>
        </SafeAreaView>
    );
}
