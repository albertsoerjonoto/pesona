import { describe, it, expect } from 'vitest';
import {
  TIER_CONFIG,
  formatPriceIDR,
  meetsMinimumTier,
  getTierConfig,
  type SubscriptionTier,
} from '@/lib/payments/tiers';

describe('Tier Configuration', () => {
  it('has all four tiers defined', () => {
    expect(Object.keys(TIER_CONFIG)).toEqual(['free', 'plus', 'pro', 'elite']);
  });

  it('free tier has correct limits', () => {
    const free = TIER_CONFIG.free;
    expect(free.price_idr).toBe(0);
    expect(free.daily_chat_limit).toBe(3);
    expect(free.daily_photo_limit).toBe(1);
    expect(free.weekly_report).toBe(false);
    expect(free.advanced_analysis).toBe(false);
    expect(free.derm_consult).toBe(false);
  });

  it('plus tier costs Rp 59,000/month', () => {
    const plus = TIER_CONFIG.plus;
    expect(plus.price_idr).toBe(59_000);
    expect(plus.annual_price_idr).toBe(590_000);
    expect(plus.daily_chat_limit).toBe(Infinity);
    expect(plus.weekly_report).toBe(true);
  });

  it('pro tier costs Rp 179,000/month', () => {
    const pro = TIER_CONFIG.pro;
    expect(pro.price_idr).toBe(179_000);
    expect(pro.daily_photo_limit).toBe(Infinity);
    expect(pro.advanced_analysis).toBe(true);
    expect(pro.priority_response).toBe(true);
  });

  it('elite tier includes derm consult', () => {
    const elite = TIER_CONFIG.elite;
    expect(elite.price_idr).toBe(499_000);
    expect(elite.derm_consult).toBe(true);
  });

  it('annual plans are 10x monthly (2 months free)', () => {
    for (const tier of ['plus', 'pro', 'elite'] as SubscriptionTier[]) {
      const config = TIER_CONFIG[tier];
      expect(config.annual_price_idr).toBe(config.price_idr * 10);
    }
  });

  it('all tiers have Bahasa names', () => {
    for (const tier of Object.values(TIER_CONFIG)) {
      expect(tier.nameBahasa).toBeTruthy();
      expect(tier.nameBahasa.startsWith('Pesona')).toBe(true);
    }
  });
});

describe('formatPriceIDR', () => {
  it('formats zero as Gratis', () => {
    expect(formatPriceIDR(0)).toBe('Gratis');
  });

  it('formats prices with Rp prefix and Indonesian locale', () => {
    const result = formatPriceIDR(59_000);
    expect(result).toContain('Rp');
    expect(result).toContain('59');
  });

  it('formats large amounts', () => {
    const result = formatPriceIDR(499_000);
    expect(result).toContain('Rp');
    expect(result).toContain('499');
  });
});

describe('meetsMinimumTier', () => {
  it('free meets free', () => {
    expect(meetsMinimumTier('free', 'free')).toBe(true);
  });

  it('free does not meet plus', () => {
    expect(meetsMinimumTier('free', 'plus')).toBe(false);
  });

  it('plus meets plus', () => {
    expect(meetsMinimumTier('plus', 'plus')).toBe(true);
  });

  it('pro meets plus', () => {
    expect(meetsMinimumTier('pro', 'plus')).toBe(true);
  });

  it('elite meets everything', () => {
    expect(meetsMinimumTier('elite', 'free')).toBe(true);
    expect(meetsMinimumTier('elite', 'plus')).toBe(true);
    expect(meetsMinimumTier('elite', 'pro')).toBe(true);
    expect(meetsMinimumTier('elite', 'elite')).toBe(true);
  });

  it('plus does not meet pro', () => {
    expect(meetsMinimumTier('plus', 'pro')).toBe(false);
  });
});

describe('getTierConfig', () => {
  it('returns config for each tier', () => {
    const tiers: SubscriptionTier[] = ['free', 'plus', 'pro', 'elite'];
    for (const tier of tiers) {
      const config = getTierConfig(tier);
      expect(config).toBeDefined();
      expect(config.name).toBeTruthy();
    }
  });
});
