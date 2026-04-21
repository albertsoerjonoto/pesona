import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@/lib/supabase/server';
import { createSnapTransaction } from '@/lib/payments/midtrans';
import { TIER_CONFIG, TIER_ORDER, type SubscriptionTier } from '@/lib/payments/tiers';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: { tier?: string; period?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const tier = body.tier as SubscriptionTier | undefined;
    const period = (body.period === 'annual' ? 'annual' : 'monthly') as 'monthly' | 'annual';

    if (!tier || !TIER_CONFIG[tier] || tier === 'free') {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
    }

    // Don't allow downgrading an active paid subscription via a new checkout
    const { data: existing } = await supabase
      .from('subscriptions')
      .select('tier, status, current_period_end')
      .eq('user_id', user.id)
      .maybeSingle();

    if (
      existing &&
      existing.status === 'active' &&
      existing.tier !== 'free' &&
      existing.current_period_end &&
      new Date(existing.current_period_end) > new Date()
    ) {
      if (TIER_ORDER.indexOf(tier) < TIER_ORDER.indexOf(existing.tier as SubscriptionTier)) {
        return NextResponse.json(
          { error: 'Cannot downgrade active subscription' },
          { status: 409 },
        );
      }
    }

    const config = TIER_CONFIG[tier];
    const amount = period === 'annual' ? config.annual_price_idr : config.price_idr;
    // Include a random suffix so two clicks in the same millisecond don't
    // produce the same orderId. 8 hex chars = 4 bytes of entropy.
    const uniqueSuffix = crypto.randomBytes(4).toString('hex');
    const orderId = `pesona-${tier}-${user.id.slice(0, 8)}-${Date.now()}-${uniqueSuffix}`;

    // Get user profile for customer details. Use maybeSingle to return null
    // cleanly rather than throwing on missing row (new user, race, etc.).
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name, email')
      .eq('id', user.id)
      .maybeSingle();

    const snap = await createSnapTransaction({
      order_id: orderId,
      gross_amount: amount,
      customer_name: profile?.display_name || user.email?.split('@')[0] || 'User',
      customer_email: user.email || '',
      item_name: `${config.nameBahasa} (${period === 'annual' ? 'Tahunan' : 'Bulanan'})`,
    });

    // Preserve an active subscription during upgrade flow: only overwrite
    // tier/status/billing_period/price_idr when there is NO currently-active
    // paid subscription. For active users, we only record the pending order_id
    // so the webhook can still look up the row by order_id and apply the upgrade
    // when Midtrans confirms payment — without revoking access in the interim.
    const hasActivePaidSub =
      existing &&
      existing.status === 'active' &&
      existing.tier !== 'free' &&
      existing.current_period_end &&
      new Date(existing.current_period_end) > new Date();

    if (hasActivePaidSub) {
      // Active user upgrading: keep active tier/status, just stamp the new order_id
      await supabase
        .from('subscriptions')
        .update({ midtrans_order_id: orderId })
        .eq('user_id', user.id);
    } else {
      // No active sub: standard pending upsert
      await supabase.from('subscriptions').upsert(
        {
          user_id: user.id,
          tier,
          status: 'pending',
          billing_period: period,
          price_idr: amount,
          midtrans_order_id: orderId,
        },
        { onConflict: 'user_id' },
      );
    }

    return NextResponse.json({
      token: snap.token,
      redirect_url: snap.redirect_url,
      order_id: orderId,
    });
  } catch (err) {
    console.error('[checkout]', err);
    // User-facing error string must be Bahasa — the frontend displays it
    // verbatim on the failed-checkout screen. Keep the internal code in
    // English for log greps + error tracking.
    return NextResponse.json(
      {
        error: 'Pembayaran tidak bisa diproses sekarang. Coba lagi ya.',
        code: 'checkout_failed',
      },
      { status: 500 },
    );
  }
}
