import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { FirebaseAuthGuard } from '../auth/firebase-auth/firebase-auth.guard';
import { NotificationService } from './notification.service';

@Controller('notifications')
@UseGuards(FirebaseAuthGuard)
export class NotificationController {
    constructor(private readonly notificationService: NotificationService) { }

    @Post('register-token')
    async registerPushToken(@Req() req, @Body() body: { pushToken: string }) {
        await this.notificationService.registerPushToken(req.user.uid, body.pushToken);
        return { status: 'ok' };
    }
}
