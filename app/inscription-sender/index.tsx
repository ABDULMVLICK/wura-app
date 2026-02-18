import { Link, useRouter } from "expo-router";
import { ArrowLeft, ArrowRight, Phone, User } from "lucide-react-native";
import { useState } from "react";
import { Image, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { FormField } from "../../components/FormField";

export default function SenderSignupScreen() {
    const router = useRouter();
    const [nom, setNom] = useState("");
    const [prenom, setPrenom] = useState("");
    const [telephone, setTelephone] = useState("");

    const handleSignup = () => {
        // Mock signup — navigate to sender home
        router.replace("/sender-home");
    };

    return (
        <SafeAreaView className="flex-1 bg-background">
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                className="flex-1"
            >
                <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
                    <View className="flex-1 items-center justify-center p-4">
                        <View className="w-full max-w-md flex-col gap-8 rounded-3xl bg-muted px-6 py-10">
                            {/* Back button */}
                            <TouchableOpacity
                                onPress={() => router.back()}
                                className="flex-row items-center gap-2"
                            >
                                <ArrowLeft size={20} color="#6b7280" />
                                <Text className="text-sm text-muted-foreground">Retour</Text>
                            </TouchableOpacity>

                            {/* Logo */}
                            <View className="items-center gap-3">
                                <Text className="text-3xl font-extrabold tracking-tight text-foreground italic lowercase">
                                    wura<Text className="text-[#F59E0B]">.</Text>
                                </Text>
                                <Text className="text-sm text-muted-foreground text-center">
                                    Créez votre compte pour envoyer de l'argent
                                </Text>
                            </View>

                            {/* Form */}
                            <View>
                                <FormField
                                    label="Nom"
                                    icon={<User size={20} color="#f59e0b" />}
                                    placeholder="Dupont"
                                    value={nom}
                                    onChangeText={setNom}
                                    autoCapitalize="words"
                                />

                                <FormField
                                    label="Prénom"
                                    icon={<User size={20} color="#f59e0b" />}
                                    placeholder="Jean"
                                    value={prenom}
                                    onChangeText={setPrenom}
                                    autoCapitalize="words"
                                />

                                <FormField
                                    label="Numéro de téléphone"
                                    icon={<Phone size={20} color="#f59e0b" />}
                                    placeholder="+225 XX XX XX XX"
                                    keyboardType="phone-pad"
                                    value={telephone}
                                    onChangeText={setTelephone}
                                />

                                <TouchableOpacity
                                    onPress={handleSignup}
                                    className="mt-4 flex-row w-full items-center justify-center gap-3 rounded-2xl bg-[#064E3B] px-6 py-4 active:opacity-80"
                                >
                                    <Text className="text-base font-semibold text-white">
                                        Créer mon compte
                                    </Text>
                                    <ArrowRight size={20} color="white" />
                                </TouchableOpacity>

                                {/* Separator */}
                                <View className="my-6 flex-row items-center gap-4">
                                    <View className="h-[1px] flex-1 bg-border/50" />
                                    <Text className="text-xs text-muted-foreground uppercase">Ou continuer avec</Text>
                                    <View className="h-[1px] flex-1 bg-border/50" />
                                </View>

                                {/* Google Sign-In Button */}
                                <TouchableOpacity
                                    className="flex-row w-full items-center justify-center gap-3 rounded-2xl bg-white border border-gray-200 px-6 py-4 active:opacity-80 shadow-sm"
                                >
                                    <Image
                                        source={{ uri: "https://developers.google.com/identity/images/g-logo.png" }}
                                        className="w-5 h-5"
                                        resizeMode="contain"
                                    />
                                    <Text className="text-base font-semibold text-gray-700">
                                        Google
                                    </Text>
                                </TouchableOpacity>

                                <View className="mt-6 flex-row justify-center gap-1">
                                    <Text className="text-sm text-muted-foreground">
                                        Vous avez déjà un compte ?
                                    </Text>
                                    <Link href="/connexion-sender" asChild>
                                        <TouchableOpacity>
                                            <Text className="text-sm font-semibold text-foreground underline">
                                                Se connecter
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
