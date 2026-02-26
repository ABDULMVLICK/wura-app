import { Body, Controller, Get, NotFoundException, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { FirebaseAuthGuard } from '../auth/firebase-auth/firebase-auth.guard';
import { KkiapayService } from '../kkiapay/kkiapay.service';
import { UsersService } from '../users/users.service';
import { TransactionsService } from './transactions.service';

@Controller('transactions')
@UseGuards(FirebaseAuthGuard)
export class TransactionsController {
    constructor(
        private readonly transactionsService: TransactionsService,
        private readonly usersService: UsersService,
        private readonly kkiapayService: KkiapayService
    ) { }

    @Post()
    async createTransaction(@Req() req, @Body() body: any) {
        const user = await this.usersService.findByFirebaseUid(req.user.uid);
        if (!user) throw new NotFoundException('User not found');
        return this.transactionsService.createTransaction(user.id, body);
    }

    @Get()
    async getMyTransactions(@Req() req) {
        // Find user first
        const user = await this.usersService.findByFirebaseUid(req.user.uid);
        if (!user) throw new NotFoundException('User not found');

        // Check if user has a Sender profile
        try {
            const senderTxs = await this.transactionsService.getTransactionsBySender(user.id);
            if (senderTxs && senderTxs.length > 0) return senderTxs;
        } catch (e) {
            // Ignore error, might not be a sender
        }

        // Check if user has a Receiver profile
        try {
            const receiverTxs = await this.transactionsService.getTransactionsByReceiver(user.id);
            return receiverTxs || [];
        } catch (e) {
            return [];
        }
    }

    @Get(':id')
    async getTransaction(@Req() req, @Param('id') id: string) {
        return this.transactionsService.getTransactionById(id);
    }

    @Patch(':id/offramp')
    async reportOfframp(@Req() req, @Param('id') id: string, @Body() body: { polygonTxHash?: string }) {
        const user = await this.usersService.findByFirebaseUid(req.user.uid);
        if (!user) throw new NotFoundException('User not found');
        return this.transactionsService.markOfframpStarted(id, body.polygonTxHash ?? '');
    }

    @Post(':id/refund')
    async refundTransaction(@Req() req, @Param('id') id: string) {
        // Vérifier que l'utilisateur existe
        const user = await this.usersService.findByFirebaseUid(req.user.uid);
        if (!user) throw new NotFoundException('User not found');

        return this.kkiapayService.refundTransaction(id);
    }
}

// Controller public séparé pour requêter les infos basiques avant Onboarding
@Controller('public-transactions')
export class PublicTransactionsController {
    constructor(private readonly transactionsService: TransactionsService) { }

    @Get('claim/:referenceId')
    async getClaimableTransaction(@Param('referenceId') referenceId: string) {
        const tx = await this.transactionsService.getTransactionByReference(referenceId);

        // Security: Return only safe fields needed for the UI
        return {
            referenceId: tx.referenceId,
            status: tx.status,
            amountFiatOutExpected: tx.amountFiatOutExpected,
            deliverySpeed: tx.deliverySpeed,
            senderFirstName: tx.sender?.firstName || "Quelqu'un",
            createdAt: tx.createdAt
        };
    }
}
