-- Subscriptions table for Pesona tier management
CREATE TABLE IF NOT EXISTS subscriptions (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tier text NOT NULL DEFAULT 'free',
  status text NOT NULL DEFAULT 'active',
  billing_period text DEFAULT 'monthly',
  price_idr integer DEFAULT 0,
  midtrans_order_id text,
  midtrans_transaction_id text,
  started_at timestamptz,
  current_period_end timestamptz,
  canceled_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can read their own subscription
DO $$ BEGIN
  CREATE POLICY "own_sub_read" ON subscriptions FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Only server can insert/update (via service role)
-- No insert/update policy for anon — webhooks use service role

-- Index
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions (status) WHERE status = 'active';

-- Updated_at trigger (reuse existing function if available)
CREATE OR REPLACE FUNCTION touch_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER t_subscriptions BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
