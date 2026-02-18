import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, TextInputProps } from "react-native";
import { Eye, EyeOff } from "lucide-react-native";
import { useColorScheme } from "nativewind";

interface FormFieldProps extends TextInputProps {
    label: string;
    icon: React.ReactNode;
    helperText?: string;
    type?: "text" | "password" | "email";
}

export function FormField({ label, icon, helperText, type = "text", ...inputProps }: FormFieldProps) {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === "password";
    const { colorScheme } = useColorScheme();

    // Basic mapping for secureTextEntry
    const secureTextEntry = isPassword && !showPassword;

    return (
        <View className="flex-col gap-2 mb-4">
            <Text className="text-sm font-semibold text-foreground">{label}</Text>
            <View className="flex-row items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3.5">
                <View className="shrink-0 items-center justify-center">
                    {/* We can clone the icon to enforce color if needed, but here we expect the parent to pass styled icon */}
                    {icon}
                </View>
                <TextInput
                    className="flex-1 bg-transparent text-base text-foreground"
                    placeholderTextColor="#9ca3af" // muted-foreground approximation
                    secureTextEntry={secureTextEntry}
                    autoCapitalize="none"
                    {...inputProps}
                />
                {isPassword && (
                    <TouchableOpacity
                        onPress={() => setShowPassword((prev) => !prev)}
                        className="shrink-0 items-center justify-center"
                    >
                        {showPassword ? (
                            <EyeOff size={20} color="#6b7280" />
                        ) : (
                            <Eye size={20} color="#6b7280" />
                        )}
                    </TouchableOpacity>
                )}
            </View>
            {helperText && (
                <Text className="text-xs text-muted-foreground">{helperText}</Text>
            )}
        </View>
    );
}
