// app/(dashboard)/settings/billing/page.tsx
"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/providers/AuthProvider';
import { usePlanExpiry } from '@/hooks/usePlanExpiry';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/config';
import toast from 'react-hot-toast';
import { Check, Crown, Loader2, ArrowLeft, Sparkles, Mail } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface Plan {
  id: string;
  name: string;
  price: number | null; // null = custom / contact us
  originalPrice?: number; // for showing a strikethrough discount
  durationDays: number | null; // null = not applicable (custom)
  durationLabel: string;
  description: string;
  features: string[];
  bestValue?: boolean; // marketing tag, independent from selection state
  isFree?: boolean;
  isCustom?: boolean;
}

const PLANS: Plan[] = [
  {
    id: 'free-trial',
    name: 'Free Trial',
    price: 0,
    durationDays: 30,
    durationLabel: '1 Month',
    description: 'Try EventFlux with no cost',
    isFree: true,
    features: [
      'Up to 1 event',
      'Up to 100 guests',
      'Basic RSVP management',
      'Email support',
    ],
  },
  {
    id: 'six-month',
    name: '6 Months',
    price: 11999,
    durationDays: 182,
    durationLabel: '6 Months',
    description: 'Best for a season of events',
    features: [
      'Unlimited events',
      'Up to 1000 guests per event',
      'WhatsApp automation',
      'Accommodation management',
      'Priority support',
    ],
  },
  {
    id: 'twelve-month',
    name: '12 Months',
    price: 19999,
    originalPrice: 23999,
    durationDays: 365,
    durationLabel: '12 Months',
    description: 'Best value — 2 months free',
    bestValue: true,
    features: [
      'Everything in 6 Months',
      'Unlimited guests',
      'Custom branding',
      'Dedicated account manager',
      'Priority WhatsApp support',
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
    ],
  },
];

export default function BillingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { planName, daysLeft, status: planStatus } = usePlanExpiry();
  const [processingPlanId, setProcessingPlanId] = useState<string | null>(null);

  const handleSelectPlan = async (plan: Plan) => {
    if (plan.isCustom) {
      window.location.href = 'mailto:sales@eventflux.com?subject=Custom Plan Enquiry';
      return;
    }

    if (!user) {
      toast.error('Please sign in first');
      return;
    }

    if (!plan.durationDays) return;

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
        doc(db, 'users', user.uid),
        {
          planName: plan.name,
          planId: plan.id,
          planExpiryDate: Timestamp.fromDate(newExpiry),
          planUpdatedAt: Timestamp.now(),
        },
        { merge: true }
      );

      toast.success(`${plan.name} plan activated!`);
    } catch (error) {
      console.error('Error updating plan:', error);
      toast.error('Failed to update plan. Please try again.');
    } finally {
      setProcessingPlanId(null);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
 

      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Choose Your Plan</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Start free, or pick a plan that fits how long you need EventFlux
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {PLANS.map((plan) => {
          const isCurrentPlan = planName === plan.name && planStatus !== 'expired' && planStatus !== 'none';
          const isProcessing = processingPlanId === plan.id;

          // Decide which badge (if any) this card shows, above the card itself
          let badgeNode: React.ReactNode = null;
          if (isCurrentPlan) {
            badgeNode = (
              <Badge variant="default" className="px-3 py-1 bg-blue-600 hover:bg-blue-600">
                Your Plan
              </Badge>
            );
          } else if (plan.bestValue) {
            badgeNode = <Badge variant="success" className="px-3 py-1">Best Value</Badge>;
          } else if (plan.isFree) {
            badgeNode = (
              <Badge variant="warning" className="px-3 py-1 flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                No Cost
              </Badge>
            );
          }

          return (
            // Outer wrapper is NOT clipped (no overflow-hidden), so the badge
            // sits fully outside/above the Card and never gets cut off,
            // regardless of the Card component's own rounded-corner overflow styling.
            <div key={plan.id} className="relative pt-4">
              {badgeNode && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10">
                  {badgeNode}
                </div>
              )}
              <Card
                className={cn(
                  'flex flex-col h-full transition-all',
                  isCurrentPlan && 'border-2 border-blue-500 shadow-lg'
                )}
              >
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>

                <CardContent className="flex flex-col flex-1">
                  <div className="mb-6">
                    {plan.isCustom ? (
                      <span className="text-2xl font-bold text-gray-900 dark:text-white">
                        Let's Talk
                      </span>
                    ) : plan.isFree ? (
                      <span className="text-3xl font-bold text-gray-900 dark:text-white">Free</span>
                    ) : (
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="text-3xl font-bold text-gray-900 dark:text-white">
                          ₹{plan.price!.toLocaleString('en-IN')}
                        </span>
                        {plan.originalPrice && (
                          <span className="text-sm text-gray-400 line-through">
                            ₹{plan.originalPrice.toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-1">{plan.durationLabel}</p>
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
                    variant={isCurrentPlan ? 'default' : 'outline'}
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
                    ) : plan.isFree ? (
                      'Start Free Trial'
                    ) : (
                      'Select Plan'
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>

      <p className="text-center text-xs text-gray-500 mt-8">
        This activates the plan directly. Connect a real payment gateway (Razorpay/Stripe) before going live.
      </p>
    </div>
  );
}