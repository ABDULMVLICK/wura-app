import api from '../lib/api';
import { UserProfile } from '../types/user';

export const AuthService = {
    /**
     * Enregistrer un expéditeur (Sender) dans la base de données après Firebase Auth
     */
    registerSender: async (data: { firstName: string, lastName: string, country: string }) => {
        const response = await api.post('/users/register/sender', data);
        return response.data;
    },

    /**
     * Enregistrer un bénéficiaire (Receiver) dans la base de données après Firebase Auth
     */
    registerReceiver: async (data: { firstName: string, lastName: string }) => {
        const response = await api.post('/users/register/receiver', data);
        return response.data;
    },

    /**
     * Récupérer le profil complet de l'utilisateur connecté
     */
    getProfile: async (): Promise<UserProfile> => {
        const response = await api.get('/users/me');
        return response.data;
    },

    /**
     * Vérifie si un WuraID est déjà pris
     */
    checkWuraId: async (wuraId: string): Promise<{ available: boolean }> => {
        const response = await api.get(`/users/check-wura-id/${wuraId}`);
        return response.data;
    },

    /**
     * Assigne un WuraID au profil de l'utilisateur
     */
    updateWuraId: async (wuraId: string): Promise<UserProfile> => {
        const response = await api.patch('/users/me/wura-id', { wuraId });
        return response.data;
    }
};
