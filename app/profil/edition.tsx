import { useRouter } from "expo-router";
import { ArrowLeft, Camera, Check, Mail, MapPin, Phone, User } from "lucide-react-native";
import { useState } from "react";
import {  ActivityIndicator, Image, KeyboardAvoidingView, Platform,  ScrollView, Text, TextInput, TouchableOpacity, View  } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context";
import { updateUserProfile, useAuth } from "../../contexts/AuthContext";

export default function EditProfileScreen() {
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
        <SafeAreaView className="flex-1 bg-background">
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                className="flex-1"
            >
                <View className="flex-1">
                    {/* Header */}
                    <View className="px-6 py-4 flex-row items-center justify-between border-b border-border/40">
                        <TouchableOpacity
                            onPress={() => router.back()}
                            className="h-10 w-10 items-center justify-center rounded-full bg-muted"
                        >
                            <ArrowLeft size={20} className="text-foreground" color="#000" />
                        </TouchableOpacity>
                        <Text className="text-lg font-bold text-foreground">Modifier le profil</Text>
                        <View className="w-10" />
                    </View>

                    <ScrollView contentContainerStyle={{ paddingBottom: 40 }} className="flex-1 px-6 pt-6">
                        {/* Avatar Edit */}
                        <View className="items-center mb-8">
                            <View className="relative">
                                <View className="h-28 w-28 rounded-full bg-muted items-center justify-center overflow-hidden border-4 border-card shadow-sm">
                                    <Image
                                        source={{ uri: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" }}
                                        className="h-full w-full"
                                        resizeMode="cover"
                                    />
                                </View>
                                <TouchableOpacity className="absolute bottom-0 right-0 h-9 w-9 bg-primary items-center justify-center rounded-full border-4 border-background shadow-sm">
                                    <Camera size={16} color="white" />
                                </TouchableOpacity>
                            </View>
                            <Text className="mt-3 text-sm font-medium text-primary">Changer la photo</Text>
                        </View>

                        {/* Form Fields */}
                        <View className="space-y-5 gap-5">
                            <View>
                                <Text className="text-sm font-medium text-muted-foreground mb-2 ml-1">Prénom</Text>
                                <View className="flex-row items-center rounded-2xl bg-card border border-border px-4 py-3.5 focus:border-primary">
                                    <User size={20} className="text-muted-foreground mr-3" color="#9CA3AF" />
                                    <TextInput
                                        value={formData.firstName}
                                        onChangeText={(text) => setFormData({ ...formData, firstName: text })}
                                        className="flex-1 text-base font-medium text-foreground"
                                        placeholder="Votre prénom"
                                        placeholderTextColor="#9CA3AF"
                                    />
                                </View>
                            </View>

                            <View>
                                <Text className="text-sm font-medium text-muted-foreground mb-2 ml-1">Nom</Text>
                                <View className="flex-row items-center rounded-2xl bg-card border border-border px-4 py-3.5 focus:border-primary">
                                    <User size={20} className="text-muted-foreground mr-3" color="#9CA3AF" />
                                    <TextInput
                                        value={formData.lastName}
                                        onChangeText={(text) => setFormData({ ...formData, lastName: text })}
                                        className="flex-1 text-base font-medium text-foreground"
                                        placeholder="Votre nom"
                                        placeholderTextColor="#9CA3AF"
                                    />
                                </View>
                            </View>

                            <View>
                                <Text className="text-sm font-medium text-muted-foreground mb-2 ml-1">Email</Text>
                                <View className="flex-row items-center rounded-2xl bg-card border border-border px-4 py-3.5 focus:border-primary">
                                    <Mail size={20} className="text-muted-foreground mr-3" color="#9CA3AF" />
                                    <TextInput
                                        value={formData.email}
                                        onChangeText={(text) => setFormData({ ...formData, email: text })}
                                        className="flex-1 text-base font-medium text-foreground"
                                        placeholder="Votre email"
                                        placeholderTextColor="#9CA3AF"
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                    />
                                </View>
                            </View>

                            <View>
                                <Text className="text-sm font-medium text-muted-foreground mb-2 ml-1">Téléphone</Text>
                                <View className="flex-row items-center rounded-2xl bg-card border border-border px-4 py-3.5 focus:border-primary">
                                    <Phone size={20} className="text-muted-foreground mr-3" color="#9CA3AF" />
                                    <TextInput
                                        value={formData.phone}
                                        onChangeText={(text) => setFormData({ ...formData, phone: text })}
                                        className="flex-1 text-base font-medium text-foreground"
                                        placeholder="Votre numéro"
                                        placeholderTextColor="#9CA3AF"
                                        keyboardType="phone-pad"
                                    />
                                </View>
                            </View>

                            <View>
                                <Text className="text-sm font-medium text-muted-foreground mb-2 ml-1">Adresse</Text>
                                <View className="flex-row items-center rounded-2xl bg-card border border-border px-4 py-3.5 focus:border-primary">
                                    <MapPin size={20} className="text-muted-foreground mr-3" color="#9CA3AF" />
                                    <TextInput
                                        value={formData.address}
                                        onChangeText={(text) => setFormData({ ...formData, address: text })}
                                        className="flex-1 text-base font-medium text-foreground"
                                        placeholder="Votre adresse"
                                        placeholderTextColor="#9CA3AF"
                                        multiline
                                    />
                                </View>
                            </View>
                        </View>
                    </ScrollView>

                    {/* Save Button */}
                    <View className="p-6 bg-background border-t border-border/40">
                        <TouchableOpacity
                            onPress={handleSave}
                            className="w-full bg-primary py-4 rounded-2xl items-center justify-center flex-row shadow-lg shadow-primary/20 active:scale-[0.98]"
                        >
                            <Check size={20} color="white" className="mr-2" />
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
