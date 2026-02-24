import type { FirebaseAuthTypes } from "@react-native-firebase/auth";
import { signInWithPhoneNumber } from "@react-native-firebase/auth";
import { Link, useRouter } from "expo-router";
import { ArrowLeft, ArrowRight, Phone, User } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { useState } from "react";
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FormField } from "../../components/FormField";
import { useAuth } from "../../contexts/AuthContext";
import { auth } from "../../lib/firebase";
import { AuthService } from "../../services/auth";

export default function SenderSignupScreen() {
    const { refreshProfile } = useAuth();
    const router = useRouter();
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === "dark";
    const [nom, setNom] = useState("");
    const [prenom, setPrenom] = useState("");
    const [telephone, setTelephone] = useState("");
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<"form" | "otp">("form");
    const [confirmation, setConfirmation] = useState<FirebaseAuthTypes.ConfirmationResult | null>(null);
    const [otp, setOtp] = useState("");

    const handleSendCode = async () => {
        if (!nom.trim() || !prenom.trim() || !telephone.trim()) {
            Alert.alert("Erreur", "Veuillez remplir tous les champs.");
            return;
        }

        setLoading(true);
        try {
            // Envoie un vrai SMS OTP via Firebase
            const confirm = await signInWithPhoneNumber(auth, telephone);
            setConfirmation(confirm);
            setStep("otp");
        } catch (error: any) {
            console.error("Erreur envoi SMS:", error);
            Alert.alert(
                "Erreur",
                error?.message || "Impossible d'envoyer le code. Vérifiez le numéro de téléphone."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!confirmation) return;
        if (!otp.trim() || otp.length < 4) {
            Alert.alert("Erreur", "Veuillez entrer le code de vérification.");
            return;
        }

        setLoading(true);
        try {
            // Vérifie le code OTP
            const userCredential = await confirmation.confirm(otp);
            const user = userCredential?.user;

            if (user) {
                // Crée le profil dans PostgreSQL (NestJS)
                await AuthService.registerSender({
                    firstName: prenom,
                    lastName: nom,
                    country: "CIV", // Par défaut ou à rajouter dans le form
                });
                await refreshProfile();
                // La redirection est gérée par AuthContext dans _layout.tsx
            }
        } catch (error: any) {
            console.error("Erreur vérification OTP:", error);
            Alert.alert(
                "Code invalide",
                "Le code de vérification est incorrect. Veuillez réessayer."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background">
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                className="flex-1"
            >
                <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
                    <View className="flex-1 items-center justify-center p-4">
                        <View className="w-full max-w-md flex-col gap-3 rounded-3xl bg-muted px-6 py-4">
                            {/* Back button */}
                            <TouchableOpacity
                                onPress={() => {
                                    if (step === "otp") {
                                        setStep("form");
                                        setOtp("");
                                    } else {
                                        router.back();
                                    }
                                }}
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
                                    {step === "form"
                                        ? "Créez votre compte pour envoyer de l'argent"
                                        : `Entrez le code envoyé au ${telephone}`
                                    }
                                </Text>
                            </View>

                            {step === "form" ? (
                                /* Registration Form */
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
                                        onPress={handleSendCode}
                                        disabled={loading}
                                        className="mt-4 flex-row w-full items-center justify-center gap-3 rounded-2xl bg-[#064E3B] px-6 py-4 active:opacity-80"
                                        style={loading ? { opacity: 0.6 } : {}}
                                    >
                                        {loading ? (
                                            <ActivityIndicator color="white" />
                                        ) : (
                                            <>
                                                <Text className="text-base font-semibold text-white">
                                                    Créer mon compte
                                                </Text>
                                                <ArrowRight size={20} color="white" />
                                            </>
                                        )}
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
                            ) : (
                                /* OTP Verification Step */
                                <View>
                                    <FormField
                                        label="Code de vérification"
                                        icon={<Phone size={20} color="#f59e0b" />}
                                        placeholder="123456"
                                        keyboardType="number-pad"
                                        value={otp}
                                        onChangeText={setOtp}
                                    />

                                    <TouchableOpacity
                                        onPress={handleVerifyOtp}
                                        disabled={loading}
                                        className="mt-4 flex-row w-full items-center justify-center gap-3 rounded-2xl bg-[#064E3B] px-6 py-4 active:opacity-80"
                                        style={loading ? { opacity: 0.6 } : {}}
                                    >
                                        {loading ? (
                                            <ActivityIndicator color="white" />
                                        ) : (
                                            <>
                                                <Text className="text-base font-semibold text-white">
                                                    Vérifier et créer le compte
                                                </Text>
                                                <ArrowRight size={20} color="white" />
                                            </>
                                        )}
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        onPress={handleSendCode}
                                        className="mt-4 items-center"
                                    >
                                        <Text className="text-sm font-medium text-[#064E3B]">
                                            Renvoyer le code
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
