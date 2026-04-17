import 'server-only';
import { createClient as createServerClient } from '@supabase/supabase-js';
import type { WatiTemplate } from '@/lib/whatsapp/wati';

// Re-export cron auth so existing routes keep working.
export { isCronAuthorized } from './auth';

/**
 * Queue WhatsApp nudges for all users with phone numbers.
 *
 * Idempotent at the database layer: a unique index on
 * (user_id, template, day-in-WIB) prevents duplicate inserts.
 * Concurrent cron runs can both attempt to insert — the second
 * write gets rejected by the constraint and we ignore it.
 */
export async function queueNudges(template: WatiTemplate): Promise<{
  queued: number;
  skipped: number;
}> {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // Get users with phone numbers
  const { data: users, error: usersError } = await supabase
    .from('profiles')
    .select('id, display_name, phone')
    .not('phone', 'is', null);

  if (usersError) {
    throw new Error(`Failed to fetch users: ${usersError.message}`);
  }

  if (!users || users.length === 0) {
    return { queued: 0, skipped: 0 };
  }

  const now = new Date().toISOString();
  const nudges = users
    .filter((u) => u.phone)
    .map((u) => ({
      user_id: u.id,
      channel: 'whatsapp',
      template,
      payload: { name: u.display_name || 'kamu' },
      scheduled_for: now,
      status: 'pending',
    }));

  if (nudges.length === 0) {
    return { queued: 0, skipped: 0 };
  }

  // Bulk upsert with ignoreDuplicates=true. The unique constraint on
  // (user_id, template, scheduled_day) dedupes at the DB layer — concurrent
  // cron runs can both attempt this insert; Postgres ON CONFLICT DO NOTHING
  // silently skips rows that would collide. Single round-trip for N users.
  const { data: inserted, error: insertError } = await supabase
    .from('notifications_queue')
    .upsert(nudges, {
      onConflict: 'user_id,template,scheduled_day',
      ignoreDuplicates: true,
    })
    .select('id');

  if (insertError) {
    throw new Error(`Failed to queue nudges: ${insertError.message}`);
  }

  const queued = inserted?.length ?? 0;
  const skipped = nudges.length - queued;

  return { queued, skipped };
}

