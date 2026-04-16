import { describe, it, expect } from 'vitest';

/**
 * Tests for cron route authorization logic.
 */

function isCronAuthorized(authHeader: string | null, secret: string | undefined): boolean {
  if (!secret) return false;
  return authHeader === `Bearer ${secret}`;
}

describe('Cron authorization', () => {
  const TEST_SECRET = 'test-cron-secret-12345';

  it('rejects missing auth header', () => {
    expect(isCronAuthorized(null, TEST_SECRET)).toBe(false);
  });

  it('rejects empty auth header', () => {
    expect(isCronAuthorized('', TEST_SECRET)).toBe(false);
  });

  it('rejects wrong scheme', () => {
    expect(isCronAuthorized(`Basic ${TEST_SECRET}`, TEST_SECRET)).toBe(false);
  });

  it('rejects wrong token', () => {
    expect(isCronAuthorized('Bearer wrong-secret', TEST_SECRET)).toBe(false);
  });

  it('rejects partial match (attacker truncates)', () => {
    expect(isCronAuthorized(`Bearer ${TEST_SECRET.slice(0, 10)}`, TEST_SECRET)).toBe(false);
  });

  it('rejects when no secret is configured', () => {
    expect(isCronAuthorized(`Bearer ${TEST_SECRET}`, undefined)).toBe(false);
    expect(isCronAuthorized(`Bearer ${TEST_SECRET}`, '')).toBe(false);
  });

  it('accepts correct secret', () => {
    expect(isCronAuthorized(`Bearer ${TEST_SECRET}`, TEST_SECRET)).toBe(true);
  });

  it('is case-sensitive (bearer vs Bearer)', () => {
    expect(isCronAuthorized(`bearer ${TEST_SECRET}`, TEST_SECRET)).toBe(false);
    expect(isCronAuthorized(`BEARER ${TEST_SECRET}`, TEST_SECRET)).toBe(false);
  });

  it('rejects trailing whitespace', () => {
    expect(isCronAuthorized(`Bearer ${TEST_SECRET} `, TEST_SECRET)).toBe(false);
  });
});
