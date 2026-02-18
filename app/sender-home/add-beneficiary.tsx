import { clsx } from "clsx";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowRight, ChevronDown, ChevronLeft, Clipboard, Info, Landmark, MoreHorizontal } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { useState } from "react";
import { Image, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";

// Reusable Floating Label Input Component
const FloatingLabelInput = ({
    label,
    value,
    onChangeText,
    placeholder,
    icon,
    rightIcon,
    onRightIconPress,
    autoCapitalize = "sentences",
    keyboardType = "default"
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
                            icon ? "pl-2 px-4" : "px-4"
                        )}
                        value={value}
                        onChangeText={onChangeText}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
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
        </View>
    );
};

export default function AddBeneficiaryScreen() {
    const router = useRouter();
    const { amount } = useLocalSearchParams();
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === "dark";
    const [formData, setFormData] = useState({
        nom: "",
        prenom: "",
        iban: "",
        bic: "",
        banque: ""
    });

    const updateField = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleVerify = () => {
        // Navigate to Confirmation Beneficiary
        router.push({
            pathname: "/sender-home/confirmation-beneficiary",
            params: {
                nom: formData.nom,
                prenom: formData.prenom,
                iban: formData.iban,
                bic: formData.bic,
                banque: formData.banque,
                pays: "France (FR)", // Hardcoded based on mock country select, typically dynamic
                amount: amount // Pass amount forward
            }
        });
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

                        {/* Country Select (Mock) */}
                        <View className="bg-white dark:bg-white/10 rounded-xl shadow-sm flex-row items-center px-4 py-3 active:border-[#F59E0B]/30 border border-transparent">
                            <View className="mr-3">
                                {/* Abstract Flag */}
                                <View className="w-8 h-6 rounded bg-blue-600 flex-row overflow-hidden relative">
                                    <View className="flex-1 bg-blue-600" />
                                    <View className="flex-1 bg-white" />
                                    <View className="flex-1 bg-red-600" />
                                    <View className="absolute inset-0 bg-white/10" />
                                </View>
                            </View>
                            <View className="flex-1">
                                <Text className="text-xs text-gray-500 dark:text-gray-400">Pays de la banque</Text>
                                <View className="flex-row items-center justify-between mt-0.5">
                                    <Text className="text-sm font-medium text-gray-900 dark:text-white">France (FR)</Text>
                                </View>
                            </View>
                            <ChevronDown size={24} className="text-[#F59E0B]" color="#F59E0B" />
                        </View>

                        {/* Name Fields Row */}
                        <View className="flex-row gap-4">
                            <View className="flex-1">
                                <FloatingLabelInput
                                    label="Nom"
                                    value={formData.nom}
                                    onChangeText={(t: string) => updateField('nom', t)}
                                />
                            </View>
                            <View className="flex-1">
                                <FloatingLabelInput
                                    label="Prénom"
                                    value={formData.prenom}
                                    onChangeText={(t: string) => updateField('prenom', t)}
                                />
                            </View>
                        </View>

                        {/* IBAN */}
                        <FloatingLabelInput
                            label="IBAN"
                            value={formData.iban}
                            onChangeText={(t: string) => updateField('iban', t)}
                            autoCapitalize="characters"
                            rightIcon={<Clipboard size={20} className="text-gray-400" color="#9ca3af" />}
                            onRightIconPress={() => console.log('Paste IBAN')}
                        />

                        {/* BIC */}
                        <FloatingLabelInput
                            label="BIC / SWIFT"
                            value={formData.bic}
                            onChangeText={(t: string) => updateField('bic', t)}
                            autoCapitalize="characters"
                        />

                        {/* Banque */}
                        <FloatingLabelInput
                            label="Nom de la banque"
                            value={formData.banque}
                            onChangeText={(t: string) => updateField('banque', t)}
                            icon={<Landmark size={20} className="text-gray-400" color="#9ca3af" />}
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
                        onPress={handleVerify}
                        className="w-full bg-[#064E3B] py-4 rounded-xl shadow-lg shadow-emerald-900/20 flex-row items-center justify-center gap-2 active:scale-[0.98]"
                    >
                        <Text className="text-white font-medium text-lg">Vérifier</Text>
                        <ArrowRight size={18} color="white" className="opacity-70" />
                    </TouchableOpacity>
                </View>

            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
