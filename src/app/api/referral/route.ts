import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@/lib/supabase/server';

const CODE_LENGTH = 12;
const MAX_RETRIES = 5;

/**
 * Generate a 12-char uppercase alphanumeric referral code.
 * 36^12 ≈ 4.7×10^18 possibilities — collision-free at realistic scale.
 */
function generateReferralCode(): string {
  // 9 random bytes → ~12.6 base36 chars. Slice to 12.
  return crypto.randomBytes(9).toString('base64url')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, CODE_LENGTH)
    .padEnd(CODE_LENGTH, 'X');
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
      referral_url: `https://pesona.io/?ref=${profile.referral_code}`,
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
        referral_url: `https://pesona.io/?ref=${code}`,
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
