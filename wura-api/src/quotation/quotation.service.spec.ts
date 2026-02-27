import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { DeliverySpeed, QuotationService } from './quotation.service';

// Mock fetch global (pas de vraies requêtes HTTP en tests)
global.fetch = jest.fn();

describe('QuotationService - Wura QA', () => {
  let service: QuotationService;

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuotationService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<QuotationService>(QuotationService);
    jest.clearAllMocks();
    // Pas de clés API par défaut → mode mock (fallback interne)
    mockConfigService.get.mockReturnValue(undefined);
  });

  // ================================================
  // getQuote — INSTANT (Transak, no API key → fallback mock)
  // ================================================
  describe('getQuote — INSTANT', () => {
    it('✅ Cas 1: 50 000 XOF → devis INSTANT cohérent', async () => {
      const result = await service.getQuote({
        amount: 50000,
        currency: 'XOF',
        speed: DeliverySpeed.INSTANT,
      });

      expect(result.baseAmountCfa).toBe(50000);
      expect(result.commercialAmountCfa).toBeGreaterThan(50000); // taux Wura > taux officiel
      expect(result.montant_euro_recu_par_jean).toBeGreaterThan(0);
      expect(result.montant_usdt_a_envoyer_polygon).toBeGreaterThan(0);
      expect(result.kkiapayFeeCfa).toBeGreaterThan(0);
      expect(result.taux_wura_cfa).toBe(719.9); // taux INSTANT
      expect(result.taux_officiel_cfa).toBe(655.96);
    });

    it('✅ Cas 2: Saisie en EUR → conversion baseAmountCfa correcte', async () => {
      const result = await service.getQuote({
        amount: 76,
        currency: 'EUR',
        speed: DeliverySpeed.INSTANT,
      });

      // baseAmountCfa ≈ 76 × 655.96 = 49 852 CFA
      expect(result.baseAmountCfa).toBeCloseTo(76 * 655.96, -2);
      expect(result.montant_euro_recu_par_jean).toBeGreaterThan(0);
      expect(result.totalToPayCfa).toBeGreaterThan(result.baseAmountCfa);
    });

    it('✅ Cas 3: totalToPayCfa ≥ baseAmountCfa (frais toujours positifs)', async () => {
      const result = await service.getQuote({
        amount: 100000,
        currency: 'XOF',
        speed: DeliverySpeed.INSTANT,
      });

      expect(result.totalToPayCfa).toBeGreaterThanOrEqual(result.baseAmountCfa);
      expect(result.kkiapayFeeCfa).toBeGreaterThan(0);
    });

    it('✅ Cas 4: Le USDT bridgé inclut ~3% de frais (mode mock)', async () => {
      const result = await service.getQuote({
        amount: 50000,
        currency: 'XOF',
        speed: DeliverySpeed.INSTANT,
      });

      // En mode mock (no API key), getUsdtForTargetEur = targetEur * 1.03
      // targetEur ≈ 50000 / 655.96 ≈ 76.22€
      // USDT ≈ 76.22 * 1.03 ≈ 78.5 (avant ajustement slippage)
      expect(result.montant_usdt_a_envoyer_polygon).toBeGreaterThan(70);
      expect(result.montant_usdt_a_envoyer_polygon).toBeLessThan(150);
    });
  });

  // ================================================
  // getQuote — STANDARD (Mt Pelerin, no key → mock)
  // ================================================
  describe('getQuote — STANDARD', () => {
    it('✅ Cas 5: 50 000 XOF → taux Wura STANDARD (689.9)', async () => {
      const result = await service.getQuote({
        amount: 50000,
        currency: 'XOF',
        speed: DeliverySpeed.STANDARD,
      });

      expect(result.taux_wura_cfa).toBe(689.9);
      expect(result.baseAmountCfa).toBe(50000);
    });

    it('✅ Cas 6: Petit montant < 47.5€ → fallback Transak Standard (partnerFees fixe)', async () => {
      // 30€ × 655.96 = 19 678 CFA
      const result = await service.getQuote({
        amount: 19678,
        currency: 'XOF',
        speed: DeliverySpeed.STANDARD,
      });

      // Transak Standard flat fee ≈ 3€ × 655.96 = ~1968 CFA
      expect(result.partnerFeesCfa).toBeGreaterThan(0);
      expect(result.montant_usdt_a_envoyer_polygon).toBeGreaterThan(0);
    });

    it('✅ Cas 7: Grand montant ≥ 47.5€ → Mt Pelerin (partnerFeesCfa = 0)', async () => {
      // 100€ × 655.96 = 65 596 CFA → Mt Pelerin
      const result = await service.getQuote({
        amount: 65596,
        currency: 'XOF',
        speed: DeliverySpeed.STANDARD,
      });

      // Mt Pelerin absorbe ses frais dans le spread → partnerFeesCfa = 0
      expect(result.partnerFeesCfa).toBe(0);
      expect(result.wuraFeesCfa).toBeGreaterThan(0);
    });
  });

  // ================================================
  // getOffRampQuote — sans clé API (mock interne)
  // ================================================
  describe('getOffRampQuote (mode mock — sans clé API)', () => {
    it('✅ Retourne un devis cohérent : fiatAmount < cryptoAmount', async () => {
      const result = await service.getOffRampQuote(100);

      expect(result.cryptoAmount).toBe(100);
      expect(result.fiatAmount).toBeLessThan(100);   // frais déduits
      expect(result.fiatAmount).toBeGreaterThan(90); // frais < 10%
      expect(result.transakFee).toBeGreaterThan(0);
      expect(result.partnerFee).toBeGreaterThan(0);
      expect(result.totalFee).toBeCloseTo(result.transakFee + result.partnerFee, 2);
    });

    it('✅ fiatAmount + totalFee ≈ cryptoAmount × conversionPrice', async () => {
      const result = await service.getOffRampQuote(50);

      const expected = 50 * result.conversionPrice;
      expect(result.fiatAmount + result.totalFee).toBeCloseTo(expected, 1);
    });
  });

  // ================================================
  // getOffRampQuote — avec clé API + mock fetch
  // ================================================
  describe('getOffRampQuote (avec TRANSAK_API_KEY)', () => {
    beforeEach(() => {
      mockConfigService.get.mockReturnValue('fake-transak-key-123');
    });

    it('✅ Cas 1: sepa_bank_transfer_instant indispo → retry sepa_bank_transfer réussi', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          text: async () => JSON.stringify({ error: { message: 'Invalid payment method' } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            response: {
              cryptoAmount: 100,
              fiatAmount: 96.5,
              conversionPrice: 0.9998,
              totalFee: 3.5,
              feeBreakdown: [
                { id: 'transak_fee', value: 2.0 },
                { id: 'partner_fee', value: 1.5 },
              ],
            },
          }),
        });

      const result = await service.getOffRampQuote(100);

      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(result.fiatAmount).toBe(96.5);
      expect(result.transakFee).toBe(2.0);
      expect(result.partnerFee).toBe(1.5);
      expect(result.totalFee).toBe(3.5);
    });

    it('✅ Cas 2: sepa_bank_transfer_instant disponible directement → 1 seul appel', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          response: {
            cryptoAmount: 200,
            fiatAmount: 193.2,
            conversionPrice: 0.9998,
            totalFee: 6.8,
            feeBreakdown: [
              { id: 'transak_fee', value: 4.0 },
              { id: 'partner_fee', value: 2.8 },
            ],
          },
        }),
      });

      const result = await service.getOffRampQuote(200);

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(result.fiatAmount).toBe(193.2);
    });

    it('💥 Cas 3: Tous les payment methods échouent → fallback mock (pas d\'exception)', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: false, text: async () => 'Invalid payment method' })
        .mockResolvedValueOnce({ ok: false, text: async () => 'Service unavailable' });

      const result = await service.getOffRampQuote(50);

      // Le service NE doit PAS throw — il retourne le mock
      expect(result.cryptoAmount).toBe(50);
      expect(result.fiatAmount).toBeGreaterThan(0);
    });

    it('💥 Cas 4: fetch throw network error → fallback mock', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const result = await service.getOffRampQuote(75);

      expect(result.cryptoAmount).toBe(75);
      expect(result.fiatAmount).toBeGreaterThan(0);
    });
  });

  // ================================================
  // getUsdtForTargetEur — avec clé API + mock fetch
  // ================================================
  describe('getUsdtForTargetEur (avec TRANSAK_API_KEY)', () => {
    beforeEach(() => {
      mockConfigService.get.mockReturnValue('fake-transak-key-123');
    });

    it('✅ Cas 1: SELL quote réussi au premier try', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          response: { cryptoAmount: 78.5 },
        }),
      });

      // On appelle indirectement via getQuote INSTANT
      const result = await service.getQuote({
        amount: 50000,
        currency: 'XOF',
        speed: DeliverySpeed.INSTANT,
      });

      expect(result.montant_usdt_a_envoyer_polygon).toBeGreaterThan(0);
    });

    it('💥 Cas 2: Sans clé → fallback mock (+3% des EUR cibles)', async () => {
      // mockConfigService.get retourne undefined (défaut beforeEach principal)
      const targetEur = 76.22;
      // getUsdtForTargetEur(76.22) sans clé → 76.22 * 1.03 ≈ 78.51
      const result = await service.getQuote({
        amount: 50000,
        currency: 'XOF',
        speed: DeliverySpeed.INSTANT,
      });

      // Vérification que le USDT est raisonnable (mock = targetEur * 1.03)
      expect(result.montant_usdt_a_envoyer_polygon).toBeGreaterThan(70);
    });
  });
});
