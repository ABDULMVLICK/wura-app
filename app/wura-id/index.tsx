import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, SafeAreaView } from "react-native";
import { useRouter } from "expo-router";
import { ChevronLeft, ArrowRight, Diamond } from "lucide-react-native";

export default function WuraIdScreen() {
    const router = useRouter();
    const [wuraId, setWuraId] = useState("JeanD");

    const suggestions = ["JeanD_01", "Jean.Du", "Pro_Jean"];

    const handleContinue = () => {
        // Navigate to Home
        router.push("/accueil");
    };

    return (
        <SafeAreaView className="flex-1 bg-background">
            <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
                <View className="flex-1 px-6 pt-12 pb-8">
                    {/* Header */}
                    <View className="relative mb-8 flex-row items-center justify-center">
                        <TouchableOpacity
                            onPress={() => router.back()}
                            className="absolute left-0 h-9 w-9 items-center justify-center"
                        >
                            <ChevronLeft size={24} className="text-foreground" color="#1a1a2e" />
                        </TouchableOpacity>

                        {/* Progress Bar */}
                        <View className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                            <View className="h-full w-2/3 bg-accent rounded-full" />
                        </View>
                    </View>

                    {/* Diamond Icon */}
                    <View className="mb-6 items-center justify-center">
                        <View className="flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-50">
                            <Diamond size={40} className="text-amber-500" color="#f59e0b" fill="#f59e0b" />
                        </View>
                    </View>

                    {/* Title & Description */}
                    <View className="mb-10 items-center">
                        <Text className="text-3xl font-bold tracking-tight text-primary text-center">
                            Créez votre{"\n"}identité unique
                        </Text>
                        <Text className="mt-4 text-sm text-center text-muted-foreground leading-relaxed">
                            Choisissez un <Text className="font-bold text-primary">@wuraID</Text> pour envoyer{"\n"}
                            et recevoir de l'argent instantanément,{"\n"}
                            sans partager vos données bancaires.
                        </Text>
                    </View>

                    {/* Input Field */}
                    <View className="mb-2 relative items-center">
                        <View className="flex-row items-center rounded-3xl bg-muted/50 px-6 py-4 w-full">
                            <Text className="text-xl font-bold text-muted-foreground mr-1">@</Text>
                            <TextInput
                                value={wuraId}
                                onChangeText={setWuraId}
                                className="flex-1 bg-transparent text-center text-xl font-bold text-foreground"
                                placeholder="VotrePseudo"
                                placeholderTextColor="#9ca3af" // muted-foreground/50
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                        </View>
                    </View>

                    {/* Verification Status (Mock) */}
                    <View className="mb-8 flex-row items-center justify-center gap-2">
                        <View className="h-2 w-2 rounded-full bg-amber-400" /> {/* animate-pulse logic later if needed */}
                        <Text className="text-xs font-medium text-muted-foreground">Vérification...</Text>
                    </View>

                    {/* Suggestions */}
                    <View className="mb-12 flex-row flex-wrap justify-center gap-3">
                        {suggestions.map((suggestion) => (
                            <TouchableOpacity
                                key={suggestion}
                                onPress={() => setWuraId(suggestion)}
                                className="rounded-full bg-muted/50 px-4 py-2"
                            >
                                <Text className="text-sm font-medium text-foreground">{suggestion}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Spacer */}
                    <View className="flex-1 min-h-[32px]" />

                    {/* Continue Button */}
                    <TouchableOpacity
                        onPress={handleContinue}
                        className="mb-6 flex-row w-full items-center justify-center gap-2 rounded-full bg-primary py-4 active:scale-95 transition-transform shadow-lg shadow-primary/20"
                    >
                        <Text className="text-base font-bold text-primary-foreground text-white">
                            Continuer
                        </Text>
                        <ArrowRight size={20} color="white" />
                    </TouchableOpacity>

                    {/* Termes */}
                    <Text className="text-center text-[10px] text-muted-foreground px-4">
                        En continuant, vous acceptez nos <Text className="underline">Conditions Générales</Text>
                    </Text>

                    {/* Bottom handle */}
                    <View className="items-center mt-6">
                        <View className="h-1 w-12 rounded-full bg-muted-foreground/20" />
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
