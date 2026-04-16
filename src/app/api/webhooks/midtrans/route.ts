import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@supabase/supabase-js';
import { verifySignature } from '@/lib/payments/midtrans';
import { trackServerEvent, shutdownPostHog } from '@/lib/analytics/posthog-server';

// Use service role for webhook — not user-scoped
function getServiceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

// Validate required fields on the notification payload.
function validateNotification(n: unknown): n is {
  order_id: string;
  status_code: string;
  gross_amount: string;
  signature_key: string;
  transaction_status: string;
  transaction_id?: string;
  fraud_status?: string;
} {
  if (!n || typeof n !== 'object') return false;
  const obj = n as Record<string, unknown>;
  return (
    typeof obj.order_id === 'string' && obj.order_id.length > 0 &&
    typeof obj.status_code === 'string' && obj.status_code.length > 0 &&
    typeof obj.gross_amount === 'string' && obj.gross_amount.length > 0 &&
    typeof obj.signature_key === 'string' && obj.signature_key.length > 0 &&
    typeof obj.transaction_status === 'string' && obj.transaction_status.length > 0
  );
}

export async function POST(req: NextRequest) {
  let notification: unknown;
  try {
    notification = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Validate structure before anything else
  if (!validateNotification(notification)) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 },
    );
  }

  // Verify signature
  if (!verifySignature(notification)) {
    console.warn('[midtrans-webhook] Invalid signature', notification.order_id);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
  }

  const orderId = notification.order_id;
  const transactionStatus = notification.transaction_status;
  const fraudStatus = notification.fraud_status;

  try {
    const supabase = getServiceClient();

    // Look up existing subscription by order_id
    const { data: existing } = await supabase
      .from('subscriptions')
      .select('status, midtrans_order_id, billing_period, user_id, tier, price_idr')
      .eq('midtrans_order_id', orderId)
      .maybeSingle();

    if (!existing) {
      console.warn('[midtrans-webhook] No subscription found for order', orderId);
      // Return 200 so Midtrans doesn't retry forever for an unknown order
      return NextResponse.json({ status: 'ignored' });
    }

    // Idempotency: any settlement → active transition that's already done
    if (
      existing.status === 'active' &&
      (transactionStatus === 'settlement' || transactionStatus === 'capture')
    ) {
      return NextResponse.json({ status: 'already_processed' });
    }

    // Process based on transaction status
    if (transactionStatus === 'settlement' || transactionStatus === 'capture') {
      // For capture, check fraud status
      if (transactionStatus === 'capture' && fraudStatus && fraudStatus !== 'accept') {
        await supabase
          .from('subscriptions')
          .update({ status: 'fraud_review' })
          .eq('midtrans_order_id', orderId);
        return NextResponse.json({ status: 'fraud_review' });
      }

      // Compute period end based on billing period
      const periodEnd = new Date();
      if (existing.billing_period === 'annual') {
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      } else {
        periodEnd.setMonth(periodEnd.getMonth() + 1);
      }

      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          status: 'active',
          started_at: new Date().toISOString(),
          current_period_end: periodEnd.toISOString(),
          midtrans_transaction_id: notification.transaction_id ?? null,
        })
        .eq('midtrans_order_id', orderId);

      if (updateError) {
        console.error('[midtrans-webhook] Update failed:', updateError);
        return NextResponse.json({ error: 'DB update failed' }, { status: 500 });
      }

      // Track analytics (best-effort, flush before response)
      trackServerEvent(existing.user_id, 'subscription_started', {
        tier: existing.tier,
        price_idr: existing.price_idr,
        channel: 'web',
      });
      await shutdownPostHog();

      return NextResponse.json({ status: 'ok' });
    }

    if (
      transactionStatus === 'deny' ||
      transactionStatus === 'cancel' ||
      transactionStatus === 'expire'
    ) {
      await supabase
        .from('subscriptions')
        .update({ status: 'failed' })
        .eq('midtrans_order_id', orderId);
      return NextResponse.json({ status: 'failed' });
    }

    if (transactionStatus === 'pending') {
      // No state change; ack
      return NextResponse.json({ status: 'pending' });
    }

    // Unknown status — ack to prevent Midtrans retries, but log
    console.warn('[midtrans-webhook] Unknown status:', transactionStatus, orderId);
    return NextResponse.json({ status: 'unknown_status' });
  } catch (err) {
    console.error('[midtrans-webhook]', err);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 },
    );
  }
}
