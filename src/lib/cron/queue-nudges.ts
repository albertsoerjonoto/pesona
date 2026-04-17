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

  // Try to insert each nudge individually; the unique index rejects duplicates.
  // We count inserts vs. rejections. Supabase-JS doesn't expose ON CONFLICT DO
  // NOTHING directly in insert(), so we emulate via individual inserts with
  // error suppression. Supabase dedupes by (user_id, template, day-WIB).
  let queued = 0;
  let skipped = 0;
  for (const nudge of nudges) {
    const { error } = await supabase.from('notifications_queue').insert(nudge);
    if (error) {
      // Unique violation = already queued today for this user+template
      if (error.code === '23505') {
        skipped++;
      } else {
        console.error('[queueNudges] insert failed', nudge.user_id, error);
      }
    } else {
      queued++;
    }
  }

  return { queued, skipped };
}

