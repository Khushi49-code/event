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
import { Check, Crown, Loader2, Mail, Sparkles, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  const { user } = useAuth();
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