import { useState } from "react";
import { View, Text, ScrollView, SafeAreaView, TouchableOpacity, KeyboardAvoidingView, Platform } from "react-native";
import { Link, useRouter } from "expo-router";
import { Mail, Lock, ArrowRight } from "lucide-react-native";
import { WuraLogo } from "../../components/WuraLogo";
import { FormField } from "../../components/FormField";

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
                    <View className="flex-1 items-center justify-center p-4">
                        <View className="w-full max-w-md flex-col gap-10 rounded-3xl bg-muted px-6 py-12">
                            <WuraLogo />

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

                                <TouchableOpacity
                                    onPress={handleLogin}
                                    className="mt-2 flex-row w-full items-center justify-center gap-3 rounded-2xl bg-primary px-6 py-4 active:opacity-80"
                                >
                                    <Text className="text-base font-semibold text-white">
                                        Se connecter
                                    </Text>
                                    <ArrowRight size={20} color="white" />
                                </TouchableOpacity>

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
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
