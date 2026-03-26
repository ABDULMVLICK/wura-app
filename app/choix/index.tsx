import { useRouter } from "expo-router";
import { ArrowRight, Download, Send } from "lucide-react-native";
import { Image, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AnimatedPressable } from "../../components/AnimatedPressable";
import { FadeInView } from "../../components/FadeInView";

export default function ChoiceScreen() {
    const router = useRouter();

    return (
        <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: '#14533d' }}>
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>

                {/* Logo + Subtitle */}
                <FadeInView delay={0} style={{ alignItems: 'center', marginBottom: 48 }}>
                    <Image
                        source={require("../../assets/images/wuraa-removebg-logoVersionDark.png")}
                        style={{ width: 400, height: 130 }}
                        resizeMode="contain"
                    />
                    <Text style={{
                        fontFamily: 'Outfit_400Regular', fontSize: 15,
                        color: 'rgba(255,255,255,0.55)', marginTop: 16,
                        textAlign: 'center',
                    }}>
                        Que souhaitez-vous faire ?
                    </Text>
                </FadeInView>

                {/* Choice Cards */}
                <View style={{ width: '100%', maxWidth: 380 }}>

                    {/* Choice 1: Send from Africa */}
                    <FadeInView delay={200} style={{ marginBottom: 16 }}>
                        <AnimatedPressable
                            onPress={() => router.push("/inscription-sender")}
                            style={{
                                backgroundColor: 'rgba(255,255,255,0.1)',
                                borderRadius: 24, padding: 20,
                                borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
                            }}
                        >
                            {/* Row: Icon left + Content right */}
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <View style={{
                                    width: 52, height: 52, borderRadius: 16,
                                    backgroundColor: '#064E3B',
                                    alignItems: 'center', justifyContent: 'center',
                                    marginRight: 16,
                                }}>
                                    <Send size={22} color="white" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <Text style={{
                                            fontFamily: 'Outfit_700Bold', fontSize: 16, color: '#ffffff',
                                            flex: 1,
                                        }}>
                                            Envoyer depuis l'Afrique
                                        </Text>
                                        <ArrowRight size={18} color="rgba(255,255,255,0.6)" style={{ marginLeft: 8 }} />
                                    </View>
                                    <Text style={{
                                        fontFamily: 'Outfit_400Regular', fontSize: 13,
                                        color: 'rgba(255,255,255,0.5)', marginTop: 4,
                                    }}>
                                        Envoyez de l'argent vers l'Europe
                                    </Text>
                                </View>
                            </View>
                        </AnimatedPressable>
                    </FadeInView>

                    {/* Choice 2: Receive in Europe */}
                    <FadeInView delay={350}>
                        <AnimatedPressable
                            onPress={() => router.push("/inscription-receiver")}
                            style={{
                                backgroundColor: 'rgba(255,255,255,0.1)',
                                borderRadius: 24, padding: 20,
                                borderWidth: 1, borderColor: 'rgba(245,158,11,0.25)',
                            }}
                        >
                            {/* Row: Icon left + Content right */}
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <View style={{
                                    width: 52, height: 52, borderRadius: 16,
                                    backgroundColor: '#F59E0B',
                                    alignItems: 'center', justifyContent: 'center',
                                    marginRight: 16,
                                }}>
                                    <Download size={22} color="white" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <Text style={{
                                            fontFamily: 'Outfit_700Bold', fontSize: 16, color: '#ffffff',
                                            flex: 1,
                                        }}>
                                            Recevoir en Europe
                                        </Text>
                                        <ArrowRight size={18} color="rgba(245,158,11,0.7)" style={{ marginLeft: 8 }} />
                                    </View>
                                    <Text style={{
                                        fontFamily: 'Outfit_400Regular', fontSize: 13,
                                        color: 'rgba(255,255,255,0.5)', marginTop: 4,
                                    }}>
                                        Recevez de l'argent depuis l'Afrique
                                    </Text>
                                </View>
                            </View>
                        </AnimatedPressable>
                    </FadeInView>
                </View>

                {/* Bottom tagline */}
                <Text style={{
                    position: 'absolute', bottom: 24,
                    fontFamily: 'Outfit_400Regular', fontSize: 12,
                    color: 'rgba(255,255,255,0.25)', letterSpacing: 0.5,
                }}>
                    Sécurisé • Rapide • Sans frontières
                </Text>
            </View>
        </SafeAreaView>
    );
}
