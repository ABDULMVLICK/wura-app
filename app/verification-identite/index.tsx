import { useState } from "react";
import {  View, Text, TouchableOpacity, ScrollView } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ShieldCheck, Clock, CheckCircle2, ArrowRight, CloudUpload } from "lucide-react-native";
import { clsx } from "clsx";

type KycStatus = "unverified" | "pending" | "verified";

export default function VerificationIdentiteScreen() {
    const router = useRouter();
    const [status, setStatus] = useState<KycStatus>("unverified");

    return (
        <SafeAreaView className="flex-1 bg-background">
            <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
                <View className="flex-1 items-center px-6 pt-12">
                    {/* Header */}
                    <View className="mb-10 items-center justify-center">
                        <Text className="text-2xl font-bold text-foreground text-center">
                            Vérification d'identité
                        </Text>
                        <Text className="mt-2 text-sm text-muted-foreground text-center">
                            Sécurisez votre compte et débloquez toutes les fonctionnalités.
                        </Text>
                    </View>

                    {/* Dynamic Content based on Status */}
                    <View className="w-full flex-1 flex-col items-center justify-start gap-8">
                        {/* STATE 1: UNVERIFIED */}
                        {status === "unverified" && (
                            <View className="w-full flex-col items-center gap-6 rounded-3xl border border-dashed border-muted-foreground/30 bg-card p-6 shadow-sm">
                                <View className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50">
                                    <ShieldCheck size={40} className="text-emerald-600" color="#059669" />
                                </View>
                                <View className="items-center">
                                    <Text className="text-lg font-bold text-foreground">Non Vérifié</Text>
                                    <Text className="mt-1 text-sm text-muted-foreground text-center">
                                        Veuillez soumettre vos documents pour activer les retraits.
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    onPress={() => setStatus("pending")}
                                    className="flex-row w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3.5 active:opacity-80 transition-opacity"
                                >
                                    <CloudUpload size={16} color="white" />
                                    <Text className="text-sm font-bold text-white">
                                        Démarrer la vérification
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* STATE 2: PENDING */}
                        {status === "pending" && (
                            <View className="w-full flex-col items-center gap-6 rounded-3xl border border-yellow-200 bg-yellow-50 p-6 shadow-sm">
                                <View className="flex h-20 w-20 items-center justify-center rounded-full bg-yellow-100">
                                    <Clock size={40} className="text-yellow-600" color="#ca8a04" />
                                </View>
                                <View className="items-center">
                                    <View className="flex-row items-center justify-center gap-2">
                                        <Text className="text-lg font-bold text-foreground">Vérification en cours</Text>
                                    </View>
                                    <Text className="mt-2 text-sm text-muted-foreground text-center">
                                        Vos documents sont en cours d'analyse. Cette opération peut prendre jusqu'à 24h.
                                    </Text>
                                    <View className="mt-4 rounded-lg bg-white/50 px-3 py-2">
                                        <Text className="text-xs font-medium text-muted-foreground">
                                            🔒 Retraits temporairement désactivés
                                        </Text>
                                    </View>
                                </View>
                                <TouchableOpacity
                                    onPress={() => setStatus("verified")}
                                    className="mt-2"
                                >
                                    <Text className="text-xs font-semibold text-yellow-600 underline">
                                        (Démo: Passer à 'Vérifié')
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* STATE 3: VERIFIED */}
                        {status === "verified" && (
                            <View className="w-full flex-col items-center gap-6 rounded-3xl border border-emerald-100 bg-emerald-50 p-6 shadow-sm">
                                <View className="relative">
                                    <View className="flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100">
                                        <CheckCircle2 size={48} className="text-emerald-600" color="#059669" />
                                    </View>
                                    <View className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-background border-4 border-background">
                                        <View className="h-full w-full rounded-full bg-amber-400 items-center justify-center">
                                            <CheckCircle2 size={12} color="white" />
                                        </View>
                                    </View>
                                </View>
                                <View className="items-center">
                                    <Text className="text-2xl font-bold text-foreground">Utilisateur Vérifié</Text>
                                    <Text className="mt-2 text-sm text-muted-foreground text-center">
                                        Félicitations ! Votre identité a été confirmée. Vous avez accès à toutes les fonctionnalités.
                                    </Text>
                                </View>
                                <View className="w-full flex-col gap-3">
                                    <View className="flex-row items-center gap-3 rounded-xl bg-background p-3">
                                        <View className="h-2 w-2 rounded-full bg-emerald-500" />
                                        <Text className="text-sm font-medium text-foreground">Retraits illimités</Text>
                                    </View>
                                    <View className="flex-row items-center gap-3 rounded-xl bg-background p-3">
                                        <View className="h-2 w-2 rounded-full bg-emerald-500" />
                                        <Text className="text-sm font-medium text-foreground">Transferts prioritaires</Text>
                                    </View>
                                </View>
                                <TouchableOpacity
                                    onPress={() => router.push("/wura-id")}
                                    className="mt-4 flex-row w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 active:opacity-80 transition-opacity shadow-lg shadow-primary/20"
                                >
                                    <Text className="text-base font-bold text-primary-foreground text-white">
                                        Continuer vers WuraID
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>

                    {/* Demo Controls */}
                    <View className="mt-12 mb-8 flex-col items-center gap-2 rounded-xl bg-muted p-4 opacity-50">
                        <Text className="text-xs font-bold uppercase text-muted-foreground tracking-widest">
                            CONTROLES DEMO
                        </Text>
                        <View className="flex-row gap-2">
                            <TouchableOpacity onPress={() => setStatus("unverified")} className="px-3 py-1 bg-background rounded border border-border shadow-sm">
                                <Text className="text-xs text-foreground">Non Vérifié</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setStatus("pending")} className="px-3 py-1 bg-background rounded border border-border shadow-sm">
                                <Text className="text-xs text-foreground">En Attente</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setStatus("verified")} className="px-3 py-1 bg-background rounded border border-border shadow-sm">
                                <Text className="text-xs text-foreground">Vérifié</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
