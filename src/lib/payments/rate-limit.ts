import 'server-only';

import { createClient } from '@/lib/supabase/server';
import type { SubscriptionTier } from './tiers';
import { TIER_CONFIG } from './tiers';

export type RateLimitAction = 'chat' | 'photo' | 'vision';

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetAt: string;
}

function getLimitForAction(tier: SubscriptionTier, action: RateLimitAction): number {
  const config = TIER_CONFIG[tier];
  switch (action) {
    case 'chat':
      return config.daily_chat_limit;
    case 'photo':
    case 'vision':
      return config.daily_photo_limit;
    default:
      return 3;
  }
}

/**
 * Check and consume a rate limit for a user + action.
 * Uses Supabase to count today's actions.
 */
export async function checkRateLimit(
  userId: string,
  tier: SubscriptionTier,
  action: RateLimitAction,
): Promise<RateLimitResult> {
  const limit = getLimitForAction(tier, action);

  // Unlimited for paid tiers where applicable
  if (limit === Infinity) {
    return { allowed: true, remaining: Infinity, limit: Infinity, resetAt: '' };
  }

  const supabase = await createClient();
  const today = new Date().toISOString().split('T')[0];

  // Count today's usage based on action type
  let count = 0;

  if (action === 'chat') {
    const { count: msgCount } = await supabase
      .from('ai_messages')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('role', 'user')
      .gte('created_at', `${today}T00:00:00+07:00`)
      .lt('created_at', `${today}T23:59:59+07:00`);
    count = msgCount ?? 0;
  } else if (action === 'photo' || action === 'vision') {
    const { count: photoCount } = await supabase
      .from('photo_progress')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', `${today}T00:00:00+07:00`)
      .lt('created_at', `${today}T23:59:59+07:00`);
    count = photoCount ?? 0;
  }

  const remaining = Math.max(0, limit - count);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  return {
    allowed: count < limit,
    remaining,
    limit,
    resetAt: tomorrow.toISOString(),
  };
}

/**
 * Get the user's current subscription tier from the database.
 */
export async function getUserTier(userId: string): Promise<SubscriptionTier> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('subscriptions')
    .select('tier, status, current_period_end')
    .eq('user_id', userId)
    .single();

  if (!data) return 'free';
  if (data.status !== 'active') return 'free';
  if (data.current_period_end && new Date(data.current_period_end) < new Date()) return 'free';

  return (data.tier as SubscriptionTier) || 'free';
}

/**
 * Require a minimum tier for an API route. Throws if insufficient.
 */
export async function requireTier(
  userId: string,
  minimumTier: SubscriptionTier,
): Promise<SubscriptionTier> {
  const userTier = await getUserTier(userId);
  const order: SubscriptionTier[] = ['free', 'plus', 'pro', 'elite'];

  if (order.indexOf(userTier) < order.indexOf(minimumTier)) {
    throw new Error(`Tier ${minimumTier} required, user has ${userTier}`);
  }

  return userTier;
}
