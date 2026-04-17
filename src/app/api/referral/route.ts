import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@/lib/supabase/server';

const CODE_LENGTH = 12;
const MAX_RETRIES = 5;

/**
 * Generate a 12-char uppercase alphanumeric referral code.
 * 36^12 ≈ 4.7×10^18 possibilities — collision-free at realistic scale.
 */
export function generateReferralCode(): string {
  // Gather ≥CODE_LENGTH usable [A-Z0-9] chars. base64url yields [A-Za-z0-9_-];
  // uppercasing folds a-z→A-Z, then the regex strips _ and -. Worst-case a
  // single randomBytes batch is too short, so we loop until pool is big enough.
  // This avoids the low-entropy 'X' padding of the previous implementation.
  let pool = '';
  while (pool.length < CODE_LENGTH) {
    pool += crypto.randomBytes(18).toString('base64url')
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '');
  }
  return pool.slice(0, CODE_LENGTH);
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('referral_code')
    .eq('id', user.id)
    .single();

  if (profile?.referral_code) {
    return NextResponse.json({
      referral_code: profile.referral_code,
      referral_url: `https://pesona.io/?ref=${encodeURIComponent(profile.referral_code)}`,
    });
  }

  // Generate with collision-retry. UNIQUE constraint on referral_code
  // makes this safe; we only loop on 23505 (unique violation).
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const code = generateReferralCode();
    const { error } = await supabase
      .from('profiles')
      .update({ referral_code: code })
      .eq('id', user.id);

    if (!error) {
      return NextResponse.json({
        referral_code: code,
        referral_url: `https://pesona.io/?ref=${encodeURIComponent(code)}`,
      });
    }
    // 23505 = unique_violation; anything else is a real error
    if (error.code !== '23505') {
      console.error('[referral] update failed', error);
      return NextResponse.json({ error: 'Failed to generate code' }, { status: 500 });
    }
    // Collision — loop and retry
  }

  return NextResponse.json(
    { error: 'Failed after max retries' },
    { status: 500 },
  );
}
