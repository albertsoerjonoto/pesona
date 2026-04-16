import { NextRequest, NextResponse } from 'next/server';
import { queueNudges, isCronAuthorized } from '@/lib/cron/queue-nudges';

export async function GET(req: NextRequest) {
  if (!isCronAuthorized(req.headers.get('authorization'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await queueNudges('pesona_morning_routine');
    return NextResponse.json(result);
  } catch (err) {
    console.error('[cron/morning-nudge]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed' },
      { status: 500 },
    );
  }
}
