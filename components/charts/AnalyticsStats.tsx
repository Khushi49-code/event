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
  Loader2
} from 'lucide-react';

interface AnalyticsStatsProps {
  stats: {
    totalGuests: number;
    confirmed: number;
    pending: number;
    declined: number;
    hotelGuests?: number;
    occupancy?: number;
    responseRate?: number;
    confirmationRate?: number;
  } | null;
  loading?: boolean;
}

export function AnalyticsStats({ stats, loading = false }: AnalyticsStatsProps) {
  // Show skeleton while loading
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2" />
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // If no stats, show zeros
  const displayStats = stats || {
    totalGuests: 0,
    confirmed: 0,
    pending: 0,
    declined: 0,
    hotelGuests: 0,
    occupancy: 0,
    responseRate: 0,
    confirmationRate: 0
  };

  const items = [
    {
      label: 'Total Guests',
      value: displayStats.totalGuests,
      icon: Users,
      color: 'bg-blue-500',
      description: displayStats.totalGuests === 0 ? 'No guests yet' : 'Total registered guests'
    },
    {
      label: 'Confirmed',
      value: displayStats.confirmed,
      icon: CheckCircle,
      color: 'bg-green-500',
      description: displayStats.totalGuests === 0 ? 'No confirmations yet' : `${displayStats.confirmationRate?.toFixed(1) || 0}% confirmation rate`
    },
    {
      label: 'Pending',
      value: displayStats.pending,
      icon: Calendar,
      color: 'bg-yellow-500',
      description: displayStats.totalGuests === 0 ? 'No pending guests' : 'Awaiting response'
    },
    {
      label: 'Declined',
      value: displayStats.declined || 0,
      icon: XCircle,
      color: 'bg-red-500',
      description: displayStats.totalGuests === 0 ? 'No declines' : `${((displayStats.declined || 0) / displayStats.totalGuests * 100).toFixed(1)}% declined`
    },
    {
      label: 'Hotel Guests',
      value: displayStats.hotelGuests || 0,
      icon: Hotel,
      color: 'bg-purple-500',
      description: displayStats.totalGuests === 0 ? 'No hotel guests' : 'Need accommodation'
    },
    {
      label: 'Occupancy',
      value: `${(displayStats.occupancy || 0).toFixed(1)}%`,
      icon: Hotel,
      color: 'bg-indigo-500',
      description: displayStats.totalGuests === 0 ? 'No occupancy data' : 'Current occupancy rate'
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((item) => (
        <Card key={item.label} className="hover:shadow-lg transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  {item.label}
                </p>
                <p className="text-2xl font-bold mt-1 text-gray-900 dark:text-gray-100">
                  {item.value}
                </p>
                {item.description && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    {item.description}
                  </p>
                )}
              </div>
              <div className={`${item.color} p-3 rounded-lg text-white shrink-0`}>
                <item.icon size={24} />
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1 text-xs">
              {displayStats.totalGuests === 0 ? (
                <span className="text-gray-400">No data yet</span>
              ) : (
                <span className="text-gray-400">Updated recently</span>
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Response Rate Card */}
      <Card className="hover:shadow-lg transition-shadow duration-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                Response Rate
              </p>
              <p className="text-2xl font-bold mt-1 text-gray-900 dark:text-gray-100">
                {(displayStats.responseRate || 0).toFixed(1)}%
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {displayStats.totalGuests === 0 
                  ? 'No guests yet' 
                  : `${(displayStats.confirmed || 0) + (displayStats.declined || 0)} of ${displayStats.totalGuests} responded`}
              </p>
            </div>
            <div className="bg-teal-500 p-3 rounded-lg text-white shrink-0">
              <Users size={24} />
            </div>
          </div>
          <div className="mt-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-teal-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${displayStats.responseRate || 0}%` }}
            />
          </div>
          {displayStats.totalGuests === 0 && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 text-center">
              Add guests to see response rate
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}