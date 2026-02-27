import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class AdminGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const adminKey = request.headers['x-admin-key'];
        const expectedKey = process.env.ADMIN_SECRET_KEY;

        if (!expectedKey) {
            throw new UnauthorizedException('ADMIN_SECRET_KEY non configurée côté serveur.');
        }

        if (!adminKey || adminKey !== expectedKey) {
            throw new UnauthorizedException('Clé admin invalide ou absente.');
        }

        return true;
    }
}
