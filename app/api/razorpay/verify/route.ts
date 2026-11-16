// 📁 FILE PATH: app/api/razorpay/verify/route.ts
import { NextResponse } from 'next/server';
import { getUidFromRequest } from '@/lib/firebaseAdmin';
import { razorpay, verifyPaymentSignature, fulfillPayment } from '@/lib/razorpay';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const uid = await getUidFromRequest(req);
    const body = await req.json();

    const orderId = String(body.razorpay_order_id || '');
    const paymentId = String(body.razorpay_payment_id || '');
    const signature = String(body.razorpay_signature || '');

    if (!orderId || !paymentId || !signature) {
      return NextResponse.json({ error: 'Missing payment details' }, { status: 400 });
    }

    if (!verifyPaymentSignature(orderId, paymentId, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Aa order aa j user no che ke nahi
    const order = await razorpay.orders.fetch(orderId);
    if (order.notes?.uid !== uid) {
      return NextResponse.json({ error: 'Order does not belong to this user' }, { status: 403 });
    }

    const result = await fulfillPayment(paymentId, orderId);

    if (result.status === 'not_captured') {
      // Webhook capture thay tyare credit apse
      return NextResponse.json({ success: true, pending: true });
    }

    return NextResponse.json({
      success: true,
      credited: result.status === 'credited',
      quantity: result.quantity,
    });
  } catch (e: any) {
    console.error('verify error:', e);

    const unauthorized = e?.message === 'Unauthorized' || e?.code?.startsWith?.('auth/');
    return NextResponse.json(
      { error: unauthorized ? 'Unauthorized' : 'Payment verification failed' },
      { status: unauthorized ? 401 : 500 }
    );
  }
}