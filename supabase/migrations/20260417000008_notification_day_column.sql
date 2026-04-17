-- Add a generated scheduled_day column so we can use ON CONFLICT with Supabase-JS
-- (which addresses conflict targets by column name, not expression).
-- Replaces the expression-based unique index from migration 20260417000005.
--
-- Day is computed in Asia/Jakarta timezone so the boundary aligns with WIB
-- (same semantics as the previous expression-based index).

-- Drop the expression-based index — it was unique but Supabase-JS can't
-- target it for ON CONFLICT DO NOTHING via the onConflict parameter.
DROP INDEX IF EXISTS idx_notif_user_template_day;

-- Add a generated column with the WIB day.
ALTER TABLE notifications_queue
  ADD COLUMN IF NOT EXISTS scheduled_day date
  GENERATED ALWAYS AS (
    ((created_at AT TIME ZONE 'Asia/Jakarta')::date)
  ) STORED;

-- Unique constraint — addressable by column name from Supabase-JS.
DO $$ BEGIN
  ALTER TABLE notifications_queue
    ADD CONSTRAINT notifications_queue_user_template_day_key
    UNIQUE (user_id, template, scheduled_day);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
