import { GoogleAuthProvider, signInWithCredential } from "@react-native-firebase/auth";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { Link, useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { useState } from "react";
import {  ActivityIndicator, Alert, Image,  Text, TouchableOpacity, View  } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context";
import { auth } from "../../lib/firebase";

// Configure Google Sign-In (le webClientId vient de la console Firebase)
GoogleSignin.configure({
    webClientId: "107069302242-7gfurhktqt5etgs5u0241qsrbvcmcvce.apps.googleusercontent.com",
    iosClientId: "107069302242-jcvddehcuprc88ab0lcb0admb52tmqko.apps.googleusercontent.com",
});

export default function ReceiverLoginScreen() {
    const router = useRouter();
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === "dark";
    const [loading, setLoading] = useState(false);

    const handleGoogleLogin = async () => {
        setLoading(true);
        try {
            await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

            const signInResult = await GoogleSignin.signIn();

            const idToken = signInResult?.data?.idToken;
            if (!idToken) {
                throw new Error("Impossible de récupérer le token Google.");
            }

            const googleCredential = GoogleAuthProvider.credential(idToken);
            await signInWithCredential(auth, googleCredential);

            // La redirection est gérée automatiquement par AuthContext dans _layout.tsx
        } catch (error: any) {
            console.error("Erreur Google Sign-In:", error);
            if (error.code !== "SIGN_IN_CANCELLED") {
                Alert.alert(
                    "Erreur",
                    error?.message || "Impossible de se connecter avec Google."
                );
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-background">
            <View className="flex-1 items-center justify-center p-4">
                <View className="w-full max-w-md flex-col gap-3 rounded-3xl bg-muted px-6 py-4">
                    {/* Back button */}
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="flex-row items-center gap-2"
                    >
                        <ArrowLeft size={20} color="#6b7280" />
                        <Text className="text-sm text-muted-foreground">Retour</Text>
                    </TouchableOpacity>

                    {/* Logo */}
                    <View className="items-center gap-1">
                        <Image
                            source={isDark ? require("../../assets/images/wuraa-removebg-logoVersionDark.png") : require("../../assets/images/wuralogo-removebg-preview.png")}
                            style={{ width: 400, height: 110 }}
                            resizeMode="contain"
                        />
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
                            disabled={loading}
                            className="flex-row w-full items-center justify-center gap-3 rounded-2xl bg-white border-2 border-gray-200 px-6 py-4 active:opacity-80 shadow-sm"
                            style={loading ? { opacity: 0.6 } : {}}
                        >
                            {loading ? (
                                <ActivityIndicator color="#064E3B" />
                            ) : (
                                <>
                                    <Image
                                        source={{ uri: "https://developers.google.com/identity/images/g-logo.png" }}
                                        className="w-5 h-5"
                                        resizeMode="contain"
                                    />
                                    <Text className="text-base font-semibold text-gray-700">
                                        Se connecter avec Google
                                    </Text>
                                </>
                            )}
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
