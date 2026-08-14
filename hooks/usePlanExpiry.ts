// hooks/usePlanExpiry.ts
"use client";

import { useState, useEffect } from 'react';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { db } from '@/lib/config';
import { useAuth } from '@/providers/AuthProvider';

export type PlanExpiryStatus = 'none' | 'ok' | 'reminder' | 'warning' | 'urgent' | 'expired';

export interface PlanExpiryInfo {
  planName: string | null;
  expiryDate: Date | null;
  daysLeft: number | null;
  status: PlanExpiryStatus;
  loading: boolean;
}

/**
 * Reads the user's plan name + expiry date from Firestore (users/{uid})
 * and computes a notification status based on how many days remain:
 * - 30 / 15 / 7 days out -> 'reminder'
 * - <= 7 days -> 'warning'
 * - <= 3 days -> 'urgent' (shows every day until expiry)
 * - < 0 days -> 'expired' (keeps showing after expiry too)
 *
 * Expects Firestore fields: users/{uid}.planName (string), users/{uid}.planExpiryDate (Timestamp | string)
 */
export function usePlanExpiry(): PlanExpiryInfo {
  const { user, loading: authLoading } = useAuth();
  // ✅ providers/AuthProvider just re-exports contexts/AuthContext's useAuth,
  // whose User type only has `id` (set from firebaseUser.uid) — there is no
  // `uid` field on it. Use `user.id` everywhere below.
  const [planName, setPlanName] = useState<string | null>(null);
  const [expiryDate, setExpiryDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ✅ Check if auth is still loading
    if (authLoading) {
      setLoading(true);
      return;
    }

    // ✅ Check if user exists and has id
    if (!user || !user.id) {
      console.log('usePlanExpiry: No user found');
      setPlanName(null);
      setExpiryDate(null);
      setLoading(false);
      return;
    }

    console.log('usePlanExpiry: Setting up listener for user:', user.id);

    // ✅ Make sure db is initialized
    if (!db) {
      console.error('Firestore db is not initialized');
      setLoading(false);
      return;
    }

    const userRef = doc(db, 'users', user.id);

    const applyData = (data: Record<string, any> | undefined) => {
      setPlanName(data?.planName || null);

      const raw = data?.planExpiryDate;
      if (!raw) {
        setExpiryDate(null);
      } else if (raw?.toDate) {
        // Firestore Timestamp
        setExpiryDate(raw.toDate());
      } else if (typeof raw === 'string' || typeof raw === 'number') {
        setExpiryDate(new Date(raw));
      } else {
        setExpiryDate(null);
      }
    };

    let cancelled = false;

    const unsubscribe = onSnapshot(
      userRef,
      (snap) => {
        if (cancelled) return;
        const data = snap.data();
        console.log('usePlanExpiry: Data received:', data);
        applyData(data);
        setLoading(false);
      },
      async (err) => {
        // 🔥 FIX: The realtime listener can transiently fail right after a
        // page reload (e.g. the Firestore auth token hasn't fully
        // propagated yet even though `user` is already set) — see the same
        // class of bug documented in useEvents() in hooks/useFirebase.ts.
        // Previously this just logged and left `planName` stuck at null
        // forever, which showed as "No Plan" in the sidebar until the user
        // logged out and back in. Fall back to a one-shot getDoc instead of
        // giving up, so a transient listener error doesn't require a
        // manual re-login to recover.
        console.error('usePlanExpiry onSnapshot error, falling back to getDoc:', err);
        try {
          const snap = await getDoc(userRef);
          if (cancelled) return;
          applyData(snap.exists() ? snap.data() : undefined);
        } catch (fallbackErr) {
          console.error('usePlanExpiry fallback getDoc also failed:', fallbackErr);
        } finally {
          if (!cancelled) setLoading(false);
        }
      }
    );

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [user, authLoading]);

  let daysLeft: number | null = null;
  let status: PlanExpiryStatus = 'none';

  if (expiryDate) {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryDate);
    expiry.setHours(0, 0, 0, 0);

    daysLeft = Math.round((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysLeft < 0) status = 'expired';
    else if (daysLeft <= 3) status = 'urgent';
    else if (daysLeft <= 7) status = 'warning';
    else if (daysLeft <= 30) status = 'reminder';
    else status = 'ok';
  }

  return { planName, expiryDate, daysLeft, status, loading: loading || authLoading };
}