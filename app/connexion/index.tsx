import { Link, useRouter } from "expo-router";
import { ArrowRight, Lock, Mail } from "lucide-react-native";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AnimatedPressable } from "../../components/AnimatedPressable";
import { FadeInView } from "../../components/FadeInView";
import { FormField } from "../../components/FormField";
import { WuraLogo } from "../../components/WuraLogo";

export default function LoginScreen() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleLogin = () => {
        // Mock authentication
        router.push("/sender-home");
    };

    return (
        <SafeAreaView className="flex-1 bg-background">
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                className="flex-1"
            >
                <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
                    <View className="flex-1 items-center justify-center p-5">
                        <View className="w-full max-w-md flex-col gap-10 rounded-[32px] bg-muted px-8 py-12"
                            style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 20, elevation: 3 }}>
                            <FadeInView delay={0}>
                                <WuraLogo />
                            </FadeInView>

                            <FadeInView delay={150}>
                                <View>
                                    <FormField
                                        label="Adresse email"
                                        icon={<Mail size={20} className="text-accent" color="#f59e0b" />}
                                        placeholder="jean@exemple.com"
                                        keyboardType="email-address"
                                        value={email}
                                        onChangeText={setEmail}
                                    />

                                    <FormField
                                        label="Mot de passe"
                                        icon={<Lock size={20} className="text-accent" color="#f59e0b" />}
                                        placeholder="Entrez votre mot de passe"
                                        type="password"
                                        value={password}
                                        onChangeText={setPassword}
                                    />

                                    <View className="flex-row justify-end mb-4">
                                        <TouchableOpacity>
                                            <Text className="text-sm font-medium text-primary">
                                                Mot de passe oublié ?
                                            </Text>
                                        </TouchableOpacity>
                                    </View>

                                    <AnimatedPressable
                                        onPress={handleLogin}
                                        className="mt-4 flex-row w-full items-center justify-center gap-3 rounded-full bg-primary px-6 py-5"
                                        style={{ shadowColor: '#00F5A0', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 8 }}
                                    >
                                        <Text className="text-lg font-bold text-white">
                                            Se connecter
                                        </Text>
                                        <ArrowRight size={20} color="white" />
                                    </AnimatedPressable>

                                    <View className="mt-6 flex-row justify-center gap-1">
                                        <Text className="text-sm text-muted-foreground">
                                            Pas encore de compte ?
                                        </Text>
                                        <Link href="/" asChild>
                                            <TouchableOpacity>
                                                <Text className="text-sm font-semibold text-foreground underline">
                                                    Créer un compte
                                                </Text>
                                            </TouchableOpacity>
                                        </Link>
                                    </View>
                                </View>
                            </FadeInView>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
