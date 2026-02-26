import { Module } from '@nestjs/common';
import { QuotationController } from './quotation.controller';
import { QuotesController } from './quotes.controller';
import { QuotationService } from './quotation.service';

@Module({
    controllers: [QuotationController, QuotesController],
    providers: [QuotationService],
    exports: [QuotationService], // Pour que TransactionsService puisse l'utiliser
})
export class QuotationModule { }
