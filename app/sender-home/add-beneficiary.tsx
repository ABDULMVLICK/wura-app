import { zodResolver } from "@hookform/resolvers/zod";
import { clsx } from "clsx";
import { useRouter } from "expo-router";
import { ArrowRight, ChevronLeft, Globe, Info, Mail, MoreHorizontal, Phone, Shield } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Image, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as z from "zod";
import { useTransfer } from "../../contexts/TransferContext";
import { TransferService } from "../../services/transfers";

const LIEN_OPTIONS = [
    { value: 'famille', label: 'Famille' },
    { value: 'ami', label: 'Ami(e)' },
    { value: 'professionnel', label: 'Pro' },
    { value: 'autre', label: 'Autre' },
] as const;

const beneficiarySchema = z.object({
    nom: z.string().min(2, "Le nom est trop court"),
    prenom: z.string().min(2, "Le prénom est trop court"),
    email: z.string().email("Email invalide").optional().or(z.literal('')),
    telephone: z.string().min(6, "Numéro invalide").optional().or(z.literal('')),
    pays: z.string().min(2, "Pays invalide").optional().or(z.literal('')),
    lien: z.enum(['famille', 'ami', 'professionnel', 'autre']).optional(),
});
type BeneficiaryFormValues = z.infer<typeof beneficiarySchema>;

const FloatingLabelInput = ({
    label,
    value,
    onChangeText,
    onBlur: onInputBlur,
    autoCapitalize = "sentences",
    keyboardType = "default",
    error,
    icon,
}: any) => {
    const [isFocused, setIsFocused] = useState(false);
    const isFloating = isFocused || (value && value.length > 0);

    return (
        <View className="relative">
            <View className={clsx(
                "bg-white dark:bg-white/10 rounded-xl border h-14 flex-row items-center",
                isFocused ? "border-[#F59E0B] shadow-sm shadow-[#F59E0B]/30" : "border-transparent shadow-sm"
            )}>
                {icon && (
                    <View className="pl-4 pr-1 h-full justify-center">
                        {icon}
                    </View>
                )}
                <View className="flex-1 h-full relative">
                    <TextInput
                        className={clsx(
                            "block w-full h-full bg-transparent border-none pt-5 pb-1 px-4 text-sm font-medium text-gray-900 dark:text-white leading-tight",
                            icon && "pl-1",
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
                        icon && "left-1",
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
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const {
        control,
        handleSubmit,
        setValue,
        watch,
        formState: { errors }
    } = useForm<BeneficiaryFormValues>({
        resolver: zodResolver(beneficiarySchema),
        defaultValues: {
            nom: "",
            prenom: "",
            email: "",
            telephone: "",
            pays: "",
            lien: undefined,
        }
    });

    const selectedLien = watch('lien');

    const onSubmit = async (data: BeneficiaryFormValues) => {
        setIsSubmitting(true);
        setSubmitError(null);
        try {
            const response = await TransferService.createRecipient({
                nom: data.nom,
                prenom: data.prenom,
                email: data.email || undefined,
                telephone: data.telephone || undefined,
            });

            const realWuraId = response.receiver?.wuraId || response.wuraId;

            setRecipient({
                id: response.id,
                wuraId: realWuraId,
                nom: data.nom,
                prenom: data.prenom,
                email: data.email || undefined,
                telephone: data.telephone || undefined,
                pays: data.pays || undefined,
                lien: data.lien,
                iban: '',
                bic: '',
                banque: '',
                isNew: true,
            });

            router.push("/sender-home/confirmation-beneficiary");
        } catch (error: any) {
            console.error("Erreur lors de la création du bénéficiaire:", error);
            const message = error?.response?.data?.message ?? "Une erreur est survenue lors de l'enregistrement du bénéficiaire.";
            setSubmitError(message);
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
                        <ChevronLeft size={24} color={isDark ? "#ffffff" : "#1f2937"} />
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
                <View className="px-8 mt-2 mb-6 text-center items-center">
                    <Text className="text-xl font-semibold text-gray-900 dark:text-white">Nouveau Bénéficiaire</Text>
                    <Text className="text-sm text-gray-500 dark:text-gray-400 mt-1">Saisissez les informations du destinataire</Text>
                </View>

                <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
                    <View className="gap-4">

                        {/* Erreur soumission */}
                        {submitError && (
                            <View className="px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-xl">
                                <Text className="text-red-600 dark:text-red-400 text-sm">{submitError}</Text>
                            </View>
                        )}

                        {/* Section: Identité */}
                        <View>
                            <Text className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">
                                Identité du bénéficiaire
                            </Text>
                            <View className="gap-3">
                                <View className="flex-row gap-3">
                                    <View className="flex-1">
                                        <Controller
                                            control={control}
                                            name="nom"
                                            render={({ field: { onChange, onBlur, value } }) => (
                                                <FloatingLabelInput
                                                    label="Nom *"
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
                                                    label="Prénom *"
                                                    value={value}
                                                    onChangeText={onChange}
                                                    onBlur={onBlur}
                                                    error={errors.prenom?.message}
                                                />
                                            )}
                                        />
                                    </View>
                                </View>

                                <Controller
                                    control={control}
                                    name="pays"
                                    render={({ field: { onChange, onBlur, value } }) => (
                                        <FloatingLabelInput
                                            label="Pays de résidence"
                                            value={value}
                                            onChangeText={onChange}
                                            onBlur={onBlur}
                                            error={errors.pays?.message}
                                            icon={<Globe size={16} color="#9ca3af" />}
                                        />
                                    )}
                                />
                            </View>
                        </View>

                        {/* Section: Contact */}
                        <View>
                            <Text className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">
                                Coordonnées
                            </Text>
                            <View className="gap-3">
                                <Controller
                                    control={control}
                                    name="email"
                                    render={({ field: { onChange, onBlur, value } }) => (
                                        <FloatingLabelInput
                                            label="Email du bénéficiaire"
                                            value={value}
                                            onChangeText={onChange}
                                            onBlur={onBlur}
                                            keyboardType="email-address"
                                            autoCapitalize="none"
                                            error={errors.email?.message}
                                            icon={<Mail size={16} color="#9ca3af" />}
                                        />
                                    )}
                                />

                                <Controller
                                    control={control}
                                    name="telephone"
                                    render={({ field: { onChange, onBlur, value } }) => (
                                        <FloatingLabelInput
                                            label="Téléphone du bénéficiaire"
                                            value={value}
                                            onChangeText={onChange}
                                            onBlur={onBlur}
                                            keyboardType="phone-pad"
                                            autoCapitalize="none"
                                            error={errors.telephone?.message}
                                            icon={<Phone size={16} color="#9ca3af" />}
                                        />
                                    )}
                                />
                            </View>
                        </View>

                        {/* Section: Lien de parenté */}
                        <View>
                            <View className="flex-row items-center gap-2 mb-3">
                                <Shield size={14} color="#9ca3af" />
                                <Text className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                                    Lien avec le bénéficiaire
                                </Text>
                            </View>
                            <Controller
                                control={control}
                                name="lien"
                                render={({ field: { onChange } }) => (
                                    <View className="flex-row gap-2 flex-wrap">
                                        {LIEN_OPTIONS.map((opt) => (
                                            <TouchableOpacity
                                                key={opt.value}
                                                onPress={() => onChange(selectedLien === opt.value ? undefined : opt.value)}
                                                className={clsx(
                                                    "px-4 py-2.5 rounded-xl border",
                                                    selectedLien === opt.value
                                                        ? "bg-[#F59E0B]/15 border-[#F59E0B]"
                                                        : "bg-white dark:bg-white/10 border-transparent shadow-sm"
                                                )}
                                            >
                                                <Text className={clsx(
                                                    "text-sm font-medium",
                                                    selectedLien === opt.value
                                                        ? "text-[#F59E0B]"
                                                        : "text-gray-600 dark:text-gray-300"
                                                )}>
                                                    {opt.label}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}
                            />
                        </View>

                        {/* Info Note */}
                        <View className="flex-row items-start gap-3 px-3 py-3 bg-[#F59E0B]/5 rounded-xl border border-[#F59E0B]/20">
                            <Info size={16} color="#F59E0B" />
                            <Text className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed flex-1">
                                Un lien de retrait sécurisé sera généré après le paiement. Votre bénéficiaire n'a pas besoin de l'application — il entrera son IBAN directement depuis le lien.
                            </Text>
                        </View>

                    </View>
                </ScrollView>

                {/* Sticky Bottom Action */}
                <View className="absolute bottom-0 left-0 right-0 p-6 bg-[#f8f7f5]/90 dark:bg-[#221b10]/95 pt-6 pb-8 z-50">
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
