// 📁 FILE PATH: lib/otp.ts   (નવી ફાઇલ)
import crypto from 'crypto';

export const OTP_TTL_MS = 10 * 60 * 1000; // code 10 મિનિટ ચાલે
export const OTP_RESEND_COOLDOWN_MS = 60 * 1000; // 60 સેકન્ડ પછી જ ફરી મોકલાય
export const OTP_MAX_ATTEMPTS = 5; // 5 ખોટા પ્રયત્ન પછી code બંધ
export const OTP_MAX_SENDS = 5; // એક કલાકમાં વધુમાં વધુ 5 code
export const ONE_HOUR_MS = 60 * 60 * 1000;

export const normalizeEmail = (e: string) => e.trim().toLowerCase();

export const otpDocId = (email: string) =>
  crypto.createHash('sha256').update(email).digest('hex');

export function generateOtp(): string {
  return String(crypto.randomInt(100000, 1000000)); // 6 આંકડા
}

export function hashOtp(email: string, otp: string): string {
  const secret = process.env.OTP_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error('OTP_SECRET .env.local માં ખૂટે છે');
  return crypto.createHmac('sha256', secret).update(`${email}:${otp}`).digest('hex');
}

export function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}

export const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);