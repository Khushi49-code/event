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
import { Check, CreditCard, Crown, IndianRupee, Loader2, Mail, Minus, Plus, Sparkles, Zap } from 'lucide-react';
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
  eventCredits?: number;
}

// Price per single event credit — used both for purchases and for
// estimating total amount paid on the credits summary below.
const PRICE_PER_CREDIT = 100;

const PLANS: Plan[] = [
  {
    id: 'pro',
    name: 'Pro',
    price: PRICE_PER_CREDIT,
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

export default function BillingPage() {
  const router = useRouter();
  const { user, loading: authLoading, firebaseUser } = useAuth();
  const { planName, daysLeft, status: planStatus, loading: planLoading } = usePlanExpiry();
  const { userPlan, purchaseEvents, remainingEvents, refreshPlan: refreshPaymentPlan } = usePaymentPlans();
  const [processingPlanId, setProcessingPlanId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const getQuantity = (planId: string) => quantities[planId] ?? 1;
  const setQuantity = (planId: string, qty: number) => {
    const clamped = Math.max(1, Math.min(999, qty || 1));
    setQuantities((prev) => ({ ...prev, [planId]: clamped }));
  };

  useEffect(() => {
    setMounted(true);
  }, []);

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

    const qty = plan.pricePerEvent ? getQuantity(plan.id) : 1;

    setProcessingPlanId(plan.id);
    try {
      const now = new Date();
      const isSamePlanActive = planName === plan.name && planStatus !== 'expired' && planStatus !== 'none';

      let baseDate = now;
      if (isSamePlanActive && daysLeft && daysLeft > 0) {
        baseDate = new Date(now.getTime() + daysLeft * 24 * 60 * 60 * 1000);
      }

      const newExpiry = new Date(baseDate.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

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

      if (plan.pricePerEvent && plan.eventCredits) {
        await purchaseEvents(plan.eventCredits * qty);
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

  // 🔥 NEW: credits summary numbers.
  // - totalPurchased: total event credits ever bought (maxEvents).
  // - totalPaid: estimated total money paid, at $100/credit.
  // - active: credits currently in use (Active events, live-counted).
  // - forfeited: credits permanently burned (cancelled after invitation was shared/downloaded).
  // - remaining: credits still available to activate a new event.
  const totalPurchased = userPlan?.maxEvents || 0;
  const totalPaid = totalPurchased * PRICE_PER_CREDIT;
  const activeUsed = userPlan?.eventsCreated || 0; // now mirrors live active-event count
  const forfeited = userPlan?.forfeitedCredits || 0;
  const remaining = remainingEvents();

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

      {/* 🔥 NEW: Your Credits summary */}
      <Card className="max-w-4xl mx-auto mb-10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <CreditCard className="h-5 w-5 text-blue-600" />
            Your Credits
          </CardTitle>
          <CardDescription>Payment and event-credit history at a glance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">Total Paid</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center justify-center gap-0.5">
                <IndianRupee className="h-4 w-4 hidden" />${totalPaid}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">Credits Purchased</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{totalPurchased}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">Currently Active</p>
              <p className="text-xl sm:text-2xl font-bold text-blue-600">{activeUsed}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">Forfeited</p>
              <p className="text-xl sm:text-2xl font-bold text-orange-600">{forfeited}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">Remaining</p>
              <p className="text-xl sm:text-2xl font-bold text-green-600">{remaining}</p>
            </div>
          </div>
          {forfeited > 0 && (
            <p className="text-xs text-gray-400 mt-4 text-center">
              Forfeited credits belonged to events that were cancelled after their invitation was already shared or downloaded — those don't come back.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {PLANS.map((plan) => {
          const isCurrentPlan = planName === plan.name && planStatus !== 'expired' && planStatus !== 'none';
          const isProcessing = processingPlanId === plan.id;
          const qty = getQuantity(plan.id);
          const totalPrice = plan.pricePerEvent && plan.price ? plan.price * qty : plan.price;

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
                          ${totalPrice}
                        </span>
                        <span className="text-sm text-gray-500 ml-2">
                          {qty > 1 ? `for ${qty} events` : '/ event'}
                        </span>
                        <p className="text-xs text-gray-400 mt-1">Billed annually · ${plan.price}/event</p>
                      </div>
                    ) : (
                      <span className="text-3xl font-bold text-gray-900 dark:text-white">Free</span>
                    )}
                  </div>

                  {plan.pricePerEvent && (
                    <div className="mb-6">
                      <label className="block text-xs font-medium text-gray-500 mb-1.5">
                        Number of events
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setQuantity(plan.id, qty - 1)}
                          disabled={isProcessing || qty <= 1}
                          className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 transition-colors"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <input
                          type="number"
                          min={1}
                          value={qty}
                          onChange={(e) => setQuantity(plan.id, parseInt(e.target.value, 10))}
                          disabled={isProcessing}
                          className="w-16 text-center px-2 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => setQuantity(plan.id, qty + 1)}
                          disabled={isProcessing}
                          className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 transition-colors"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}

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
                    ) : plan.pricePerEvent ? (
                      qty > 1 ? `Buy ${qty} Events — $${totalPrice}` : 'Select Plan'
                    ) : isCurrentPlan ? (
                      'Renew Plan'
                    ) : (
                      'Select Plan'
                    )}
                  </Button>

                  {plan.pricePerEvent && (
                    <p className="text-xs text-center text-gray-400 mt-3">
                      Pay only for events you activate
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