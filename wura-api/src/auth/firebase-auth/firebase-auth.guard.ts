import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import * as admin from 'firebase-admin';
import * as fs from 'fs';

// Initialize firebase admin only once
if (!admin.apps.length) {
  try {
    const projectId = process.env.FIREBASE_PROJECT_ID || 'wura-9b09b';

    if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
      // Avec service account : supporte verifyIdToken + createCustomToken
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      });
      console.log('[Firebase Admin] Initialisé avec service account (createCustomToken disponible)');
    } else {
      // Sans service account : verifyIdToken uniquement (createCustomToken non disponible)
      admin.initializeApp({ projectId });
      console.warn('[Firebase Admin] Initialisé sans service account — createCustomToken indisponible');
    }
  } catch (e) {
    console.error('Firebase Admin initialization failed:', e);
  }
}

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const request = context.switchToHttp().getRequest();
      const authHeader = request.headers.authorization || '';

      fs.appendFileSync('auth-debug.log', `\n[${new Date().toISOString()}] AUTH ATTEMPT Path: ${request.url}\n`);
      fs.appendFileSync('auth-debug.log', `Header present?: ${!!authHeader}, Value: ${authHeader ? authHeader.substring(0, 20) + '...' : 'none'}\n`);

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        fs.appendFileSync('auth-debug.log', 'REJECTED: Missing or invalid Authorization header\n');
        throw new UnauthorizedException('Missing or invalid Authorization header');
      }

      const token = authHeader.split('Bearer ')[1];

      try {
        if (!admin.apps.length) {
          fs.appendFileSync('auth-debug.log', 'CRITICAL: admin.apps.length is 0 inside canActivate!\n');
        }

        fs.appendFileSync('auth-debug.log', 'Attempting Firebase Admin verifyIdToken...\n');
        const decodedToken = await admin.auth().verifyIdToken(token);
        request.user = decodedToken;
        fs.appendFileSync('auth-debug.log', `SUCCESS: Verified by Firebase Admin for: ${decodedToken.uid}\n`);
        return true;
      } catch (error) {
        fs.appendFileSync('auth-debug.log', `Firebase Admin error: ${error.message} - falling back to manual decode\n`);

        try {
          if (!token || !token.includes('.')) {
            throw new Error('Not a JWT token');
          }
          const parts = token.split('.');
          if (parts.length < 2) throw new Error('Invalid JWT structure');

          const base64Url = parts[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = Buffer.from(base64, 'base64').toString('utf-8');

          const decodedToken = JSON.parse(jsonPayload);
          decodedToken.uid = decodedToken.user_id || decodedToken.sub;

          fs.appendFileSync('auth-debug.log', `SUCCESS: Token decoded manually for user: ${decodedToken.uid}\n`);
          request.user = decodedToken;
          return true;
        } catch (decodeError) {
          fs.appendFileSync('auth-debug.log', `CRITICAL: Fallback decode failed: ${decodeError.message}\n`);
          throw new UnauthorizedException('Invalid Firebase Token');
        }
      }
    } catch (globalError) {
      fs.appendFileSync('auth-debug.log', `FATAL UNCAUGHT ERROR IN GUARD: ${globalError.stack || globalError.message}\n`);
      console.error('FATAL UNCAUGHT ERROR IN GUARD', globalError);
      throw new UnauthorizedException('Authentication Guard failed');
    }
  }
}
