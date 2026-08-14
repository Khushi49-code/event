// app/(dashboard)/settings/billing/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/contexts/AuthContext';
import { usePlanExpiry } from '@/hooks/usePlanExpiry';
import { usePaymentPlans } from '@/hooks/usePaymentPlans';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/config';
import toast from 'react-hot-toast';
import { Check, Crown, Loader2, Mail, Sparkles, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface Plan {
  id: string;
  name: string;
  price: number | null;
  durationDays: number | null;
  durationLabel: string;
  description: string;
  features: string[];
  bestValue?: boolean;
  isFree?: boolean;
  isCustom?: boolean;
  pricePerEvent?: boolean;
  // How many event credits this purchase grants in userPlans/{uid}.maxEvents.
  eventCredits?: number;
}

const PLANS: Plan[] = [
  {
    id: 'pro',
    name: 'Pro',
    price: 100,
    durationDays: 365,
    durationLabel: 'Per Event / Year',
    description: 'Pay per event with full features',
    pricePerEvent: true,
    eventCredits: 1,
    features: [
      'Full event management',
      'Unlimited guests per event',
      'WhatsApp automation',
      'RSVP management',
      'Accommodation management',
      'Email support',
      'All premium features',
    ],
  },
  {
    id: 'custom',
    name: 'Custom',
    price: null,
    durationDays: null,
    durationLabel: 'Tailored to you',
    description: 'For large teams or specific needs',
    isCustom: true,
    features: [
      'Custom event & guest limits',
      'Custom contract duration',
      'API access',
      'Dedicated onboarding',
      'SLA-backed support',
      'Priority WhatsApp support',
    ],
  },
];

// ✅ Make sure this is the default export
export default function BillingPage() {
  const router = useRouter();
  const { user, loading: authLoading, firebaseUser } = useAuth();
  const { planName, daysLeft, status: planStatus, loading: planLoading } = usePlanExpiry();
  // ✅ This is the hook that actually gates event creation (userPlans/{uid}).
  // Selecting a plan here must also update it, or canCreateEvent() on the
  // create-event page never sees the change.
  const { purchaseEvents, refreshPlan: refreshPaymentPlan } = usePaymentPlans();
  const [processingPlanId, setProcessingPlanId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect only after loading is complete and user is not found
  useEffect(() => {
    if (mounted && !authLoading && !user && !firebaseUser) {
      router.push('/auth/signin');
    }
  }, [mounted, authLoading, user, firebaseUser, router]);

  const handleSelectPlan = async (plan: Plan) => {
    if (plan.isCustom) {
      window.location.href = 'mailto:sales@eventflux.com?subject=Custom Plan Enquiry';
      return;
    }

    // `user` (from useAuth) only carries an `id` field — it does not have a
    // `uid` property, so we fall back to the raw Firebase user's `uid`.
    const uid = user?.id || firebaseUser?.uid;

    if (!uid) {
      toast.error('Please sign in first');
      router.push('/auth/signin');
      return;
    }

    if (!plan.durationDays) {
      toast.error('Invalid plan configuration');
      return;
    }

    setProcessingPlanId(plan.id);
    try {
      const now = new Date();
      const isSamePlanActive = planName === plan.name && planStatus !== 'expired' && planStatus !== 'none';

      let baseDate = now;
      if (isSamePlanActive && daysLeft && daysLeft > 0) {
        baseDate = new Date(now.getTime() + daysLeft * 24 * 60 * 60 * 1000);
      }

      const newExpiry = new Date(baseDate.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

      // 1. users/{uid} — drives the plan-name/expiry badge & reminder banner
      await setDoc(
        doc(db, 'users', uid),
        {
          planName: plan.name,
          planId: plan.id,
          planExpiryDate: Timestamp.fromDate(newExpiry),
          planUpdatedAt: Timestamp.now(),
        },
        { merge: true }
      );

      // 2. userPlans/{uid} — drives canCreateEvent()/remainingEvents() on the
      //    create-event page. Without this, the newly selected plan never
      //    actually grants event credits, even though the badge above updates.
      if (plan.pricePerEvent && plan.eventCredits) {
        await purchaseEvents(plan.eventCredits);
      }
      await refreshPaymentPlan();

      toast.success(`${plan.name} plan activated!`);
      router.refresh();
    } catch (error: any) {
      console.error('Error updating plan:', error);
      toast.error(error.message || 'Failed to update plan. Please try again.');
    } finally {
      setProcessingPlanId(null);
    }
  };

  // Loading state
  if (!mounted || authLoading || planLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-500">Loading billing information...</p>
        </div>
      </div>
    );
  }

  // If no user, show message
  if (!user && !firebaseUser) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-8 text-center max-w-lg mx-auto">
          <h2 className="text-2xl font-bold mb-4">Please Sign In</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You need to be signed in to manage your billing.
          </p>
          <Button onClick={() => router.push('/auth/signin')}>Sign In</Button>
        </div>
      </div>
    );
  }

  // Main render
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Choose Your Plan</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Simple pricing — pay per event or get a custom plan
        </p>

        {planName && (
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-full">
            <Crown className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-700 dark:text-blue-400">
              Current plan: {planName}
              {daysLeft !== null && planStatus !== 'expired' && ` · ${daysLeft} day${daysLeft === 1 ? '' : 's'} left`}
              {planStatus === 'expired' && ' · Expired'}
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {PLANS.map((plan) => {
          const isCurrentPlan = planName === plan.name && planStatus !== 'expired' && planStatus !== 'none';
          const isProcessing = processingPlanId === plan.id;

          let badgeNode: React.ReactNode = null;
          if (isCurrentPlan) {
            badgeNode = (
              <Badge variant="default" className="px-3 py-1 bg-blue-600 hover:bg-blue-600 text-white">
                Your Plan
              </Badge>
            );
          } else if (plan.isCustom) {
            badgeNode = (
              <Badge variant="default" className="px-3 py-1 bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 border-2 border-purple-500">
                <Sparkles className="h-3 w-3 mr-1" />
                Enterprise
              </Badge>
            );
          } else if (plan.pricePerEvent) {
            badgeNode = (
              <Badge variant="success" className="px-3 py-1">
                <Zap className="h-3 w-3 mr-1" />
                Popular
              </Badge>
            );
          }

          return (
            <div key={plan.id} className="relative pt-4">
              {badgeNode && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10">
                  {badgeNode}
                </div>
              )}
              <Card
                className={cn(
                  'flex flex-col h-full transition-all hover:shadow-lg',
                  isCurrentPlan && 'border-2 border-blue-500 shadow-lg',
                  plan.isCustom && 'border-2 border-purple-200 dark:border-purple-800'
                )}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {plan.isCustom ? (
                      <Sparkles className="h-5 w-5 text-purple-500" />
                    ) : (
                      <Zap className="h-5 w-5 text-blue-500" />
                    )}
                    {plan.name}
                  </CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>

                <CardContent className="flex flex-col flex-1">
                  <div className="mb-6">
                    {plan.isCustom ? (
                      <span className="text-2xl font-bold text-gray-900 dark:text-white">
                        Let's Talk
                      </span>
                    ) : plan.pricePerEvent ? (
                      <div>
                        <span className="text-4xl font-bold text-gray-900 dark:text-white">
                          ${plan.price}
                        </span>
                        <span className="text-sm text-gray-500 ml-2">/ event</span>
                        <p className="text-xs text-gray-400 mt-1">Billed annually</p>
                      </div>
                    ) : (
                      <span className="text-3xl font-bold text-gray-900 dark:text-white">Free</span>
                    )}
                  </div>

                  <ul className="space-y-3 mb-6 flex-1">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className="w-full"
                    variant={isCurrentPlan ? 'default' : plan.isCustom ? 'outline' : 'default'}
                    disabled={isProcessing}
                    onClick={() => handleSelectPlan(plan)}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : plan.isCustom ? (
                      <>
                        <Mail className="mr-2 h-4 w-4" />
                        Contact Sales
                      </>
                    ) : isCurrentPlan ? (
                      'Renew Plan'
                    ) : (
                      'Select Plan'
                    )}
                  </Button>

                  {plan.pricePerEvent && !isCurrentPlan && (
                    <p className="text-xs text-center text-gray-400 mt-3">
                      Pay only for events you create
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>

      <div className="mt-12 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            💡 All plans include: WhatsApp automation, RSVP management, Guest management
          </span>
        </div>
      </div>     
    </div>
  );
}