import { useRouter } from "expo-router";
import { ArrowLeft, Camera, Check, Mail, MapPin, Phone, User } from "lucide-react-native";
import { useState } from "react";
import { Image, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function SenderEditProfileScreen() {
    const router = useRouter();

    // Mock user data state
    const [formData, setFormData] = useState({
        firstName: "Moussa",
        lastName: "Koné",
        email: "moussa.kone@example.com",
        phone: "+223 70 12 34 56",
        address: "Bamako, Mali"
    });

    const handleSave = () => {
        // Implement save logic here
        router.back();
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50 dark:bg-[#221b10]">
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                className="flex-1"
            >
                <View className="flex-1">
                    {/* Header */}
                    <View className="px-6 py-4 flex-row items-center justify-between">
                        <TouchableOpacity
                            onPress={() => router.back()}
                            className="h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-white/10 shadow-sm"
                        >
                            <ArrowLeft size={20} className="text-gray-800 dark:text-white" color="#1f2937" />
                        </TouchableOpacity>
                        <Text className="text-lg font-bold text-gray-900 dark:text-white">Modifier le profil</Text>
                        <View className="w-10" />
                    </View>

                    <ScrollView contentContainerStyle={{ paddingBottom: 40 }} className="flex-1 px-6 pt-4">
                        {/* Avatar Edit */}
                        <View className="items-center mb-8">
                            <View className="relative">
                                <View className="h-28 w-28 rounded-full bg-gray-200 overflow-hidden border-4 border-white dark:border-white/10 shadow-sm">
                                    <Image
                                        source={{ uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuBSjJ-nEaQvx0w3s2-UzHGdRJQK9RZtt1p_gYxL3GurM8c-7fxRXvMy7RtFemPXZkCfD40LA8zTfVvZlFDwQk83So-cMN4vuG4tHkhrQW3E09zNENGNi9aiAbQAqtNsvH6xAB04XSe9E8_NtRv2bh7w_hRM8Zm7VjwIMVdi4Vk8EMCZqU98TDk9h07ZFgdDKOyW9QNeKKGQZMsxboYOF5ibxYnI2hfsR0DmyxZbz4NjoFGcuxm0yTecNuI5VyJX21XF1zeMXWf5gxY" }}
                                        className="h-full w-full"
                                        resizeMode="cover"
                                    />
                                </View>
                                <TouchableOpacity className="absolute bottom-0 right-0 h-9 w-9 bg-[#064E3B] items-center justify-center rounded-full border-4 border-white dark:border-[#221b10] shadow-sm">
                                    <Camera size={16} color="white" />
                                </TouchableOpacity>
                            </View>
                            <Text className="mt-3 text-sm font-medium text-[#064E3B] dark:text-[#10b981]">Changer la photo</Text>
                        </View>

                        {/* Form Fields */}
                        <View className="space-y-5 gap-5">
                            <View>
                                <Text className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 ml-1">Prénom</Text>
                                <View className="flex-row items-center rounded-2xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 px-4 py-3.5 focus:border-[#064E3B]">
                                    <User size={20} className="text-gray-400" color="#9CA3AF" />
                                    <TextInput
                                        value={formData.firstName}
                                        onChangeText={(text) => setFormData({ ...formData, firstName: text })}
                                        className="flex-1 text-base font-medium text-gray-900 dark:text-white"
                                        placeholder="Votre prénom"
                                        placeholderTextColor="#9CA3AF"
                                    />
                                </View>
                            </View>

                            <View>
                                <Text className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 ml-1">Nom</Text>
                                <View className="flex-row items-center rounded-2xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 px-4 py-3.5 focus:border-[#064E3B]">
                                    <User size={20} className="text-gray-400" color="#9CA3AF" />
                                    <TextInput
                                        value={formData.lastName}
                                        onChangeText={(text) => setFormData({ ...formData, lastName: text })}
                                        className="flex-1 text-base font-medium text-gray-900 dark:text-white"
                                        placeholder="Votre nom"
                                        placeholderTextColor="#9CA3AF"
                                    />
                                </View>
                            </View>

                            <View>
                                <Text className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 ml-1">Email</Text>
                                <View className="flex-row items-center rounded-2xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 px-4 py-3.5 focus:border-[#064E3B]">
                                    <Mail size={20} className="text-gray-400" color="#9CA3AF" />
                                    <TextInput
                                        value={formData.email}
                                        onChangeText={(text) => setFormData({ ...formData, email: text })}
                                        className="flex-1 text-base font-medium text-gray-900 dark:text-white"
                                        placeholder="Votre email"
                                        placeholderTextColor="#9CA3AF"
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                    />
                                </View>
                            </View>

                            <View>
                                <Text className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 ml-1">Téléphone</Text>
                                <View className="flex-row items-center rounded-2xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 px-4 py-3.5 focus:border-[#064E3B]">
                                    <Phone size={20} className="text-gray-400" color="#9CA3AF" />
                                    <TextInput
                                        value={formData.phone}
                                        onChangeText={(text) => setFormData({ ...formData, phone: text })}
                                        className="flex-1 text-base font-medium text-gray-900 dark:text-white"
                                        placeholder="Votre numéro"
                                        placeholderTextColor="#9CA3AF"
                                        keyboardType="phone-pad"
                                    />
                                </View>
                            </View>

                            <View>
                                <Text className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 ml-1">Adresse</Text>
                                <View className="flex-row items-center rounded-2xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 px-4 py-3.5 focus:border-[#064E3B]">
                                    <MapPin size={20} className="text-gray-400" color="#9CA3AF" />
                                    <TextInput
                                        value={formData.address}
                                        onChangeText={(text) => setFormData({ ...formData, address: text })}
                                        className="flex-1 text-base font-medium text-gray-900 dark:text-white"
                                        placeholder="Votre adresse"
                                        placeholderTextColor="#9CA3AF"
                                        multiline
                                    />
                                </View>
                            </View>
                        </View>
                    </ScrollView>

                    {/* Save Button */}
                    <View className="p-6 bg-gray-50 dark:bg-[#221b10] border-t border-gray-100 dark:border-white/5">
                        <TouchableOpacity
                            onPress={handleSave}
                            className="w-full bg-[#064E3B] py-4 rounded-2xl items-center justify-center flex-row shadow-lg shadow-emerald-900/10 active:scale-[0.98]"
                        >
                            <Check size={20} color="white" className="mr-2" />
                            <Text className="text-white font-bold text-lg">Enregistrer les modifications</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
