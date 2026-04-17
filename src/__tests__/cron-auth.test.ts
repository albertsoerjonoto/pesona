import { describe, it, expect, afterAll } from 'vitest';
import { isCronAuthorized } from '@/lib/cron/auth';

/**
 * Tests for cron route authorization logic — imports the production
 * implementation directly so tests catch any drift.
 */

const TEST_SECRET = 'test-cron-secret-12345';
const ORIGINAL_SECRET = process.env.CRON_SECRET;

// Test helper: set the env var and call the prod function.
function call(authHeader: string | null, secret: string | undefined): boolean {
  if (secret === undefined) delete process.env.CRON_SECRET;
  else process.env.CRON_SECRET = secret;
  return isCronAuthorized(authHeader);
}

describe('Cron authorization (prod impl)', () => {
  afterAll(() => {
    if (ORIGINAL_SECRET === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = ORIGINAL_SECRET;
  });

  it('rejects missing auth header', () => {
    expect(call(null, TEST_SECRET)).toBe(false);
  });

  it('rejects empty auth header', () => {
    expect(call('', TEST_SECRET)).toBe(false);
  });

  it('rejects wrong scheme', () => {
    expect(call(`Basic ${TEST_SECRET}`, TEST_SECRET)).toBe(false);
  });

  it('rejects wrong token', () => {
    expect(call('Bearer wrong-secret', TEST_SECRET)).toBe(false);
  });

  it('rejects partial match (attacker truncates)', () => {
    expect(call(`Bearer ${TEST_SECRET.slice(0, 10)}`, TEST_SECRET)).toBe(false);
  });

  it('rejects when no secret is configured', () => {
    expect(call(`Bearer ${TEST_SECRET}`, undefined)).toBe(false);
    expect(call(`Bearer ${TEST_SECRET}`, '')).toBe(false);
  });

  it('accepts correct secret', () => {
    expect(call(`Bearer ${TEST_SECRET}`, TEST_SECRET)).toBe(true);
  });

  it('is case-sensitive (bearer vs Bearer)', () => {
    expect(call(`bearer ${TEST_SECRET}`, TEST_SECRET)).toBe(false);
    expect(call(`BEARER ${TEST_SECRET}`, TEST_SECRET)).toBe(false);
  });

  it('rejects trailing whitespace', () => {
    expect(call(`Bearer ${TEST_SECRET} `, TEST_SECRET)).toBe(false);
  });
});
