import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export enum DeliverySpeed {
    INSTANT = 'INSTANT',   // Transak off-ramp
    STANDARD = 'STANDARD'  // Mt Pelerin
}

interface QuoteRequest {
    amount: number;
    currency: 'XOF' | 'EUR';
    speed: DeliverySpeed;
}

export interface QuoteResult {
    baseAmountCfa: number;
    commercialAmountCfa: number;
    kkiapayFeeCfa: number;
    partnerFeesCfa: number;    // = frais Transak réels (converties en CFA)
    wuraFeesCfa: number;       // = marge nette Wura après déduction frais Transak
    totalToPayCfa: number;
    montant_usdt_a_envoyer_polygon: number;
    montant_euro_recu_par_jean: number;
    taux_wura_cfa: number;
    taux_officiel_cfa: number;
}

export interface OffRampQuoteResult {
    cryptoAmount: number;      // USDT envoyés par le receiver
    fiatAmount: number;        // EUR nets reçus après tous frais
    conversionPrice: number;   // Taux EUR/USDT de base
    transakFee: number;        // Part Transak (EUR)
    partnerFee: number;        // Part Wura configurée côté Transak (EUR)
    totalFee: number;          // Total frais (EUR)
}

@Injectable()
export class QuotationService {
    private readonly logger = new Logger(QuotationService.name);

    // Taux de facturation Wura (FCFA / 1€)
    private readonly TAUX_WURA_INSTANT = 719.9;
    private readonly TAUX_WURA_STANDARD = 689.9;

    // Taux officiel fixe EUR/XOF
    private readonly TAUX_OFFICIEL = 655.96;

    // Frais Kkiapay Mobile Money (2%)
    private readonly KKIAPAY_FEE_PERCENTAGE = 0.02;

    constructor(private readonly configService: ConfigService) { }

    // -----------------------------------------------------------------------
    // Transak SELL (direction correcte) : combien de USDT envoyer au receiver
    // pour qu'il reçoive EXACTEMENT targetEur après les frais Transak ?
    // On utilise le SELL API avec fiatAmount pour obtenir le cryptoAmount précis.
    // -----------------------------------------------------------------------
    // paymentMethod : 'sepa_bank_transfer_instant' (INSTANT) ou 'sepa_bank_transfer' (STANDARD fallback)
    async getUsdtForTargetEur(
        targetEur: number,
        paymentMethod: 'sepa_bank_transfer_instant' | 'sepa_bank_transfer' = 'sepa_bank_transfer_instant',
    ): Promise<number> {
        const apiKey = this.configService.get<string>('TRANSAK_API_KEY');

        if (!apiKey) {
            // Fallback : on ajoute ~3% de frais Transak par-dessus le montant cible
            this.logger.warn('[Transak] TRANSAK_API_KEY manquante — Mock SELL: +3% frais');
            return parseFloat((targetEur * 1.03).toFixed(6));
        }

        const url = new URL('https://api-stg.transak.com/api/v2/currencies/price');
        url.searchParams.append('fiatCurrency', 'EUR');
        url.searchParams.append('cryptoCurrency', 'USDT');
        url.searchParams.append('isBuyOrSell', 'SELL');
        url.searchParams.append('network', 'polygon');
        url.searchParams.append('paymentMethod', paymentMethod);
        url.searchParams.append('fiatAmount', targetEur.toString()); // EUR net voulu
        url.searchParams.append('partnerApiKey', apiKey);

        const tryFetch = async (pm: string): Promise<number | null> => {
            url.searchParams.set('paymentMethod', pm);
            const response = await fetch(url.toString(), { method: 'GET' });
            if (!response.ok) {
                const body = await response.text();
                this.logger.warn(`[Transak] SELL API ${response.status} (${pm}): ${body}`);
                return null;
            }
            const { response: r } = await response.json();
            this.logger.log(`[Transak] SELL quote (${pm}): pour recevoir ${targetEur}€ → envoyer ${r.cryptoAmount} USDT`);
            return parseFloat(r.cryptoAmount);
        };

        try {
            const result = await tryFetch(paymentMethod) ?? await tryFetch('sepa_bank_transfer');
            if (result !== null) return result;
            throw new Error('Tous les payment methods ont échoué');
        } catch (err: any) {
            this.logger.error(`[Transak] SELL fallback Mock: ${err.message}`);
            return parseFloat((targetEur * 1.03).toFixed(6));
        }
    }

    // -----------------------------------------------------------------------
    // Transak OFF-RAMP : combien d'EUR reçoit-on en vendant X USDT ?
    // Utilisé pour la page de retrait ET pour les vrais frais partenaires
    // -----------------------------------------------------------------------
    async getOffRampQuote(cryptoAmount: number): Promise<OffRampQuoteResult> {
        const apiKey = this.configService.get<string>('TRANSAK_API_KEY');

        if (!apiKey) {
            this.logger.warn('[Transak] TRANSAK_API_KEY manquante — Mock off-ramp');
            // Mock cohérent : Transak prend ~1.5% + frais fixes
            const conversionPrice = 0.9998;
            const grossFiat = cryptoAmount * conversionPrice;
            const transakFee = parseFloat((grossFiat * 0.015 + 0.99).toFixed(2));
            const partnerFee = parseFloat((grossFiat * 0.01).toFixed(2));
            const totalFee = transakFee + partnerFee;
            return {
                cryptoAmount,
                fiatAmount: parseFloat((grossFiat - totalFee).toFixed(2)),
                conversionPrice,
                transakFee,
                partnerFee,
                totalFee,
            };
        }

        const url = new URL('https://api-stg.transak.com/api/v2/currencies/price');
        url.searchParams.append('fiatCurrency', 'EUR');
        url.searchParams.append('cryptoCurrency', 'USDT');
        url.searchParams.append('isBuyOrSell', 'SELL');
        url.searchParams.append('network', 'polygon');
        url.searchParams.append('cryptoAmount', cryptoAmount.toString());
        url.searchParams.append('partnerApiKey', apiKey);

        // Essayer d'abord sepa_bank_transfer_instant (prod), puis fallback sepa_bank_transfer (staging)
        const paymentMethods = ['sepa_bank_transfer_instant', 'sepa_bank_transfer'];
        let rawResponse: any = null;

        for (const pm of paymentMethods) {
            url.searchParams.set('paymentMethod', pm);
            try {
                const res = await fetch(url.toString(), { method: 'GET' });
                if (res.ok) {
                    const json = await res.json();
                    rawResponse = json.response;
                    this.logger.log(`[Transak] Off-ramp quote via ${pm}`);
                    break;
                }
                const body = await res.text();
                this.logger.warn(`[Transak] Off-ramp ${pm} ${res.status}: ${body}`);
            } catch (e: any) {
                this.logger.warn(`[Transak] Off-ramp ${pm} network error: ${e.message}`);
            }
        }

        try {
            if (!rawResponse) throw new Error('Aucun payment method disponible');

            const r = rawResponse;

            // Extraire les frais depuis feeBreakdown
            const feeBreakdown: Array<{ id: string; value: number }> = r.feeBreakdown ?? [];
            const transakFee = parseFloat(
                (feeBreakdown.find(f => f.id === 'transak_fee')?.value ?? r.totalFee * 0.65).toFixed(2)
            );
            const partnerFee = parseFloat(
                (feeBreakdown.find(f => f.id === 'partner_fee')?.value ?? r.totalFee * 0.35).toFixed(2)
            );

            this.logger.log(
                `[Transak] Off-ramp quote: ${cryptoAmount} USDT → ${r.fiatAmount} EUR | transakFee=${transakFee}€ partnerFee=${partnerFee}€`
            );

            return {
                cryptoAmount: r.cryptoAmount ?? cryptoAmount,
                fiatAmount: r.fiatAmount,
                conversionPrice: r.conversionPrice,
                transakFee,
                partnerFee,
                totalFee: r.totalFee ?? transakFee + partnerFee,
            };
        } catch (err: any) {
            this.logger.error(`[Transak] Off-ramp fallback Mock: ${err.message}`);
            const conversionPrice = 0.9998;
            const grossFiat = cryptoAmount * conversionPrice;
            const transakFee = parseFloat((grossFiat * 0.015 + 0.99).toFixed(2));
            const partnerFee = parseFloat((grossFiat * 0.01).toFixed(2));
            const totalFee = transakFee + partnerFee;
            return {
                cryptoAmount,
                fiatAmount: parseFloat((grossFiat - totalFee).toFixed(2)),
                conversionPrice,
                transakFee,
                partnerFee,
                totalFee,
            };
        }
    }

    // -----------------------------------------------------------------------
    // Mt Pelerin SELL (direction correcte, mode STANDARD)
    // On demande : "combien de USDT envoyer pour que le receiver reçoive
    // exactement targetEur après les frais Mt Pelerin ?"
    // API : sourceCurrency=USDT (ce que le receiver envoie)
    //       destCurrency=EUR   (ce que le receiver veut recevoir)
    //       destAmount=targetEur → retourne sourceAmount (USDT nécessaires)
    // -----------------------------------------------------------------------
    private async getMtPelerinQuote(targetEur: number): Promise<number> {
        const apiKey = this.configService.get<string>('MT_PELERIN_API_KEY');
        const url = 'https://api.mtpelerin.com/currency_rates/convert';

        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;
        else this.logger.warn('[MtPelerin] MT_PELERIN_API_KEY manquante — appel public');

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    sourceCurrency: 'USDT',   // receiver envoie USDT
                    destCurrency: 'EUR',       // receiver veut recevoir EUR
                    destAmount: targetEur,     // montant EUR net voulu
                    sourceNetwork: 'matic_mainnet',
                    destNetwork: 'fiat',
                    isCardPayment: false,
                }),
            });

            if (!response.ok) {
                this.logger.error(`[MtPelerin] API ${response.status}: ${await response.text()}`);
                throw new Error('Mt Pelerin API error');
            }
            const data = await response.json();
            // sourceAmount = USDT à envoyer pour obtenir targetEur net
            this.logger.log(`[MtPelerin] SELL quote: pour recevoir ${targetEur}€ → envoyer ${data.sourceAmount} USDT`);
            return parseFloat(data.sourceAmount);
        } catch (err: any) {
            this.logger.error(`[MtPelerin] Fallback Mock: ${err.message}`);
            // Fallback : +2% pour couvrir les frais Mt Pelerin estimés
            return parseFloat((targetEur * 1.02).toFixed(6));
        }
    }

    // -----------------------------------------------------------------------
    // Devis complet pour le flow envoi (XOF → USDT → EUR)
    // partnerFeesCfa = vrais frais Transak off-ramp (plus de mock 30/70)
    // -----------------------------------------------------------------------
    async getQuote(request: QuoteRequest): Promise<QuoteResult> {
        const tauxWura =
            request.speed === DeliverySpeed.INSTANT
                ? this.TAUX_WURA_INSTANT
                : this.TAUX_WURA_STANDARD;

        // 1. Montant cible en EUR
        let amountEUR_cible: number;
        let baseAmountCfa: number;

        if (request.currency === 'XOF') {
            baseAmountCfa = request.amount;
            amountEUR_cible = request.amount / this.TAUX_OFFICIEL;
        } else {
            amountEUR_cible = request.amount;
            baseAmountCfa = amountEUR_cible * this.TAUX_OFFICIEL;
        }

        // 2. Montant facturé au taux Wura
        const commercialAmountCfa = amountEUR_cible * tauxWura;

        // 3. Frais Kkiapay Mobile Money
        const kkiapayFeeCfa = commercialAmountCfa * this.KKIAPAY_FEE_PERCENTAGE;

        // 4. Obtenir le montant USDT à bridger
        // Direction SELL : "combien de USDT envoyer pour que receiver reçoive amountEUR_cible net ?"
        // Mt Pelerin minimum : ~50 CHF ≈ 47.50€ — fallback Transak Standard en dessous
        const MT_PELERIN_MIN_EUR = 47.5;
        const useTransakStandardFallback =
            request.speed === DeliverySpeed.STANDARD && amountEUR_cible < MT_PELERIN_MIN_EUR;

        let montantUsdt: number;
        if (request.speed === DeliverySpeed.INSTANT) {
            montantUsdt = await this.getUsdtForTargetEur(amountEUR_cible);
        } else if (useTransakStandardFallback) {
            // Montant sous le seuil Mt Pelerin → Transak SEPA Standard
            this.logger.warn(
                `[Quote] STANDARD ${amountEUR_cible.toFixed(2)}€ < min Mt Pelerin (${MT_PELERIN_MIN_EUR}€) → fallback Transak Standard`
            );
            montantUsdt = await this.getUsdtForTargetEur(amountEUR_cible, 'sepa_bank_transfer');
        } else {
            montantUsdt = await this.getMtPelerinQuote(amountEUR_cible);
        }

        // 5. Frais réels → partnerFeesCfa et wuraFeesCfa
        let partnerFeesCfa: number;
        let wuraFeesCfa: number;
        let montant_euro_recu_par_jean: number = Number(amountEUR_cible.toFixed(2));
        const marginCfa = commercialAmountCfa - baseAmountCfa;

        if (request.speed === DeliverySpeed.INSTANT) {
            let offRamp = await this.getOffRampQuote(montantUsdt);

            // Ajustement anti-slippage : si Transak rend moins que promis (asymétrie API),
            // on augmente proportionnellement le USDT bridgé — Wura absorbe l'écart, pas le client.
            if (offRamp.fiatAmount < amountEUR_cible - 0.01) {
                const ratio = amountEUR_cible / offRamp.fiatAmount;
                const adjustedUsdt = parseFloat((montantUsdt * ratio).toFixed(6));
                this.logger.warn(
                    `[Quote] Slippage ${(amountEUR_cible - offRamp.fiatAmount).toFixed(2)}€ détecté. ` +
                    `USDT ajusté: ${montantUsdt} → ${adjustedUsdt} (Wura absorbe l'écart)`
                );
                offRamp = await this.getOffRampQuote(adjustedUsdt);
                montantUsdt = adjustedUsdt;
            }

            montant_euro_recu_par_jean = Number(offRamp.fiatAmount.toFixed(2));
            const transakTotalFeeEur = offRamp.transakFee + offRamp.partnerFee;
            partnerFeesCfa = Math.round(transakTotalFeeEur * this.TAUX_OFFICIEL);
            wuraFeesCfa = Math.round(marginCfa - partnerFeesCfa);

        } else if (useTransakStandardFallback) {
            // Transak Standard (fallback petits montants) : ~3€ frais fixes
            const TRANSAK_STD_FLAT_FEE_EUR = 3.0;
            partnerFeesCfa = Math.round(TRANSAK_STD_FLAT_FEE_EUR * this.TAUX_OFFICIEL);
            wuraFeesCfa = Math.round(marginCfa - partnerFeesCfa);

        } else {
            // Mt Pelerin STANDARD : spread ≈ 0, pas de frais fixes
            // Les frais Mt Pelerin sont absorbés dans le taux de change (USDT supplémentaire)
            partnerFeesCfa = 0;
            wuraFeesCfa = Math.round(marginCfa);
        }

        // montantUsdt est final ici (potentiellement ajusté dans le bloc INSTANT ci-dessus)
        const montant_usdt_a_envoyer_polygon = Number(montantUsdt.toFixed(6));
        const totalToPayCfa = commercialAmountCfa;

        this.logger.log(
            `[Quote] ${Math.round(baseAmountCfa)} CFA → cible ${amountEUR_cible.toFixed(2)} EUR → réel ${montant_euro_recu_par_jean} EUR | USDT: ${montant_usdt_a_envoyer_polygon} | partnerFees: ${partnerFeesCfa} CFA | wuraFees: ${wuraFeesCfa} CFA`
        );

        return {
            baseAmountCfa: Math.round(baseAmountCfa),
            commercialAmountCfa: Math.round(commercialAmountCfa),
            kkiapayFeeCfa: Math.round(kkiapayFeeCfa),
            partnerFeesCfa,
            wuraFeesCfa,
            totalToPayCfa: Math.ceil(totalToPayCfa),
            montant_usdt_a_envoyer_polygon,
            montant_euro_recu_par_jean,
            taux_wura_cfa: tauxWura,
            taux_officiel_cfa: this.TAUX_OFFICIEL,
        };
    }
}
