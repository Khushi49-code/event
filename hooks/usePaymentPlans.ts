// hooks/usePaymentPlans.ts
"use client";

import { useState, useEffect, useCallback } from 'react';
import { 
  doc, 
  getDoc, 
  updateDoc, 
  setDoc,
  increment,
  Timestamp,
  collection,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/config';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

export interface UserPlan {
  tier: 'free' | 'pro' | 'premium' | 'enterprise';
  maxEvents: number;
  eventsCreated: number;
  // 🔥 NEW: credits permanently lost — an Active event whose invitation was
  // already shared/downloaded, then cancelled. These never come back, even
  // though the event itself is gone (so live active-count alone can't
  // capture this — it has to be tracked separately).
  forfeitedCredits?: number;
  paymentStatus: 'active' | 'pending' | 'expired' | 'none';
  planId?: string;
  purchaseDate?: string;
  expiryDate?: string;
  features?: string[];
}

export function usePaymentPlans() {
  const { user, loading: authLoading } = useAuth();
  const [userPlan, setUserPlan] = useState<UserPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Live count of this user's currently-Active events — the real source of
  // truth for "how many credits are in use right now" (self-corrects,
  // never drifts like a stored counter can).
  const [activeEventsCount, setActiveEventsCount] = useState(0);
  const [activeCountLoading, setActiveCountLoading] = useState(true);

  const PLANS: Record<string, UserPlan> = {
    free: {
      tier: 'free',
      maxEvents: 1,
      eventsCreated: 0,
      forfeitedCredits: 0,
      paymentStatus: 'none',
      features: ['1 free event', 'Basic features', 'Email support']
    },
    pro: {
      tier: 'pro',
      maxEvents: 10,
      eventsCreated: 0,
      forfeitedCredits: 0,
      paymentStatus: 'pending',
      features: ['10 events', 'Advanced features', 'Priority support', 'WhatsApp integration']
    },
    premium: {
      tier: 'premium',
      maxEvents: 25,
      eventsCreated: 0,
      forfeitedCredits: 0,
      paymentStatus: 'pending',
      features: ['25 events', 'All features', '24/7 support', 'Custom branding']
    },
    enterprise: {
      tier: 'enterprise',
      maxEvents: 100,
      eventsCreated: 0,
      forfeitedCredits: 0,
      paymentStatus: 'pending',
      features: ['100 events', 'All features', 'Dedicated support', 'API access']
    }
  };

  const fetchUserPlan = useCallback(async () => {
    if (!user || !user.id) {
      setUserPlan(null);
      setLoading(false);
      return null;
    }

    try {
      setLoading(true);
      setError(null);

      if (!db) {
        throw new Error('Database not initialized');
      }

      const userPlanRef = doc(db, 'userPlans', user.id);
      const userPlanDoc = await getDoc(userPlanRef);

      if (userPlanDoc.exists()) {
        const data = userPlanDoc.data() as UserPlan;
        setUserPlan(data);
        return data;
      } else {
        const defaultPlan: UserPlan = {
          ...PLANS.free,
          eventsCreated: 0,
          forfeitedCredits: 0,
        };
        await setDoc(userPlanRef, defaultPlan);
        setUserPlan(defaultPlan);
        return defaultPlan;
      }
    } catch (err: any) {
      console.error('Error fetching user plan:', err);
      setError(err.message);
      const fallbackPlan: UserPlan = {
        ...PLANS.free,
        eventsCreated: 0,
        forfeitedCredits: 0,
      };
      setUserPlan(fallbackPlan);
      return fallbackPlan;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Live-count actual Active events for this user.
  useEffect(() => {
    if (!user || !user.id) {
      setActiveEventsCount(0);
      setActiveCountLoading(false);
      return;
    }

    setActiveCountLoading(true);
    const q = query(
      collection(db, 'events'),
      where('createdBy', '==', user.id),
      where('status', '==', 'active')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setActiveEventsCount(snapshot.size);
        setActiveCountLoading(false);
      },
      (err) => {
        console.error('Error counting active events:', err);
        setActiveCountLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const incrementEventCount = useCallback(async () => {
    if (!user || !user.id || !userPlan) {
      throw new Error('User not authenticated or plan not loaded');
    }

    try {
      const userPlanRef = doc(db, 'userPlans', user.id);

      await updateDoc(userPlanRef, {
        eventsCreated: increment(1),
        updatedAt: Timestamp.now()
      });

      setUserPlan(prev => prev ? {
        ...prev,
        eventsCreated: prev.eventsCreated + 1
      } : null);

      return true;
    } catch (err: any) {
      console.error('Error incrementing event count:', err);
      throw new Error(err.message || 'Failed to update event count');
    }
  }, [user, userPlan]);

  // 🔥 NEW: permanently burn 1 credit — call this when an Active event whose
  // invitation was already shared/downloaded gets cancelled. This is what
  // makes the loss stick even though the event (and its live-count slot)
  // goes away.
  const forfeitCredit = useCallback(async () => {
    if (!user || !user.id) {
      throw new Error('User not authenticated');
    }

    try {
      const userPlanRef = doc(db, 'userPlans', user.id);
      await updateDoc(userPlanRef, {
        forfeitedCredits: increment(1),
        updatedAt: Timestamp.now()
      });

      setUserPlan(prev => prev ? {
        ...prev,
        forfeitedCredits: (prev.forfeitedCredits || 0) + 1
      } : null);

      return true;
    } catch (err: any) {
      console.error('Error forfeiting credit:', err);
      throw new Error(err.message || 'Failed to update credits');
    }
  }, [user]);

  // 🔥 Total consumed = live active events + permanently forfeited credits.
  // Cancelling an event whose invitation was never shared/downloaded frees
  // its slot automatically (it just drops out of activeEventsCount).
  // Cancelling one that WAS shared/downloaded doesn't — forfeitedCredits
  // keeps holding that slot used forever.
  const canCreateEvent = useCallback(() => {
    if (!userPlan) return false;
    const consumed = activeEventsCount + (userPlan.forfeitedCredits || 0);
    return consumed < userPlan.maxEvents;
  }, [userPlan, activeEventsCount]);

  const remainingEvents = useCallback(() => {
    if (!userPlan) return 0;
    const consumed = activeEventsCount + (userPlan.forfeitedCredits || 0);
    return Math.max(0, userPlan.maxEvents - consumed);
  }, [userPlan, activeEventsCount]);

  // 🔥 purchaseEvents now genuinely supports buying several credits in one
  // go — pass quantity from the billing page's quantity input (e.g. qty=5
  // for a $500 purchase at $100/event).
  const purchaseEvents = useCallback(async (eventCount: number = 1) => {
    if (!user || !user.id) {
      throw new Error('User not authenticated');
    }
    if (eventCount < 1) {
      throw new Error('Quantity must be at least 1');
    }

    try {
      const userPlanRef = doc(db, 'userPlans', user.id);
      
      await updateDoc(userPlanRef, {
        maxEvents: increment(eventCount),
        paymentStatus: 'active',
        updatedAt: Timestamp.now()
      });

      setUserPlan(prev => prev ? {
        ...prev,
        maxEvents: prev.maxEvents + eventCount,
        paymentStatus: 'active'
      } : null);

      toast.success(
        eventCount === 1
          ? 'Successfully purchased 1 additional event!'
          : `Successfully purchased ${eventCount} additional events!`
      );
      return true;
    } catch (err: any) {
      console.error('Error purchasing events:', err);
      throw new Error(err.message || 'Failed to purchase events');
    }
  }, [user]);

  const hasActivePlan = useCallback(() => {
    if (!userPlan) return false;
    return userPlan.paymentStatus === 'active' || userPlan.paymentStatus === 'pending';
  }, [userPlan]);

  const upgradePlan = useCallback(async (newTier: 'pro' | 'premium' | 'enterprise') => {
    if (!user || !user.id) {
      throw new Error('User not authenticated');
    }

    try {
      const userPlanRef = doc(db, 'userPlans', user.id);
      const newPlan = PLANS[newTier];
      
      if (!newPlan) {
        throw new Error('Invalid plan tier');
      }

      await updateDoc(userPlanRef, {
        tier: newTier,
        maxEvents: newPlan.maxEvents,
        paymentStatus: 'pending',
        updatedAt: Timestamp.now()
      });

      setUserPlan(prev => prev ? {
        ...prev,
        tier: newTier,
        maxEvents: newPlan.maxEvents,
        paymentStatus: 'pending'
      } : null);

      toast.success(`Upgraded to ${newTier} plan!`);
      return true;
    } catch (err: any) {
      console.error('Error upgrading plan:', err);
      throw new Error(err.message || 'Failed to upgrade plan');
    }
  }, [user]);

  const refreshPlan = useCallback(async () => {
    return await fetchUserPlan();
  }, [fetchUserPlan]);

  useEffect(() => {
    if (!authLoading) {
      fetchUserPlan();
    }
  }, [authLoading, fetchUserPlan]);

  return {
    userPlan: userPlan ? { ...userPlan, eventsCreated: activeEventsCount } : null,
    loading: loading || authLoading || activeCountLoading,
    error,
    fetchUserPlan,
    incrementEventCount,
    forfeitCredit,
    canCreateEvent,
    remainingEvents,
    purchaseEvents,
    hasActivePlan,
    upgradePlan,
    refreshPlan,
    PLANS
  };
}