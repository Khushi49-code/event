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
} from 'firebase/firestore';
import { db } from '@/lib/config';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

export interface UserPlan {
  tier: 'free' | 'pro' | 'premium' | 'enterprise';
  maxEvents: number;
  eventsCreated: number;
  paymentStatus: 'active' | 'pending' | 'expired' | 'none';
  planId?: string;
  purchaseDate?: string;
  expiryDate?: string;
  features?: string[];
}

export function usePaymentPlans() {
  const { user, loading: authLoading } = useAuth();
  // ✅ AuthContext's User type only has `id` (set from firebaseUser.uid),
  // there is no `uid` field on it — use `user.id` everywhere below.
  const [userPlan, setUserPlan] = useState<UserPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Default plans configuration
  const PLANS: Record<string, UserPlan> = {
    free: {
      tier: 'free',
      maxEvents: 1,
      eventsCreated: 0,
      paymentStatus: 'none',
      features: ['1 free event', 'Basic features', 'Email support']
    },
    pro: {
      tier: 'pro',
      maxEvents: 10,
      eventsCreated: 0,
      paymentStatus: 'pending',
      features: ['10 events', 'Advanced features', 'Priority support', 'WhatsApp integration']
    },
    premium: {
      tier: 'premium',
      maxEvents: 25,
      eventsCreated: 0,
      paymentStatus: 'pending',
      features: ['25 events', 'All features', '24/7 support', 'Custom branding']
    },
    enterprise: {
      tier: 'enterprise',
      maxEvents: 100,
      eventsCreated: 0,
      paymentStatus: 'pending',
      features: ['100 events', 'All features', 'Dedicated support', 'API access']
    }
  };

  // Fetch user's plan from Firestore
  const fetchUserPlan = useCallback(async () => {
    // ✅ CRITICAL: Check if user exists and has id
    if (!user || !user.id) {
      console.log('No user or id found, setting default plan');
      setUserPlan(null);
      setLoading(false);
      return null;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('Fetching plan for user:', user.id);

      // ✅ Make sure db is initialized
      if (!db) {
        console.error('Firestore db is not initialized');
        throw new Error('Database not initialized');
      }

      // Try to get user's plan from Firestore
      const userPlanRef = doc(db, 'userPlans', user.id);
      const userPlanDoc = await getDoc(userPlanRef);

      if (userPlanDoc.exists()) {
        const data = userPlanDoc.data() as UserPlan;
        console.log('Plan found:', data);
        setUserPlan(data);
        return data;
      } else {
        // Create default free plan for new users
        const defaultPlan: UserPlan = {
          ...PLANS.free,
          eventsCreated: 0,
        };
        
        // Save to Firestore
        await setDoc(userPlanRef, defaultPlan);
        console.log('Default plan created:', defaultPlan);
        setUserPlan(defaultPlan);
        return defaultPlan;
      }
    } catch (err: any) {
      console.error('Error fetching user plan:', err);
      setError(err.message);
      
      // Fallback to free plan if Firestore fails
      const fallbackPlan: UserPlan = {
        ...PLANS.free,
        eventsCreated: 0,
      };
      setUserPlan(fallbackPlan);
      return fallbackPlan;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Increment event count
  const incrementEventCount = useCallback(async () => {
    if (!user || !user.id || !userPlan) {
      throw new Error('User not authenticated or plan not loaded');
    }

    try {
      const userPlanRef = doc(db, 'userPlans', user.id);
      
      if (userPlan.eventsCreated >= userPlan.maxEvents) {
        throw new Error('Event limit reached');
      }

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

  // Check if user can create an event
  const canCreateEvent = useCallback(() => {
    if (!userPlan) return false;
    return userPlan.eventsCreated < userPlan.maxEvents;
  }, [userPlan]);

  // Get remaining events
  const remainingEvents = useCallback(() => {
    if (!userPlan) return 0;
    return Math.max(0, userPlan.maxEvents - userPlan.eventsCreated);
  }, [userPlan]);

  // Purchase additional events
  const purchaseEvents = useCallback(async (eventCount: number = 1) => {
    if (!user || !user.id) {
      throw new Error('User not authenticated');
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

      toast.success(`Successfully purchased ${eventCount} additional events!`);
      return true;
    } catch (err: any) {
      console.error('Error purchasing events:', err);
      throw new Error(err.message || 'Failed to purchase events');
    }
  }, [user]);

  // Check if user has an active plan
  const hasActivePlan = useCallback(() => {
    if (!userPlan) return false;
    return userPlan.paymentStatus === 'active' || userPlan.paymentStatus === 'pending';
  }, [userPlan]);

  // Upgrade plan
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

  // Refresh plan data
  const refreshPlan = useCallback(async () => {
    return await fetchUserPlan();
  }, [fetchUserPlan]);

  // ✅ Load plan only when auth is loaded and user exists
  useEffect(() => {
    // Wait for auth to finish loading
    if (!authLoading) {
      console.log('Auth loaded, fetching plan...');
      fetchUserPlan();
    }
  }, [authLoading, fetchUserPlan]);

  return {
    userPlan,
    loading: loading || authLoading,
    error,
    fetchUserPlan,
    incrementEventCount,
    canCreateEvent,
    remainingEvents,
    purchaseEvents,
    hasActivePlan,
    upgradePlan,
    refreshPlan,
    PLANS
  };
}