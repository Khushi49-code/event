// app/(auth)/login/page.tsx
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../../lib/config';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Loader2, Mail, Lock, Ban, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

type BlockedState =
  | { type: 'deactivated' }
  | { type: 'expired' }
  | null;

// Treats false, "false", 0, "0", "inactive", "disabled" as deactivated —
// covers common ways this field might have been stored manually in Firestore.
function isUserDeactivated(userData: any): boolean {
  const candidates = [
    userData?.isActive,
    userData?.active,
    userData?.status,
    userData?.disabled,
    userData?.accountStatus,
  ];

  for (const value of candidates) {
    if (value === undefined || value === null) continue;
    if (value === false) return true;
    if (value === true) return false;
    if (typeof value === 'string') {
      const v = value.toLowerCase();
      if (['false', '0', 'inactive', 'disabled', 'deactivated', 'blocked'].includes(v)) return true;
      if (['true', '1', 'active', 'enabled'].includes(v)) return false;
    }
    if (typeof value === 'number') {
      if (value === 0) return true;
      if (value === 1) return false;
    }
  }
  return false;
}

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [blocked, setBlocked] = useState<BlockedState>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setBlocked(null);

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        formData.email.trim(),
        formData.password
      );
      console.log('Login successful:', userCredential.user.uid);

      const uid = userCredential.user.uid;

      // ---- Check account status + plan status before granting access ----
      const userDocRef = doc(db, 'users', uid);
      const userDocSnap = await getDoc(userDocRef);

      // DEBUG: log exactly what Firestore returned for this user so we can
      // see the real field names/values. Check your browser console after
      // logging in with the inactive test account.
      console.log('User doc exists:', userDocSnap.exists());
      console.log('User doc data:', userDocSnap.data());

      const userData = userDocSnap.exists() ? userDocSnap.data() : null;

      // 1. Admin deactivation check
      const deactivated = isUserDeactivated(userData);
      console.log('Computed deactivated status:', deactivated);

      if (deactivated) {
        await signOut(auth);
        document.cookie = 'firebaseAuthToken=; path=/; max-age=0; SameSite=Lax';
        setBlocked({ type: 'deactivated' });
        toast.error('Your admin has blocked your access. Please connect with your admin.', {
          duration: 5000,
        });
        return;
      }

      // 2. Plan expiry check (users/{uid}.planExpiryDate)
      let planExpired = false;
      const rawExpiry = userData?.planExpiryDate;
      if (rawExpiry) {
        const expiryDate: Date = rawExpiry?.toDate
          ? rawExpiry.toDate()
          : new Date(rawExpiry);
        planExpired = expiryDate.getTime() < Date.now();
      }

      const idToken = await userCredential.user.getIdToken();
      document.cookie = `firebaseAuthToken=${idToken}; path=/; max-age=3600; SameSite=Lax`;

      if (planExpired) {
        setBlocked({ type: 'expired' });
        toast.error('Your plan has expired. Please renew to continue.');
        router.push('/settings/billing');
        return;
      }

      toast.success('Login successful!');
      window.location.href = '/';

    } catch (error: any) {
      console.error('Login error code:', error.code);
      console.error('Login error full:', error);

      switch (error.code) {
        case 'auth/user-not-found':
          toast.error('User not found. Please check your email.');
          break;
        case 'auth/user-disabled':
          // This fires when the account is disabled directly in Firebase
          // Authentication console (separate from our Firestore isActive check).
          setBlocked({ type: 'deactivated' });
          toast.error('Your admin has blocked your access. Please connect with your admin.', {
            duration: 5000,
          });
          break;
        case 'auth/wrong-password':
          toast.error('Incorrect password. Please try again.');
          break;
        case 'auth/invalid-email':
          toast.error('Invalid email address.');
          break;
        case 'auth/invalid-credential':
          toast.error('Invalid email or password.');
          break;
        case 'auth/too-many-requests':
          toast.error('Too many attempts. Please try again later.');
          break;
        case 'auth/network-request-failed':
          toast.error('Network error. Check your internet connection.');
          break;
        case 'permission-denied':
          toast.error('Permission denied reading account status. Check Firestore rules.');
          break;
        default:
          toast.error(`Login failed: ${error.message || 'Please try again.'}`);
      }
    } finally {
      setLoading(false);
    }
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
            <p className="text-sm text-gray-600 dark:text-gray-400">Event Management ERP System</p>
            <CardTitle className="text-xl mt-2">Welcome Back</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Blocked state banners */}
            {blocked?.type === 'deactivated' && (
              <div className="mb-4 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <Ban className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-700 dark:text-red-400">
                      Access Blocked
                    </p>
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                      Your admin has blocked your access. Please connect with your admin to
                      restore your account.
                    </p>
                  </div>
                </div>
                <a
                  href="mailto:admin@eventflux.com?subject=Account%20Deactivated%20-%20Support%20Request"
                  className="inline-flex items-center justify-center gap-2 text-sm font-medium bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <Mail className="h-4 w-4" />
                  Contact Admin
                </a>
              </div>
            )}

            {blocked?.type === 'expired' && (
              <div className="mb-4 p-4 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-orange-700 dark:text-orange-400">
                      Plan Expired
                    </p>
                    <p className="text-sm text-orange-600 dark:text-orange-400 mt-1">
                      Your plan has expired. Redirecting you to renew your plan...
                    </p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
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
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="rounded border-gray-300" />
                  <span className="text-gray-600 dark:text-gray-400">Remember me</span>
                </label>
                <Link href="/forgot-password" className="text-blue-600 hover:text-blue-700">
                  Forgot password?
                </Link>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>

              <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                Don't have an account?{' '}
                <Link href="/register" className="text-blue-600 hover:text-blue-700 font-medium">
                  Sign up
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}