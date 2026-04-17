import { NextRequest, NextResponse } from 'next/server';
import { queueNudges, isCronAuthorized } from '@/lib/cron/queue-nudges';

export async function GET(req: NextRequest) {
  if (!isCronAuthorized(req.headers.get('authorization'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await queueNudges('pesona_weekly_checkin');
    return NextResponse.json(result);
  } catch (err) {
    // Log internally but don't leak details to the (trusted) cron caller.
    console.error('[cron/weekly-checkin]', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
