import 'server-only';
import { createClient as createServerClient } from '@supabase/supabase-js';
import type { WatiTemplate } from '@/lib/whatsapp/wati';

/**
 * Queue WhatsApp nudges for all users with phone numbers.
 * Idempotent: will not queue a second nudge with the same template
 * for the same user on the same day.
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

  // Check existing nudges for today to avoid duplicates
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const userIds = users.map((u) => u.id);
  const { data: existingNudges } = await supabase
    .from('notifications_queue')
    .select('user_id')
    .eq('template', template)
    .gte('created_at', todayStart.toISOString())
    .in('user_id', userIds);

  const alreadyQueued = new Set((existingNudges || []).map((n) => n.user_id));

  const now = new Date().toISOString();
  const nudges = users
    .filter((u) => u.phone && !alreadyQueued.has(u.id))
    .map((u) => ({
      user_id: u.id,
      channel: 'whatsapp',
      template,
      payload: { name: u.display_name || 'kamu' },
      scheduled_for: now,
      status: 'pending',
    }));

  if (nudges.length > 0) {
    const { error: insertError } = await supabase
      .from('notifications_queue')
      .insert(nudges);
    if (insertError) {
      throw new Error(`Failed to queue nudges: ${insertError.message}`);
    }
  }

  return {
    queued: nudges.length,
    skipped: alreadyQueued.size,
  };
}

/**
 * Verify a cron request has the correct auth header.
 */
export function isCronAuthorized(authHeader: string | null): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return authHeader === `Bearer ${secret}`;
}
