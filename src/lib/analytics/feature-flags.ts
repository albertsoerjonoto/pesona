'use client';

import { posthog } from './posthog-client';

/**
 * Feature flag helpers for A/B testing via PostHog.
 *
 * Usage:
 *   const variant = useFeatureFlag('paywall-copy-v2');
 *   if (variant === 'control') return <OldCopy />;
 *   if (variant === 'treatment') return <NewCopy />;
 *
 * Define flags in PostHog → Feature Flags. Use string multivariate
 * flags for A/B tests and boolean flags for simple gates.
 */

import { useEffect, useState } from 'react';

export type FlagValue = boolean | string | undefined;

/**
 * Hook to read a PostHog feature flag.
 * Returns undefined until PostHog finishes loading flags, then the value.
 */
export function useFeatureFlag(flagKey: string): FlagValue {
  const [value, setValue] = useState<FlagValue>(() => {
    // Initialize synchronously from PostHog if flags are already loaded.
    // Returns undefined during SSR and on first paint when flags aren't ready.
    if (typeof window === 'undefined') return undefined;
    return posthog.getFeatureFlag(flagKey);
  });

  useEffect(() => {
    // Subscribe to flag updates. This will fire once flags finish loading
    // (possibly after mount), and again on any server-push changes.
    const unsubscribe = posthog.onFeatureFlags(() => {
      setValue(posthog.getFeatureFlag(flagKey));
    });

    return () => {
      // posthog.onFeatureFlags returns an unsubscribe function in newer versions
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [flagKey]);

  return value;
}

/**
 * Synchronous variant for non-React code. Returns undefined
 * if flags haven't loaded yet.
 */
export function getFeatureFlag(flagKey: string): FlagValue {
  if (typeof window === 'undefined') return undefined;
  return posthog.getFeatureFlag(flagKey);
}

/**
 * Track a feature flag exposure event explicitly (PostHog auto-tracks
 * this when getFeatureFlag is called, but you can call manually for
 * better control).
 */
export function trackFlagExposure(flagKey: string) {
  if (typeof window === 'undefined') return;
  posthog.capture('$feature_flag_called', {
    $feature_flag: flagKey,
    $feature_flag_response: posthog.getFeatureFlag(flagKey),
  });
}

/**
 * Known feature flags for Pesona. Use these typed constants
 * instead of raw strings to catch typos at compile time.
 */
export const FLAGS = {
  PAYWALL_COPY_V2: 'paywall-copy-v2',
  ONBOARDING_QUIZ_LENGTH: 'onboarding-quiz-length',
  PRICING_DISPLAY: 'pricing-display-variant',
  REFERRAL_INCENTIVE: 'referral-incentive-amount',
} as const;

export type FlagKey = (typeof FLAGS)[keyof typeof FLAGS];
