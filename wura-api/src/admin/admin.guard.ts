import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class AdminGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const adminKey = request.headers['x-admin-key'];

        if (!adminKey) {
            throw new UnauthorizedException('Clé admin absente.');
        }

        // Format ADMIN_KEYS="KEY1:Nom1,KEY2:Nom2"
        const adminKeysRaw = process.env.ADMIN_KEYS;
        if (adminKeysRaw) {
            for (const pair of adminKeysRaw.split(',')) {
                const colonIdx = pair.indexOf(':');
                if (colonIdx === -1) continue;
                const key = pair.substring(0, colonIdx).trim();
                const name = pair.substring(colonIdx + 1).trim();
                if (adminKey === key) {
                    request.adminName = name || 'Admin';
                    return true;
                }
            }
        }

        // Fallback sur l'ancienne variable ADMIN_SECRET_KEY
        const legacyKey = process.env.ADMIN_SECRET_KEY;
        if (legacyKey && adminKey === legacyKey) {
            request.adminName = 'Admin';
            return true;
        }

        if (!adminKeysRaw && !legacyKey) {
            throw new UnauthorizedException('Aucune clé admin configurée côté serveur.');
        }

        throw new UnauthorizedException('Clé admin invalide.');
    }
}
