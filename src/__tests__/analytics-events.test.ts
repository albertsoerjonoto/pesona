import { describe, it, expect } from 'vitest';
import type { PesonaEvent, PesonaEventName, EventProperties } from '@/lib/analytics/events';

/**
 * Type-level tests for analytics events.
 * These ensure the typed event system catches incorrect usage at compile time.
 */

describe('Analytics Event Types', () => {
  it('all event names are strings', () => {
    const eventNames: PesonaEventName[] = [
      'signup_completed',
      'onboarding_started',
      'onboarding_step_completed',
      'onboarding_completed',
      'photo_uploaded',
      'routine_generated',
      'routine_step_completed',
      'coach_message_sent',
      'escalation_triggered',
      'paywall_shown',
      'paywall_dismissed',
      'subscription_started',
      'subscription_canceled',
      'affiliate_click',
      'weekly_report_generated',
      'weekly_report_opened',
      'whatsapp_nudge_sent',
      'whatsapp_nudge_clicked',
    ];

    expect(eventNames).toHaveLength(18);
    eventNames.forEach((name) => {
      expect(typeof name).toBe('string');
    });
  });

  it('paywall_shown has correct trigger options', () => {
    const validTriggers: EventProperties<'paywall_shown'>['trigger'][] = [
      'chat_limit',
      'weekly_report',
      'feature_gate',
      'photo_limit',
    ];
    expect(validTriggers).toHaveLength(4);
  });

  it('subscription_started has correct channel options', () => {
    const validChannels: EventProperties<'subscription_started'>['channel'][] = [
      'web',
      'ios',
      'android',
    ];
    expect(validChannels).toHaveLength(3);
  });

  it('photo_uploaded has correct type options', () => {
    const validTypes: EventProperties<'photo_uploaded'>['type'][] = [
      'morning',
      'evening',
      'checkin',
    ];
    expect(validTypes).toHaveLength(3);
  });

  it('event objects are well-formed', () => {
    const event: PesonaEvent = {
      event: 'subscription_started',
      properties: {
        tier: 'plus',
        price_idr: 59_000,
        channel: 'web',
      },
    };

    expect(event.event).toBe('subscription_started');
    expect(event.properties.tier).toBe('plus');
    expect(event.properties.price_idr).toBe(59_000);
  });

  it('onboarding events track concerns and skin type', () => {
    const event: PesonaEvent = {
      event: 'onboarding_completed',
      properties: {
        concerns: ['acne', 'dark_spots'],
        skin_type: 'oily',
        budget_band: '100k_300k',
      },
    };

    expect(event.properties.concerns).toHaveLength(2);
    expect(event.properties.skin_type).toBe('oily');
  });
});
