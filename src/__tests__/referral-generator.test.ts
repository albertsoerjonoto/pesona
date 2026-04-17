import { describe, it, expect } from 'vitest';
import { generateReferralCode } from '@/app/api/referral/route';

/**
 * Tests for the referral code generator.
 * - Always produces exactly 12 chars
 * - Only [A-Z0-9]
 * - Low collision rate at realistic scale
 */

describe('generateReferralCode', () => {
  it('always produces exactly 12 characters', () => {
    for (let i = 0; i < 1000; i++) {
      const code = generateReferralCode();
      expect(code.length).toBe(12);
    }
  });

  it('only contains uppercase alphanumerics', () => {
    const valid = /^[A-Z0-9]{12}$/;
    for (let i = 0; i < 1000; i++) {
      const code = generateReferralCode();
      expect(code).toMatch(valid);
    }
  });

  it('does not pad with a fixed char (no entropy degradation)', () => {
    // If the old impl padded with 'X', last chars would be biased toward 'X'.
    // We assert 'X' is NOT dramatically over-represented in the final position.
    const samples = 10_000;
    const lastCharCounts: Record<string, number> = {};
    for (let i = 0; i < samples; i++) {
      const c = generateReferralCode()[11];
      lastCharCounts[c] = (lastCharCounts[c] || 0) + 1;
    }
    // 36 possible chars, uniform would give ~samples/36 per char.
    // Allow ±3x variance. 'X' appearing >10% would indicate padding bias.
    const xCount = lastCharCounts['X'] || 0;
    expect(xCount / samples).toBeLessThan(0.1);
  });

  it('has high uniqueness over 10k samples', () => {
    const codes = new Set<string>();
    for (let i = 0; i < 10_000; i++) {
      codes.add(generateReferralCode());
    }
    // With 36^12 ≈ 4.7e18 possibilities, 10k samples should be unique.
    expect(codes.size).toBeGreaterThanOrEqual(9_999); // Allow 1 collision as buffer
  });

  it('produces different codes on successive calls', () => {
    const a = generateReferralCode();
    const b = generateReferralCode();
    expect(a).not.toBe(b);
  });
});
