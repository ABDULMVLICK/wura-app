import { clsx } from "clsx";
import { Check, X } from "lucide-react-native";
import { Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";

export interface Country {
    name: string;
    code: string;
    flag: React.ReactNode;
}

// Simple flag components to avoid heavy SVG dependencies if not present.
// We use simple flex views for triband flags and emojis for others to keep it robust.
const FlagFrance = () => (
    <View className="flex-1 flex-row">
        <View className="flex-1 bg-blue-600" />
        <View className="flex-1 bg-white" />
        <View className="flex-1 bg-red-500" />
    </View>
);

const FlagBelgium = () => (
    <View className="flex-1 flex-row">
        <View className="flex-1 bg-black" />
        <View className="flex-1 bg-yellow-400" />
        <View className="flex-1 bg-red-600" />
    </View>
);

const FlagGermany = () => (
    <View className="flex-1 flex-col">
        <View className="flex-1 bg-black" />
        <View className="flex-1 bg-red-600" />
        <View className="flex-1 bg-yellow-400" />
    </View>
);

const FlagItaly = () => (
    <View className="flex-1 flex-row">
        <View className="flex-1 bg-green-600" />
        <View className="flex-1 bg-white" />
        <View className="flex-1 bg-red-600" />
    </View>
);

const FlagEmoji = ({ emoji }: { emoji: string }) => (
    <View className="flex-1 items-center justify-center bg-gray-100 dark:bg-slate-800">
        <Text className="text-sm">{emoji}</Text>
    </View>
);

export const WESTERN_COUNTRIES: Country[] = [
    { name: "France", code: "FR", flag: <FlagFrance /> },
    { name: "Belgique", code: "BE", flag: <FlagBelgium /> },
    { name: "Allemagne", code: "DE", flag: <FlagGermany /> },
    { name: "Italie", code: "IT", flag: <FlagItaly /> },
    { name: "Espagne", code: "ES", flag: <FlagEmoji emoji="🇪🇸" /> },
    { name: "Portugal", code: "PT", flag: <FlagEmoji emoji="🇵🇹" /> },
    { name: "Royaume-Uni", code: "GB", flag: <FlagEmoji emoji="🇬🇧" /> },
    { name: "Canada", code: "CA", flag: <FlagEmoji emoji="🇨🇦" /> },
    { name: "États-Unis", code: "US", flag: <FlagEmoji emoji="🇺🇸" /> },
];

interface CountrySelectorProps {
    visible: boolean;
    onClose: () => void;
    onSelect: (country: Country) => void;
    selectedCode: string;
}

export function CountrySelector({ visible, onClose, onSelect, selectedCode }: CountrySelectorProps) {
    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View className="flex-1 justify-end bg-black/50">
                <View className="bg-white dark:bg-[#1a150c] rounded-t-3xl w-full max-h-[70%]">
                    {/* Header */}
                    <View className="flex-row items-center justify-between p-6 border-b border-gray-100 dark:border-white/10">
                        <Text className="text-lg font-bold text-gray-900 dark:text-white">Sélectionner un pays</Text>
                        <TouchableOpacity
                            onPress={onClose}
                            className="bg-gray-100 dark:bg-white/10 p-2 rounded-full"
                        >
                            <X size={20} className="text-gray-500 dark:text-gray-400" color="gray" />
                        </TouchableOpacity>
                    </View>

                    {/* List of Countries */}
                    <ScrollView className="px-4 py-2 mb-8">
                        {WESTERN_COUNTRIES.map((country) => (
                            <TouchableOpacity
                                key={country.code}
                                onPress={() => {
                                    onSelect(country);
                                    onClose();
                                }}
                                className={clsx(
                                    "flex-row items-center justify-between p-4 my-1 rounded-xl",
                                    selectedCode === country.code
                                        ? "bg-[#064E3B]/10 dark:bg-emerald-900/20"
                                        : "active:bg-gray-50 dark:active:bg-white/5"
                                )}
                            >
                                <View className="flex-row items-center gap-4">
                                    <View className="w-8 h-6 rounded-sm overflow-hidden border border-gray-200 dark:border-white/10">
                                        {country.flag}
                                    </View>
                                    <Text className={clsx(
                                        "text-base font-medium",
                                        selectedCode === country.code
                                            ? "text-[#064E3B] dark:text-emerald-400"
                                            : "text-gray-700 dark:text-gray-300"
                                    )}>
                                        {country.name}
                                    </Text>
                                </View>
                                {selectedCode === country.code && (
                                    <Check size={20} className="text-[#064E3B] dark:text-emerald-400" color="#10B981" />
                                )}
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}
