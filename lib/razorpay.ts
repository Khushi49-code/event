// 📁 FILE PATH: lib/razorpay.ts
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebaseAdmin';
import { PRICE_PER_CREDIT } from '@/lib/pricing';

export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

// Checkout pachhi client mokle e signature verify kare (order_id|payment_id)
export function verifyPaymentSignature(orderId: string, paymentId: string, signature: string) {
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  return (
    expected.length === signature.length &&
    crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
  );
}

export type FulfillResult =
  | { status: 'credited'; uid: string; quantity: number }
  | { status: 'already_processed'; uid: string; quantity: number }
  | { status: 'not_captured'; paymentStatus: string };

/**
 * Verify route ane webhook, banne ahi thi j credit ape che.
 * - Idempotent: ek paymentId mate credit ek j var add thay.
 * - uid ane quantity order na notes mathi (server-side), client na body mathi nahi.
 * - Amount verify thay che.
 */
export async function fulfillPayment(paymentId: string, orderId: string): Promise<FulfillResult> {
  const [payment, order] = await Promise.all([
    razorpay.payments.fetch(paymentId),
    razorpay.orders.fetch(orderId),
  ]);

  if (payment.order_id !== orderId) {
    throw new Error('Payment is not for this order');
  }

  // Auto-capture off hoy to payment 'authorized' hoy; webhook (payment.captured) pachhi credit ape
  if (payment.status !== 'captured') {
    return { status: 'not_captured', paymentStatus: String(payment.status) };
  }

  const uid = String(order.notes?.uid || '');
  const quantity = Math.floor(Number(order.notes?.quantity));
  if (!uid || !Number.isFinite(quantity) || quantity < 1) {
    throw new Error('Order notes invalid (uid/quantity)');
  }

  const expectedAmount = Math.round(quantity * PRICE_PER_CREDIT * 100);
  if (Number(order.amount) !== expectedAmount || Number(payment.amount) !== expectedAmount) {
    throw new Error('Amount mismatch');
  }

  const paymentRef = adminDb.collection('payments').doc(paymentId);
  const userRef = adminDb.collection('users').doc(uid);

  const alreadyProcessed = await adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(paymentRef);
    if (snap.exists) return true;

    tx.set(paymentRef, {
      paymentId,
      orderId,
      uid,
      quantity,
      amount: expectedAmount,
      currency: payment.currency,
      createdAt: FieldValue.serverTimestamp(),
    });

    // 🔥 Tamari user doc ma je field ma total credits rakho cho e ahi use karo
    tx.set(
      userRef,
      { totalCredits: FieldValue.increment(quantity) },
      { merge: true }
    );

    return false;
  });

  return { status: alreadyProcessed ? 'already_processed' : 'credited', uid, quantity };
}