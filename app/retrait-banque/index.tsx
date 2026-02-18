import { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView } from "react-native";
import { useRouter } from "expo-router";
import { ChevronLeft, Wallet, Info, ArrowRight, Lock, Building2 } from "lucide-react-native";
import { clsx } from "clsx";

export default function RetraitBanqueScreen() {
    const router = useRouter();
    const [amount] = useState(100.00);
    const balance = 2450.00;
    const fees = 0.50;

    return (
        <SafeAreaView className="flex-1 bg-background">
            <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
                <View className="flex-1 px-6 pt-12 pb-8">
                    {/* Header */}
                    <View className="relative mb-10 flex-row items-center justify-center">
                        <TouchableOpacity
                            onPress={() => router.back()}
                            className="absolute left-0 h-9 w-9 items-center justify-center"
                        >
                            <ChevronLeft size={24} className="text-foreground" color="#1a1a2e" />
                        </TouchableOpacity>
                        <Text className="text-lg font-bold text-foreground">Retrait vers la banque</Text>
                    </View>

                    {/* Amount Section */}
                    <View className="mb-10 flex-col items-center">
                        <Text className="mb-4 text-sm text-muted-foreground">Combien souhaitez-vous retirer ?</Text>
                        <View className="flex-row items-center justify-center gap-2">
                            <Text className="text-4xl font-bold text-primary">€</Text>
                            <Text className="text-6xl font-bold text-primary">
                                {amount.toLocaleString("fr-FR", { minimumFractionDigits: 2 })}
                            </Text>
                        </View>

                        {/* Balance Badge */}
                        <View className="mt-6 flex-row items-center gap-2 rounded-full bg-emerald-50 px-4 py-2">
                            <Wallet size={16} className="text-emerald-800" color="#065f46" />
                            <Text className="text-sm font-medium text-emerald-800">
                                Solde dispo: {balance.toLocaleString("fr-FR", { minimumFractionDigits: 2 })}€
                            </Text>
                        </View>
                    </View>

                    {/* Bank Account Selector Card */}
                    <View className="mb-6 rounded-3xl border border-border bg-card p-6 shadow-sm">
                        <Text className="mb-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                            Vers le compte
                        </Text>
                        <View className="flex-row items-center justify-between">
                            <View className="flex-row items-center gap-4">
                                <View className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50">
                                    <Building2 size={24} className="text-blue-600" color="#2563eb" />
                                </View>
                                <View>
                                    <Text className="font-bold text-foreground">BNP Paribas</Text>
                                    <Text className="font-mono text-sm text-muted-foreground">FR76 •••• •••• 4589</Text>
                                </View>
                            </View>
                            <ChevronLeft size={20} className="text-muted-foreground rotate-270" color="#6b7280" style={{ transform: [{ rotate: '-90deg' }] }} />
                        </View>
                    </View>

                    {/* Summary Card */}
                    <View className="mb-8 rounded-3xl border border-border bg-card p-6 shadow-sm">
                        <View className="mb-4 flex-row items-center justify-between">
                            <Text className="text-sm text-muted-foreground">Montant du retrait</Text>
                            <Text className="font-bold text-foreground">{amount.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €</Text>
                        </View>
                        <View className="mb-4 flex-row items-center justify-between border-b border-border/50 pb-4">
                            <View className="flex-row items-center gap-1.5">
                                <Text className="text-sm text-muted-foreground">Frais de service</Text>
                                <Info size={14} className="text-muted-foreground/70" color="#9ca3af" />
                            </View>
                            <Text className="font-bold text-foreground">{fees.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €</Text>
                        </View>
                        <View className="flex-row items-center justify-between">
                            <Text className="font-bold text-primary">Total débité</Text>
                            <Text className="text-xl font-bold text-primary">
                                {(amount + fees).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €
                            </Text>
                        </View>
                    </View>

                    {/* Spacer */}
                    <View className="flex-1 min-h-[16px]" />

                    {/* Confirm Button */}
                    <TouchableOpacity
                        onPress={() => router.push("/retrait-banque/succes")}
                        className="mb-6 flex-row w-full items-center justify-center gap-2 rounded-full bg-primary py-4 active:scale-95 transition-transform shadow-lg shadow-primary/20"
                    >
                        <Text className="text-base font-bold text-primary-foreground text-white">
                            Confirmer le retrait
                        </Text>
                        <ArrowRight size={20} color="white" />
                    </TouchableOpacity>

                    {/* Security Footer */}
                    <View className="flex-row items-center justify-center gap-2 mb-4">
                        <Lock size={12} className="text-emerald-600" color="#059669" />
                        <Text className="text-[10px] font-medium text-muted-foreground">
                            Transaction sécurisée SSL256-bit
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
