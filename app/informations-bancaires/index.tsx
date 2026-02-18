import { useRouter } from "expo-router";
import { ArrowRight, Building2, CreditCard, Lock, User, Wallet } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { Image, SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import Svg, { Rect } from "react-native-svg";

export default function BankInfoScreen() {
    const router = useRouter();
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === "dark";

    return (
        <SafeAreaView className="flex-1 bg-background">
            <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
                <View className="flex-1 px-6 pt-2 pb-12">
                    {/* Header */}
                    <View className="mb-2 flex-col items-center gap-1 text-center">
                        <Image
                            source={isDark ? require("../../assets/images/wuraa-removebg-logoVersionDark.png") : require("../../assets/images/wuralogo-removebg-preview.png")}
                            style={{ width: 400, height: 110 }}
                            resizeMode="contain"
                        />
                        <Text className="mt-1 text-2xl font-bold text-foreground text-center">
                            Informations Bancaires
                        </Text>
                        <Text className="max-w-[300px] text-sm text-center text-muted-foreground">
                            Veuillez saisir les coordonnées de votre compte européen pour activer les virements.
                        </Text>
                    </View>

                    {/* Form */}
                    <View className="flex-col gap-6">
                        {/* Titulaire */}
                        <View className="flex-col gap-2">
                            <Text className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                Titulaire du compte
                            </Text>
                            <View className="relative justify-center">
                                <View className="absolute left-4 z-10">
                                    <User size={20} className="text-muted-foreground" color="#6b7280" />
                                </View>
                                <TextInput
                                    placeholder="Jean Dupont"
                                    placeholderTextColor="#9ca3af"
                                    className="w-full rounded-2xl border border-border bg-card py-4 pl-12 pr-4 text-base text-foreground bg-white"
                                />
                            </View>
                        </View>

                        {/* IBAN */}
                        <View className="flex-col gap-2">
                            <Text className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                IBAN
                            </Text>
                            <View className="relative justify-center">
                                <View className="absolute left-4 z-10">
                                    <CreditCard size={20} className="text-muted-foreground" color="#6b7280" />
                                </View>
                                <TextInput
                                    placeholder="FR76 1234 5678 9012"
                                    placeholderTextColor="#9ca3af"
                                    className="w-full rounded-2xl border border-border bg-card py-4 pl-12 pr-12 text-base text-foreground bg-white"
                                />
                                <View className="absolute right-4 z-10">
                                    {/* French Flag Icon (svg) */}
                                    <View className="h-4 w-6 rounded-sm overflow-hidden shadow-sm">
                                        <Svg width="100%" height="100%" viewBox="0 0 3 2">
                                            <Rect width="1" height="2" fill="#002654" />
                                            <Rect width="1" height="2" x="1" fill="#ffffff" />
                                            <Rect width="1" height="2" x="2" fill="#ed2939" />
                                        </Svg>
                                    </View>
                                </View>
                            </View>
                        </View>

                        {/* BIC/SWIFT */}
                        <View className="flex-col gap-2">
                            <Text className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                Code BIC/SWIFT
                            </Text>
                            <View className="relative justify-center">
                                <View className="absolute left-4 z-10">
                                    <Building2 size={20} className="text-muted-foreground" color="#6b7280" />
                                </View>
                                <TextInput
                                    placeholder="PARIFRPPXXX"
                                    placeholderTextColor="#9ca3af"
                                    className="w-full rounded-2xl border border-border bg-card py-4 pl-12 pr-4 text-base text-foreground bg-white"
                                />
                            </View>
                        </View>

                        {/* Nom de la banque */}
                        <View className="flex-col gap-2">
                            <Text className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                Nom de la banque
                            </Text>
                            <View className="relative justify-center">
                                <View className="absolute left-4 z-10">
                                    <Wallet size={20} className="text-muted-foreground" color="#6b7280" />
                                </View>
                                <TextInput
                                    placeholder="BNP Paribas"
                                    placeholderTextColor="#9ca3af"
                                    className="w-full rounded-2xl border border-border bg-card py-4 pl-12 pr-4 text-base text-foreground bg-white"
                                />
                            </View>
                        </View>
                    </View>

                    {/* Security Notice */}
                    <View className="mt-8 flex-row items-center justify-center gap-2">
                        <Lock size={12} className="text-muted-foreground" color="#6b7280" />
                        <Text className="text-xs text-muted-foreground text-center">
                            Vos données sont chiffrées de bout en bout
                        </Text>
                    </View>

                    {/* Spacer */}
                    <View className="flex-1 min-h-[32px]" />

                    {/* Action Button */}
                    <TouchableOpacity
                        onPress={() => router.push("/verification-identite")}
                        className="mb-8 flex-row w-full items-center justify-center gap-2 rounded-full bg-primary py-4 active:scale-95 transition-transform shadow-lg shadow-primary/20"
                    >
                        <Text className="text-base font-bold text-primary-foreground text-white">
                            Enregistrer mes coordonnées
                        </Text>
                        <ArrowRight size={20} color="white" />
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
