-- Prevent duplicate WhatsApp nudges for the same user+template on the same day.
-- The cron routes previously used check-then-insert, which is racy under
-- concurrent invocations. This unique index + ON CONFLICT DO NOTHING in code
-- makes dedup authoritative at the database layer.
--
-- Uses date_trunc('day', created_at AT TIME ZONE 'Asia/Jakarta') so the
-- day boundary aligns with WIB rather than UTC.

CREATE UNIQUE INDEX IF NOT EXISTS idx_notif_user_template_day
  ON notifications_queue (
    user_id,
    template,
    (date_trunc('day', (created_at AT TIME ZONE 'Asia/Jakarta')::timestamp))
  );
