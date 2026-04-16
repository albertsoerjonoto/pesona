import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@supabase/supabase-js';
import { verifySignature } from '@/lib/payments/midtrans';
import { trackServerEvent } from '@/lib/analytics/posthog-server';

// Use service role for webhook — not user-scoped
function getServiceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function POST(req: NextRequest) {
  try {
    const notification = await req.json();

    // Verify signature
    if (!verifySignature(notification)) {
      console.warn('[midtrans-webhook] Invalid signature', notification.order_id);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
    }

    const orderId = notification.order_id as string;
    const transactionStatus = notification.transaction_status as string;
    const fraudStatus = notification.fraud_status as string | undefined;

    const supabase = getServiceClient();

    // Idempotency: check if already processed
    const { data: existing } = await supabase
      .from('subscriptions')
      .select('status, midtrans_order_id')
      .eq('midtrans_order_id', orderId)
      .single();

    if (!existing) {
      console.warn('[midtrans-webhook] No subscription found for order', orderId);
      return NextResponse.json({ status: 'ignored' });
    }

    // Already in terminal state — idempotent
    if (existing.status === 'active' && transactionStatus === 'settlement') {
      return NextResponse.json({ status: 'already_processed' });
    }

    // Process based on transaction status
    if (transactionStatus === 'settlement' || transactionStatus === 'capture') {
      // For capture, check fraud status
      if (transactionStatus === 'capture' && fraudStatus !== 'accept') {
        return NextResponse.json({ status: 'fraud_review' });
      }

      // Activate subscription
      const periodEnd = new Date();
      // Check billing period from the existing row
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('billing_period, user_id, tier, price_idr')
        .eq('midtrans_order_id', orderId)
        .single();

      if (sub?.billing_period === 'annual') {
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      } else {
        periodEnd.setMonth(periodEnd.getMonth() + 1);
      }

      await supabase
        .from('subscriptions')
        .update({
          status: 'active',
          started_at: new Date().toISOString(),
          current_period_end: periodEnd.toISOString(),
          midtrans_transaction_id: notification.transaction_id,
        })
        .eq('midtrans_order_id', orderId);

      // Track analytics
      if (sub) {
        trackServerEvent(sub.user_id, 'subscription_started', {
          tier: sub.tier,
          price_idr: sub.price_idr,
          channel: 'web',
        });
      }
    } else if (
      transactionStatus === 'deny' ||
      transactionStatus === 'cancel' ||
      transactionStatus === 'expire'
    ) {
      await supabase
        .from('subscriptions')
        .update({ status: 'failed' })
        .eq('midtrans_order_id', orderId);
    } else if (transactionStatus === 'pending') {
      // Keep as pending
    }

    return NextResponse.json({ status: 'ok' });
  } catch (err) {
    console.error('[midtrans-webhook]', err);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
