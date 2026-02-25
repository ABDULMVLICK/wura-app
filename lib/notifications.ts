import { Platform } from 'react-native';
import api from './api';

/**
 * Enregistre le device pour les push notifications.
 * Ne fait RIEN sur le simulateur ou si les modules natifs ne sont pas disponibles.
 */
export async function registerForPushNotifications(): Promise<string | null> {
    // Les push ne fonctionnent PAS sur le simulateur iOS ni sur Expo Go
    // On vérifie via une approche safe sans importer les modules natifs
    if (__DEV__ && Platform.OS === 'ios') {
        console.log('[Push] Simulateur iOS détecté — push notifications ignorées');
        return null;
    }

    let Notifications: any;
    let Device: any;

    try {
        Notifications = require('expo-notifications');
        Device = require('expo-device');
    } catch {
        console.warn('[Push] Modules natifs non disponibles (Expo Go ?)');
        return null;
    }

    try {
        // Configure le comportement des notifications en foreground
        Notifications.setNotificationHandler({
            handleNotification: async () => ({
                shouldShowAlert: true,
                shouldPlaySound: true,
                shouldSetBadge: true,
            }),
        });

        if (!Device.isDevice) {
            console.warn('[Push] Push notifications uniquement sur device physique');
            return null;
        }

        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.warn('[Push] Permission refusée');
            return null;
        }

        const tokenData = await Notifications.getExpoPushTokenAsync({
            projectId: '517e5327-3235-4881-98b1-a397a35c84ce',
        });
        const pushToken = tokenData.data;
        console.log('[Push] Token:', pushToken);

        if (Platform.OS === 'android') {
            Notifications.setNotificationChannelAsync('default', {
                name: 'Wura',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#F59E0B',
            });
        }

        try {
            await api.post('/notifications/register-token', { pushToken });
            console.log('[Push] Token enregistré au backend');
        } catch (error) {
            console.warn('[Push] Erreur envoi token:', error);
        }

        return pushToken;
    } catch (error) {
        console.warn('[Push] Erreur push notifications:', (error as Error).message);
        return null;
    }
}
