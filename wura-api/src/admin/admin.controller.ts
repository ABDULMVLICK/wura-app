import {
    Body,
    Controller,
    DefaultValuePipe,
    Delete,
    Get,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    Query,
    UseGuards,
} from '@nestjs/common';
import { TransactionStatus } from '@prisma/client';
import { KkiapayService } from '../kkiapay/kkiapay.service';
import { AdminGuard } from './admin.guard';
import { AdminService } from './admin.service';

@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
    constructor(
        private readonly adminService: AdminService,
        private readonly kkiapayService: KkiapayService,
    ) { }

    // ── DASHBOARD ────────────────────────────────────────────────────────────────

    @Get('liquidity')
    getLiquidity() {
        return this.adminService.getLiquidity();
    }

    @Get('analytics')
    getAnalytics() {
        return this.adminService.getAnalytics();
    }

    // ── TRANSACTIONS ─────────────────────────────────────────────────────────────

    @Get('transactions')
    getTransactions(
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
        @Query('status') status?: TransactionStatus,
    ) {
        return this.adminService.getTransactions(page, limit, status);
    }

    @Post('transactions/:id/retry')
    retryBridge(@Param('id') id: string) {
        return this.adminService.retryBridge(id);
    }

    @Post('transactions/:id/refund')
    refund(@Param('id') id: string) {
        return this.kkiapayService.refundTransaction(id);
    }

    @Patch('transactions/:id/status')
    forceStatus(
        @Param('id') id: string,
        @Body() body: { status: TransactionStatus; reason?: string },
    ) {
        return this.adminService.forceTransactionStatus(id, body.status, body.reason);
    }

    // ── TAUX DE CHANGE ───────────────────────────────────────────────────────────

    @Get('rates')
    getRates() {
        return this.adminService.getRates();
    }

    @Patch('rates/:pair')
    updateRate(
        @Param('pair') pair: string,
        @Body() body: { baseRate?: number; markupPercent?: number },
    ) {
        return this.adminService.updateRate(pair, body);
    }

    // ── NOTIFICATIONS ────────────────────────────────────────────────────────────

    @Post('notifications/push')
    sendPushToUser(@Body() body: { userId: string; title: string; body: string }) {
        return this.adminService.sendPushToUser(body.userId, body.title, body.body);
    }

    @Post('notifications/broadcast')
    broadcastPush(@Body() body: { title: string; body: string; role?: 'SENDER' | 'RECEIVER' }) {
        return this.adminService.broadcastPush(body.title, body.body, body.role);
    }

    // ── USERS ────────────────────────────────────────────────────────────────────

    @Get('users')
    getUsers(
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    ) {
        return this.adminService.getUsers(page, limit);
    }

    @Delete('users/:id')
    deleteUser(@Param('id') id: string) {
        return this.adminService.deleteUser(id);
    }
}
