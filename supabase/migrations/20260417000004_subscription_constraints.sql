-- Harden subscriptions schema with CHECK constraints.
-- These prevent typos or invalid values from being inserted by
-- the service role (our server code) or from misapplied migrations.

-- Drop any prior versions of these constraints so this migration is idempotent.
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_tier_check;
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_status_check;
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_billing_period_check;

ALTER TABLE subscriptions
  ADD CONSTRAINT subscriptions_tier_check
  CHECK (tier IN ('free', 'plus', 'pro', 'elite'));

ALTER TABLE subscriptions
  ADD CONSTRAINT subscriptions_status_check
  CHECK (status IN ('active', 'pending', 'failed', 'canceled', 'fraud_review'));

ALTER TABLE subscriptions
  ADD CONSTRAINT subscriptions_billing_period_check
  CHECK (billing_period IN ('monthly', 'annual'));
