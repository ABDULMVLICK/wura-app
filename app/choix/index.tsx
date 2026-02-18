import { View, Text, TouchableOpacity, SafeAreaView } from "react-native";
import { useRouter } from "expo-router";
import { Send, Download, ArrowRight } from "lucide-react-native";

export default function ChoiceScreen() {
    const router = useRouter();

    return (
        <SafeAreaView className="flex-1 bg-background">
            <View className="flex-1 items-center justify-center px-6">
                {/* Logo */}
                <View className="mb-12 items-center">
                    <Text className="text-4xl font-extrabold tracking-tight text-foreground italic lowercase">
                        wura<Text className="text-[#F59E0B]">.</Text>
                    </Text>
                    <Text className="mt-3 text-sm text-muted-foreground text-center">
                        Que souhaitez-vous faire ?
                    </Text>
                </View>

                {/* Choice Cards */}
                <View className="w-full max-w-sm flex-col gap-4">
                    {/* Choice 1: Send from Africa */}
                    <TouchableOpacity
                        onPress={() => router.push("/inscription-sender")}
                        className="w-full flex-row items-center gap-4 rounded-2xl border-2 border-[#064E3B] bg-[#064E3B]/5 p-5 active:opacity-80"
                    >
                        <View className="flex h-14 w-14 items-center justify-center rounded-full bg-[#064E3B]">
                            <Send size={24} color="white" />
                        </View>
                        <View className="flex-1 flex-col gap-1">
                            <Text className="text-base font-bold text-foreground">
                                Envoyer depuis l'Afrique
                            </Text>
                            <Text className="text-xs text-muted-foreground">
                                Envoyez de l'argent vers l'Europe rapidement
                            </Text>
                        </View>
                        <ArrowRight size={20} color="#064E3B" />
                    </TouchableOpacity>

                    {/* Choice 2: Receive in Europe */}
                    <TouchableOpacity
                        onPress={() => router.push("/inscription-receiver")}
                        className="w-full flex-row items-center gap-4 rounded-2xl border-2 border-[#F59E0B] bg-[#F59E0B]/5 p-5 active:opacity-80"
                    >
                        <View className="flex h-14 w-14 items-center justify-center rounded-full bg-[#F59E0B]">
                            <Download size={24} color="white" />
                        </View>
                        <View className="flex-1 flex-col gap-1">
                            <Text className="text-base font-bold text-foreground">
                                Recevoir en Europe
                            </Text>
                            <Text className="text-xs text-muted-foreground">
                                Recevez de l'argent depuis l'Afrique
                            </Text>
                        </View>
                        <ArrowRight size={20} color="#F59E0B" />
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}
