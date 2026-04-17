import { describe, it, expect } from 'vitest';
import { TIER_CONFIG } from '@/lib/payments/tiers';

/**
 * Rate-limiting tests.
 * The actual checkRateLimit uses Supabase; here we test the
 * tier-to-limit mapping and the decision logic.
 */

type RateLimitAction = 'chat' | 'photo' | 'vision';

function getLimitForAction(tier: keyof typeof TIER_CONFIG, action: RateLimitAction): number {
  const config = TIER_CONFIG[tier];
  if (action === 'chat') return config.daily_chat_limit;
  return config.daily_photo_limit;
}

function decide(tier: keyof typeof TIER_CONFIG, action: RateLimitAction, usedToday: number) {
  const limit = getLimitForAction(tier, action);
  if (limit === Infinity) {
    return { allowed: true, remaining: Infinity, limit: Infinity };
  }
  return {
    allowed: usedToday < limit,
    remaining: Math.max(0, limit - usedToday),
    limit,
  };
}

describe('Rate limit — Free tier', () => {
  it('allows first chat message', () => {
    expect(decide('free', 'chat', 0).allowed).toBe(true);
  });

  it('allows 3rd chat message (0-indexed counting)', () => {
    expect(decide('free', 'chat', 2).allowed).toBe(true);
  });

  it('blocks 4th chat message', () => {
    expect(decide('free', 'chat', 3).allowed).toBe(false);
  });

  it('reports remaining correctly', () => {
    expect(decide('free', 'chat', 1).remaining).toBe(2);
    expect(decide('free', 'chat', 3).remaining).toBe(0);
    expect(decide('free', 'chat', 10).remaining).toBe(0); // never negative
  });

  it('allows 1 photo per day', () => {
    expect(decide('free', 'photo', 0).allowed).toBe(true);
    expect(decide('free', 'photo', 1).allowed).toBe(false);
  });
});

describe('Rate limit — Plus tier', () => {
  it('has unlimited chat', () => {
    expect(decide('plus', 'chat', 0).allowed).toBe(true);
    expect(decide('plus', 'chat', 100).allowed).toBe(true);
    expect(decide('plus', 'chat', 10000).allowed).toBe(true);
  });

  it('reports Infinity remaining for unlimited', () => {
    expect(decide('plus', 'chat', 50).remaining).toBe(Infinity);
  });

  it('has 3 photos per day', () => {
    expect(decide('plus', 'photo', 2).allowed).toBe(true);
    expect(decide('plus', 'photo', 3).allowed).toBe(false);
  });
});

describe('Rate limit — Pro tier', () => {
  it('has unlimited everything', () => {
    expect(decide('pro', 'chat', 1000).allowed).toBe(true);
    expect(decide('pro', 'photo', 1000).allowed).toBe(true);
    expect(decide('pro', 'vision', 1000).allowed).toBe(true);
  });
});

describe('Rate limit — Elite tier', () => {
  it('has unlimited everything', () => {
    expect(decide('elite', 'chat', 1000).allowed).toBe(true);
    expect(decide('elite', 'photo', 1000).allowed).toBe(true);
  });
});

describe('Rate limit edge cases', () => {
  it('handles negative used count defensively (still allows)', () => {
    const result = decide('free', 'chat', -5);
    // With negative input, remaining is bigger than limit (nonsensical),
    // but at least we don't block — fails open for the user.
    expect(result.allowed).toBe(true);
  });

  it('vision action uses photo limit', () => {
    expect(decide('free', 'vision', 0).allowed).toBe(true);
    expect(decide('free', 'vision', 1).allowed).toBe(false);
  });
});
