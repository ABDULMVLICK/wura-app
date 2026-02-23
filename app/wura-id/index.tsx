import { useRouter } from "expo-router";
import { ArrowRight, Check, ChevronLeft, Diamond, X } from "lucide-react-native";
import { useEffect, useState } from "react";
import {  ActivityIndicator, Alert,  ScrollView, Text, TextInput, TouchableOpacity, View  } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context";
import { claimWuraId, generateWuraId, isWuraIdTaken, useAuth } from "../../contexts/AuthContext";

export default function WuraIdScreen() {
    const router = useRouter();
    const { user, profile, refreshProfile } = useAuth();
    const [wuraId, setWuraId] = useState("");
    const [checking, setChecking] = useState(false);
    const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
    const [saving, setSaving] = useState(false);

    // Génère des suggestions basées sur le nom de l'utilisateur
    const prenom = profile?.prenom || "User";
    const suggestions = [
        generateWuraId(prenom),
        generateWuraId(prenom),
        generateWuraId(prenom),
    ];

    // Vérifie la disponibilité du wuraId avec un debounce
    useEffect(() => {
        if (!wuraId.trim() || wuraId.length < 3) {
            setIsAvailable(null);
            return;
        }

        setChecking(true);
        const timeout = setTimeout(async () => {
            try {
                const taken = await isWuraIdTaken(wuraId.trim());
                setIsAvailable(!taken);
            } catch (error) {
                console.error("Erreur vérification wuraId:", error);
                setIsAvailable(null);
            } finally {
                setChecking(false);
            }
        }, 500);

        return () => clearTimeout(timeout);
    }, [wuraId]);

    const handleContinue = async () => {
        if (!wuraId.trim() || !isAvailable || !user) return;

        setSaving(true);
        try {
            // Réserve le wuraId de manière atomique (transaction Firestore)
            const success = await claimWuraId(user.uid, wuraId.trim());

            if (!success) {
                Alert.alert("Déjà pris", "Ce WuraId vient d'être pris par quelqu'un d'autre. Essayez un autre.");
                setIsAvailable(false);
                return;
            }

            await refreshProfile();
            // Navigate to receiver home
            router.replace("/accueil");
        } catch (error: any) {
            console.error("Erreur sauvegarde wuraId:", error);
            Alert.alert("Erreur", "Impossible de sauvegarder votre WuraId.");
        } finally {
            setSaving(false);
        }
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
                            Choisissez un <Text className="font-bold text-primary">@wuraID</Text> pour que les envoyeurs{"\n"}
                            puissent vous retrouver facilement{"\n"}
                            et vous envoyer de l'argent instantanément.
                        </Text>
                    </View>

                    {/* Input Field */}
                    <View className="mb-2 relative items-center">
                        <View className="flex-row items-center rounded-3xl bg-muted/50 px-6 py-4 w-full">
                            <Text className="text-xl font-bold text-muted-foreground mr-1">@</Text>
                            <TextInput
                                value={wuraId}
                                onChangeText={(text) => setWuraId(text.replace(/[^a-zA-Z0-9_.-]/g, ""))}
                                className="flex-1 bg-transparent text-center text-xl font-bold text-foreground"
                                placeholder="VotrePseudo"
                                placeholderTextColor="#9ca3af"
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                        </View>
                    </View>

                    {/* Verification Status */}
                    <View className="mb-8 flex-row items-center justify-center gap-2">
                        {wuraId.length < 3 ? (
                            <Text className="text-xs font-medium text-muted-foreground">
                                Minimum 3 caractères
                            </Text>
                        ) : checking ? (
                            <>
                                <ActivityIndicator size="small" color="#f59e0b" />
                                <Text className="text-xs font-medium text-muted-foreground">Vérification...</Text>
                            </>
                        ) : isAvailable === true ? (
                            <>
                                <Check size={14} color="#22c55e" />
                                <Text className="text-xs font-medium text-green-500">@{wuraId} est disponible !</Text>
                            </>
                        ) : isAvailable === false ? (
                            <>
                                <X size={14} color="#ef4444" />
                                <Text className="text-xs font-medium text-red-500">@{wuraId} est déjà pris</Text>
                            </>
                        ) : null}
                    </View>

                    {/* Suggestions */}
                    <View className="mb-12 flex-row flex-wrap justify-center gap-3">
                        {suggestions.map((suggestion, i) => (
                            <TouchableOpacity
                                key={`${suggestion}-${i}`}
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
                        disabled={!isAvailable || saving}
                        className="mb-6 flex-row w-full items-center justify-center gap-2 rounded-full bg-primary py-4 active:scale-95 transition-transform shadow-lg shadow-primary/20"
                        style={(!isAvailable || saving) ? { opacity: 0.5 } : {}}
                    >
                        {saving ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <>
                                <Text className="text-base font-bold text-primary-foreground text-white">
                                    Continuer
                                </Text>
                                <ArrowRight size={20} color="white" />
                            </>
                        )}
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
