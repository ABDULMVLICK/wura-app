import { getIdToken, signOut } from '@react-native-firebase/auth';
import axios from 'axios';
import { router } from 'expo-router';
import { auth } from './firebase';
const api = axios.create({
    baseURL: process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.114:3000',
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

// Response Interceptor: Gère les erreurs globales (ex: 401 Unauthorized)
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response && error.response.status === 401) {
            // Token expiré ou invalide (guard: only signOut if a user is currently signed in)
            if (auth.currentUser) {
                await signOut(auth);
            }
            router.replace('/choix');
        }
        return Promise.reject(error);
    }
);

export default api;
