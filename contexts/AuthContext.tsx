import type { FirebaseAuthTypes } from "@react-native-firebase/auth";
import { signOut as firebaseSignOut, onAuthStateChanged } from "@react-native-firebase/auth";
import React, { createContext, useContext, useEffect, useState } from "react";
import { auth } from "../lib/firebase";
import { AuthService } from "../services/auth";

type User = FirebaseAuthTypes.User;

import { UserProfile } from "../types/user";

interface AuthContextType {
    user: User | null;
    profile: UserProfile | null;
    loading: boolean;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    profile: null,
    loading: true,
    signOut: async () => { },
    refreshProfile: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    // Charge le profil depuis l'API NestJS
    const fetchProfile = async (uid: string) => {
        try {
            const profileData = await AuthService.getProfile();
            if (profileData) {
                setProfile(profileData);
            } else {
                setProfile(null);
                // Si l'auth existe mais l'API refuse ou ne trouve pas le profil
                try {
                    await firebaseSignOut(auth);
                } catch (e) {
                    console.error("Erreur auto-déconnexion:", e);
                }
            }
        } catch (error) {
            console.error("Erreur lors du chargement API du profil:", error);
            setProfile(null);
        }
    };

    const refreshProfile = async () => {
        if (user) {
            await fetchProfile(user.uid);
        }
    };

    // Écoute les changements d'état d'authentification
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser);
            if (firebaseUser) {
                await fetchProfile(firebaseUser.uid);
            } else {
                setProfile(null);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const signOut = async () => {
        try {
            await firebaseSignOut(auth);
            setUser(null);
            setProfile(null);
        } catch (error) {
            console.error("Erreur de déconnexion:", error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, profile, loading, signOut, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    );
}

// Helper temporaire (retirer progressivement ce qui ne sert plus)
export function generateWuraId(prenom: string): string {
    const base = prenom.trim().replace(/\s+/g, "").substring(0, 8);
    const random = Math.floor(1000 + Math.random() * 9000);
    return `${base}${random}`;
}

export async function updateUserProfile(uid: string, data: any) {
    console.warn("updateUserProfile is deprecated. Please use specific AuthService API endpoints.");
}

export async function isWuraIdTaken(wuraId: string): Promise<boolean> {
    try {
        const result = await AuthService.checkWuraId(wuraId);
        return !result.available;
    } catch {
        return true; // En cas d'erreur, on assume qu'il est pris par sécurité
    }
}

export async function claimWuraId(uid: string, wuraId: string): Promise<boolean> {
    try {
        await AuthService.updateWuraId(wuraId);
        return true;
    } catch (error) {
        return false;
    }
}
