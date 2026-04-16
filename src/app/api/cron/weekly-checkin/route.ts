import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@supabase/supabase-js';

function getServiceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getServiceClient();

  // Get users who have active routines and phone numbers
  const { data: users } = await supabase
    .from('profiles')
    .select('id, display_name, phone')
    .not('phone', 'is', null);

  // Queue weekly check-in nudges
  const now = new Date().toISOString();
  const nudges = (users || [])
    .filter(u => u.phone)
    .map(u => ({
      user_id: u.id,
      channel: 'whatsapp',
      template: 'pesona_weekly_checkin',
      payload: { name: u.display_name || 'kamu' },
      scheduled_for: now,
      status: 'pending',
    }));

  if (nudges.length > 0) {
    await supabase.from('notifications_queue').insert(nudges);
  }

  return NextResponse.json({ queued: nudges.length });
}
