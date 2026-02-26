import { Module } from '@nestjs/common';
import { KkiapayModule } from '../kkiapay/kkiapay.module';
import { QuotationModule } from '../quotation/quotation.module';
import { UsersModule } from '../users/users.module';
import { PublicTransactionsController, TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';

@Module({
  imports: [UsersModule, QuotationModule, KkiapayModule],
  controllers: [TransactionsController, PublicTransactionsController],
  providers: [TransactionsService],
})
export class TransactionsModule { }
