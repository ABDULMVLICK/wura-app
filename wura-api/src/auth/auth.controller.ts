import { Body, Controller, Post, UnauthorizedException } from '@nestjs/common';
import * as admin from 'firebase-admin';
import * as crypto from 'crypto';

// ---------------------------------------------------------------------------
// Web3Auth JWKS — clé publique pour vérifier les idToken Web3Auth (ES256)
// ---------------------------------------------------------------------------
const WEB3AUTH_JWKS_URL = 'https://api-auth.web3auth.io/jwks';

/**
 * Convertit la signature ECDSA compact (r || s, 64 octets) du format JWT
 * vers le format DER attendu par Node.js crypto.verify().
 */
function jwtEcdsaToDer(signature: Buffer): Buffer {
    const r = signature.slice(0, 32);
    const s = signature.slice(32, 64);
    const rPad = r[0] & 0x80 ? Buffer.concat([Buffer.from([0x00]), r]) : r;
    const sPad = s[0] & 0x80 ? Buffer.concat([Buffer.from([0x00]), s]) : s;
    const rSeq = Buffer.concat([Buffer.from([0x02, rPad.length]), rPad]);
    const sSeq = Buffer.concat([Buffer.from([0x02, sPad.length]), sPad]);
    const body = Buffer.concat([rSeq, sSeq]);
    return Buffer.concat([Buffer.from([0x30, body.length]), body]);
}

@Controller('auth')
export class AuthController {

    /**
     * POST /auth/firebase-custom-token
     *
     * Accepte le idToken JWT émis par Web3Auth (Google login),
     * vérifie sa signature via le JWKS Web3Auth, puis :
     *   - Trouve ou crée le compte Firebase correspondant à l'email
     *   - Retourne un Firebase Custom Token → le client appelle signInWithCustomToken()
     *
     * Nécessaire car Web3Auth SAPPHIRE_DEVNET ne retourne pas oAuthIdToken
     * (le token Google d'origine), seulement son propre JWT.
     */
    @Post('firebase-custom-token')
    async getFirebaseCustomToken(
        @Body() body: { idToken: string },
    ): Promise<{ firebaseToken: string }> {
        const { idToken } = body;

        if (!idToken) {
            throw new UnauthorizedException('idToken requis');
        }

        // 1. Décodage JWT (header + payload)
        const parts = idToken.split('.');
        if (parts.length !== 3) {
            throw new UnauthorizedException('Format JWT invalide');
        }

        let header: any;
        let payload: any;
        try {
            header = JSON.parse(Buffer.from(parts[0], 'base64url').toString());
            payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
        } catch {
            throw new UnauthorizedException('Impossible de décoder le JWT');
        }

        // 2. Vérification expiration
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp && payload.exp < now) {
            throw new UnauthorizedException('Token Web3Auth expiré');
        }

        if (!payload.email) {
            throw new UnauthorizedException('Email introuvable dans le token Web3Auth');
        }

        // 3. Vérification de la signature ES256 via JWKS Web3Auth
        try {
            const jwksRes = await fetch(WEB3AUTH_JWKS_URL);
            if (!jwksRes.ok) throw new Error(`JWKS fetch failed: ${jwksRes.status}`);
            const jwks = await jwksRes.json() as { keys: any[] };

            // Sélectionner la clé correspondante (par kid ou première par défaut)
            const jwk = jwks.keys.find((k: any) => k.kid === header.kid) ?? jwks.keys[0];
            if (!jwk) throw new Error('Aucune clé JWKS disponible');

            const publicKey = crypto.createPublicKey({ key: jwk, format: 'jwk' });
            const signingInput = Buffer.from(`${parts[0]}.${parts[1]}`);
            const sigRaw = Buffer.from(parts[2], 'base64url');
            const sigDer = jwtEcdsaToDer(sigRaw);

            const isValid = crypto.verify('SHA256', signingInput, publicKey, sigDer);
            if (!isValid) throw new Error('Signature ECDSA invalide');
        } catch (err: any) {
            throw new UnauthorizedException(`Vérification signature échouée: ${err.message}`);
        }

        // 4. Trouver ou créer le compte Firebase par email (préserve l'UID existant)
        let uid: string;
        try {
            const existingUser = await admin.auth().getUserByEmail(payload.email);
            uid = existingUser.uid;
            console.log(`[Auth] Utilisateur Firebase trouvé: ${uid}`);
        } catch {
            try {
                const newUser = await admin.auth().createUser({
                    email: payload.email,
                    displayName: payload.name ?? '',
                });
                uid = newUser.uid;
                console.log(`[Auth] Nouveau compte Firebase créé: ${uid}`);
            } catch (createErr: any) {
                console.error('[Auth] createUser failed:', createErr.message, createErr.code);
                throw new Error(`Impossible de créer le compte Firebase: ${createErr.message}`);
            }
        }

        // 5. Émettre un Firebase Custom Token pour cet UID
        try {
            const firebaseToken = await admin.auth().createCustomToken(uid);
            return { firebaseToken };
        } catch (tokenErr: any) {
            console.error('[Auth] createCustomToken failed:', tokenErr.message, tokenErr.code);
            console.error('[Auth] Conseil: ajoutez FIREBASE_CLIENT_EMAIL et FIREBASE_PRIVATE_KEY dans .env');
            throw new Error(`createCustomToken indisponible — service account manquant: ${tokenErr.message}`);
        }
    }
}
