import { Eye, EyeOff } from "lucide-react-native";

import { useState } from "react";
import { Text, TextInput, TextInputProps, TouchableOpacity, View } from "react-native";

interface FormFieldProps extends TextInputProps {
    label: string;
    icon: React.ReactNode;
    helperText?: string;
    type?: "text" | "password" | "email";
}

export function FormField({ label, icon, helperText, type = "text", ...inputProps }: FormFieldProps) {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === "password";


    // Basic mapping for secureTextEntry
    const secureTextEntry = isPassword && !showPassword;

    return (
        <View className="flex-col gap-2.5 mb-5">
            <Text className="text-sm font-semibold text-foreground ml-1">{label}</Text>
            <View className="flex-row items-center gap-4 rounded-3xl border border-border bg-card px-5 py-4"
                style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 1 }}>
                <View className="shrink-0 items-center justify-center">
                    {/* We can clone the icon to enforce color if needed, but here we expect the parent to pass styled icon */}
                    {icon}
                </View>
                <TextInput
                    className="flex-1 bg-transparent text-base text-foreground"
                    placeholderTextColor="#a8a29e" // muted-foreground approximation
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
                <Text className="text-xs text-muted-foreground ml-1">{helperText}</Text>
            )}
        </View>
    );
}
