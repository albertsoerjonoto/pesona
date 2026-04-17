-- Add phone column to profiles (for WhatsApp nudges)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone text;

-- Notifications queue for WhatsApp/email delivery
CREATE TABLE IF NOT EXISTS notifications_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel text NOT NULL,          -- 'whatsapp' | 'email' | 'push'
  template text NOT NULL,         -- template identifier
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  scheduled_for timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz,
  status text NOT NULL DEFAULT 'pending', -- 'pending' | 'sent' | 'failed'
  error_message text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications_queue ENABLE ROW LEVEL SECURITY;

-- Users can read their own queued notifications; only service role writes
DO $$ BEGIN
  CREATE POLICY "own_notifications_read" ON notifications_queue FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_notif_pending ON notifications_queue (status, scheduled_for)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_notif_user_template ON notifications_queue (user_id, template, scheduled_for DESC);
