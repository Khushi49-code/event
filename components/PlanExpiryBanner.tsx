// components/PlanExpiryBanner.tsx
"use client";

import Link from 'next/link';
import { AlertTriangle, Clock, XCircle } from 'lucide-react';
import { usePlanExpiry } from '@/hooks/usePlanExpiry';

export function PlanExpiryBanner() {
  const { daysLeft, status, loading } = usePlanExpiry();

  if (loading || status === 'none' || status === 'ok') return null;

  const configs = {
    expired: {
      bg: 'bg-red-600',
      icon: XCircle,
      text: 'Your plan has expired. Renew now to continue using EventPro without interruption.',
    },
    urgent: {
      bg: 'bg-red-500',
      icon: AlertTriangle,
      text: `Your plan expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'}. Renew now to avoid interruption.`,
    },
    warning: {
      bg: 'bg-orange-500',
      icon: AlertTriangle,
      text: `Your plan expires in ${daysLeft} days. Please renew soon.`,
    },
    reminder: {
      bg: 'bg-yellow-500',
      icon: Clock,
      text: `Your plan expires in ${daysLeft} days. Consider renewing to avoid any interruption.`,
    },
  } as const;

  const config = configs[status as keyof typeof configs];
  if (!config) return null;

  const Icon = config.icon;

  return (
    <div className={`${config.bg} text-white rounded-xl p-4 flex items-center justify-between gap-4 flex-wrap shadow-sm`}>
      <div className="flex items-center gap-3 min-w-0">
        <Icon className="h-5 w-5 shrink-0" />
        <p className="text-sm font-medium">{config.text}</p>
      </div>
      <Link href="/settings/billing">
        <button className="bg-white/20 hover:bg-white/30 transition-colors text-white text-sm font-medium px-4 py-2 rounded-lg whitespace-nowrap">
          Renew Now
        </button>
      </Link>
    </div>
  );
}