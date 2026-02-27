import { getIdToken, signOut } from '@react-native-firebase/auth';
import axios from 'axios';
import { router } from 'expo-router';
import { auth } from './firebase';
const api = axios.create({
    baseURL: process.env.EXPO_PUBLIC_API_URL || 'https://wura-app-production.up.railway.app',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    }
});

// Request Interceptor: Injecte le token d'authentification
api.interceptors.request.use(async (config) => {
    const user = auth.currentUser;
    if (user) {
        const token = await getIdToken(user, true);
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// Response Interceptor: Gère les erreurs 401 avec retry token avant déconnexion
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            const user = auth.currentUser;
            if (user) {
                try {
                    // Force refresh du token Firebase puis retry la requête
                    const freshToken = await getIdToken(user, true);
                    originalRequest.headers.Authorization = `Bearer ${freshToken}`;
                    return api(originalRequest);
                } catch {
                    await signOut(auth);
                    router.replace('/choix');
                }
            } else {
                router.replace('/choix');
            }
        }
        return Promise.reject(error);
    }
);

export default api;
