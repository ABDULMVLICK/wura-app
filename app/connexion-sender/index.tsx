import { zodResolver } from "@hookform/resolvers/zod";
import type { FirebaseAuthTypes } from "@react-native-firebase/auth";
import { signInWithPhoneNumber } from "@react-native-firebase/auth";
import { Link, useRouter } from "expo-router";
import { ArrowLeft, ArrowRight, Phone, ShieldCheck } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as z from "zod";
import { FormField } from "../../components/FormField";
import { auth } from "../../lib/firebase";

const phoneSchema = z.object({
    telephone: z.string().min(8, "Le numéro de téléphone est trop court").regex(/^\+?[0-9\s-]+$/, "Le numéro de téléphone est invalide"),
});
type PhoneFormValues = z.infer<typeof phoneSchema>;

export default function SenderLoginScreen() {
    const router = useRouter();
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === "dark";
    const [step, setStep] = useState<"phone" | "otp">("phone");
    const { control, handleSubmit, formState: { errors }, watch } = useForm<PhoneFormValues>({
        resolver: zodResolver(phoneSchema),
        defaultValues: { telephone: "" }
    });
    const telephone = watch("telephone");

    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [loading, setLoading] = useState(false);
    const [confirmation, setConfirmation] = useState<FirebaseAuthTypes.ConfirmationResult | null>(null);
    const otpRefs = useRef<(TextInput | null)[]>([]);

    const onSubmitPhone = async (data: PhoneFormValues) => {
        setLoading(true);
        try {
            const confirm = await signInWithPhoneNumber(auth, data.telephone);
            setConfirmation(confirm);
            setStep("otp");
        } catch (error: any) {
            console.error("Erreur envoi SMS:", error);
            const errorMessage = error?.message || "";
            if (errorMessage.includes("BILLING_NOT_ENABLED") || errorMessage.includes("billing-not")) {
                Alert.alert(
                    "Firebase Billing requis",
                    "L'envoi de SMS nécessite le plan Blaze (payant) sur Firebase.\n\n" +
                    "Pour développer sans payer :\n" +
                    "1. Va sur Firebase Console → Authentication → Sign-in method → Phone\n" +
                    "2. Ajoute un numéro de test (ex: +33 6 12 34 56 78 / code: 123456)\n" +
                    "3. Réessaie avec ce numéro"
                );
            } else {
                Alert.alert(
                    "Erreur",
                    error?.message || "Impossible d'envoyer le code. Vérifiez votre numéro."
                );
            }
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (autoCode?: string) => {
        if (!confirmation) return;

        const code = autoCode || otp.join("");
        if (code.length < 6) {
            Alert.alert("Erreur", "Veuillez entrer le code complet.");
            return;
        }

        setLoading(true);
        try {
            await confirmation.confirm(code);
            // La redirection est gérée automatiquement par AuthContext dans _layout.tsx
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

    const handleOtpChange = (text: string, index: number) => {
        const newOtp = [...otp];
        newOtp[index] = text;
        setOtp(newOtp);

        // Auto-focus next input
        if (text && index < 5) {
            otpRefs.current[index + 1]?.focus();
        }

        // Auto-submit when all filled
        if (index === 5 && text) {
            const codeArray = [...newOtp];
            if (codeArray.every(d => d !== "")) {
                setTimeout(() => handleVerifyOtp(codeArray.join("")), 300);
            }
        }
    };

    const handleOtpKeyPress = (key: string, index: number) => {
        if (key === "Backspace" && !otp[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
    };

    return (
        <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background">
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                className="flex-1"
            >
                <View className="flex-1 items-center justify-center p-4">
                    <View className="w-full max-w-md flex-col gap-3 rounded-3xl bg-muted px-6 py-4">
                        {/* Back button */}
                        <TouchableOpacity
                            onPress={() => {
                                if (step === "otp") {
                                    setStep("phone");
                                    setOtp(["", "", "", "", "", ""]);
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
                                {step === "phone"
                                    ? "Connectez-vous avec votre numéro de téléphone"
                                    : "Entrez le code de vérification"
                                }
                            </Text>
                        </View>

                        {step === "phone" ? (
                            /* Phone Input Step */
                            <View>
                                <Controller
                                    control={control}
                                    name="telephone"
                                    render={({ field: { onChange, value } }) => (
                                        <View>
                                            <FormField
                                                label="Numéro de téléphone"
                                                icon={<Phone size={20} color="#f59e0b" />}
                                                placeholder="+225 XX XX XX XX"
                                                keyboardType="phone-pad"
                                                value={value}
                                                onChangeText={onChange}
                                            />
                                            {errors.telephone && <Text className="text-red-500 text-xs mt-1 ml-1">{errors.telephone.message}</Text>}
                                        </View>
                                    )}
                                />

                                <TouchableOpacity
                                    onPress={handleSubmit(onSubmitPhone)}
                                    disabled={loading}
                                    className="mt-4 flex-row w-full items-center justify-center gap-3 rounded-2xl bg-[#064E3B] px-6 py-4 active:opacity-80"
                                    style={loading ? { opacity: 0.6 } : {}}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="white" />
                                    ) : (
                                        <>
                                            <Text className="text-base font-semibold text-white">
                                                Recevoir le code
                                            </Text>
                                            <ArrowRight size={20} color="white" />
                                        </>
                                    )}
                                </TouchableOpacity>

                                <View className="mt-6 flex-row justify-center gap-1">
                                    <Text className="text-sm text-muted-foreground">
                                        Pas encore de compte ?
                                    </Text>
                                    <Link href="/inscription-sender" asChild>
                                        <TouchableOpacity>
                                            <Text className="text-sm font-semibold text-foreground underline">
                                                Créer un compte
                                            </Text>
                                        </TouchableOpacity>
                                    </Link>
                                </View>
                            </View>
                        ) : (
                            /* OTP Verification Step */
                            <View className="items-center gap-6">
                                <View className="w-16 h-16 rounded-full bg-[#064E3B]/10 items-center justify-center">
                                    <ShieldCheck size={32} color="#064E3B" />
                                </View>

                                <Text className="text-center text-sm text-muted-foreground">
                                    Un code a été envoyé au{"\n"}
                                    <Text className="font-bold text-foreground">{telephone}</Text>
                                </Text>

                                {/* OTP Input (6 digits for Firebase) */}
                                <View className="flex-row gap-2 justify-center">
                                    {otp.map((digit, index) => (
                                        <TextInput
                                            key={index}
                                            ref={(ref) => { otpRefs.current[index] = ref; }}
                                            value={digit}
                                            onChangeText={(text) => handleOtpChange(text.replace(/[^0-9]/g, "").slice(-1), index)}
                                            onKeyPress={({ nativeEvent }) => handleOtpKeyPress(nativeEvent.key, index)}
                                            keyboardType="number-pad"
                                            maxLength={1}
                                            className="w-12 h-14 rounded-2xl border-2 border-border bg-card text-center text-2xl font-bold text-foreground"
                                            selectionColor="#F59E0B"
                                            autoFocus={index === 0}
                                        />
                                    ))}
                                </View>

                                <TouchableOpacity
                                    onPress={() => handleVerifyOtp()}
                                    disabled={loading}
                                    className="flex-row w-full items-center justify-center gap-3 rounded-2xl bg-[#064E3B] px-6 py-4 active:opacity-80"
                                    style={loading ? { opacity: 0.6 } : {}}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="white" />
                                    ) : (
                                        <>
                                            <Text className="text-base font-semibold text-white">
                                                Vérifier
                                            </Text>
                                            <ArrowRight size={20} color="white" />
                                        </>
                                    )}
                                </TouchableOpacity>

                                <TouchableOpacity onPress={handleSubmit(onSubmitPhone)}>
                                    <Text className="text-sm font-medium text-[#064E3B]">
                                        Renvoyer le code
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
