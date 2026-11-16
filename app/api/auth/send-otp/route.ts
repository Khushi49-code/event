// 📁 FILE PATH: app/api/auth/send-otp/route.ts   (નવી ફાઇલ, ફોલ્ડર: send-otp)
import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';
import { verifyCaptcha } from '@/lib/captcha';
import { sendOtpEmail } from '@/lib/mailer';
import {
  OTP_TTL_MS,
  OTP_RESEND_COOLDOWN_MS,
  OTP_MAX_SENDS,
  ONE_HOUR_MS,
  normalizeEmail,
  otpDocId,
  generateOtp,
  hashOtp,
  isValidEmail,
} from '@/lib/otp';

export const runtime = 'nodejs';

const fail = (error: string, status = 400, extra: object = {}) =>
  NextResponse.json({ error, ...extra }, { status });

export async function POST(req: Request) {
  try {
    const { name, email: rawEmail, captchaToken, resend } = await req.json();

    const email = normalizeEmail(String(rawEmail || ''));
    const cleanName = String(name || '').trim().slice(0, 80);

    if (!isValidEmail(email)) return fail('Invalid email address.');
    if (!cleanName) return fail('Please enter your name.');

    // પહેલેથી રજિસ્ટર્ડ છે?
    try {
      await adminAuth.getUserByEmail(email);
      return fail('Email already in use. Please login.', 409);
    } catch (e: any) {
      if (e?.code !== 'auth/user-not-found') throw e;
    }

    const ref = adminDb.collection('emailOtps').doc(otpDocId(email));
    const snap = await ref.get();
    const data = snap.data();
    const now = Date.now();

    if (resend) {
      // ફરી મોકલવા માટે પહેલા code બન્યો હોવો જોઈએ (captcha પહેલી વારે થઈ ગયું)
      if (!snap.exists) return fail('Please start again.');
    } else {
      const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
      const ok = await verifyCaptcha(captchaToken, ip);
      if (!ok) return fail('Robot check failed. Please try again.');
    }

    let sendCount = 0;
    let firstSentAt = now;
    if (data) {
      const wait = OTP_RESEND_COOLDOWN_MS - (now - (data.lastSentAt || 0));
      if (wait > 0) {
        return fail(`Please wait ${Math.ceil(wait / 1000)}s before requesting a new code.`, 429, {
          retryAfter: Math.ceil(wait / 1000),
        });
      }
      if (now - (data.firstSentAt || 0) < ONE_HOUR_MS) {
        sendCount = data.sendCount || 0;
        firstSentAt = data.firstSentAt || now;
        if (sendCount >= OTP_MAX_SENDS) {
          return fail('Too many codes requested. Please try again in an hour.', 429);
        }
      }
    }

    const otp = generateOtp();

    await ref.set({
      otpHash: hashOtp(email, otp),
      expiresAt: now + OTP_TTL_MS,
      attempts: 0,
      lastSentAt: now,
      firstSentAt,
      sendCount: sendCount + 1,
    });

    await sendOtpEmail(email, cleanName, otp);

    return NextResponse.json({ success: true, cooldown: OTP_RESEND_COOLDOWN_MS / 1000 });
  } catch (e: any) {
    console.error('send-otp error:', e);
    const detail = e?.message || 'Unknown error';
    return fail(
      process.env.NODE_ENV === 'production' ? 'Could not send code. Please try again.' : `Could not send code: ${detail}`,
      500
    );
  }
}