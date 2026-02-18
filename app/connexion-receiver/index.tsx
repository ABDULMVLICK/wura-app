import { View, Text, SafeAreaView, TouchableOpacity, Image } from "react-native";
import { Link, useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";

export default function ReceiverLoginScreen() {
    const router = useRouter();

    const handleGoogleLogin = () => {
        // Mock Google login — navigate to receiver home
        router.replace("/accueil");
    };

    return (
        <SafeAreaView className="flex-1 bg-background">
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
                            Connectez-vous pour recevoir votre argent
                        </Text>
                    </View>

                    {/* Google Login */}
                    <View className="items-center gap-6">
                        <View className="w-20 h-20 rounded-full bg-white items-center justify-center shadow-lg shadow-black/10">
                            <Image
                                source={{ uri: "https://www.google.com/favicon.ico" }}
                                className="w-10 h-10"
                                resizeMode="contain"
                            />
                        </View>

                        <Text className="text-center text-sm text-muted-foreground px-4">
                            Connectez-vous avec votre compte Google pour accéder à vos fonds.
                        </Text>

                        <TouchableOpacity
                            onPress={handleGoogleLogin}
                            className="flex-row w-full items-center justify-center gap-3 rounded-2xl bg-white border-2 border-gray-200 px-6 py-4 active:opacity-80 shadow-sm"
                        >
                            <Image
                                source={{ uri: "https://developers.google.com/identity/images/g-logo.png" }}
                                className="w-5 h-5"
                                resizeMode="contain"
                            />
                            <Text className="text-base font-semibold text-gray-700">
                                Se connecter avec Google
                            </Text>
                        </TouchableOpacity>

                        <View className="mt-2 flex-row justify-center gap-1">
                            <Text className="text-sm text-muted-foreground">
                                Pas encore de compte ?
                            </Text>
                            <Link href="/inscription-receiver" asChild>
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
        </SafeAreaView>
    );
}
