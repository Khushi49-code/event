// hooks/usePlanExpiry.ts
"use client";

import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
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
  const { user } = useAuth();
  const [planName, setPlanName] = useState<string | null>(null);
  const [expiryDate, setExpiryDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setPlanName(null);
      setExpiryDate(null);
      setLoading(false);
      return;
    }

    const userRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(
      userRef,
      (snap) => {
        const data = snap.data();

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
        setLoading(false);
      },
      (err) => {
        console.error('usePlanExpiry error:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

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

  return { planName, expiryDate, daysLeft, status, loading };
}