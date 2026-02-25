import { GoogleAuthProvider, signInWithCredential } from "@react-native-firebase/auth";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { Link, useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { useState } from "react";
import { ActivityIndicator, Alert, Image, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { useWeb3Auth } from "../../contexts/Web3AuthContext";
import { auth } from "../../lib/firebase";
import { AuthService } from "../../services/auth";

// Configure Google Sign-In (le webClientId vient de la console Firebase)
GoogleSignin.configure({
    webClientId: "107069302242-7gfurhktqt5etgs5u0241qsrbvcmcvce.apps.googleusercontent.com",
    iosClientId: "107069302242-jcvddehcuprc88ab0lcb0admb52tmqko.apps.googleusercontent.com",
});

export default function ReceiverSignupScreen() {
    const router = useRouter();
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === "dark";
    const [loading, setLoading] = useState(false);

    const { loginWithGoogle } = useWeb3Auth();

    const handleGoogleSignup = async () => {
        setLoading(true);
        try {
            // 1. Google Sign-In natif pour obtenir le token Google
            await GoogleSignin.hasPlayServices();
            const signInResult = await GoogleSignin.signIn();
            const googleIdToken = signInResult?.data?.idToken;

            if (!googleIdToken) {
                throw new Error("Impossible de récupérer le token Google.");
            }

            // 2. Authentification Firebase avec le token Google
            const googleCredential = GoogleAuthProvider.credential(googleIdToken);
            const userCredential = await signInWithCredential(auth, googleCredential);
            const user = userCredential.user;

            // 3. Création du wallet via Web3Auth (en arrière-plan)
            let walletAddress = "";
            try {
                const web3AuthResult = await loginWithGoogle();
                if (web3AuthResult?.address) {
                    walletAddress = web3AuthResult.address;
                }
            } catch (walletError: any) {
                console.warn("[Signup] Web3Auth wallet creation failed, continuing without wallet:", walletError.message);
            }

            // 4. Crée le profil PostgreSQL
            await AuthService.registerReceiver({
                firstName: user.displayName?.split(" ")[0] || "",
                lastName: user.displayName?.split(" ").slice(1).join(" ") || "",
                web3AuthWalletAddress: walletAddress,
            });

            Toast.show({
                type: 'success',
                text1: walletAddress ? 'Wallet Généré' : 'Compte Créé',
                text2: walletAddress ? `Adresse: ${walletAddress.substring(0, 8)}...` : 'Bienvenue sur Wura!'
            });

            // 5. Termine le Onboarding
            router.replace("/wura-id");
        } catch (error: any) {
            console.error("Erreur Google Sign-In:", error);

            if (auth.currentUser && error.message?.includes("permission-denied")) {
                try {
                    await auth.currentUser.delete();
                } catch (e) {
                    console.error("Impossible de supprimer le compte fantôme", e);
                }
            }

            if (error.code !== "SIGN_IN_CANCELLED" && error.code !== "12501") {
                Alert.alert(
                    "Erreur d'inscription",
                    error?.message || "Impossible de finaliser l'inscription."
                );
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background">
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
                            style={{ width: 280, height: 80 }}
                            resizeMode="contain"
                        />
                        <Text className="text-sm text-muted-foreground text-center">
                            Créez votre compte pour recevoir de l'argent
                        </Text>
                    </View>

                    {/* Google Sign Up */}
                    <View className="items-center gap-6">
                        <View className="w-20 h-20 rounded-full bg-white items-center justify-center shadow-lg shadow-black/10">
                            <Image
                                source={{ uri: "https://www.google.com/favicon.ico" }}
                                className="w-10 h-10"
                                resizeMode="contain"
                            />
                        </View>

                        <Text className="text-center text-sm text-muted-foreground px-4">
                            Inscrivez-vous avec votre compte Google pour commencer à recevoir de l'argent en Europe.
                        </Text>

                        <TouchableOpacity
                            onPress={handleGoogleSignup}
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
                                        S'inscrire avec Google
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>

                        <View className="mt-2 flex-row justify-center gap-1">
                            <Text className="text-sm text-muted-foreground">
                                Vous avez déjà un compte ?
                            </Text>
                            <Link href="/connexion-receiver" asChild>
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
        </SafeAreaView>
    );
}
