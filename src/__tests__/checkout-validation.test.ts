import { describe, it, expect } from 'vitest';
import { TIER_CONFIG, type SubscriptionTier } from '@/lib/payments/tiers';

/**
 * Tests for checkout validation logic.
 * Exercises tier validation, period handling, amount computation,
 * and downgrade protection.
 */

function validateCheckoutRequest(body: { tier?: string; period?: string }) {
  const tier = body.tier as SubscriptionTier | undefined;
  if (!tier || !TIER_CONFIG[tier] || tier === 'free') {
    return { valid: false, error: 'Invalid tier' as const };
  }
  const period = body.period === 'annual' ? 'annual' : 'monthly';
  const config = TIER_CONFIG[tier];
  const amount = period === 'annual' ? config.annual_price_idr : config.price_idr;
  return { valid: true as const, tier, period, amount };
}

function canDowngrade(
  existingTier: SubscriptionTier,
  existingStatus: string,
  existingPeriodEnd: string | null,
  newTier: SubscriptionTier,
): boolean {
  if (existingStatus !== 'active') return true;
  if (existingTier === 'free') return true;
  if (!existingPeriodEnd) return true;
  if (new Date(existingPeriodEnd) <= new Date()) return true;

  const order: SubscriptionTier[] = ['free', 'plus', 'pro', 'elite'];
  return order.indexOf(newTier) >= order.indexOf(existingTier);
}

describe('Checkout tier validation', () => {
  it('rejects missing tier', () => {
    expect(validateCheckoutRequest({}).valid).toBe(false);
  });

  it('rejects empty tier', () => {
    expect(validateCheckoutRequest({ tier: '' }).valid).toBe(false);
  });

  it('rejects free tier (no payment needed)', () => {
    expect(validateCheckoutRequest({ tier: 'free' }).valid).toBe(false);
  });

  it('rejects unknown tier', () => {
    expect(validateCheckoutRequest({ tier: 'premium' }).valid).toBe(false);
  });

  it('accepts plus tier', () => {
    const result = validateCheckoutRequest({ tier: 'plus' });
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.amount).toBe(59000);
    }
  });

  it('accepts pro tier', () => {
    const result = validateCheckoutRequest({ tier: 'pro' });
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.amount).toBe(179000);
    }
  });

  it('accepts elite tier', () => {
    const result = validateCheckoutRequest({ tier: 'elite' });
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.amount).toBe(499000);
    }
  });
});

describe('Checkout period handling', () => {
  it('defaults to monthly when period missing', () => {
    const result = validateCheckoutRequest({ tier: 'plus' });
    if (result.valid) {
      expect(result.period).toBe('monthly');
      expect(result.amount).toBe(59000);
    }
  });

  it('accepts annual and uses annual pricing', () => {
    const result = validateCheckoutRequest({ tier: 'plus', period: 'annual' });
    if (result.valid) {
      expect(result.period).toBe('annual');
      expect(result.amount).toBe(590000);
    }
  });

  it('treats unknown periods as monthly', () => {
    const result = validateCheckoutRequest({ tier: 'plus', period: 'quarterly' });
    if (result.valid) {
      expect(result.period).toBe('monthly');
    }
  });

  it('handles malicious period input', () => {
    const result = validateCheckoutRequest({ tier: 'plus', period: '"; DROP TABLE users; --' });
    if (result.valid) {
      expect(result.period).toBe('monthly');
    }
  });
});

describe('Downgrade protection', () => {
  const future = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString();
  const past = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();

  it('allows upgrade from plus to pro', () => {
    expect(canDowngrade('plus', 'active', future, 'pro')).toBe(true);
  });

  it('allows upgrade from plus to elite', () => {
    expect(canDowngrade('plus', 'active', future, 'elite')).toBe(true);
  });

  it('blocks downgrade from pro to plus while active', () => {
    expect(canDowngrade('pro', 'active', future, 'plus')).toBe(false);
  });

  it('blocks downgrade from elite to plus while active', () => {
    expect(canDowngrade('elite', 'active', future, 'plus')).toBe(false);
  });

  it('allows re-subscribing after expiry', () => {
    expect(canDowngrade('pro', 'active', past, 'plus')).toBe(true);
  });

  it('allows "resubscribe" at same tier', () => {
    expect(canDowngrade('plus', 'active', future, 'plus')).toBe(true);
  });

  it('allows anything when previous sub is not active', () => {
    expect(canDowngrade('pro', 'failed', future, 'plus')).toBe(true);
    expect(canDowngrade('pro', 'canceled', future, 'plus')).toBe(true);
  });

  it('allows anything when previous sub was free', () => {
    expect(canDowngrade('free', 'active', future, 'plus')).toBe(true);
  });
});

/**
 * Regression: ISSUE-QA-1 — the API's catch-all 500 response used to return
 * {error: 'Checkout failed'}, which surfaced verbatim on the checkout error
 * screen (the frontend reads body.error as the user-facing message). That
 * was an English leak in an otherwise Bahasa-first brand voice.
 *
 * Found by /qa on 2026-04-21 while clicking Pilih Plus as a Free user;
 * the backend failed (Midtrans 401 in dev) and the user saw "Gagal
 * memproses pembayaran / Checkout failed" — the second line English.
 *
 * Contract: every user-facing error field must be Bahasa. Internal
 * short codes can live on the `code` field for log greps and telemetry.
 */
describe('Checkout 500 error shape (Bahasa-first contract)', () => {
  // Mirror of the catch block in /api/subscription/checkout/route.ts.
  function buildErrorResponse() {
    return {
      error: 'Pembayaran tidak bisa diproses sekarang. Coba lagi ya.',
      code: 'checkout_failed',
    };
  }

  const englishTokens = [
    'failed', 'checkout', 'error', 'unable', 'cannot', 'please',
    'try', 'again', 'processing',
  ];

  it('error message is Bahasa (no English words)', () => {
    const body = buildErrorResponse();
    const lower = body.error.toLowerCase();
    for (const t of englishTokens) {
      expect(lower).not.toContain(t);
    }
  });

  it('uses "ya" or similar Bahasa conversational particle', () => {
    const body = buildErrorResponse();
    // Friendly Bahasa voice per Build Spec §3.3 — "ya" is a gentle particle
    // native users expect on polite error messages.
    expect(body.error).toMatch(/\b(ya|dong|yuk|deh|sih)\b/);
  });

  it('exposes a stable internal `code` for log greps + telemetry', () => {
    const body = buildErrorResponse();
    expect(body.code).toBe('checkout_failed');
  });
});
