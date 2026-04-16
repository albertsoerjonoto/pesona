import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import crypto from 'crypto';

/**
 * Adversarial tests for the Midtrans webhook logic.
 * We replicate the key logic paths (validate + verify + process)
 * so we can test without a real Supabase/network dependency.
 */

const SERVER_KEY = 'SB-Mid-server-test-adversarial';
process.env.MIDTRANS_SERVER_KEY = SERVER_KEY;

function makeSignature(orderId: string, statusCode: string, grossAmount: string): string {
  return crypto
    .createHash('sha512')
    .update(orderId + statusCode + grossAmount + SERVER_KEY)
    .digest('hex');
}

function validateNotification(n: unknown): boolean {
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

function verifySig(n: { order_id: string; status_code: string; gross_amount: string; signature_key: string }): boolean {
  const expected = crypto
    .createHash('sha512')
    .update(n.order_id + n.status_code + n.gross_amount + SERVER_KEY)
    .digest('hex');
  return expected === n.signature_key;
}

describe('Webhook validation (structure)', () => {
  it('rejects null', () => {
    expect(validateNotification(null)).toBe(false);
  });

  it('rejects undefined', () => {
    expect(validateNotification(undefined)).toBe(false);
  });

  it('rejects empty object', () => {
    expect(validateNotification({})).toBe(false);
  });

  it('rejects missing order_id', () => {
    expect(validateNotification({
      status_code: '200',
      gross_amount: '59000.00',
      signature_key: 'abc',
      transaction_status: 'settlement',
    })).toBe(false);
  });

  it('rejects missing signature_key', () => {
    expect(validateNotification({
      order_id: 'test',
      status_code: '200',
      gross_amount: '59000.00',
      transaction_status: 'settlement',
    })).toBe(false);
  });

  it('rejects empty string fields', () => {
    expect(validateNotification({
      order_id: '',
      status_code: '200',
      gross_amount: '59000.00',
      signature_key: 'abc',
      transaction_status: 'settlement',
    })).toBe(false);
  });

  it('rejects numeric gross_amount (must be string)', () => {
    expect(validateNotification({
      order_id: 'test',
      status_code: '200',
      gross_amount: 59000,
      signature_key: 'abc',
      transaction_status: 'settlement',
    })).toBe(false);
  });

  it('rejects array instead of object', () => {
    expect(validateNotification([1, 2, 3])).toBe(false);
  });

  it('rejects string instead of object', () => {
    expect(validateNotification('notification')).toBe(false);
  });

  it('accepts well-formed notification', () => {
    expect(validateNotification({
      order_id: 'pesona-plus-abc12345-1234567890',
      status_code: '200',
      gross_amount: '59000.00',
      signature_key: 'abc',
      transaction_status: 'settlement',
    })).toBe(true);
  });
});

describe('Webhook replay attacks', () => {
  it('rejects replay with modified order_id but original signature', () => {
    const origSig = makeSignature('pesona-plus-abc12345-1', '200', '59000.00');
    const result = verifySig({
      order_id: 'pesona-pro-hacker-2',   // attacker swapped in their order
      status_code: '200',
      gross_amount: '59000.00',
      signature_key: origSig,
    });
    expect(result).toBe(false);
  });

  it('rejects replay with bumped gross_amount', () => {
    const origSig = makeSignature('order-1', '200', '10000.00');
    // Attacker tries to replay with 10x the amount but same sig
    expect(verifySig({
      order_id: 'order-1',
      status_code: '200',
      gross_amount: '100000.00',
      signature_key: origSig,
    })).toBe(false);
  });

  it('rejects replay with status_code mismatch (e.g. settlement sig used for deny)', () => {
    const settlementSig = makeSignature('order-1', '200', '59000.00');
    expect(verifySig({
      order_id: 'order-1',
      status_code: '202', // deny code
      gross_amount: '59000.00',
      signature_key: settlementSig,
    })).toBe(false);
  });

  it('accepts legitimate settlement', () => {
    const sig = makeSignature('order-real', '200', '179000.00');
    expect(verifySig({
      order_id: 'order-real',
      status_code: '200',
      gross_amount: '179000.00',
      signature_key: sig,
    })).toBe(true);
  });
});

describe('Webhook signature edge cases', () => {
  it('rejects empty signature string', () => {
    expect(verifySig({
      order_id: 'order-1',
      status_code: '200',
      gross_amount: '59000.00',
      signature_key: '',
    })).toBe(false);
  });

  it('rejects wrong-length signature (e.g. MD5 instead of SHA512)', () => {
    expect(verifySig({
      order_id: 'order-1',
      status_code: '200',
      gross_amount: '59000.00',
      signature_key: 'd41d8cd98f00b204e9800998ecf8427e', // MD5 length
    })).toBe(false);
  });

  it('is case-sensitive (signature is hex, attacker cannot uppercase it)', () => {
    const sig = makeSignature('order-1', '200', '59000.00');
    expect(verifySig({
      order_id: 'order-1',
      status_code: '200',
      gross_amount: '59000.00',
      signature_key: sig.toUpperCase(),
    })).toBe(false);
  });

  it('resists prefix-extension attacks (SHA512 resistant, but check anyway)', () => {
    const sig = makeSignature('order-1', '200', '59000.00');
    // Attacker appends extra data to signature
    expect(verifySig({
      order_id: 'order-1',
      status_code: '200',
      gross_amount: '59000.00',
      signature_key: sig + '0000',
    })).toBe(false);
  });
});

describe('Webhook status handling logic', () => {
  // Replicate the status processing logic
  function decideNextState(
    existingStatus: string,
    transactionStatus: string,
    fraudStatus?: string,
  ): 'active' | 'failed' | 'fraud_review' | 'pending' | 'already_processed' | 'ignored' {
    if (existingStatus === 'active' &&
        (transactionStatus === 'settlement' || transactionStatus === 'capture')) {
      return 'already_processed';
    }
    if (transactionStatus === 'settlement') return 'active';
    if (transactionStatus === 'capture') {
      if (fraudStatus && fraudStatus !== 'accept') return 'fraud_review';
      return 'active';
    }
    if (['deny', 'cancel', 'expire'].includes(transactionStatus)) return 'failed';
    if (transactionStatus === 'pending') return 'pending';
    return 'ignored';
  }

  it('settlement → active', () => {
    expect(decideNextState('pending', 'settlement')).toBe('active');
  });

  it('capture with accept → active', () => {
    expect(decideNextState('pending', 'capture', 'accept')).toBe('active');
  });

  it('capture with challenge → fraud_review', () => {
    expect(decideNextState('pending', 'capture', 'challenge')).toBe('fraud_review');
  });

  it('capture with deny → fraud_review', () => {
    expect(decideNextState('pending', 'capture', 'deny')).toBe('fraud_review');
  });

  it('deny → failed', () => {
    expect(decideNextState('pending', 'deny')).toBe('failed');
  });

  it('cancel → failed', () => {
    expect(decideNextState('pending', 'cancel')).toBe('failed');
  });

  it('expire → failed', () => {
    expect(decideNextState('pending', 'expire')).toBe('failed');
  });

  it('pending → pending (no change)', () => {
    expect(decideNextState('pending', 'pending')).toBe('pending');
  });

  it('idempotent: already-active settlement returns already_processed', () => {
    expect(decideNextState('active', 'settlement')).toBe('already_processed');
  });

  it('idempotent: already-active capture returns already_processed', () => {
    expect(decideNextState('active', 'capture', 'accept')).toBe('already_processed');
  });

  it('unknown status → ignored', () => {
    expect(decideNextState('pending', 'refund')).toBe('ignored');
  });
});
