// 📁 FILE PATH: app/api/razorpay/webhook/route.ts
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { fulfillPayment } from '@/lib/razorpay';

export const runtime = 'nodejs';

// Razorpay Dashboard > Settings > Webhooks
//   URL:    https://YOUR_DOMAIN/api/razorpay/webhook
//   Secret: same value as RAZORPAY_WEBHOOK_SECRET
//   Event:  payment.captured
export async function POST(req: Request) {
  if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
    console.error('RAZORPAY_WEBHOOK_SECRET missing');
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }

  const rawBody = await req.text(); // raw body is required for signature check
  const signature = req.headers.get('x-razorpay-signature') || '';

  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');

  const valid =
    expected.length === signature.length &&
    crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));

  if (!valid) return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });

  try {
    const event = JSON.parse(rawBody);

    if (event.event === 'payment.captured') {
      const p = event.payload.payment.entity;
      await fulfillPayment(p.id, p.order_id);
    }

    return NextResponse.json({ received: true });
  } catch (e) {
    console.error('webhook error:', e);
    // 500 makes Razorpay retry later
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}