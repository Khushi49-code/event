// 📁 FILE PATH: app/api/auth/verify-captcha/route.ts   (નવી ફાઇલ, ફોલ્ડર: verify-captcha)
import { NextResponse } from 'next/server';
import { verifyCaptcha } from '@/lib/captcha';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { token } = await req.json();
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
    const ok = await verifyCaptcha(token, ip);
    if (!ok) {
      return NextResponse.json({ error: 'Robot check failed. Please try again.' }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error('verify-captcha error:', e);
    return NextResponse.json({ error: e?.message || 'Captcha error' }, { status: 500 });
  }
}