import { zodResolver } from "@hookform/resolvers/zod";
import { clsx } from "clsx";
import { useRouter } from "expo-router";
import { ArrowRight, ChevronLeft, Info, MoreHorizontal } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Image, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as z from "zod";
import { useTransfer } from "../../contexts/TransferContext";
import { TransferService } from "../../services/transfers";

const beneficiarySchema = z.object({
    nom: z.string().min(2, "Le nom est trop court"),
    prenom: z.string().min(2, "Le prénom est trop court"),
});
type BeneficiaryFormValues = z.infer<typeof beneficiarySchema>;

// Reusable Floating Label Input Component
const FloatingLabelInput = ({
    label,
    value,
    onChangeText,
    onBlur: onInputBlur,
    autoCapitalize = "sentences",
    keyboardType = "default",
    error
}: any) => {
    const [isFocused, setIsFocused] = useState(false);
    const isFloating = isFocused || value.length > 0;

    return (
        <View className="relative group">
            <View className={clsx(
                "bg-white dark:bg-white/10 rounded-xl border transition-all duration-300 relative h-14 flex-row items-center",
                isFocused ? "border-[#F59E0B] shadow-sm shadow-[#F59E0B]/30" : "border-transparent shadow-sm"
            )}>
                <View className="flex-1 h-full relative">
                    <TextInput
                        className={clsx(
                            "block w-full h-full bg-transparent border-none pt-5 pb-1 px-4 text-sm font-medium text-gray-900 dark:text-white leading-tight",
                            error && "text-red-500"
                        )}
                        value={value}
                        onChangeText={onChangeText}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => {
                            setIsFocused(false);
                            if (onInputBlur) onInputBlur();
                        }}
                        placeholder=""
                        autoCapitalize={autoCapitalize}
                        keyboardType={keyboardType}
                    />
                    <Text className={clsx(
                        "absolute left-4 text-xs duration-200 z-10 origin-[0]",
                        isFloating
                            ? "transform -translate-y-2 top-2 text-[#F59E0B]"
                            : "transform top-4 text-gray-400 text-sm"
                    )}>
                        {label}
                    </Text>
                </View>
            </View>
            {error && <Text className="text-red-500 text-xs mt-1 ml-1">{error}</Text>}
        </View>
    );
};

export default function AddBeneficiaryScreen() {
    const router = useRouter();
    const { setRecipient } = useTransfer();
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === "dark";
    const {
        control,
        handleSubmit,
        formState: { errors }
    } = useForm<BeneficiaryFormValues>({
        resolver: zodResolver(beneficiarySchema),
        defaultValues: {
            nom: "",
            prenom: "",
        }
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    const onSubmit = async (data: BeneficiaryFormValues) => {
        setIsSubmitting(true);
        try {
            // Crée un compte receiver provisoire en base (wuraId auto-généré)
            const response = await TransferService.createRecipient({
                nom: data.nom,
                prenom: data.prenom,
            });

            const realWuraId = response.receiver?.wuraId || response.wuraId || `${data.prenom.replace(/\s+/g, '')}${data.nom.charAt(0).toUpperCase()}`;

            setRecipient({
                id: response.id || `new-${Date.now()}`,
                wuraId: realWuraId,
                nom: data.nom,
                prenom: data.prenom,
                iban: '',
                bic: '',
                banque: '',
                pays: '',
                isNew: true
            });

            router.push("/sender-home/confirmation-beneficiary");
        } catch (error) {
            console.error("Erreur lors de la création du bénéficiaire:", error);
            alert("Une erreur est survenue lors de l'enregistrement du bénéficiaire.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-[#f8f7f5] dark:bg-[#221b10]">
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                className="flex-1"
            >
                {/* Header */}
                <View className="relative px-6 py-4 flex-row items-center justify-between z-20">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="p-2 -ml-2 rounded-full active:bg-black/5 dark:active:bg-white/10"
                    >
                        <ChevronLeft size={24} color="#1f2937" />
                    </TouchableOpacity>

                    <View className="absolute left-0 right-0 top-0 bottom-0 items-center justify-center pointer-events-none z-[-1]">
                        <Image
                            source={isDark ? require("../../assets/images/wuraa-removebg-logoVersionDark.png") : require("../../assets/images/wuralogo-removebg-preview.png")}
                            style={{ width: 400, height: 110 }}
                            resizeMode="contain"
                        />
                    </View>

                    <TouchableOpacity className="p-2 -mr-2 rounded-full active:bg-black/5 dark:active:bg-white/10">
                        <MoreHorizontal size={24} color="#9ca3af" />
                    </TouchableOpacity>
                </View>

                {/* Subheader */}
                <View className="px-8 mt-2 mb-8 text-center items-center">
                    <Text className="text-xl font-semibold text-gray-900 dark:text-white">Nouveau Bénéficiaire</Text>
                    <Text className="text-sm text-gray-500 dark:text-gray-400 mt-1">Saisissez les informations du destinataire</Text>
                </View>

                <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
                    <View className="space-y-4 gap-4">

                        {/* Name Fields Row */}
                        <View className="flex-row gap-4">
                            <View className="flex-1">
                                <Controller
                                    control={control}
                                    name="nom"
                                    render={({ field: { onChange, onBlur, value } }) => (
                                        <FloatingLabelInput
                                            label="Nom"
                                            value={value}
                                            onChangeText={onChange}
                                            onBlur={onBlur}
                                            error={errors.nom?.message}
                                        />
                                    )}
                                />
                            </View>
                            <View className="flex-1">
                                <Controller
                                    control={control}
                                    name="prenom"
                                    render={({ field: { onChange, onBlur, value } }) => (
                                        <FloatingLabelInput
                                            label="Prénom"
                                            value={value}
                                            onChangeText={onChange}
                                            onBlur={onBlur}
                                            error={errors.prenom?.message}
                                        />
                                    )}
                                />
                            </View>
                        </View>

                        {/* Info Note */}
                        <View className="flex-row items-start gap-3 px-2 py-2 mt-2 bg-[#F59E0B]/5 rounded-xl border border-[#F59E0B]/20">
                            <Info size={18} color="#F59E0B" className="mt-0.5" />
                            <Text className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed flex-1">
                                Un lien de retrait sécurisé sera généré après le paiement. Votre bénéficiaire n'a pas besoin de l'application — il entrera son IBAN directement depuis le lien.
                            </Text>
                        </View>

                    </View>
                </ScrollView>

                {/* Sticky Bottom Action */}
                <View className="absolute bottom-0 left-0 right-0 p-6 bg-[#f8f7f5]/90 dark:bg-[#221b10]/95 pt-8 pb-8 z-50">
                    <TouchableOpacity
                        onPress={handleSubmit(onSubmit)}
                        disabled={isSubmitting}
                        className={clsx(
                            "w-full bg-[#064E3B] py-4 rounded-xl shadow-lg shadow-emerald-900/20 flex-row items-center justify-center gap-2 active:scale-[0.98]",
                            isSubmitting && "opacity-70"
                        )}
                    >
                        <Text className="text-white font-medium text-lg">
                            {isSubmitting ? "Création..." : "Continuer"}
                        </Text>
                        {!isSubmitting && <ArrowRight size={18} color="white" />}
                    </TouchableOpacity>
                </View>

            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
