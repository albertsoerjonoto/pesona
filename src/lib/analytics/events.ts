/**
 * Typed PostHog analytics events for Pesona.
 * Every event name + property shape is defined here
 * so we get compile-time safety when tracking.
 */

export type PesonaEvent =
  | { event: 'signup_completed'; properties: { source: 'tiktok' | 'ig' | 'direct' | 'referral' | 'organic' } }
  | { event: 'onboarding_started'; properties: { source: string } }
  | { event: 'onboarding_step_completed'; properties: { step: number; answer?: string } }
  | { event: 'onboarding_completed'; properties: { concerns: string[]; skin_type: string; budget_band: string } }
  | { event: 'photo_uploaded'; properties: { type: 'morning' | 'evening' | 'checkin'; analysis_success: boolean } }
  | { event: 'routine_generated'; properties: { version: number; product_count: number; total_price_idr: number } }
  | { event: 'routine_step_completed'; properties: { time_of_day: 'morning' | 'evening'; streak_day: number } }
  | { event: 'coach_message_sent'; properties: { message_length: number; tokens?: number; escalated: boolean } }
  | { event: 'escalation_triggered'; properties: { reason: string; trigger_keyword?: string } }
  | { event: 'paywall_shown'; properties: { trigger: 'chat_limit' | 'weekly_report' | 'feature_gate' | 'photo_limit' } }
  | { event: 'paywall_dismissed'; properties: { dismissed_at_tier: string } }
  | { event: 'subscription_started'; properties: { tier: string; price_idr: number; channel: 'web' | 'ios' | 'android' } }
  | { event: 'subscription_canceled'; properties: { tier: string; days_active: number; reason?: string } }
  | { event: 'affiliate_click'; properties: { product_id: string; source: string; destination: string } }
  | { event: 'weekly_report_generated'; properties: { brightness_delta: number; redness_delta: number; breakout_delta: number } }
  | { event: 'weekly_report_opened'; properties: { days_since_report: number } }
  | { event: 'whatsapp_nudge_sent'; properties: { template: string; scheduled_for: string } }
  | { event: 'whatsapp_nudge_clicked'; properties: { template: string; time_to_click_min: number } };

export type PesonaEventName = PesonaEvent['event'];

// Helper to extract properties type for a given event name
export type EventProperties<E extends PesonaEventName> = Extract<
  PesonaEvent,
  { event: E }
>['properties'];
