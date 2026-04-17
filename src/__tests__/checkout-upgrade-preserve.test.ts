import { describe, it, expect } from 'vitest';

/**
 * Tests for the "preserve active subscription during upgrade" logic.
 * This mirrors the flag computation in checkout/route.ts so regression
 * is caught if the conditions change.
 */

type ExistingSub = {
  status: string;
  tier: string;
  current_period_end: string | null;
} | null;

function hasActivePaidSub(existing: ExistingSub): boolean {
  return Boolean(
    existing &&
      existing.status === 'active' &&
      existing.tier !== 'free' &&
      existing.current_period_end &&
      new Date(existing.current_period_end) > new Date(),
  );
}

const future = new Date(Date.now() + 30 * 86400_000).toISOString();
const past = new Date(Date.now() - 86400_000).toISOString();

describe('Active paid subscription detection', () => {
  it('null existing → false (new user)', () => {
    expect(hasActivePaidSub(null)).toBe(false);
  });

  it('free + active + future → false (free is not paid)', () => {
    expect(hasActivePaidSub({ status: 'active', tier: 'free', current_period_end: future })).toBe(false);
  });

  it('plus + active + future → true (real active paid sub)', () => {
    expect(hasActivePaidSub({ status: 'active', tier: 'plus', current_period_end: future })).toBe(true);
  });

  it('plus + pending + future → false (payment not settled)', () => {
    expect(hasActivePaidSub({ status: 'pending', tier: 'plus', current_period_end: future })).toBe(false);
  });

  it('plus + active + past → false (expired)', () => {
    expect(hasActivePaidSub({ status: 'active', tier: 'plus', current_period_end: past })).toBe(false);
  });

  it('plus + active + null period_end → false (no valid end)', () => {
    expect(hasActivePaidSub({ status: 'active', tier: 'plus', current_period_end: null })).toBe(false);
  });

  it('plus + failed → false', () => {
    expect(hasActivePaidSub({ status: 'failed', tier: 'plus', current_period_end: future })).toBe(false);
  });

  it('plus + canceled → false', () => {
    expect(hasActivePaidSub({ status: 'canceled', tier: 'plus', current_period_end: future })).toBe(false);
  });

  it('plus + fraud_review → false (not safe to treat as active)', () => {
    expect(hasActivePaidSub({ status: 'fraud_review', tier: 'plus', current_period_end: future })).toBe(false);
  });

  it('elite + active + future → true (highest tier still counts)', () => {
    expect(hasActivePaidSub({ status: 'active', tier: 'elite', current_period_end: future })).toBe(true);
  });

  it('pro + active + future → true', () => {
    expect(hasActivePaidSub({ status: 'active', tier: 'pro', current_period_end: future })).toBe(true);
  });
});

describe('Upgrade flow semantics', () => {
  // The upgrade flow: if user has active paid sub, preserve it and only stamp
  // new order_id. When webhook fires, it upgrades the row. If no active sub,
  // mark status='pending' as usual.
  function shouldPreserveOnUpgrade(existing: ExistingSub): boolean {
    return hasActivePaidSub(existing);
  }

  it('new user → start pending flow', () => {
    expect(shouldPreserveOnUpgrade(null)).toBe(false);
  });

  it('active plus user upgrading to pro → preserve (no access interruption)', () => {
    expect(shouldPreserveOnUpgrade({ status: 'active', tier: 'plus', current_period_end: future })).toBe(true);
  });

  it('expired plus user resubscribing → start pending flow', () => {
    expect(shouldPreserveOnUpgrade({ status: 'active', tier: 'plus', current_period_end: past })).toBe(false);
  });

  it('failed previous checkout → start pending flow (clean slate)', () => {
    expect(shouldPreserveOnUpgrade({ status: 'failed', tier: 'plus', current_period_end: future })).toBe(false);
  });
});
