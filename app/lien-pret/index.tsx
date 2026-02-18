import { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as Clipboard from "expo-clipboard";
import { Copy, Check, Link as LinkIcon, CheckCircle2 } from "lucide-react-native";

const GENERATED_LINK = "wura.app/send/jean-1x8k...";

export default function LienPretScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { amount } = params;
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await Clipboard.setStringAsync(`https://${GENERATED_LINK}`);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (e) {
            console.error(e);
            // Fallback or error handling
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-background">
            <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
                {/* ... existing content ... */}
                <View className="flex-1 items-center px-6 py-12">
                    {/* ... (keep exact same content above) ... */}

                    {/* Keep everything same until the button */}

                    {/* Spacer top */}
                    <View className="flex-1 min-h-[32px]" />

                    {/* Success icon */}
                    <View className="relative mb-6 items-center justify-center">
                        {/* Glow effect - simplified for RN */}
                        <View className="absolute h-32 w-32 rounded-full bg-accent/20" /> {/* blur-2xl difficult in RN without dedicated lib, using opacity */}

                        {/* Outer ring */}
                        <View className="relative flex h-28 w-28 items-center justify-center rounded-full border-[3px] border-accent bg-amber-50">
                            {/* Inner circle with checkmark */}
                            <View className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
                                <Check className="text-accent" size={36} color="#f59e0b" strokeWidth={2.5} />
                            </View>
                        </View>

                        {/* Decorative elements - absolute positioning */}
                        <View className="absolute -right-6 top-2 h-3 w-3 bg-accent/30 rotate-45" />
                        <View className="absolute -left-8 bottom-4 h-2 w-2 rounded-full bg-accent/40" />
                        <View className="absolute -right-4 -bottom-2 h-1.5 w-1.5 rounded-full bg-accent/25" />
                    </View>

                    {/* Title */}
                    <Text className="mb-2 text-center text-2xl font-bold text-foreground">
                        Lien Prêt !
                    </Text>

                    {/* Subtitle */}
                    <Text className="mb-10 max-w-[260px] text-center text-sm text-muted-foreground leading-relaxed">
                        Le lien pour votre bénéficiaire a été généré avec succès.
                    </Text>

                    {/* Link card */}
                    <View className="mb-6 w-full rounded-2xl border border-accent/20 bg-amber-50 p-5">
                        <Text className="mb-3 text-center text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
                            Lien de paiement
                        </Text>
                        <View className="flex-row items-center justify-center gap-2.5 rounded-xl border border-dashed border-accent/30 bg-card px-4 py-3">
                            <LinkIcon size={16} className="text-accent" color="#f59e0b" />
                            <Text
                                numberOfLines={1}
                                ellipsizeMode="tail"
                                className="text-sm font-medium text-foreground"
                            >
                                {GENERATED_LINK}
                            </Text>
                        </View>
                    </View>

                    {/* Copy button */}
                    <TouchableOpacity
                        onPress={handleCopy}
                        className="mb-5 flex-row w-full items-center justify-center gap-3 rounded-2xl bg-primary py-4 active:opacity-80"
                    >
                        {copied ? (
                            <>
                                <Check size={20} color="white" />
                                <Text className="text-base font-semibold text-white">Lien copié !</Text>
                            </>
                        ) : (
                            <>
                                <Copy size={20} color="white" />
                                <Text className="text-base font-semibold text-white">Copier le lien</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    {/* Share text */}
                    <Text className="mb-6 max-w-[280px] text-center text-base font-bold text-foreground leading-snug">
                        Envoyez-le par message au bénéficiaire
                    </Text>

                    {/* Spacer */}
                    <View className="flex-1 min-h-[32px]" />

                    {/* Return link -> Changed to "Terminer" redirecting to Success */}
                    <TouchableOpacity
                        onPress={() => router.push({ pathname: "/sender-home/transfert-reussi", params: { amount } })}
                        className="mb-10 p-4 w-full items-center justify-center rounded-2xl border-2 border-[#F59E0B]"
                    >
                        <Text className="text-sm font-bold tracking-widest text-[#F59E0B] uppercase">
                            Terminer et Voir le reçu
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
