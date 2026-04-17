-- Add referral_code to profiles for referral program
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referral_code text UNIQUE;

-- Generate referral codes for existing users (8 char alphanumeric)
UPDATE profiles SET referral_code = upper(substr(md5(random()::text), 1, 8))
WHERE referral_code IS NULL;

-- Referral tracking table
CREATE TABLE IF NOT EXISTS referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  referral_code text NOT NULL,
  status text DEFAULT 'pending',
  reward_granted boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "own_referrals_read" ON referrals FOR SELECT USING (auth.uid() = referrer_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals (referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals (referrer_id);
