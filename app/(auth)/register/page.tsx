// 📁 FILE PATH: app/(auth)/register/page.tsx   (જૂની ફાઇલ પૂરી બદલો)
"use client";

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';
import { auth } from '../../../lib/config';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Loader2, Mail, Lock, User, ShieldCheck, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '';

async function callApi(url: string, payload: object) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err: any = new Error(data.error || 'Something went wrong');
    err.retryAfter = data.retryAfter;
    throw err;
  }
  return data;
}

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [otp, setOtp] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const turnstileRef = useRef<TurnstileInstance>(null);
  const captchaUsedRef = useRef(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  // Resend countdown
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  // Robot check: વિગતો ભર્યા પછી, બટન દબાવો ત્યારે જ ચાલે છે
  const runCaptcha = async (): Promise<string> => {
    const widget = turnstileRef.current;
    if (!widget) throw new Error('Robot check is not ready. Please refresh the page.');
    try {
      if (captchaUsedRef.current) widget.reset(); // token એક જ વાર વપરાય
      captchaUsedRef.current = true;
      widget.execute();
      const token = await widget.getResponsePromise();
      if (!token) throw new Error('no token');
      return token;
    } catch {
      throw new Error('Robot check failed. Please try again.');
    }
  };

  // STEP 1: robot check + email પર OTP મોકલો
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const captchaToken = await runCaptcha();
      const data = await callApi('/api/auth/send-otp', {
        name: formData.name,
        email: formData.email,
        captchaToken,
      });
      setCooldown(data.cooldown || 60);
      setOtp('');
      setStep('otp');
      toast.success('Verification code sent to your email');
    } catch (error: any) {
      if (error.retryAfter) setCooldown(error.retryAfter);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: OTP ચકાસો, account બનાવો અને login કરો
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!/^\d{6}$/.test(otp)) {
      toast.error('Enter the 6-digit code');
      return;
    }

    setLoading(true);
    try {
      await callApi('/api/auth/verify-otp', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        otp,
      });

      // Account બની ગયું, હવે login કરો
      const userCredential = await signInWithEmailAndPassword(
        auth,
        formData.email.trim(),
        formData.password
      );
      const idToken = await userCredential.user.getIdToken();
      document.cookie = `firebaseAuthToken=${idToken}; path=/; max-age=3600; SameSite=Lax`;

      toast.success('Account created successfully!');
      router.push('/');
    } catch (error: any) {
      console.error('Registration error:', error);
      if (error.code === 'auth/too-many-requests') {
        toast.error('Too many attempts. Please try again later.');
      } else {
        toast.error(error.message || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setLoading(true);
    try {
      const data = await callApi('/api/auth/send-otp', {
        name: formData.name,
        email: formData.email,
        resend: true,
      });
      setCooldown(data.cooldown || 60);
      toast.success('New code sent');
    } catch (error: any) {
      if (error.retryAfter) setCooldown(error.retryAfter);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const backToForm = () => {
    setStep('form');
    setOtp('');
    captchaUsedRef.current = false;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            {/* Logo and Name inside Card Header */}
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="w-12 h-12 flex-shrink-0">
                <img
                  src="/Logo.png"
                  alt="EventFlux Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex flex-col items-start">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">EventFlux</h1>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {step === 'form' ? 'Create your account' : 'Verify your email address'}
            </p>
            <CardTitle className="text-xl mt-2">
              {step === 'form' ? 'Sign Up' : 'Enter Verification Code'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {step === 'form' ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      type="text"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      type="email"
                      placeholder="admin@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      type="password"
                      placeholder="Min 6 characters"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      type="password"
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                {/* Robot check: વિગતો ભર્યા પછી બટન દબાવો ત્યારે જ દેખાય અને ચાલે છે */}
                <div className="flex justify-start">
                  {TURNSTILE_SITE_KEY ? (
                    <Turnstile
                      ref={turnstileRef}
                      siteKey={TURNSTILE_SITE_KEY}
                      options={{ theme: 'auto', execution: 'execute', appearance: 'execute' }}
                    />
                  ) : (
                    <p className="text-xs text-red-500">
                      NEXT_PUBLIC_TURNSTILE_SITE_KEY .env.local માં ખૂટે છે
                    </p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending code...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </Button>

                <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                  Already have an account?{' '}
                  <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                    Sign in
                  </Link>
                </p>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                  <ShieldCheck className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-700 dark:text-blue-400">
                    We sent a 6-digit code to <span className="font-semibold">{formData.email}</span>.
                    It expires in 10 minutes.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Verification Code</label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    placeholder="000000"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="text-center text-2xl tracking-[0.5em] font-semibold"
                    required
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading || otp.length !== 6}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Verify & Create Account'
                  )}
                </Button>

                <div className="flex items-center justify-between text-sm">
                  <button
                    type="button"
                    onClick={backToForm}
                    disabled={loading}
                    className="inline-flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Change email
                  </button>
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={loading || cooldown > 0}
                    className="text-blue-600 hover:text-blue-700 font-medium disabled:text-gray-400 disabled:cursor-not-allowed"
                  >
                    {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
                  </button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}