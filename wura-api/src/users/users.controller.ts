import { Body, ConflictException, Controller, Get, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { FirebaseAuthGuard } from '../auth/firebase-auth/firebase-auth.guard';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Post('register/sender')
    @UseGuards(FirebaseAuthGuard)
    async registerSender(@Req() req, @Body() body: any) {
        const firebaseUid = req.user.uid;
        const phone = req.user.phone_number || body.phone;

        return this.usersService.createSender({
            firebaseUid,
            phone,
            ...body
        });
    }

    @Post('register/receiver')
    @UseGuards(FirebaseAuthGuard)
    async registerReceiver(@Req() req, @Body() body: any) {
        const firebaseUid = req.user.uid;
        const email = req.user.email || body.email;

        return this.usersService.createReceiver({
            firebaseUid,
            email,
            ...body
        });
    }

    @Post('register/provisional-receiver')
    @UseGuards(FirebaseAuthGuard)
    async registerProvisionalReceiver(@Body() body: { firstName: string; lastName: string; email?: string }) {
        return this.usersService.createProvisionalReceiver({
            firstName: body.firstName,
            lastName: body.lastName,
            email: body.email,
        });
    }

    @Get('me')
    @UseGuards(FirebaseAuthGuard)
    async getProfile(@Req() req) {
        return this.usersService.findByFirebaseUid(req.user.uid);
    }

    @Patch('me/wura-id')
    @UseGuards(FirebaseAuthGuard)
    async updateWuraId(@Req() req, @Body() body: { wuraId: string }) {
        if (!body.wuraId) {
            throw new ConflictException('wuraId is required');
        }
        return this.usersService.updateWuraId(req.user.uid, body.wuraId);
    }

    @Get('check-wura-id/:wuraId')
    // No FirebaseAuthGuard here so the app can check availability without needing a full profile
    async checkWuraId(@Req() req) {
        const wuraId = req.params.wuraId;
        return this.usersService.checkWuraId(wuraId);
    }

    @Get('search')
    @UseGuards(FirebaseAuthGuard)
    async searchWuraId(@Req() req) {
        const query = req.query.q as string;
        if (!query || query.length < 3) return [];
        return this.usersService.searchWuraId(query);
    }

    @Patch('me/wallet')
    @UseGuards(FirebaseAuthGuard)
    async updateWallet(@Req() req, @Body() body: { walletAddress: string }) {
        if (!body.walletAddress) {
            throw new ConflictException('walletAddress is required');
        }
        return this.usersService.updateWalletAddress(req.user.uid, body.walletAddress);
    }
}
