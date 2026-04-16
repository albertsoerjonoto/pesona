import { describe, it, expect } from 'vitest';
import crypto from 'crypto';

/**
 * Tests for Midtrans payment logic.
 * We test the signature verification algorithm directly
 * since the actual API calls need sandbox credentials.
 */

// Replicate the verification logic from lib/payments/midtrans.ts
function verifySignature(
  notification: {
    order_id: string;
    status_code: string;
    gross_amount: string;
    signature_key: string;
  },
  serverKey: string,
): boolean {
  const payload =
    notification.order_id +
    notification.status_code +
    notification.gross_amount +
    serverKey;
  const expected = crypto.createHash('sha512').update(payload).digest('hex');
  return expected === notification.signature_key;
}

describe('Midtrans Signature Verification', () => {
  const SERVER_KEY = 'SB-Mid-server-test123';

  it('validates correct signature', () => {
    const orderId = 'pesona-plus-abc12345-1234567890';
    const statusCode = '200';
    const grossAmount = '59000.00';
    const payload = orderId + statusCode + grossAmount + SERVER_KEY;
    const signature = crypto.createHash('sha512').update(payload).digest('hex');

    expect(
      verifySignature(
        { order_id: orderId, status_code: statusCode, gross_amount: grossAmount, signature_key: signature },
        SERVER_KEY,
      ),
    ).toBe(true);
  });

  it('rejects tampered order_id', () => {
    const orderId = 'pesona-plus-abc12345-1234567890';
    const statusCode = '200';
    const grossAmount = '59000.00';
    const payload = orderId + statusCode + grossAmount + SERVER_KEY;
    const signature = crypto.createHash('sha512').update(payload).digest('hex');

    // Tamper the order_id
    expect(
      verifySignature(
        { order_id: 'tampered-order', status_code: statusCode, gross_amount: grossAmount, signature_key: signature },
        SERVER_KEY,
      ),
    ).toBe(false);
  });

  it('rejects tampered gross_amount', () => {
    const orderId = 'pesona-pro-abc12345-1234567890';
    const statusCode = '200';
    const grossAmount = '179000.00';
    const payload = orderId + statusCode + grossAmount + SERVER_KEY;
    const signature = crypto.createHash('sha512').update(payload).digest('hex');

    // Tamper the amount to a lower value
    expect(
      verifySignature(
        { order_id: orderId, status_code: statusCode, gross_amount: '59000.00', signature_key: signature },
        SERVER_KEY,
      ),
    ).toBe(false);
  });

  it('rejects wrong server key', () => {
    const orderId = 'pesona-plus-abc12345-1234567890';
    const statusCode = '200';
    const grossAmount = '59000.00';
    const payload = orderId + statusCode + grossAmount + 'WRONG-KEY';
    const signature = crypto.createHash('sha512').update(payload).digest('hex');

    expect(
      verifySignature(
        { order_id: orderId, status_code: statusCode, gross_amount: grossAmount, signature_key: signature },
        SERVER_KEY,
      ),
    ).toBe(false);
  });

  it('rejects empty signature', () => {
    expect(
      verifySignature(
        { order_id: 'test', status_code: '200', gross_amount: '59000.00', signature_key: '' },
        SERVER_KEY,
      ),
    ).toBe(false);
  });

  it('rejects replayed notification with different status', () => {
    const orderId = 'pesona-plus-abc12345-1234567890';
    const grossAmount = '59000.00';
    // Original settlement signature
    const settlePayload = orderId + '200' + grossAmount + SERVER_KEY;
    const settleSignature = crypto.createHash('sha512').update(settlePayload).digest('hex');

    // Try to use settlement signature with deny status
    expect(
      verifySignature(
        { order_id: orderId, status_code: '202', gross_amount: grossAmount, signature_key: settleSignature },
        SERVER_KEY,
      ),
    ).toBe(false);
  });
});

describe('Midtrans Order ID Format', () => {
  it('generates valid order IDs', () => {
    const tier = 'plus';
    const userIdSlice = 'abc12345';
    const timestamp = Date.now();
    const orderId = `pesona-${tier}-${userIdSlice}-${timestamp}`;

    expect(orderId).toMatch(/^pesona-(free|plus|pro|elite)-[a-z0-9]+-\d+$/);
    expect(orderId.length).toBeLessThan(100); // Midtrans max
  });
});
