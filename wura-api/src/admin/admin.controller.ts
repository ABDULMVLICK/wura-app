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
    Req,
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

    // ── IDENTITÉ ─────────────────────────────────────────────────────────────────

    @Get('me')
    getMe(@Req() req: any) {
        return { name: req.adminName ?? 'Admin' };
    }

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
    retryBridge(@Param('id') id: string, @Req() req: any) {
        return this.adminService.retryBridge(id, req.adminName);
    }

    @Post('transactions/:id/refund')
    async refund(@Param('id') id: string, @Req() req: any) {
        const result = await this.kkiapayService.refundTransaction(id);
        await this.adminService.logAction(req.adminName, 'REFUND', `transactionId=${id}`);
        return result;
    }

    @Patch('transactions/:id/status')
    forceStatus(
        @Param('id') id: string,
        @Body() body: { status: TransactionStatus; reason?: string },
        @Req() req: any,
    ) {
        return this.adminService.forceTransactionStatus(id, body.status, body.reason, req.adminName);
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
        @Req() req: any,
    ) {
        return this.adminService.updateRate(pair, body, req.adminName);
    }

    // ── NOTIFICATIONS ────────────────────────────────────────────────────────────

    @Post('notifications/push')
    sendPushToUser(@Body() body: { userId: string; title: string; body: string }, @Req() req: any) {
        return this.adminService.sendPushToUser(body.userId, body.title, body.body, req.adminName);
    }

    @Post('notifications/broadcast')
    broadcastPush(@Body() body: { title: string; body: string; role?: 'SENDER' | 'RECEIVER' }, @Req() req: any) {
        return this.adminService.broadcastPush(body.title, body.body, body.role, req.adminName);
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
    deleteUser(@Param('id') id: string, @Req() req: any) {
        return this.adminService.deleteUser(id, req.adminName);
    }

    // ── JOURNAL D'AUDIT ──────────────────────────────────────────────────────────

    @Get('audit-logs')
    getAuditLogs(
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
    ) {
        return this.adminService.getAuditLogs(page, limit);
    }
}
