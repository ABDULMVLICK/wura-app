import { View, Text, TouchableOpacity } from "react-native";
import { CheckCircle2, Send, Download } from "lucide-react-native";
import { clsx } from "clsx";

type Intent = "send" | "receive";

interface IntentSelectorProps {
    value: Intent;
    onChange: (value: Intent) => void;
}

export function IntentSelector({ value, onChange }: IntentSelectorProps) {
    return (
        <View className="flex-col gap-3 mb-6">
            <Text className="text-sm font-semibold text-foreground">Je souhaite</Text>
            <View className="flex-row gap-3">
                <IntentCard
                    selected={value === "send"}
                    onPress={() => onChange("send")}
                    icon={<Send size={20} className="text-accent" color="#f59e0b" />}
                    label={"Envoyer depuis l'Afrique"}
                />
                <IntentCard
                    selected={value === "receive"}
                    onPress={() => onChange("receive")}
                    icon={<Download size={20} className="text-accent" color="#f59e0b" />}
                    label={"Recevoir depuis l'Afrique"}
                />
            </View>
        </View>
    );
}

function IntentCard({
    selected,
    onPress,
    icon,
    label,
}: {
    selected: boolean;
    onPress: () => void;
    icon: React.ReactNode;
    label: string;
}) {
    return (
        <TouchableOpacity
            onPress={onPress}
            className={clsx(
                "relative flex-1 flex-col items-center gap-3 rounded-2xl border-2 px-4 py-5 transition-all",
                selected
                    ? "border-primary bg-emerald-50" // bg-primary/5 approximation
                    : "border-border bg-card"
            )}
        >
            {selected && (
                <View className="absolute top-2.5 right-2.5">
                    <CheckCircle2 size={20} className="text-primary" color="#0f3d2e" fill="white" />
                </View>
            )}
            <View className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100/50">
                {icon}
            </View>
            <Text className="text-center text-sm font-medium leading-tight text-foreground">
                {label}
            </Text>
        </TouchableOpacity>
    );
}
