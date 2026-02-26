import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { DeliverySpeed, QuotationService } from './quotation.service';

@Controller('quotation')
export class QuotationController {
    constructor(private readonly quotationService: QuotationService) { }

    @Get()
    async getQuote(
        @Query('amount') amountStr: string,
        @Query('currency') currency: 'XOF' | 'EUR',
        @Query('speed') speed: DeliverySpeed
    ) {
        if (!amountStr || !currency || !speed) {
            throw new BadRequestException('Missing required query parameters: amount, currency, speed');
        }

        const amount = parseFloat(amountStr);
        if (isNaN(amount) || amount <= 0) {
            throw new BadRequestException('Amount must be a positive number');
        }

        // Montant minimum Wura : 33 000 FCFA — appliqué uniquement en production
        const isProduction = process.env.NODE_ENV === 'production';
        const MIN_XOF = 33_000;
        const amountInXof = currency === 'XOF' ? amount : amount * 655.96;
        if (isProduction && amountInXof < MIN_XOF) {
            throw new BadRequestException(`Montant minimum : ${MIN_XOF.toLocaleString('fr-FR')} FCFA`);
        }

        if (currency !== 'XOF' && currency !== 'EUR') {
            throw new BadRequestException('Currency must be XOF or EUR');
        }

        if (speed !== DeliverySpeed.INSTANT && speed !== DeliverySpeed.STANDARD) {
            throw new BadRequestException('Speed must be INSTANT or STANDARD');
        }

        return this.quotationService.getQuote({ amount, currency, speed });
    }
}
