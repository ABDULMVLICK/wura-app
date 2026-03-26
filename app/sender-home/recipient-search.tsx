import { useRouter } from "expo-router";
import { ChevronLeft, ChevronRight, Plus, Search } from "lucide-react-native";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SenderGradient } from "../../components/SenderGradient";
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
        <SafeAreaView style={{ flex: 1, backgroundColor: '#14533d' }}>
            {/* Gradient animé — identité sender */}
            <SenderGradient heightRatio={0.42} />

            {/* Header */}
            <View style={{
                paddingTop: 16, paddingHorizontal: 28, paddingBottom: 12,
                flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                zIndex: 1,
            }}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={{
                        padding: 8, marginLeft: -8, borderRadius: 999,
                        backgroundColor: 'rgba(255,255,255,0.1)',
                    }}
                >
                    <ChevronLeft size={24} color="#ffffff" />
                </TouchableOpacity>
                <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 20, color: '#ffffff' }}>
                    Envoyer de l'argent
                </Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                contentContainerStyle={{ paddingHorizontal: 28, paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
                style={{ zIndex: 1 }}
            >
                {/* Search Bar */}
                <View style={{ marginTop: 4, marginBottom: 20 }}>
                    <View style={{
                        backgroundColor: 'rgba(255,255,255,0.1)',
                        borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.15)',
                        borderRadius: 18, flexDirection: 'row', alignItems: 'center',
                        paddingHorizontal: 16, paddingVertical: 4,
                    }}>
                        <Search size={22} color="#F59E0B" style={{ marginRight: 8 }} />
                        <TextInput
                            autoFocus={true}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            autoCapitalize="none"
                            style={{
                                flex: 1, paddingVertical: 14, fontSize: 17,
                                fontFamily: 'Outfit_400Regular', color: '#ffffff',
                            }}
                            placeholder="Wura ID ou Téléphone"
                            placeholderTextColor="rgba(255,255,255,0.35)"
                        />
                        {isSearching ? (
                            <ActivityIndicator size="small" color="#F59E0B" />
                        ) : searchQuery.length > 0 ? (
                            <TouchableOpacity onPress={() => setSearchQuery("")}>
                                <Text style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'Outfit_700Bold', fontSize: 16 }}>✕</Text>
                            </TouchableOpacity>
                        ) : (
                            <View style={{ height: 8, width: 8, borderRadius: 4, backgroundColor: '#F59E0B' }} />
                        )}
                    </View>
                </View>

                {/* New Recipient Button */}
                <TouchableOpacity
                    onPress={() => router.push("/sender-home/add-beneficiary")}
                    style={{
                        width: '100%', marginBottom: 20,
                        flexDirection: 'row', alignItems: 'center', padding: 16,
                        backgroundColor: 'rgba(255,255,255,0.08)',
                        borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
                    }}
                    activeOpacity={0.8}
                >
                    <View style={{
                        height: 48, width: 48, borderRadius: 24,
                        backgroundColor: '#F59E0B', alignItems: 'center', justifyContent: 'center',
                        shadowColor: '#F59E0B', shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.35, shadowRadius: 10, elevation: 5,
                    }}>
                        <Plus size={24} color="#0f3d2e" />
                    </View>
                    <View style={{ marginLeft: 16, flex: 1 }}>
                        <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 15, color: '#ffffff' }}>Nouveau bénéficiaire</Text>
                        <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>Ajouter via ID ou téléphone</Text>
                    </View>
                    <ChevronRight size={22} color="rgba(255,255,255,0.4)" />
                </TouchableOpacity>

                {/* Results header */}
                <View style={{ marginBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={{ fontFamily: 'Outfit_600SemiBold', fontSize: 12, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: 1.5 }}>
                        {searchQuery.length >= 3 ? "Résultats" : "Suggérés"}
                    </Text>
                    {!searchQuery && (
                        <TouchableOpacity onPress={() => router.push("/historique")}>
                            <Text style={{ fontFamily: 'Outfit_600SemiBold', fontSize: 13, color: '#F59E0B' }}>Voir tout</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Results List */}
                <View style={{ gap: 12 }}>
                    {searchQuery.length < 3 && (
                        <View style={{ paddingVertical: 32, alignItems: 'center' }}>
                            <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 14, color: 'rgba(255,255,255,0.35)', textAlign: 'center' }}>
                                Tapez au moins 3 caractères{'\n'}pour rechercher un bénéficiaire
                            </Text>
                        </View>
                    )}

                    {searchQuery.length >= 3 && searchResults.length === 0 && !isSearching && (
                        <View style={{ paddingVertical: 24, alignItems: 'center' }}>
                            <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 14, color: 'rgba(255,255,255,0.45)', textAlign: 'center' }}>
                                Aucun utilisateur trouvé pour @{searchQuery.trim()}
                            </Text>
                        </View>
                    )}

                    {searchQuery.length >= 3 && searchResults.map((recipient: any) => (
                        <TouchableOpacity
                            key={recipient.id}
                            onPress={() => handleSelectRecipient(recipient)}
                            style={{
                                backgroundColor: 'rgba(255,255,255,0.08)',
                                borderRadius: 20, padding: 20,
                                flexDirection: 'row', alignItems: 'center',
                                borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
                            }}
                            activeOpacity={0.8}
                        >
                            <View style={{
                                height: 48, width: 48, borderRadius: 24,
                                alignItems: 'center', justifyContent: 'center',
                                backgroundColor: 'rgba(245,158,11,0.15)',
                                borderWidth: 2, borderColor: 'rgba(245,158,11,0.3)',
                            }}>
                                <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 16, color: '#F59E0B' }}>
                                    {recipient.wuraId ? recipient.wuraId.substring(0, 2).toUpperCase() : "WU"}
                                </Text>
                            </View>

                            <View style={{ marginLeft: 16, flex: 1 }}>
                                <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 15, color: '#ffffff' }}>
                                    {recipient.email ? recipient.email.split('@')[0] : "Utilisateur Wura"}
                                </Text>
                                <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
                                    @{recipient.wuraId}
                                </Text>
                            </View>

                            <View style={{
                                height: 32, width: 32, borderRadius: 16,
                                alignItems: 'center', justifyContent: 'center',
                                backgroundColor: 'rgba(255,255,255,0.08)',
                            }}>
                                <ChevronRight size={16} color="rgba(255,255,255,0.4)" />
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
