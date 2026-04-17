import { describe, it, expect } from 'vitest';
import { decideWebhookState } from '@/lib/payments/webhook-logic';
import type { PesonaEvent } from '@/lib/analytics/events';

/**
 * Ensures the webhook analytics events for terminal states
 * (subscription_fraud_review, subscription_failed) are defined
 * in the typed event registry and match the shape the route emits.
 */

describe('Webhook terminal state analytics', () => {
  it('subscription_fraud_review event is typed with tier + order_id', () => {
    // Ensures the event exists in the typed union — would fail to compile otherwise.
    const e: PesonaEvent = {
      event: 'subscription_fraud_review',
      properties: { tier: 'plus', order_id: 'pesona-plus-abc-123' },
    };
    expect(e.event).toBe('subscription_fraud_review');
  });

  it('subscription_failed event carries reason', () => {
    const e: PesonaEvent = {
      event: 'subscription_failed',
      properties: {
        tier: 'pro',
        order_id: 'pesona-pro-xyz-456',
        reason: 'deny',
      },
    };
    expect(e.properties.reason).toBe('deny');
  });

  it('decideWebhookState → fraud_review for capture+challenge', () => {
    expect(decideWebhookState('pending', 'capture', 'challenge')).toBe('fraud_review');
  });

  it('decideWebhookState → failed for deny, cancel, expire (all emit event)', () => {
    expect(decideWebhookState('pending', 'deny')).toBe('failed');
    expect(decideWebhookState('pending', 'cancel')).toBe('failed');
    expect(decideWebhookState('pending', 'expire')).toBe('failed');
  });

  it('already-processed settlements do NOT re-emit event (idempotency)', () => {
    expect(decideWebhookState('active', 'settlement')).toBe('already_processed');
    expect(decideWebhookState('active', 'capture', 'accept')).toBe('already_processed');
  });

  it('previously-failed order can re-activate on retry settlement', () => {
    // Edge case: user retries failed payment, it settles. We allow re-activation.
    expect(decideWebhookState('failed', 'settlement')).toBe('active');
  });

  it('pending → pending (no state change, no event)', () => {
    expect(decideWebhookState('pending', 'pending')).toBe('pending');
  });
});
