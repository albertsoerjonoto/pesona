import 'server-only';

import crypto from 'crypto';

const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY || '';
const MIDTRANS_IS_PRODUCTION = process.env.MIDTRANS_IS_PRODUCTION === 'true';

const BASE_URL = MIDTRANS_IS_PRODUCTION
  ? 'https://app.midtrans.com'
  : 'https://app.sandbox.midtrans.com';

const SNAP_URL = MIDTRANS_IS_PRODUCTION
  ? 'https://app.midtrans.com/snap/v1/transactions'
  : 'https://app.sandbox.midtrans.com/snap/v1/transactions';

function getAuthHeader(): string {
  return 'Basic ' + Buffer.from(MIDTRANS_SERVER_KEY + ':').toString('base64');
}

export interface SnapTransactionParams {
  order_id: string;
  gross_amount: number;
  customer_name: string;
  customer_email: string;
  item_name: string;
}

export interface SnapResponse {
  token: string;
  redirect_url: string;
}

/**
 * Create a Midtrans Snap transaction for web checkout.
 */
export async function createSnapTransaction(
  params: SnapTransactionParams,
): Promise<SnapResponse> {
  const body = {
    transaction_details: {
      order_id: params.order_id,
      gross_amount: params.gross_amount,
    },
    customer_details: {
      first_name: params.customer_name,
      email: params.customer_email,
    },
    item_details: [
      {
        id: params.order_id,
        price: params.gross_amount,
        quantity: 1,
        name: params.item_name,
      },
    ],
    callbacks: {
      finish: `${process.env.NEXT_PUBLIC_APP_URL || 'https://pesona.io'}/subscription/success`,
      error: `${process.env.NEXT_PUBLIC_APP_URL || 'https://pesona.io'}/subscription/failed`,
      pending: `${process.env.NEXT_PUBLIC_APP_URL || 'https://pesona.io'}/subscription/success`,
    },
  };

  const res = await fetch(SNAP_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: getAuthHeader(),
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Midtrans Snap error ${res.status}: ${text}`);
  }

  return res.json();
}

/**
 * Verify Midtrans webhook notification signature.
 * Signature = SHA512(order_id + status_code + gross_amount + server_key)
 */
export function verifySignature(notification: {
  order_id: string;
  status_code: string;
  gross_amount: string;
  signature_key: string;
}): boolean {
  const payload =
    notification.order_id +
    notification.status_code +
    notification.gross_amount +
    MIDTRANS_SERVER_KEY;

  const expected = crypto.createHash('sha512').update(payload).digest('hex');
  return expected === notification.signature_key;
}

/**
 * Check transaction status directly with Midtrans API.
 */
export async function getTransactionStatus(orderId: string) {
  const res = await fetch(`${BASE_URL}/v2/${orderId}/status`, {
    headers: {
      Accept: 'application/json',
      Authorization: getAuthHeader(),
    },
  });

  if (!res.ok) {
    throw new Error(`Midtrans status check failed: ${res.status}`);
  }

  return res.json();
}
