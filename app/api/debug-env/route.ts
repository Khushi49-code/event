// 📁 FILE PATH: app/api/debug-env/route.ts   (નવી ફાઇલ, ફોલ્ડર: debug-env)
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

// TEMP DEBUG: ફક્ત true/false બતાવે છે (value નહીં). કામ પતે એટલે આ ફાઇલ ડિલીટ કરજો.
export async function GET() {
  const names = [
    'FIREBASE_PROJECT_ID',
    'FIREBASE_CLIENT_EMAIL',
    'FIREBASE_PRIVATE_KEY',
    'FIREBASE_ADMIN_PROJECT_ID',
    'FIREBASE_ADMIN_CLIENT_EMAIL',
    'FIREBASE_ADMIN_PRIVATE_KEY',
    'FIREBASE_SERVICE_ACCOUNT',
    'TURNSTILE_SECRET_KEY',
    'NEXT_PUBLIC_TURNSTILE_SITE_KEY',
    'OTP_SECRET',
    'SMTP_HOST',
    'SMTP_PORT',
    'SMTP_USER',
    'SMTP_PASS',
    'SMTP_PASSWORD',
    'MAIL_FROM',
    'EMAIL_USER',
    'EMAIL_PASS',
    'RESEND_API_KEY',
  ];

  const result: Record<string, boolean> = {};
  for (const n of names) result[n] = !!process.env[n];

  const pk = process.env.FIREBASE_PRIVATE_KEY || process.env.FIREBASE_ADMIN_PRIVATE_KEY || '';
  return NextResponse.json({
    env: result,
    privateKeyStartsCorrectly: pk.includes('BEGIN PRIVATE KEY'),
    privateKeyHasRealNewlines: pk.includes('\n'),
    privateKeyHasEscapedNewlines: pk.includes('\\n'),
  });
}