// components/charts/AnalyticsStats.tsx
"use client";

import { Card, CardContent } from '@/components/ui/Card';
import { 
  Users, 
  CheckCircle, 
  XCircle, 
  Hotel, 
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';

interface AnalyticsStatsProps {
  stats: {
    totalGuests: number;
    confirmed: number;
    pending: number;
    declined: number;
    hotelGuests: number;
    occupancy: number;
  } | null;
  loading?: boolean;
}

export function AnalyticsStats({ stats, loading = false }: AnalyticsStatsProps) {
  // Show skeleton while loading OR when stats hasn't been fetched yet (null)
  if (loading || !stats) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
                <div className="h-8 bg-gray-200 rounded w-1/3" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const items = [
    {
      label: 'Total Guests',
      value: stats.totalGuests,
      icon: Users,
      color: 'bg-blue-500',
      trend: '+12%',
      trendUp: true
    },
    {
      label: 'Confirmed',
      value: stats.confirmed,
      icon: CheckCircle,
      color: 'bg-green-500',
      trend: '+8%',
      trendUp: true
    },
    {
      label: 'Pending',
      value: stats.pending,
      icon: Calendar,
      color: 'bg-yellow-500',
      trend: '-3%',
      trendUp: false
    },
    {
      label: 'Declined',
      value: stats.declined,
      icon: XCircle,
      color: 'bg-red-500',
      trend: '+2%',
      trendUp: false
    },
    {
      label: 'Hotel Guests',
      value: stats.hotelGuests,
      icon: Hotel,
      color: 'bg-purple-500',
      trend: '+5%',
      trendUp: true
    },
    {
      label: 'Occupancy',
      value: `${stats.occupancy.toFixed(1)}%`,
      icon: Hotel,
      color: 'bg-indigo-500',
      trend: '+3%',
      trendUp: true
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((item) => (
        <Card key={item.label} className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{item.label}</p>
                <p className="text-2xl font-bold mt-1">{item.value}</p>
              </div>
              <div className={`${item.color} p-3 rounded-lg text-white`}>
                <item.icon size={24} />
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1 text-xs">
              {item.trendUp ? (
                <TrendingUp className="h-3 w-3 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500" />
              )}
              <span className={item.trendUp ? 'text-green-500' : 'text-red-500'}>
                {item.trend}
              </span>
              <span className="text-gray-500">from last week</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}