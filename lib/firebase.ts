import { getAuth } from "@react-native-firebase/auth";
import { getFirestore } from "@react-native-firebase/firestore";

// Firebase est auto-configuré via google-services.json (Android) et GoogleService-Info.plist (iOS)
// Les fichiers de config natifs sont chargés automatiquement par @react-native-firebase

// Exporte les instances pour usage à travers l'app
export const auth = getAuth();
export const db = getFirestore();
