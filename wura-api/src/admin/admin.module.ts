import { Module } from '@nestjs/common';
import { BlockchainModule } from '../blockchain/blockchain.module';
import { KkiapayModule } from '../kkiapay/kkiapay.module';
import { NotificationModule } from '../notifications/notification.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
    imports: [PrismaModule, BlockchainModule, KkiapayModule, NotificationModule],
    controllers: [AdminController],
    providers: [AdminService],
})
export class AdminModule { }
