import { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ChevronLeft, ShieldCheck, ArrowRight } from "lucide-react-native";
import { clsx } from "clsx";

interface PaymentMethod {
    id: string;
    label: string;
    shortName: string;
    colors: {
        bg: string;
        text: string;
    };
}

const PAYMENT_METHODS: PaymentMethod[] = [
    {
        id: "mtn",
        label: "MTN Mobile Money",
        shortName: "MTN",
        colors: {
            bg: "bg-[#ffcc00]",
            text: "text-[#1a1a1a]",
        },
    },
    {
        id: "moov",
        label: "Moov Money",
        shortName: "MOOV",
        colors: {
            bg: "bg-[#5b86e5]", // Gradient approximation or simplified color for NativeWind if gradients not supported seamlessly without specific linear-gradient lib. Tailwind arbitrary gradients might not work perfectly in RN without expo-linear-gradient. I'll use a solid color fallback for Moov or check if NativeWind handles it. For now, solid color.
            text: "text-white",
        },
    },
    {
        id: "orange",
        label: "Orange Money",
        shortName: "OM",
        colors: {
            bg: "bg-[#ff6600]",
            text: "text-white",
        },
    },
    {
        id: "airtel",
        label: "Airtel Money",
        shortName: "Airtel",
        colors: {
            bg: "bg-[#ed1c24]",
            text: "text-white",
        },
    },
    {
        id: "wave",
        label: "Wave",
        shortName: "Wave",
        colors: {
            bg: "bg-[#1dc4f0]",
            text: "text-white",
        },
    },
];

function formatAmount(value: number): string {
    // .replace is not strictly necessary for display if we use locale, but sticking to logic
    return value.toLocaleString("fr-FR").replace(/,/g, ".");
}

export default function PaiementScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const [selected, setSelected] = useState("mtn");

    const amountParam = params.amount;
    // Handle string | string[] from search params
    const rawAmount = Array.isArray(amountParam) ? amountParam[0] : amountParam;
    const amount = rawAmount ? parseInt(rawAmount, 10) : 12500;

    return (
        <SafeAreaView className="flex-1 bg-background">
            <View className="flex-1 flex-col">
                {/* Header */}
                <View className="relative flex-row items-center justify-center px-5 pt-4 pb-4">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="absolute left-5 flex h-9 w-9 items-center justify-center"
                    >
                        <ChevronLeft size={24} className="text-foreground" color="#1a1a2e" />
                    </TouchableOpacity>
                    <Text className="text-base font-semibold text-foreground">Paiement</Text>
                </View>

                <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
                    {/* Title */}
                    <View className="flex-col gap-2 px-6 pt-4 pb-6">
                        <Text className="text-2xl font-bold text-foreground">
                            Choisir le mode de paiement
                        </Text>
                        <Text className="text-sm text-muted-foreground leading-relaxed">
                            Sélectionnez le compte à débiter pour votre transaction.
                        </Text>
                    </View>

                    {/* Payment methods */}
                    <View className="flex-col gap-3 px-5">
                        {PAYMENT_METHODS.map((method) => {
                            const isSelected = selected === method.id;
                            return (
                                <TouchableOpacity
                                    key={method.id}
                                    onPress={() => setSelected(method.id)}
                                    className={clsx(
                                        "flex-row items-center gap-4 rounded-2xl border-2 bg-card p-4 transition-all",
                                        isSelected
                                            ? "border-accent" // shadow simplified via border for now
                                            : "border-transparent"
                                    )}
                                    style={isSelected ? { shadowColor: '#f59e0b', shadowOpacity: 0.15, shadowRadius: 1, elevation: 1 } : {}}
                                >
                                    {/* Icon badge */}
                                    <View
                                        className={clsx(
                                            "flex h-14 w-14 shrink-0 items-center justify-center rounded-xl",
                                            method.colors.bg
                                        )}
                                    >
                                        <Text className={clsx("text-xs font-bold", method.colors.text)}>
                                            {method.shortName}
                                        </Text>
                                    </View>

                                    {/* Label */}
                                    <View className="flex-1 flex-col items-start">
                                        <Text className="text-base font-semibold text-foreground">
                                            {method.label}
                                        </Text>
                                    </View>

                                    {/* Radio */}
                                    <View
                                        className={clsx(
                                            "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2",
                                            isSelected
                                                ? "border-accent bg-accent"
                                                : "border-muted-foreground bg-transparent" // border-muted-foreground/30 approx
                                        )}
                                    >
                                        {isSelected && (
                                            <View className="h-2.5 w-2.5 rounded-full bg-card" />
                                        )}
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* Security notice */}
                    <View className="flex-row items-center justify-center gap-2 px-5 pt-6">
                        <ShieldCheck size={16} className="text-muted-foreground" color="#6b7280" />
                        <Text className="text-xs text-muted-foreground">
                            Paiement 100% sécurisé par Wura
                        </Text>
                    </View>
                </ScrollView>

                {/* Footer total + CTA */}
                <View className="mt-auto flex-col gap-4 px-5 pb-8 pt-4 border-t border-border/10 bg-background">
                    {/* Total */}
                    <View className="flex-row items-center justify-between">
                        <Text className="text-base text-muted-foreground">Total à payer</Text>
                        <Text className="text-2xl font-bold text-foreground">
                            {formatAmount(amount)} FCFA
                        </Text>
                    </View>

                    {/* CTA */}
                    <TouchableOpacity
                        onPress={() => router.push({ pathname: "/lien-pret", params: { amount } })}
                        className="w-full bg-[#064E3B] py-4 rounded-2xl shadow-lg shadow-emerald-900/10 flex-row items-center justify-center gap-2 active:scale-[0.98]"
                    >
                        <Text className="text-base font-semibold text-white">
                            Confirmer et Payer
                        </Text>
                        <ArrowRight size={20} color="white" />
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}
