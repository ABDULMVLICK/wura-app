import { View, Text, TouchableOpacity, ScrollView, SafeAreaView } from "react-native";
import { useRouter } from "expo-router";
import { Check, ArrowRight, FileText, Building2, Clock, Hash } from "lucide-react-native";
import { clsx } from "clsx";

export default function RetraitSuccesScreen() {
    const router = useRouter();
    // Mock data matching the screenshot
    const amount = 500.00;
    const bankName = "BNP Paribas";
    const estimatedDate = "24-48h";
    const reference = "#TRX-89204";

    return (
        <SafeAreaView className="flex-1 bg-background">
            <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
                <View className="flex-1 px-6 pt-12 pb-8 items-center">
                    {/* Success Animation / Hero */}
                    <View className="relative mb-8 items-center justify-center">
                        {/* Glow effect */}
                        <View className="absolute h-32 w-32 rounded-full bg-amber-200 opacity-50" />
                        {/* blur-3xl hard in RN without lib, using opacity */}

                        <View className="relative flex h-24 w-24 items-center justify-center rounded-full bg-background border-4 border-amber-100 shadow-lg">
                            <View className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-500">
                                <Check size={40} color="white" strokeWidth={3} />
                            </View>
                        </View>
                    </View>

                    {/* Title & Message */}
                    <View className="mb-10 items-center px-4">
                        <Text className="text-2xl font-bold tracking-tight text-foreground text-center">
                            Demande de retrait confirmée
                        </Text>
                        <Text className="mt-3 text-sm text-muted-foreground text-center leading-relaxed">
                            Votre transaction a été traitée avec succès et est en route vers votre compte bancaire.
                        </Text>
                    </View>

                    {/* Receipt Card */}
                    <View className="w-full rounded-3xl bg-card p-6 shadow-sm border border-border/50 relative overflow-hidden mb-10">
                        {/* Top decorative line */}
                        <View className="absolute top-0 left-[33%] w-1/3 h-1 bg-amber-400 rounded-b-full opacity-50" />

                        <View className="flex-col items-center mb-8 pt-2">
                            <Text className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
                                MONTANT ENVOYÉ
                            </Text>
                            <View className="flex-row items-center gap-1">
                                <Text className="text-4xl font-bold text-foreground">
                                    {amount.toLocaleString("fr-FR", { minimumFractionDigits: 2 })}
                                </Text>
                                <Text className="text-2xl font-bold text-amber-500">€</Text>
                            </View>
                        </View>

                        <View className="my-6 border-t border-dashed border-border/60" style={{ borderStyle: 'dashed', borderWidth: 1, borderColor: '#e5e7eb' }} />

                        <View className="flex-col gap-5">
                            <View className="flex-row items-center justify-between">
                                <View className="flex-row items-center gap-3">
                                    <View className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                                        <Building2 size={16} className="text-muted-foreground" color="#6b7280" />
                                    </View>
                                    <Text className="text-sm text-muted-foreground">Banque</Text>
                                </View>
                                <Text className="text-sm font-bold text-foreground">{bankName}</Text>
                            </View>

                            <View className="flex-row items-center justify-between">
                                <View className="flex-row items-center gap-3">
                                    <View className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                                        <Clock size={16} className="text-muted-foreground" color="#6b7280" />
                                    </View>
                                    <Text className="text-sm text-muted-foreground">Date estimée</Text>
                                </View>
                                <Text className="text-sm font-bold text-foreground">{estimatedDate}</Text>
                            </View>

                            <View className="flex-row items-center justify-between">
                                <View className="flex-row items-center gap-3">
                                    <View className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                                        <Hash size={16} className="text-muted-foreground" color="#6b7280" />
                                    </View>
                                    <Text className="text-sm text-muted-foreground">Référence</Text>
                                </View>
                                <View className="bg-muted/50 px-2 py-1 rounded">
                                    <Text className="text-xs font-mono font-medium text-muted-foreground">
                                        {reference}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Spacer */}
                    <View className="flex-1 min-h-[16px]" />

                    {/* Decorative element */}
                    <View className="mb-8 items-center">
                        <View className="h-2 w-2 rounded-full bg-muted-foreground/30" />
                    </View>

                    {/* Return Button */}
                    <TouchableOpacity
                        onPress={() => router.push("/accueil")}
                        className="mb-6 flex-row w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 active:scale-95 transition-transform shadow-lg shadow-primary/20"
                    >
                        <Text className="text-base font-bold text-primary-foreground text-white">
                            Retour au tableau de bord
                        </Text>
                        <ArrowRight size={20} color="white" />
                    </TouchableOpacity>

                    {/* View Receipt Link */}
                    <TouchableOpacity className="flex-row items-center gap-2">
                        <FileText size={16} className="text-muted-foreground" color="#6b7280" />
                        <Text className="text-sm font-medium text-muted-foreground">
                            Voir le reçu
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
