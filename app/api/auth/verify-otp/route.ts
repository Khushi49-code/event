// 📁 FILE PATH: app/api/auth/verify-otp/route.ts   (નવી ફાઇલ, ફોલ્ડર: verify-otp)
// OTP સાચો હોય તો જ સર્વર પર account બને છે.
import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import {
  OTP_MAX_ATTEMPTS,
  normalizeEmail,
  otpDocId,
  hashOtp,
  safeEqual,
  isValidEmail,
} from '@/lib/otp';

export const runtime = 'nodejs';

const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });

export async function POST(req: Request) {
  try {
    const { name, email: rawEmail, password, otp } = await req.json();

    const email = normalizeEmail(String(rawEmail || ''));
    const cleanName = String(name || '').trim().slice(0, 80);
    const code = String(otp || '').trim();

    if (!isValidEmail(email)) return fail('Invalid email address.');
    if (!cleanName) return fail('Please enter your name.');
    if (typeof password !== 'string' || password.length < 6) {
      return fail('Password must be at least 6 characters.');
    }
    if (!/^\d{6}$/.test(code)) return fail('Enter the 6-digit code.');

    const ref = adminDb.collection('emailOtps').doc(otpDocId(email));
    const snap = await ref.get();
    if (!snap.exists) return fail('Code expired. Please request a new one.');

    const data = snap.data()!;

    if (Date.now() > data.expiresAt) {
      await ref.delete();
      return fail('Code expired. Please request a new one.');
    }
    if ((data.attempts || 0) >= OTP_MAX_ATTEMPTS) {
      return fail('Too many wrong attempts. Please request a new code.', 429);
    }

    if (!safeEqual(hashOtp(email, code), data.otpHash)) {
      await ref.update({ attempts: FieldValue.increment(1) });
      return fail('Incorrect code. Please try again.');
    }

    // ✅ OTP સાચો, હવે account બનાવો (email verified તરીકે)
    let uid: string;
    try {
      const user = await adminAuth.createUser({
        email,
        password,
        displayName: cleanName,
        emailVerified: true,
      });
      uid = user.uid;
    } catch (e: any) {
      if (e?.code === 'auth/email-already-exists') return fail('Email already in use. Please login.', 409);
      if (e?.code === 'auth/invalid-password') return fail('Password is too weak.');
      throw e;
    }

    await adminDb.collection('users').doc(uid).set({
      name: cleanName,
      email,
      role: 'admin',
      emailVerified: true,
      createdAt: new Date().toISOString(),
    });

    await ref.delete();
    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error('verify-otp error:', e);
    return fail(
      process.env.NODE_ENV === 'production' ? 'Verification failed. Please try again.' : `Verification failed: ${e?.message}`,
      500
    );
  }
}