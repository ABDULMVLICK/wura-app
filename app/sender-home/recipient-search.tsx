import { View, Text, TextInput, TouchableOpacity, ScrollView, SafeAreaView, Image } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ChevronLeft, QrCode, Search, ChevronRight, Plus, ChevronRight as ChevronRightIcon } from "lucide-react-native";
import { clsx } from "clsx";

// Mock Data for Recipients
const RECIPIENTS = [
    { id: '1', name: 'Amina Diallo', handle: '@AminaD', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBsbFt5zt82v5VdC2lYIDevBIro_E3MV6wwqvEM0CXOf1SProI9diWOyaVqSJe0fHlZj4P2xw18BMO8Il6C6GbnLaSovSIkvcFfMCVWU6XCD293b1csCG7HpADcP8VNLW4VEfOuhoPEU17jGpZEroClAuw-cwDrmvDCeuVpFPkWHtX_5_4e_OlhW2Lg2awPkD-ILtweEsNgsdV9pBzLhNYfrkVUtJXRReK9F6Eehsb-039h93-_BDexnonG7wHqVr2cscJkyb3gXr0' },
    { id: '2', name: 'Jean Dupont', handle: '@JeanDu93', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA9PblZlf10SpU4YF5W7EPgJBtTCiZPD49eqJy_5mmd02yiTipip2DTb44waDnDy-WGfXuQFdNV7LhWN7sdHlFA4HBdCMTo38M6QGRUBLPbgY12YWn9Vczg-3lilMDAnukzR67ww5tUysckXQ7fkJymxyhWFgynVOL9wDeNO5oQl6cNqgj5rJr_OL58vKhqLJ2IsN8PX8otheLdC2IRFQ2bhiCv4PYcluWRnjw83zGHfe0AaHOcOm0uI_bOvovReNawvBGANnlTIzg' },
    { id: '3', name: 'Kwesi Mensah', handle: '@KwesiM', initial: 'KM', color: 'bg-indigo-100', text: 'text-indigo-600', border: 'border-indigo-100' },
    { id: '4', name: 'Marie Claire', handle: '@MarieC', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDNS1CcM5dRsW6nyezA7Ktl_k-TBbdLLbTwGZentEJLAY1t-118nJtFogYM2WU1hIJ03Kwr7PWl58h29GlitKYRGyaHO2spW-BidwJw-v7MAXIhDl72VdusR7_zLMm-BiTkSlP10JhlLD4iU1LuwNyayQHmTueCOomKiI6wC9M7YIvYClBEgebVrS1Gi7cf7fGJ3Q_MYBXuvph_dhUdnBwvqXhXr29IQI9deiJDvQjdmjKH2rB76fcPIAY7X-AcgsDMGpf8BxW9qg0' },
    { id: '5', name: 'Lamine Ba', handle: '@Lamine221', initial: 'LB', color: 'bg-rose-100', text: 'text-rose-600', border: 'border-rose-100' },
];

export default function RecipientSearchScreen() {
    const router = useRouter();

    const { amount } = useLocalSearchParams();

    const handleSelectRecipient = (recipient: any) => {
        // Proceed to Payment selection with the amount
        router.push({ pathname: "/paiement", params: { amount } });
    };

    return (
        <SafeAreaView className="flex-1 bg-[#F8F8F5] dark:bg-[#23220f]">
            {/* Header */}
            <View className="pt-4 px-6 pb-4 flex-row items-center justify-between z-10 bg-[#F8F8F5]/95 dark:bg-[#23220f]/95">
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="p-2 -ml-2 rounded-full active:bg-gray-200 dark:active:bg-white/10"
                >
                    <ChevronLeft size={24} className="text-gray-800 dark:text-gray-100" color="#1f2937" />
                </TouchableOpacity>
                <Text className="text-lg font-semibold tracking-wide text-gray-900 dark:text-gray-100">
                    Envoyer de l'argent
                </Text>
                <TouchableOpacity className="p-2 -mr-2 rounded-full active:bg-gray-200 dark:active:bg-white/10">
                    <QrCode size={24} className="text-gray-800 dark:text-gray-100" color="#1f2937" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
                {/* Search Section */}
                <View className="mt-2 mb-8 relative">
                    <View className="relative">
                        <View className="absolute inset-y-0 left-0 pl-4 flex items-center justify-center z-10 h-full">
                            <Search size={24} className="text-yellow-600 dark:text-[#f9f506]" color="#d97706" />
                        </View>
                        <TextInput
                            autoFocus={true}
                            className="block w-full pl-12 pr-4 py-4 bg-white dark:bg-[#2d2c1b] border-2 border-transparent focus:border-[#f9f506] rounded-xl text-lg text-gray-900 dark:text-gray-100 placeholder:text-gray-400 shadow-sm"
                            placeholder="À qui envoyez-vous ?"
                            placeholderTextColor="#9ca3af"
                        />
                        <View className="absolute inset-y-0 right-0 pr-4 flex items-center justify-center h-full">
                            <View className="h-2 w-2 rounded-full bg-[#f9f506]" />
                        </View>
                    </View>
                </View>

                {/* New Recipient Action */}
                <TouchableOpacity
                    onPress={() => router.push({ pathname: "/sender-home/add-beneficiary", params: { amount } })}
                    className="w-full mb-8 flex-row items-center p-4 bg-white dark:bg-[#2d2c1b] rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 active:scale-[0.98]"
                >
                    <View className="h-12 w-12 rounded-full bg-[#f9f506] flex items-center justify-center shadow-sm">
                        <Plus size={24} color="black" />
                    </View>
                    <View className="ml-4 flex-1">
                        <Text className="font-bold text-gray-900 dark:text-white">Nouveau bénéficiaire</Text>
                        <Text className="text-sm text-gray-500 dark:text-gray-400">Ajouter via ID ou téléphone</Text>
                    </View>
                    <ChevronRight size={24} className="text-gray-400" color="#9ca3af" />
                </TouchableOpacity>

                {/* Suggested Header */}
                <View className="mb-4 flex-row items-center justify-between">
                    <Text className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Suggérés
                    </Text>
                    <TouchableOpacity>
                        <Text className="text-sm font-medium text-yellow-600 dark:text-[#f9f506]">Voir tout</Text>
                    </TouchableOpacity>
                </View>

                {/* List of Recipients */}
                <View className="space-y-3 gap-3">
                    {RECIPIENTS.map((recipient) => (
                        <TouchableOpacity
                            key={recipient.id}
                            onPress={() => handleSelectRecipient(recipient)}
                            className="bg-white dark:bg-[#2d2c1b] rounded-xl p-4 flex-row items-center shadow-sm border border-transparent active:border-[#f9f506]/30"
                        >
                            <View className="relative">
                                {recipient.image ? (
                                    <Image
                                        source={{ uri: recipient.image }}
                                        className="h-12 w-12 rounded-full border-2 border-white dark:border-gray-800"
                                        resizeMode="cover"
                                    />
                                ) : (
                                    <View className={clsx("h-12 w-12 rounded-full items-center justify-center border-2 border-white dark:border-gray-800", recipient.color)}>
                                        <Text className={clsx("font-bold text-lg", recipient.text)}>{recipient.initial}</Text>
                                    </View>
                                )}
                            </View>

                            <View className="ml-4 flex-1">
                                <Text className="font-bold text-gray-900 dark:text-white">{recipient.name}</Text>
                                <Text className="text-sm text-gray-500 dark:text-gray-400">{recipient.handle}</Text>
                            </View>

                            <View className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-50 dark:bg-white/5">
                                <ChevronRightIcon size={16} className="text-gray-400" color="#9ca3af" />
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>

            {/* Footer Gradient Override (Simulated with View since LinearGradient needs install) */}
            {/* Not strictly necessary in RN structure if styling matches, simpler to leave out or use standard bottom layout */}
        </SafeAreaView>
    );
}
