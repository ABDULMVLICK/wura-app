import * as SecureStore from 'expo-secure-store';

/**
 * Sauvegarde une valeur de manière sécurisée (cryptée sur l'appareil)
 */
export async function saveSecureData(key: string, value: string) {
    try {
        await SecureStore.setItemAsync(key, value);
    } catch (error) {
        console.error("Erreur saveSecureData:", error);
    }
}

/**
 * Récupère une valeur sauvegardée de manière sécurisée
 */
export async function getSecureData(key: string): Promise<string | null> {
    try {
        return await SecureStore.getItemAsync(key);
    } catch (error) {
        console.error("Erreur getSecureData:", error);
        return null;
    }
}

/**
 * Supprime une valeur de la mémoire sécurisée
 */
export async function deleteSecureData(key: string) {
    try {
        await SecureStore.deleteItemAsync(key);
    } catch (error) {
        console.error("Erreur deleteSecureData:", error);
    }
}
