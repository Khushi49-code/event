// 📁 FILE PATH: app/api/razorpay/create-order/route.ts
import { NextResponse } from 'next/server';
import { razorpay } from '@/lib/razorpay';
import { getUidFromRequest } from '@/lib/firebaseAdmin';
import { PRICE_PER_CREDIT, CURRENCY, MIN_QTY, MAX_QTY } from '@/lib/pricing';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new Error('RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET .env.local માં ખૂટે છે');
    }

    const uid = await getUidFromRequest(req); // verified, not taken from the body
    const body = await req.json();

    const qty = Math.max(MIN_QTY, Math.min(MAX_QTY, Math.floor(Number(body.quantity) || 1)));
    const amount = Math.round(qty * PRICE_PER_CREDIT * 100); // paise, calculated on the server

    const order = await razorpay.orders.create({
      amount,
      currency: CURRENCY,
      receipt: `rc_${Date.now()}`.slice(0, 40),
      notes: { uid, quantity: String(qty) },
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (e: any) {
    console.error('create-order error:', e);

    const unauthorized = e?.message === 'Unauthorized' || e?.code?.startsWith?.('auth/');
    const detail = e?.error?.description || e?.message || 'Unknown error';

    return NextResponse.json(
      {
        error: unauthorized
          ? `Unauthorized: ${detail}`
          : process.env.NODE_ENV === 'production'
            ? 'Could not create order'
            : `Could not create order: ${detail}`,
      },
      { status: unauthorized ? 401 : 500 }
    );
  }
}