import { View, Text } from "react-native";

export function WuraLogo() {
    return (
        <View className="flex-col items-center gap-3">
            <Text className="text-4xl font-bold tracking-tight text-foreground">
                wura<Text className="text-accent">.</Text>
            </Text>
            <Text className="text-sm text-muted-foreground">
                Transferts d'argent premium vers l'Europe
            </Text>
        </View>
    );
}
