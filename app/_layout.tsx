import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { OfflineBanner } from '../components/OfflineBanner';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { ReceiverProvider } from '../contexts/ReceiverContext';
import { TransferProvider } from '../contexts/TransferContext';
import "../global.css";

function RootLayoutNav() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments() as string[];

  useEffect(() => {
    if (loading) return;

    const firstSegment = segments[0];
    const inAuthGroup = firstSegment === "choix" ||
      firstSegment === "inscription-sender" ||
      firstSegment === "inscription-receiver" ||
      firstSegment === "connexion-sender" ||
      firstSegment === "connexion-receiver";

    const isIndex = segments.length === 0 || firstSegment === undefined;
    const isWuraIdPage = firstSegment === "wura-id";

    if (!user && !inAuthGroup && !isIndex) {
      // Pas connecté et pas sur une page d'auth → rediriger vers le choix
      router.replace("/choix");
    } else if (user && profile && inAuthGroup) {
      // Connecté et sur une page d'auth → rediriger vers la home
      if (profile.role === "receiver" && !profile.wuraId) {
        // Receiver sans wuraId → doit d'abord choisir son wuraId
        router.replace("/wura-id");
      } else if (profile.role === "sender") {
        router.replace("/sender-home");
      } else {
        router.replace("/accueil");
      }
    } else if (user && profile && profile.role === "receiver" && !profile.wuraId && !isWuraIdPage && !inAuthGroup) {
      // Receiver connecté mais sans wuraId, et pas sur la page wura-id → forcer
      router.replace("/wura-id");
    }
  }, [user, profile, loading, segments]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#F59E0B" />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function Layout() {
  return (
    <AuthProvider>
      <ReceiverProvider>
        <TransferProvider>
          <RootLayoutNav />
          <OfflineBanner />
          <Toast />
        </TransferProvider>
      </ReceiverProvider>
    </AuthProvider>
  );
}
