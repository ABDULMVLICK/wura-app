import { clsx } from "clsx";
import { useRouter } from "expo-router";
import { ArrowRight, ArrowUpDown, ChevronDown, Plus } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { useEffect, useState } from "react";
import { Image, Keyboard, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CountrySelector, WESTERN_COUNTRIES } from "../../components/CountrySelector";
import { useTransfer } from "../../contexts/TransferContext";

// Mock Data for Recents
const RECENTS = [
    { id: 'mk', name: 'Moussa', initial: 'MK', color: 'bg-orange-100', textColor: 'text-orange-600', type: 'initial' },
    { id: 'amina', name: 'Amina', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBPA0u1uoVySeCrPCU9G7OiadIq0eYJZoExIGAp1fhko0vYbw7rLOjAnlmwXB3ymqj2clZYrL5njep1NWFf_-ejGB80nznehVbAyqXzhTnWK36do-9-hioD9H5FfU4O1bJr8zne81Q1AySRSImM5mewHFpasYdZwqFpLjzmDn1xe9fZ-sKBpAcDpYk4SvwPSUofRneav-9k3huWh7ih0HbJlqGnaiAoWj3T5120JPG3cW1xTFtScQcsVlSUoNaR6BVnV1MGcaas4C8', type: 'image' },
    { id: 'seydou', name: 'Seydou', initial: 'SD', color: 'bg-purple-100', textColor: 'text-purple-600', type: 'initial' },
    { id: 'fatou', name: 'Fatou', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDx26Ywsww5KcbV7BhhF7CXwWA9Mhd3iPsqS7CkLxRPxvTKtRkQBby4vC-CY7BcuSQFflgdhxjDsac4am5wlcOUp6ADsLInFaDKXnj_94vxjX_VvNu78QePxdaLzpMznNb2GgWYGcyq4x9p1Xpq45qT0NpS39kFaoJ0EJ5RIxLzjF9AEJcBBgU6uDMvsP_mWkKc3z6xn34IFmGWSNKiH2zJ6Iqlg3NBbMqTHjwdEgV68PmlMfxfZppVzH9AXavYvjlPB-4U1fm352M', type: 'image' },
];

export default function SenderHomeScreen() {
    const router = useRouter();
    const { state: transferState, setInputValue, toggleCurrency, getCalculatedXOF, getCalculatedEUR } = useTransfer();

    useEffect(() => {
        if (!transferState.inputValue) {
            setInputValue("50000");
        }
    }, []);

    const amount = transferState.inputValue;
    const isXofInput = transferState.inputCurrency === 'XOF';
    const [isCountryModalVisible, setIsCountryModalVisible] = useState(false);
    const [selectedCountry, setSelectedCountry] = useState(WESTERN_COUNTRIES[0]); // France
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === "dark";

    // Blink animation for the cursor (visual only, if we wanted manual cursor)
    // But TextInput handles its own cursor. We can keep the blinking bar as a custom cursor if we hide the real one, 
    // or just use standard TextInput. The user's HTML shows a custom cursor div. 
    // For RN, standard TextInput is safer for "pavé numérique" (system keyboard).

    return (
        <SafeAreaView className="flex-1 bg-white dark:bg-[#221b10]">
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                className="flex-1"
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <View className="flex-1">
                        {/* Header: Profile icon right */}
                        <View className="flex-row justify-end px-4 pt-2">
                            <TouchableOpacity
                                onPress={() => router.push("/sender-home/profil")}
                                activeOpacity={0.7}
                            >
                                <View className="w-10 h-10 rounded-full bg-gray-50 border border-gray-100 overflow-hidden">
                                    <Image
                                        source={{ uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuBSjJ-nEaQvx0w3s2-UzHGdRJQK9RZtt1p_gYxL3GurM8c-7fxRXvMy7RtFemPXZkCfD40LA8zTfVvZlFDwQk83So-cMN4vuG4tHkhrQW3E09zNENGNi9aiAbQAqtNsvH6xAB04XSe9E8_NtRv2bh7w_hRM8Zm7VjwIMVdi4Vk8EMCZqU98TDk9h07ZFgdDKOyW9QNeKKGQZMsxboYOF5ibxYnI2hfsR0DmyxZbz4NjoFGcuxm0yTecNuI5VyJX21XF1zeMXWf5gxY" }}
                                        className="w-full h-full"
                                        resizeMode="cover"
                                    />
                                </View>
                            </TouchableOpacity>
                        </View>

                        {/* Country Selector */}
                        <View className="items-center px-6 mt-4">
                            <View className="w-full max-w-xs">
                                <TouchableOpacity onPress={() => setIsCountryModalVisible(true)} className="w-full bg-[#F9FAFB] dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-3 flex-row items-center justify-between shadow-sm active:scale-[0.98]">
                                    <View className="flex-row items-center gap-9">
                                        <Text className="text-xs font-medium text-gray-500 uppercase tracking-wide absolute -top-3 left-4 bg-white dark:bg-[#221b10] px-1">
                                            Pays du bénéficiaire
                                        </Text>
                                        <View className="w-6 h-4 rounded-sm overflow-hidden border border-gray-100 dark:border-white/10 flex-row">
                                            {selectedCountry.flag}
                                        </View>
                                        <Text className="font-semibold text-gray-800 dark:text-gray-100">{selectedCountry.name}</Text>
                                    </View>
                                    <ChevronDown size={20} className="text-gray-400" color="#9ca3af" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Main Content: AMOUNT INPUT */}
                        <View className="flex-1 items-center justify-center px-6 mt-4">
                            <View className="items-center gap-1 w-full max-w-sm">
                                <View className="relative w-full flex-row items-center justify-center">
                                    <TextInput
                                        value={amount}
                                        onChangeText={(text) => setInputValue(text.replace(/[^0-9.,]/g, ''))}
                                        keyboardType="decimal-pad"
                                        className="w-full bg-transparent text-center text-[3.5rem] font-bold tracking-tight text-gray-900 dark:text-white leading-none p-0"
                                        placeholder="0"
                                        placeholderTextColor="#cbd5e1"
                                        selectionColor="#F59E0B"
                                    />
                                    <Text className="absolute right-0 top-1/2 -translate-y-1/2 text-lg font-bold text-gray-400 dark:text-gray-500 hidden sm:flex">
                                        {isXofInput ? 'FCFA' : '€'}
                                    </Text>
                                </View>
                                <Text className="text-lg font-bold text-gray-400 dark:text-gray-500 sm:hidden">
                                    {isXofInput ? 'FCFA' : '€'}
                                </Text>

                                <View className="flex-row items-center justify-center gap-3 mt-4">
                                    <View className="flex-1 h-[1px] bg-gray-200 dark:bg-white/10" />
                                    <TouchableOpacity
                                        onPress={toggleCurrency}
                                        className="bg-gray-100 dark:bg-white/10 p-2 rounded-full active:scale-95"
                                    >
                                        <ArrowUpDown size={16} className="text-[#064E3B] dark:text-[#F59E0B]" />
                                    </TouchableOpacity>
                                    <View className="flex-1 h-[1px] bg-gray-200 dark:bg-white/10" />
                                </View>

                                <View className="flex-row items-center justify-center gap-2 mt-4">
                                    <Text className="text-xl font-semibold text-[#064E3B] dark:text-[#F59E0B]">
                                        ≈ {isXofInput ? getCalculatedEUR() : getCalculatedXOF()} {isXofInput ? '€' : 'FCFA'}
                                    </Text>
                                </View>

                                <View className="mt-2 px-3 py-1 rounded-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                                    <Text className="text-xs font-medium text-gray-400 dark:text-gray-500">
                                        1 € = 655.95 FCFA
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Bottom Section */}
                        <View className="w-full bg-white dark:bg-[#221b10] z-20 flex-col pb-8">
                            <View className="w-full px-6 mb-6">
                                <View className="flex-row justify-between items-center mb-4">
                                    <Text className="text-sm font-semibold text-gray-900 dark:text-white">Récents</Text>
                                    <TouchableOpacity>
                                        <Text className="text-xs font-medium text-[#064E3B]">Voir tout</Text>
                                    </TouchableOpacity>
                                </View>

                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16, paddingHorizontal: 0 }}>
                                    {/* New Button */}
                                    <View className="items-center gap-2 w-16">
                                        <TouchableOpacity
                                            onPress={() => router.push("/sender-home/add-beneficiary")}
                                            className="w-14 h-14 rounded-full border-2 border-dashed border-gray-300 items-center justify-center"
                                        >
                                            <Plus size={24} className="text-gray-400" color="#9ca3af" />
                                        </TouchableOpacity>
                                        <Text className="text-xs text-gray-500 font-medium text-center" numberOfLines={1}>Nouveau</Text>
                                    </View>

                                    {/* Recents List */}
                                    {RECENTS.map((contact) => (
                                        <TouchableOpacity key={contact.id} className="items-center gap-2 w-16 group">
                                            <View className={clsx(
                                                "w-14 h-14 rounded-full items-center justify-center overflow-hidden border-2 border-transparent",
                                                contact.type === 'initial' ? contact.color : "bg-gray-100"
                                            )}>
                                                {contact.type === 'image' ? (
                                                    <Image source={{ uri: contact.image }} className="w-full h-full" resizeMode="cover" />
                                                ) : (
                                                    <Text className={clsx("font-bold text-lg", contact.textColor)}>{contact.initial}</Text>
                                                )}
                                            </View>
                                            <Text className="text-xs text-gray-600 dark:text-gray-300 font-medium text-center" numberOfLines={1}>
                                                {contact.name}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>

                            <View className="px-6 pt-2">
                                <TouchableOpacity
                                    onPress={() => router.push("/sender-home/confirmation-amount")}
                                    className="w-full bg-[#064E3B] py-4 rounded-xl shadow-lg shadow-emerald-900/10 flex-row items-center justify-center gap-3 active:scale-[0.98]"
                                >
                                    <Text className="text-white font-bold text-lg">Transférer</Text>
                                    <ArrowRight size={24} color="white" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </TouchableWithoutFeedback>
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
