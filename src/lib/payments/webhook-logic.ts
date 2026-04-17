/**
 * Pure functions for Midtrans webhook processing.
 * No server-only imports — safe to import in tests.
 */

export interface MidtransNotification {
  order_id: string;
  status_code: string;
  gross_amount: string;
  signature_key: string;
  transaction_status: string;
  transaction_id?: string;
  fraud_status?: string;
}

/**
 * Validate required fields on an incoming Midtrans notification payload.
 * Acts as a type guard: if true, the value is safely typed.
 */
export function validateNotification(n: unknown): n is MidtransNotification {
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

export type WebhookDecision =
  | 'active'
  | 'failed'
  | 'fraud_review'
  | 'pending'
  | 'already_processed'
  | 'ignored';

/**
 * Decide what state a subscription should transition to based on the
 * existing row's status and the incoming Midtrans notification.
 * Pure function — no side effects.
 */
export function decideWebhookState(
  existingStatus: string,
  transactionStatus: string,
  fraudStatus?: string,
): WebhookDecision {
  if (
    existingStatus === 'active' &&
    (transactionStatus === 'settlement' || transactionStatus === 'capture')
  ) {
    return 'already_processed';
  }
  if (transactionStatus === 'settlement') return 'active';
  if (transactionStatus === 'capture') {
    if (fraudStatus && fraudStatus !== 'accept') return 'fraud_review';
    return 'active';
  }
  if (
    transactionStatus === 'deny' ||
    transactionStatus === 'cancel' ||
    transactionStatus === 'expire'
  ) {
    return 'failed';
  }
  if (transactionStatus === 'pending') return 'pending';
  return 'ignored';
}
