import { Link, useRouter } from "expo-router";
import { ArrowLeft, ArrowRight, Phone, ShieldCheck } from "lucide-react-native";
import { useRef, useState } from "react";
import { Image, KeyboardAvoidingView, Platform, SafeAreaView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { FormField } from "../../components/FormField";

export default function SenderLoginScreen() {
    const router = useRouter();
    const [step, setStep] = useState<"phone" | "otp">("phone");
    const [telephone, setTelephone] = useState("");
    const [otp, setOtp] = useState(["", "", "", ""]);
    const otpRefs = useRef<(TextInput | null)[]>([]);

    const handleSendCode = () => {
        // Mock sending OTP code
        setStep("otp");
    };

    const handleVerifyOtp = () => {
        // Mock OTP verification — navigate to sender home
        router.replace("/sender-home");
    };

    const handleOtpChange = (text: string, index: number) => {
        const newOtp = [...otp];
        newOtp[index] = text;
        setOtp(newOtp);

        // Auto-focus next input
        if (text && index < 3) {
            otpRefs.current[index + 1]?.focus();
        }

        // Auto-submit when all filled
        if (index === 3 && text) {
            setTimeout(() => handleVerifyOtp(), 300);
        }
    };

    const handleOtpKeyPress = (key: string, index: number) => {
        if (key === "Backspace" && !otp[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-background">
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                className="flex-1"
            >
                <View className="flex-1 items-center justify-center p-4">
                    <View className="w-full max-w-md flex-col gap-8 rounded-3xl bg-muted px-6 py-10">
                        {/* Back button */}
                        <TouchableOpacity
                            onPress={() => {
                                if (step === "otp") {
                                    setStep("phone");
                                    setOtp(["", "", "", ""]);
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
                        <View className="items-center gap-3">
                            <Text className="text-3xl font-extrabold tracking-tight text-foreground italic lowercase">
                                wura<Text className="text-[#F59E0B]">.</Text>
                            </Text>
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
                                    className="mt-4 flex-row w-full items-center justify-center gap-3 rounded-2xl bg-[#064E3B] px-6 py-4 active:opacity-80"
                                >
                                    <Text className="text-base font-semibold text-white">
                                        Recevoir le code
                                    </Text>
                                    <ArrowRight size={20} color="white" />
                                </TouchableOpacity>

                                {/* Separator */}
                                <View className="my-6 flex-row items-center gap-4">
                                    <View className="h-[1px] flex-1 bg-gray-200" />
                                    <Text className="text-xs text-muted-foreground uppercase">Ou continuer avec</Text>
                                    <View className="h-[1px] flex-1 bg-gray-200" />
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

                                {/* OTP Input */}
                                <View className="flex-row gap-3 justify-center">
                                    {otp.map((digit, index) => (
                                        <TextInput
                                            key={index}
                                            ref={(ref) => { otpRefs.current[index] = ref; }}
                                            value={digit}
                                            onChangeText={(text) => handleOtpChange(text.replace(/[^0-9]/g, "").slice(-1), index)}
                                            onKeyPress={({ nativeEvent }) => handleOtpKeyPress(nativeEvent.key, index)}
                                            keyboardType="number-pad"
                                            maxLength={1}
                                            className="w-14 h-16 rounded-2xl border-2 border-border bg-card text-center text-2xl font-bold text-foreground"
                                            selectionColor="#F59E0B"
                                            autoFocus={index === 0}
                                        />
                                    ))}
                                </View>

                                <TouchableOpacity
                                    onPress={handleVerifyOtp}
                                    className="flex-row w-full items-center justify-center gap-3 rounded-2xl bg-[#064E3B] px-6 py-4 active:opacity-80"
                                >
                                    <Text className="text-base font-semibold text-white">
                                        Vérifier
                                    </Text>
                                    <ArrowRight size={20} color="white" />
                                </TouchableOpacity>

                                <TouchableOpacity onPress={handleSendCode}>
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
