import { KkiapayProvider } from '@kkiapay-org/react-native-sdk';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';
import { OfflineBanner } from '../components/OfflineBanner';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { ReceiverProvider } from '../contexts/ReceiverContext';
import { TransferProvider } from '../contexts/TransferContext';
import { Web3AuthProvider } from '../contexts/Web3AuthContext';
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
      const role = profile.role?.toLowerCase();
      const hasWuraId = profile.wuraId || profile?.receiver?.wuraId;
      if (role === "receiver" && !hasWuraId) {
        // Receiver sans wuraId → doit d'abord choisir son wuraId
        router.replace("/wura-id");
      } else if (role === "sender") {
        router.replace("/sender-home");
      } else {
        router.replace("/accueil");
      }
    } else if (user && !profile && !loading && (firstSegment === "connexion-sender" || firstSegment === "choix")) {
      // Utilisateur authentifié via Firebase, mais sans profil NestJS (nouveau compte ou profil manquant)
      if (firstSegment === "connexion-sender") {
        router.replace("/inscription-sender");
      }
    } else if (user && profile && profile.role?.toLowerCase() === "receiver" && !(profile.wuraId || profile?.receiver?.wuraId) && !isWuraIdPage && !inAuthGroup) {
      // Receiver connecté mais sans wuraId, et pas sur la page wura-id → forcer
      router.replace("/wura-id");
    }
  }, [user, profile, loading, segments, router]);

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
    <KkiapayProvider>
      <Web3AuthProvider>
        <AuthProvider>
          <ReceiverProvider>
            <TransferProvider>
              <RootLayoutNav />
              <OfflineBanner />
              <Toast />
            </TransferProvider>
          </ReceiverProvider>
        </AuthProvider>
      </Web3AuthProvider>
    </KkiapayProvider>
  );
}
