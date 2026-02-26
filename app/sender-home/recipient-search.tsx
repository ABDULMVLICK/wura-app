import { useRouter } from "expo-router";
import { ChevronLeft, ChevronRight, Plus, Search } from "lucide-react-native";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTransfer } from "../../contexts/TransferContext";
import { AuthService } from "../../services/auth";

export default function RecipientSearchScreen() {
    const router = useRouter();
    const { setRecipient } = useTransfer();

    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<{ id: string, wuraId: string, email: string }[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        if (!searchQuery.trim() || searchQuery.length < 3) {
            setSearchResults([]);
            return;
        }

        const timeoutId = setTimeout(async () => {
            setIsSearching(true);
            try {
                const results = await AuthService.searchWuraId(searchQuery.trim());
                setSearchResults(results);
            } catch (error) {
                console.error("Search failed:", error);
                setSearchResults([]);
            } finally {
                setIsSearching(false);
            }
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    const handleSelectRecipient = (recipient: any) => {
        setRecipient({
            id: recipient.id,
            wuraId: recipient.wuraId,
            nom: '',
            prenom: recipient.email ? recipient.email.split('@')[0] : 'Utilisateur',
            iban: '',
            bic: '',
            banque: '',
            pays: '',
        });
        router.push("/sender-home/confirmation-beneficiary");
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
                <View style={{ width: 40 }} />
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
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            autoCapitalize="none"
                            className="block w-full pl-12 pr-12 py-4 bg-white dark:bg-[#2d2c1b] border-2 border-transparent focus:border-[#f9f506] rounded-xl text-lg text-gray-900 dark:text-gray-100 placeholder:text-gray-400 shadow-sm"
                            placeholder="Wura ID ou Téléphone"
                            placeholderTextColor="#9ca3af"
                        />
                        {isSearching ? (
                            <View className="absolute inset-y-0 right-0 pr-4 flex items-center justify-center h-full">
                                <ActivityIndicator size="small" color="#d97706" />
                            </View>
                        ) : searchQuery.length > 0 ? (
                            <TouchableOpacity
                                onPress={() => setSearchQuery("")}
                                className="absolute inset-y-0 right-0 pr-4 flex items-center justify-center h-full"
                            >
                                <Text className="text-gray-400 font-bold text-lg">✕</Text>
                            </TouchableOpacity>
                        ) : (
                            <View className="absolute inset-y-0 right-0 pr-4 flex items-center justify-center h-full">
                                <View className="h-2 w-2 rounded-full bg-[#f9f506]" />
                            </View>
                        )}
                    </View>
                </View>

                {/* New Recipient Action */}
                <TouchableOpacity
                    onPress={() => router.push("/sender-home/add-beneficiary")}
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

                {/* Suggested / Results Header */}
                <View className="mb-4 flex-row items-center justify-between">
                    <Text className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {searchQuery.length >= 3 ? "Résultats de la recherche" : "Suggérés"}
                    </Text>
                    {!searchQuery && (
                        <TouchableOpacity onPress={() => router.push("/historique")}>
                            <Text className="text-sm font-medium text-yellow-600 dark:text-[#f9f506]">Voir tout</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* List of Recipients */}
                <View className="space-y-3 gap-3">
                    {searchQuery.length < 3 && (
                        <View className="py-8 items-center">
                            <Text className="text-gray-400 dark:text-gray-500 text-center text-sm">
                                Tapez au moins 3 caractères{'\n'}pour rechercher un bénéficiaire
                            </Text>
                        </View>
                    )}

                    {searchQuery.length >= 3 && searchResults.length === 0 && !isSearching && (
                        <View className="py-6 items-center">
                            <Text className="text-gray-500 text-center">Aucun utilisateur trouvé pour @{searchQuery.trim()}</Text>
                        </View>
                    )}

                    {searchQuery.length >= 3 && searchResults.map((recipient: any) => (
                        <TouchableOpacity
                            key={recipient.id}
                            onPress={() => handleSelectRecipient(recipient)}
                            className="bg-white dark:bg-[#2d2c1b] rounded-xl p-4 flex-row items-center shadow-sm border border-transparent active:border-[#f9f506]/30"
                        >
                            <View className="h-12 w-12 rounded-full items-center justify-center border-2 border-white dark:border-gray-800 bg-yellow-100 dark:bg-yellow-900/30">
                                <Text className="font-bold text-lg text-yellow-600 dark:text-yellow-400">
                                    {recipient.wuraId ? recipient.wuraId.substring(0, 2).toUpperCase() : "WU"}
                                </Text>
                            </View>

                            <View className="ml-4 flex-1">
                                <Text className="font-bold text-gray-900 dark:text-white">
                                    {recipient.email ? recipient.email.split('@')[0] : "Utilisateur Wura"}
                                </Text>
                                <Text className="text-sm text-gray-500 dark:text-gray-400">
                                    @{recipient.wuraId}
                                </Text>
                            </View>

                            <View className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-50 dark:bg-white/5">
                                <ChevronRight size={16} className="text-gray-400" color="#9ca3af" />
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
