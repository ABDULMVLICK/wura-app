import { Module } from '@nestjs/common';
import { BlockchainModule } from '../blockchain/blockchain.module';
import { NotificationModule } from '../notifications/notification.module';
import { PrismaModule } from '../prisma/prisma.module';
import { KkiapayController } from './kkiapay.controller';
import { KkiapayService } from './kkiapay.service';

@Module({
  imports: [PrismaModule, BlockchainModule, NotificationModule],
  providers: [KkiapayService],
  controllers: [KkiapayController],
  exports: [KkiapayService]
})
export class KkiapayModule { }
