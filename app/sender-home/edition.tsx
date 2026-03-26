import { useRouter } from "expo-router";
import { Anchor, ArrowLeft, Award, Check, Compass, Globe, Heart, Leaf, Mail, MapPin, Phone, Smile, Star, Sun, User, Zap } from "lucide-react-native";
import { useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { updateUserProfile, useAuth } from "../../contexts/AuthContext";

const AVATAR_ICONS = [Smile, Star, Zap, Sun, Leaf, Globe, Heart, Anchor, Award, Compass];
const AVATAR_PALETTES = [
    { bg: '#FEF3C7', color: '#D97706' },
    { bg: '#D1FAE5', color: '#059669' },
    { bg: '#DBEAFE', color: '#2563EB' },
    { bg: '#FCE7F3', color: '#DB2777' },
    { bg: '#EDE9FE', color: '#7C3AED' },
    { bg: '#FEE2E2', color: '#DC2626' },
    { bg: '#E0F2FE', color: '#0284C7' },
];

function getAvatar(seed: string) {
    const n = (seed || 'U').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    return { Icon: AVATAR_ICONS[n % AVATAR_ICONS.length], ...AVATAR_PALETTES[n % AVATAR_PALETTES.length] };
}

export default function SenderEditProfileScreen() {
    const router = useRouter();

    const { user, profile, refreshProfile } = useAuth();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        firstName: profile?.prenom || "",
        lastName: profile?.nom || "",
        email: profile?.email || "",
        phone: profile?.telephone || "",
        address: (profile as any)?.address || ""
    });

    const avatar = getAvatar(user?.uid || profile?.email || 'U');

    const handleSave = async () => {
        if (!user) return;
        setLoading(true);
        try {
            await updateUserProfile(user.uid, {
                prenom: formData.firstName,
                nom: formData.lastName,
                email: formData.email,
                telephone: formData.phone,
                address: formData.address,
            } as any);
            await refreshProfile();
            router.back();
        } catch (error) {
            console.error("Erreur mise à jour profil:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                className="flex-1"
            >
                <View className="flex-1">
                    {/* Header */}
                    <View className="px-7 py-5 flex-row items-center justify-between">
                        <TouchableOpacity
                            onPress={() => router.back()}
                            className="h-11 w-11 items-center justify-center rounded-2xl bg-white"
                            style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}
                        >
                            <ArrowLeft size={20} className="text-gray-800" color="#1f2937" />
                        </TouchableOpacity>
                        <Text className="text-xl font-bold text-gray-900">Modifier le profil</Text>
                        <View className="w-11" />
                    </View>

                    <ScrollView contentContainerStyle={{ paddingBottom: 40 }} className="flex-1 px-6 pt-4">
                        {/* Avatar */}
                        <View className="items-center mb-8">
                            <View style={{
                                width: 120, height: 120, borderRadius: 60,
                                backgroundColor: avatar.bg,
                                alignItems: 'center', justifyContent: 'center',
                                borderWidth: 4, borderColor: '#ffffff',
                                shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 16, elevation: 5,
                            }}>
                                <avatar.Icon size={52} color={avatar.color} />
                            </View>
                        </View>

                        {/* Form Fields */}
                        <View className="space-y-5 gap-6">
                            <View>
                                <Text className="text-sm font-medium text-gray-500 mb-2 ml-1">Prénom</Text>
                                <View className="flex-row items-center rounded-2xl bg-white border border-gray-200 px-4 py-3.5 focus:border-[#064E3B]">
                                    <User size={20} className="text-gray-400" color="#9CA3AF" />
                                    <TextInput
                                        value={formData.firstName}
                                        onChangeText={(text) => setFormData({ ...formData, firstName: text })}
                                        className="flex-1 text-base font-medium text-gray-900"
                                        placeholder="Votre prénom"
                                        placeholderTextColor="#9CA3AF"
                                    />
                                </View>
                            </View>

                            <View>
                                <Text className="text-sm font-medium text-gray-500 mb-2 ml-1">Nom</Text>
                                <View className="flex-row items-center rounded-2xl bg-white border border-gray-200 px-4 py-3.5 focus:border-[#064E3B]">
                                    <User size={20} className="text-gray-400" color="#9CA3AF" />
                                    <TextInput
                                        value={formData.lastName}
                                        onChangeText={(text) => setFormData({ ...formData, lastName: text })}
                                        className="flex-1 text-base font-medium text-gray-900"
                                        placeholder="Votre nom"
                                        placeholderTextColor="#9CA3AF"
                                    />
                                </View>
                            </View>

                            <View>
                                <Text className="text-sm font-medium text-gray-500 mb-2 ml-1">Email</Text>
                                <View className="flex-row items-center rounded-2xl bg-white border border-gray-200 px-4 py-3.5 focus:border-[#064E3B]">
                                    <Mail size={20} className="text-gray-400" color="#9CA3AF" />
                                    <TextInput
                                        value={formData.email}
                                        onChangeText={(text) => setFormData({ ...formData, email: text })}
                                        className="flex-1 text-base font-medium text-gray-900"
                                        placeholder="Votre email"
                                        placeholderTextColor="#9CA3AF"
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                    />
                                </View>
                            </View>

                            <View>
                                <Text className="text-sm font-medium text-gray-500 mb-2 ml-1">Téléphone</Text>
                                <View className="flex-row items-center rounded-2xl bg-white border border-gray-200 px-4 py-3.5 focus:border-[#064E3B]">
                                    <Phone size={20} className="text-gray-400" color="#9CA3AF" />
                                    <TextInput
                                        value={formData.phone}
                                        onChangeText={(text) => setFormData({ ...formData, phone: text })}
                                        className="flex-1 text-base font-medium text-gray-900"
                                        placeholder="Votre numéro"
                                        placeholderTextColor="#9CA3AF"
                                        keyboardType="phone-pad"
                                    />
                                </View>
                            </View>

                            <View>
                                <Text className="text-sm font-medium text-gray-500 mb-2 ml-1">Adresse</Text>
                                <View className="flex-row items-center rounded-2xl bg-white border border-gray-200 px-4 py-3.5 focus:border-[#064E3B]">
                                    <MapPin size={20} className="text-gray-400" color="#9CA3AF" />
                                    <TextInput
                                        value={formData.address}
                                        onChangeText={(text) => setFormData({ ...formData, address: text })}
                                        className="flex-1 text-base font-medium text-gray-900"
                                        placeholder="Votre adresse"
                                        placeholderTextColor="#9CA3AF"
                                        multiline
                                    />
                                </View>
                            </View>
                        </View>
                    </ScrollView>

                    {/* Save Button */}
                    <View className="p-7 bg-gray-50 border-t border-gray-100">
                        <TouchableOpacity
                            onPress={handleSave}
                            className="w-full bg-[#064E3B] py-5 rounded-full items-center justify-center flex-row active:scale-[0.98]"
                            style={{ shadowColor: '#064E3B', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 6 }}
                        >
                            <Check size={22} color="white" className="mr-2" />
                            {loading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text className="text-white font-bold text-lg">Enregistrer les modifications</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
