/**
 * Subscription tier definitions and gating logic for Pesona.
 * Free: 3 chats/day, 1 photo/week
 * Plus: unlimited chat, 3 photos/day, weekly report
 * Pro: everything + advanced analysis
 * Elite: everything + derm consult (future)
 */

export type SubscriptionTier = 'free' | 'plus' | 'pro' | 'elite';

/**
 * Canonical tier order (lowest to highest). Used for comparisons,
 * gating, and downgrade checks. DO NOT redefine this elsewhere.
 */
export const TIER_ORDER: readonly SubscriptionTier[] = ['free', 'plus', 'pro', 'elite'] as const;

/**
 * Canonical subscription status values. Keep in sync with the
 * CHECK constraint in migration 20260417000004.
 */
export const SUBSCRIPTION_STATUSES = ['active', 'pending', 'failed', 'canceled', 'fraud_review'] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

export interface TierConfig {
  name: string;
  nameBahasa: string;
  price_idr: number;
  annual_price_idr: number;
  daily_chat_limit: number;
  daily_photo_limit: number;
  weekly_report: boolean;
  advanced_analysis: boolean;
  priority_response: boolean;
  derm_consult: boolean;
}

export const TIER_CONFIG: Record<SubscriptionTier, TierConfig> = {
  free: {
    name: 'Pesona Coba',
    nameBahasa: 'Pesona Coba',
    price_idr: 0,
    annual_price_idr: 0,
    daily_chat_limit: 3,
    daily_photo_limit: 1,
    weekly_report: false,
    advanced_analysis: false,
    priority_response: false,
    derm_consult: false,
  },
  plus: {
    name: 'Pesona Plus',
    nameBahasa: 'Pesona Plus',
    price_idr: 59_000,
    annual_price_idr: 590_000,
    daily_chat_limit: Infinity,
    daily_photo_limit: 3,
    weekly_report: true,
    advanced_analysis: false,
    priority_response: false,
    derm_consult: false,
  },
  pro: {
    name: 'Pesona Pro',
    nameBahasa: 'Pesona Pro',
    price_idr: 179_000,
    annual_price_idr: 1_790_000,
    daily_chat_limit: Infinity,
    daily_photo_limit: Infinity,
    weekly_report: true,
    advanced_analysis: true,
    priority_response: true,
    derm_consult: false,
  },
  elite: {
    name: 'Pesona Glow',
    nameBahasa: 'Pesona Glow',
    price_idr: 499_000,
    annual_price_idr: 4_990_000,
    daily_chat_limit: Infinity,
    daily_photo_limit: Infinity,
    weekly_report: true,
    advanced_analysis: true,
    priority_response: true,
    derm_consult: true,
  },
};

export function formatPriceIDR(amount: number): string {
  if (amount === 0) return 'Gratis';
  return `Rp ${amount.toLocaleString('id-ID')}`;
}

/**
 * Check if a user's tier meets the required tier level.
 */
export function meetsMinimumTier(
  userTier: SubscriptionTier,
  requiredTier: SubscriptionTier,
): boolean {
  return TIER_ORDER.indexOf(userTier) >= TIER_ORDER.indexOf(requiredTier);
}

/**
 * Get the user's tier config.
 */
export function getTierConfig(tier: SubscriptionTier): TierConfig {
  return TIER_CONFIG[tier];
}
