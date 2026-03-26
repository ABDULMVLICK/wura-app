import { KkiapayProvider } from '@kkiapay-org/react-native-sdk';
import { Outfit_400Regular, Outfit_600SemiBold, Outfit_700Bold, Outfit_900Black, useFonts } from '@expo-google-fonts/outfit';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
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
import { deleteSecureData, getSecureData } from '../lib/storage';

// Indispensable sur Android : ferme le Chrome Custom Tab après le redirect OAuth
// (Web3Auth / expo-web-browser). Sans cet appel, loginWithGoogle() ne se résout jamais.
WebBrowser.maybeCompleteAuthSession();

function RootLayoutNav() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments() as string[];

  const [fontsLoaded] = useFonts({
    Outfit_400Regular,
    Outfit_600SemiBold,
    Outfit_700Bold,
    Outfit_900Black,
  });

  useEffect(() => {
    if (loading) return;

    // Priorité 1: Gestion des redirections après paiement Kkiapay
    // Le widget Kkiapay démonte et remonte l'app, on doit intercepter la transaction ici
    const checkRedirects = async () => {
      const pendingTx = await getSecureData('pendingKkiapayTx');
      if (pendingTx) {
        console.log("[RootLayout] Redirecting to success page for tx:", pendingTx);
        await deleteSecureData('pendingKkiapayTx');
        router.replace({
          pathname: "/sender-home/transfert-reussi",
          params: { transactionId: pendingTx }
        });
        return true;
      }
      return false;
    };

    const runRouting = async () => {
      if (await checkRedirects()) return;

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
    };

    runRouting();
  }, [user, profile, loading, segments, router]);

  if (loading || !fontsLoaded) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#F59E0B" />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        animationDuration: 250,
        gestureEnabled: true,
        gestureDirection: 'horizontal',
      }}
    >
      {/* Splash — fade */}
      <Stack.Screen name="index" options={{ animation: 'fade' }} />

      {/* Auth screens — fade for smoother onboarding feel */}
      <Stack.Screen name="choix/index" options={{ animation: 'fade' }} />
      <Stack.Screen name="connexion/index" options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="connexion-sender/index" options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="connexion-receiver/index" options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="inscription-sender/index" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="inscription-receiver/index" options={{ animation: 'slide_from_right' }} />

      {/* Home screens — fade for tab-like feel */}
      <Stack.Screen name="sender-home/index" options={{ animation: 'fade' }} />
      <Stack.Screen name="accueil/index" options={{ animation: 'fade' }} />

      {/* Transfer success — slide from bottom like a modal celebration */}
      <Stack.Screen name="sender-home/transfert-reussi" options={{ animation: 'slide_from_bottom' }} />
    </Stack>
  );
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
