import { BadRequestException, Injectable } from '@nestjs/common';

export enum TransferStrategy {
    ECLAIR = 'ECLAIR',
    STANDARD = 'STANDARD',
}

@Injectable()
export class QuotationService {
    // Limites
    private readonly MIN_CFA = 35000;
    private readonly MAX_CFA = 300000;

    // Taux de conversion
    private readonly ECLAIR_RATE = 720; // 1€ = 720 FCFA
    private readonly STANDARD_RATE = 680; // 1€ = 680 FCFA
    private readonly KKIAPAY_FEE_PERCENT = 0.02; // 2%

    /**
     * Calcule une cotation pour un montant en FCFA
     * @param amountCfa Montant envoyé par Moussa en FCFA
     * @param strategy Stratégie choisie (ECLAIR ou STANDARD)
     */
    getQuote(amountCfa: number, strategy: TransferStrategy) {
        if (amountCfa < this.MIN_CFA || amountCfa > this.MAX_CFA) {
            throw new BadRequestException(`Le montant doit être compris entre ${this.MIN_CFA} et ${this.MAX_CFA} FCFA.`);
        }

        // 1. Déterminer le taux
        const rate = strategy === TransferStrategy.ECLAIR ? this.ECLAIR_RATE : this.STANDARD_RATE;

        // 2. Ajouter les frais Kkiapay (2%)
        // Si Moussa veut envoyer X, il est débité de X + (X * 0.02)
        const kkiapayFees = amountCfa * this.KKIAPAY_FEE_PERCENT;
        const totalDebitedCfa = amountCfa + kkiapayFees;

        // 3. Calculer le montant EUR que Jean reçoit
        // On divise le montant net (amountCfa) par le taux
        const amountEur = Number((amountCfa / rate).toFixed(2));

        // 4. Calculer le montant USDT à envoyer (6 décimales)
        // Pour simplifier, on assume 1 USDT = 1 EUR pour le moment ou on suit le même montant EUR
        const amountUsdt = Number((amountCfa / rate).toFixed(6));

        return {
            fiatAmountIn: amountCfa,
            fiatCurrencyIn: 'XOF',
            kkiapayFees,
            totalDebitedCfa,
            fiatAmountOut: amountEur,
            fiatCurrencyOut: 'EUR',
            amountUsdt,
            rate,
            strategy,
        };
    }
}
