import { zodResolver } from "@hookform/resolvers/zod";
import { clsx } from "clsx";
import { useRouter } from "expo-router";
import { ArrowRight, ChevronDown, ChevronLeft, Clipboard, Info, Landmark, MoreHorizontal } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Image, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as z from "zod";
import { CountrySelector, WESTERN_COUNTRIES } from "../../components/CountrySelector";
import { useTransfer } from "../../contexts/TransferContext";
import { TransferService } from "../../services/transfers";

const beneficiarySchema = z.object({
    nom: z.string().min(2, "Le nom est trop court"),
    prenom: z.string().min(2, "Le prénom est trop court"),
    iban: z.string().min(14, "L'IBAN semble invalide").max(34, "L'IBAN semble invalide"),
    bic: z.string().min(8, "Le BIC doit contenir 8 ou 11 caractères").max(11, "Le BIC doit contenir 8 ou 11 caractères"),
    banque: z.string().min(2, "Le nom de la banque est requis"),
});
type BeneficiaryFormValues = z.infer<typeof beneficiarySchema>;

// Reusable Floating Label Input Component
const FloatingLabelInput = ({
    label,
    value,
    onChangeText,
    onBlur: onInputBlur,
    placeholder,
    icon,
    rightIcon,
    onRightIconPress,
    autoCapitalize = "sentences",
    keyboardType = "default",
    error
}: any) => {
    const [isFocused, setIsFocused] = useState(false);
    // Label floats if focused OR if there is a value
    const isFloating = isFocused || value.length > 0;

    return (
        <View className="relative group">
            <View className={clsx(
                "bg-white dark:bg-white/10 rounded-xl border transition-all duration-300 relative h-14 flex-row items-center",
                isFocused ? "border-[#F59E0B] shadow-sm shadow-[#F59E0B]/30" : "border-transparent shadow-sm"
            )}>
                {/* Left Icon (if any) */}
                {icon && (
                    <View className="pl-4 pr-2">
                        {icon}
                    </View>
                )}

                <View className="flex-1 h-full relative">
                    <TextInput
                        className={clsx(
                            "block w-full h-full bg-transparent border-none pt-5 pb-1 text-sm font-medium text-gray-900 dark:text-white leading-tight",
                            icon ? "pl-2 px-4" : "px-4",
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
                        icon ? "left-2" : "left-4",
                        isFloating
                            ? "transform -translate-y-2 top-2 text-[#F59E0B]"
                            : "transform top-4 text-gray-400 text-sm" // top-4 to center vertically roughly
                    )}>
                        {label}
                    </Text>
                </View>

                {/* Right Icon/Button */}
                {rightIcon && (
                    <TouchableOpacity onPress={onRightIconPress} className="pr-4">
                        {rightIcon}
                    </TouchableOpacity>
                )}
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
            iban: "",
            bic: "",
            banque: ""
        }
    });

    const [isCountryModalVisible, setIsCountryModalVisible] = useState(false);
    const [selectedCountry, setSelectedCountry] = useState(WESTERN_COUNTRIES[0]); // France
    const [isSubmitting, setIsSubmitting] = useState(false);

    const onSubmit = async (data: BeneficiaryFormValues) => {
        setIsSubmitting(true);
        try {
            // Register receiver in the backend to generate Web3Auth Wallet
            const response = await TransferService.createRecipient({
                nom: data.nom,
                prenom: data.prenom,
                iban: data.iban
            });

            // Expected response: { id: "xxx", wuraId: "WURA-1234", ... }
            const realWuraId = response.receiver?.wuraId || response.wuraId || `${data.prenom.replace(/\s+/g, '')}${data.nom.charAt(0).toUpperCase()}`;

            // Save the new beneficiary in the global context
            setRecipient({
                id: response.id || `new-${Date.now()}`,
                wuraId: realWuraId,
                nom: data.nom,
                prenom: data.prenom,
                iban: data.iban,
                bic: data.bic,
                banque: data.banque,
                pays: selectedCountry.name,
                isNew: true
            });

            // Navigate to Confirmation Beneficiary
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
                        <ChevronLeft size={24} className="text-gray-800 dark:text-white" color="#1f2937" />
                    </TouchableOpacity>

                    <View className="absolute left-0 right-0 top-0 bottom-0 items-center justify-center pointer-events-none z-[-1]">
                        <Image
                            source={isDark ? require("../../assets/images/wuraa-removebg-logoVersionDark.png") : require("../../assets/images/wuralogo-removebg-preview.png")}
                            style={{ width: 400, height: 110 }}
                            resizeMode="contain"
                        />
                    </View>

                    <TouchableOpacity className="p-2 -mr-2 rounded-full active:bg-black/5 dark:active:bg-white/10">
                        <MoreHorizontal size={24} className="text-gray-400" color="#9ca3af" />
                    </TouchableOpacity>
                </View>

                {/* Subheader */}
                <View className="px-8 mt-2 mb-8 text-center items-center">
                    <Text className="text-xl font-semibold text-gray-900 dark:text-white">Nouveau Bénéficiaire</Text>
                    <Text className="text-sm text-gray-500 dark:text-gray-400 mt-1">Saisissez les coordonnées bancaires</Text>
                </View>

                <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
                    <View className="space-y-4 gap-4">

                        {/* Country Select */}
                        <TouchableOpacity onPress={() => setIsCountryModalVisible(true)} className="bg-white dark:bg-white/10 rounded-xl shadow-sm flex-row items-center px-4 py-3 active:border-[#F59E0B]/30 border border-border">
                            <View className="mr-3">
                                {/* Dynamic Flag */}
                                <View className="w-8 h-6 rounded flex-row overflow-hidden relative border border-gray-100 dark:border-white/10">
                                    {selectedCountry.flag}
                                </View>
                            </View>
                            <View className="flex-1">
                                <Text className="text-xs text-gray-500 dark:text-gray-400">Pays de la banque</Text>
                                <View className="flex-row items-center justify-between mt-0.5">
                                    <Text className="text-sm font-medium text-gray-900 dark:text-white">{selectedCountry.name}</Text>
                                </View>
                            </View>
                            <ChevronDown size={24} className="text-[#F59E0B]" color="#F59E0B" />
                        </TouchableOpacity>

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

                        {/* IBAN */}
                        <Controller
                            control={control}
                            name="iban"
                            render={({ field: { onChange, onBlur, value } }) => (
                                <FloatingLabelInput
                                    label="IBAN"
                                    value={value}
                                    onChangeText={onChange}
                                    onBlur={onBlur}
                                    autoCapitalize="characters"
                                    rightIcon={<Clipboard size={20} className="text-gray-400" color="#9ca3af" />}
                                    onRightIconPress={() => console.log('Paste IBAN')}
                                    error={errors.iban?.message}
                                />
                            )}
                        />

                        {/* BIC */}
                        <Controller
                            control={control}
                            name="bic"
                            render={({ field: { onChange, onBlur, value } }) => (
                                <FloatingLabelInput
                                    label="BIC / SWIFT"
                                    value={value}
                                    onChangeText={onChange}
                                    onBlur={onBlur}
                                    autoCapitalize="characters"
                                    error={errors.bic?.message}
                                />
                            )}
                        />

                        {/* Banque */}
                        <Controller
                            control={control}
                            name="banque"
                            render={({ field: { onChange, onBlur, value } }) => (
                                <FloatingLabelInput
                                    label="Nom de la banque"
                                    value={value}
                                    onChangeText={onChange}
                                    onBlur={onBlur}
                                    icon={<Landmark size={20} className="text-gray-400" color="#9ca3af" />}
                                    error={errors.banque?.message}
                                />
                            )}
                        />

                        {/* Info Note */}
                        <View className="flex-row items-start gap-3 px-2 py-2 mt-2">
                            <Info size={18} className="text-[#F59E0B] mt-0.5" color="#F59E0B" />
                            <Text className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed flex-1">
                                Le nom du bénéficiaire doit correspondre exactement à celui enregistré auprès de sa banque pour éviter tout rejet de virement.
                            </Text>
                        </View>

                    </View>
                </ScrollView>

                {/* Sticky Bottom Action */}
                <View className="absolute bottom-0 left-0 right-0 p-6 bg-[#f8f7f5]/90 dark:bg-[#221b10]/95 pt-8 pb-8 z-50">
                    <View className="h-1 w-full bg-gradient-to-t from-background-light to-transparent absolute top-0" />
                    <TouchableOpacity
                        onPress={handleSubmit(onSubmit)}
                        disabled={isSubmitting}
                        className={clsx(
                            "w-full bg-[#064E3B] py-4 rounded-xl shadow-lg shadow-emerald-900/20 flex-row items-center justify-center gap-2 active:scale-[0.98]",
                            isSubmitting && "opacity-70"
                        )}
                    >
                        <Text className="text-white font-medium text-lg">
                            {isSubmitting ? "Création..." : "Vérifier"}
                        </Text>
                        {!isSubmitting && <ArrowRight size={18} color="white" className="opacity-70" />}
                    </TouchableOpacity>
                </View>

            </KeyboardAvoidingView>

            <CountrySelector
                visible={isCountryModalVisible}
                onClose={() => setIsCountryModalVisible(false)}
                onSelect={setSelectedCountry}
                selectedCode={selectedCountry.code}
            />
        </SafeAreaView>
    );
}
