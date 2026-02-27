import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { BlockchainModule } from './blockchain/blockchain.module';
import { KkiapayModule } from './kkiapay/kkiapay.module';
import { NotificationModule } from './notifications/notification.module';
import { PrismaModule } from './prisma/prisma.module';
import { QuotationModule } from './quotation/quotation.module';
import { TransactionsModule } from './transactions/transactions.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    UsersModule,
    TransactionsModule,
    PrismaModule,
    AuthModule,
    BlockchainModule,
    KkiapayModule,
    QuotationModule,
    NotificationModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
