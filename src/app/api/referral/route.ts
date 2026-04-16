import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

  if (!profile?.referral_code) {
    // Generate one
    const code = user.id.slice(0, 8).toUpperCase();
    await supabase.from('profiles').update({ referral_code: code }).eq('id', user.id);
    return NextResponse.json({ referral_code: code, referral_url: `https://pesona.io/?ref=${code}` });
  }

  return NextResponse.json({
    referral_code: profile.referral_code,
    referral_url: `https://pesona.io/?ref=${profile.referral_code}`,
  });
}
