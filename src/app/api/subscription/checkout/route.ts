import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createSnapTransaction } from '@/lib/payments/midtrans';
import { TIER_CONFIG, type SubscriptionTier } from '@/lib/payments/tiers';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const tier = body.tier as SubscriptionTier;
    const period = (body.period as 'monthly' | 'annual') || 'monthly';

    if (!tier || !TIER_CONFIG[tier] || tier === 'free') {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
    }

    const config = TIER_CONFIG[tier];
    const amount = period === 'annual' ? config.annual_price_idr : config.price_idr;
    const orderId = `pesona-${tier}-${user.id.slice(0, 8)}-${Date.now()}`;

    // Get user profile for customer details
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name, email')
      .eq('id', user.id)
      .single();

    const snap = await createSnapTransaction({
      order_id: orderId,
      gross_amount: amount,
      customer_name: profile?.display_name || user.email?.split('@')[0] || 'User',
      customer_email: user.email || '',
      item_name: `${config.nameBahasa} (${period === 'annual' ? 'Tahunan' : 'Bulanan'})`,
    });

    // Create pending subscription row (idempotent by user_id)
    await supabase.from('subscriptions').upsert({
      user_id: user.id,
      tier,
      status: 'pending',
      billing_period: period,
      price_idr: amount,
      midtrans_order_id: orderId,
    }, { onConflict: 'user_id' });

    return NextResponse.json({
      token: snap.token,
      redirect_url: snap.redirect_url,
      order_id: orderId,
    });
  } catch (err) {
    console.error('[checkout]', err);
    return NextResponse.json(
      { error: 'Checkout failed' },
      { status: 500 },
    );
  }
}
