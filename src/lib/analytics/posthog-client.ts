'use client';

import posthog from 'posthog-js';
import type { PesonaEventName, EventProperties } from './events';

let initialized = false;

export function initPostHog() {
  if (initialized) return;
  if (typeof window === 'undefined') return;

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;
  if (!key) return;

  posthog.init(key, {
    api_host: host || 'https://us.i.posthog.com',
    person_profiles: 'identified_only',
    capture_pageview: true,
    capture_pageleave: true,
    autocapture: false,
    persistence: 'localStorage+cookie',
  });

  initialized = true;
}

/**
 * Type-safe event tracking.
 * Usage: trackEvent('paywall_shown', { trigger: 'chat_limit' })
 */
export function trackEvent<E extends PesonaEventName>(
  event: E,
  properties: EventProperties<E>,
) {
  if (typeof window === 'undefined') return;
  if (!initialized) initPostHog();
  posthog.capture(event, properties);
}

export function identifyUser(userId: string, traits?: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  if (!initialized) initPostHog();
  posthog.identify(userId, traits);
}

export function resetUser() {
  if (typeof window === 'undefined') return;
  posthog.reset();
}

export { posthog };
