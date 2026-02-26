import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { OffRampQuoteResult, QuotationService } from './quotation.service';

export interface UsdtForEurResult {
    eurAmount: number;
    usdtAmount: number;
}

/**
 * GET /quotes/sell?cryptoAmount=100
 *
 * Retourne un devis Transak off-ramp : combien d'EUR reçoit le receiver
 * en vendant X USDT, avec le détail des frais réels Transak.
 *
 * Utilisé par le front React Native pour afficher :
 *   - "Frais partenaires" = transakFee (ce que Transak prend)
 *   - "Frais Wura"        = partnerFee (notre marge configurée dans Transak)
 *   - "Vous recevez"      = fiatAmount (net en EUR)
 */
@Controller('quotes')
export class QuotesController {
    constructor(private readonly quotationService: QuotationService) { }

    @Get('sell')
    async getSellQuote(
        @Query('cryptoAmount') cryptoAmountStr: string,
    ): Promise<OffRampQuoteResult> {
        if (!cryptoAmountStr) {
            throw new BadRequestException('Le paramètre cryptoAmount est requis (ex: ?cryptoAmount=50)');
        }

        const cryptoAmount = parseFloat(cryptoAmountStr);

        if (isNaN(cryptoAmount) || cryptoAmount <= 0) {
            throw new BadRequestException('cryptoAmount doit être un nombre positif');
        }

        return this.quotationService.getOffRampQuote(cryptoAmount);
    }

    /**
     * GET /quotes/usdt-for-eur?eurAmount=50
     *
     * Retourne le montant exact en USDT que le receiver doit envoyer à Transak
     * pour recevoir exactement eurAmount en EUR (frais Transak inclus).
     * Utilisé par le widget de retrait pour pré-remplir defaultCryptoAmount.
     */
    @Get('usdt-for-eur')
    async getUsdtForEur(
        @Query('eurAmount') eurAmountStr: string,
    ): Promise<UsdtForEurResult> {
        if (!eurAmountStr) {
            throw new BadRequestException('Le paramètre eurAmount est requis (ex: ?eurAmount=50)');
        }

        const eurAmount = parseFloat(eurAmountStr);

        if (isNaN(eurAmount) || eurAmount <= 0) {
            throw new BadRequestException('eurAmount doit être un nombre positif');
        }

        const usdtAmount = await this.quotationService.getUsdtForTargetEur(eurAmount);
        return { eurAmount, usdtAmount };
    }
}
