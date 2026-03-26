import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { Animated, Image, View } from "react-native";

export default function SplashScreen() {
    const router = useRouter();
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.85)).current;
    const subtitleFade = useRef(new Animated.Value(0)).current;
    const dot1 = useRef(new Animated.Value(0.3)).current;
    const dot2 = useRef(new Animated.Value(0.6)).current;
    const dot3 = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        // Logo fade in + scale
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 900,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 7,
                tension: 35,
                useNativeDriver: true,
            }),
        ]).start();

        // Subtitle delayed fade in
        Animated.timing(subtitleFade, {
            toValue: 1,
            duration: 800,
            delay: 500,
            useNativeDriver: true,
        }).start();

        // Pulsing dots animation
        const animateDot = (dot: Animated.Value, delay: number) => {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(dot, { toValue: 1, duration: 500, delay, useNativeDriver: true }),
                    Animated.timing(dot, { toValue: 0.2, duration: 500, useNativeDriver: true }),
                ])
            ).start();
        };
        animateDot(dot1, 0);
        animateDot(dot2, 170);
        animateDot(dot3, 340);

        const timer = setTimeout(() => {
            router.replace("/choix");
        }, 2000);

        return () => clearTimeout(timer);
    }, []);

    return (
        <View style={{
            flex: 1, backgroundColor: '#14533d',
            alignItems: 'center', justifyContent: 'center',
        }}>
            {/* Subtle radial glow behind logo */}
            <View style={{
                position: 'absolute', width: 300, height: 300, borderRadius: 150,
                backgroundColor: 'rgba(245,158,11,0.06)',
            }} />

            <Animated.View style={{
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
                alignItems: 'center',
            }}>
                <Image
                    source={require("../assets/images/wuralogo-removebg-preview.png")}
                    style={{ width: 280, height: 95 }}
                    resizeMode="contain"
                />

                <Animated.Text style={{
                    fontFamily: 'Outfit_400Regular',
                    fontSize: 15, color: 'rgba(255,255,255,0.45)',
                    marginTop: 16, letterSpacing: 1,
                    opacity: subtitleFade,
                }}>
                    Transferts d'argent simplifiés
                </Animated.Text>

                {/* Loading dots */}
                <View style={{
                    flexDirection: 'row', gap: 10, marginTop: 40,
                }}>
                    <Animated.View style={{
                        opacity: dot1,
                        width: 8, height: 8, borderRadius: 4, backgroundColor: '#F59E0B',
                    }} />
                    <Animated.View style={{
                        opacity: dot2,
                        width: 8, height: 8, borderRadius: 4, backgroundColor: '#F59E0B',
                    }} />
                    <Animated.View style={{
                        opacity: dot3,
                        width: 8, height: 8, borderRadius: 4, backgroundColor: '#F59E0B',
                    }} />
                </View>
            </Animated.View>

            {/* Bottom tagline */}
            <Animated.Text style={{
                position: 'absolute', bottom: 50,
                fontFamily: 'Outfit_400Regular', fontSize: 12,
                color: 'rgba(255,255,255,0.25)', letterSpacing: 0.5,
                opacity: subtitleFade,
            }}>
                Wura • Afrique ↔ Europe
            </Animated.Text>
        </View>
    );
}
