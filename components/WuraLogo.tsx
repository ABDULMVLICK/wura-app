import { useColorScheme } from "nativewind";
import { Image, Text, View } from "react-native";

interface WuraLogoProps {
    size?: "sm" | "md" | "lg" | "xl";
    showSubtitle?: boolean;
    subtitle?: string;
}

const SIZES = {
    sm: { width: 160, height: 55 },
    md: { width: 300, height: 85 },
    lg: { width: 400, height: 110 },
    xl: { width: 600, height: 160 },
};

const LOGO_LIGHT = require("../assets/images/wuralogo-removebg-preview.png");
const LOGO_DARK = require("../assets/images/wuraa-removebg-logoVersionDark.png");

export function WuraLogo({ size = "md", showSubtitle = false, subtitle }: WuraLogoProps) {
    const { colorScheme } = useColorScheme();
    const dimensions = SIZES[size];
    const logoSource = colorScheme === "dark" ? LOGO_DARK : LOGO_LIGHT;

    return (
        <View className="flex-col items-center gap-3">
            <Image
                source={logoSource}
                style={{ width: dimensions.width, height: dimensions.height }}
                resizeMode="contain"
            />
            {showSubtitle && subtitle && (
                <Text className="text-sm text-muted-foreground text-center">
                    {subtitle}
                </Text>
            )}
        </View>
    );
}
