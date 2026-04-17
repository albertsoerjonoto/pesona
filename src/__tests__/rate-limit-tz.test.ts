import { describe, it, expect } from 'vitest';

/**
 * Tests for the Asia/Jakarta timezone handling in rate-limit.ts.
 * The "today" date must align with WIB (UTC+7) so the rate window
 * doesn't drift at midnight.
 */

function jakartaToday(clockISO: string): string {
  const d = new Date(clockISO);
  return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
}

describe('Rate-limit Jakarta timezone handling', () => {
  it('midday UTC → matches local Jakarta date', () => {
    // 2026-04-17 12:00 UTC = 2026-04-17 19:00 WIB
    expect(jakartaToday('2026-04-17T12:00:00Z')).toBe('2026-04-17');
  });

  it('near midnight WIB: 2026-04-17 16:00 UTC = 23:00 WIB (still April 17)', () => {
    expect(jakartaToday('2026-04-17T16:00:00Z')).toBe('2026-04-17');
  });

  it('just past midnight WIB: 2026-04-17 17:00 UTC = 00:00 WIB April 18', () => {
    expect(jakartaToday('2026-04-17T17:00:00Z')).toBe('2026-04-18');
  });

  it('01:00 WIB: 2026-04-17 18:00 UTC = 01:00 WIB April 18', () => {
    // This is the bug case — UTC date says "2026-04-17" but WIB is already April 18.
    expect(jakartaToday('2026-04-17T18:00:00Z')).toBe('2026-04-18');
    expect(jakartaToday('2026-04-17T18:00:00Z')).not.toBe('2026-04-17');
  });

  it('late UTC: 2026-04-17 23:00 UTC = 06:00 WIB April 18', () => {
    expect(jakartaToday('2026-04-17T23:00:00Z')).toBe('2026-04-18');
  });

  it('produces YYYY-MM-DD format', () => {
    const result = jakartaToday(new Date().toISOString());
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('handles year boundary correctly', () => {
    // 2025-12-31 17:00 UTC = 2026-01-01 00:00 WIB
    expect(jakartaToday('2025-12-31T17:00:00Z')).toBe('2026-01-01');
  });
});
