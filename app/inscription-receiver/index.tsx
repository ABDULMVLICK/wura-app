import { signInWithCustomToken } from "@react-native-firebase/auth";
import { Link, useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useState } from "react";
import { ActivityIndicator, Alert, Image, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { FadeInView } from "../../components/FadeInView";
import { useWeb3Auth } from "../../contexts/Web3AuthContext";
import api from "../../lib/api";
import { auth } from "../../lib/firebase";
import { AuthService } from "../../services/auth";

export default function ReceiverSignupScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const { loginWithGoogle } = useWeb3Auth();

    const handleGoogleSignup = async () => {
        setLoading(true);
        try {
            // 1. Web3Auth login Google → 1 seul dialog → retourne wallet + idToken Web3Auth
            const web3AuthResult = await loginWithGoogle();
            if (!web3AuthResult) {
                throw new Error("Connexion Web3Auth annulée.");
            }

            const walletAddress = web3AuthResult.address;

            // 2. Échange le JWT Web3Auth contre un Firebase Custom Token via le backend
            // (Web3Auth SAPPHIRE_DEVNET ne retourne pas oAuthIdToken, seulement son propre idToken)
            const web3AuthIdToken = web3AuthResult.userInfo?.idToken;
            if (!web3AuthIdToken) {
                throw new Error("Token Web3Auth introuvable.");
            }

            const { data } = await api.post<{ firebaseToken: string }>(
                '/auth/firebase-custom-token',
                { idToken: web3AuthIdToken }
            );

            // 3. Authentification Firebase avec le custom token
            const userCredential = await signInWithCustomToken(auth, data.firebaseToken);
            const user = userCredential.user;

            // 4. Crée le profil PostgreSQL
            await AuthService.registerReceiver({
                firstName: web3AuthResult.userInfo?.name?.split(" ")[0] || "",
                lastName: web3AuthResult.userInfo?.name?.split(" ").slice(1).join(" ") || "",
                web3AuthWalletAddress: walletAddress,
            });

            Toast.show({
                type: 'success',
                text1: 'Compte Créé',
                text2: 'Bienvenue sur Wura !'
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
            <View className="flex-1 items-center justify-center p-5">
                <FadeInView delay={0} className="w-full max-w-md flex-col gap-4 rounded-[32px] bg-muted px-8 py-6"
                    style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 20, elevation: 3 }}>
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
                            source={require("../../assets/images/wuralogo-removebg-preview.png")}
                            style={{ width: 280, height: 80 }}
                            resizeMode="contain"
                        />
                        <Text className="text-sm text-muted-foreground text-center">
                            Créez votre compte pour recevoir de l'argent
                        </Text>
                    </View>

                    {/* Google Sign Up */}
                    <View className="items-center gap-7">
                        <View className="w-24 h-24 rounded-full bg-white items-center justify-center"
                            style={{ shadowColor: '#FFD700', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 16, elevation: 4 }}>
                            <Image
                                source={{ uri: "https://www.google.com/favicon.ico" }}
                                className="w-12 h-12"
                                resizeMode="contain"
                            />
                        </View>

                        <Text className="text-center text-sm text-muted-foreground px-4">
                            Inscrivez-vous avec votre compte Google pour commencer à recevoir de l'argent en Europe.
                        </Text>

                        <TouchableOpacity
                            onPress={handleGoogleSignup}
                            disabled={loading}
                            className="flex-row w-full items-center justify-center gap-3 rounded-full bg-white border-2 border-gray-100 px-6 py-5 active:opacity-80"
                            style={loading ? { opacity: 0.6 } : { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 16, elevation: 3 }}
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
                                    <Text className="text-lg font-bold text-gray-700">
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
                </FadeInView>
            </View>
        </SafeAreaView >
    );
}
