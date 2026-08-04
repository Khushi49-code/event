// app/(dashboard)/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useEvents, useAnalytics, useWeeklyTrend, useEventsOverview, useRecentActivity } from '@/hooks/useFirebase';
import { 
  Calendar, 
  Users, 
  Mail, 
  Hotel, 
  CheckCircle, 
  TrendingUp,
  TrendingDown,
  Loader2,
  ArrowRight,
  Clock,
  UserPlus,
  Gift,
  MessageSquare,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';
import {
  AttendanceChart,
  PieChartComponent,
  AnalyticsStats,
  StatusDistribution,
  EventStatsChart,
  GuestChart
} from '@/components/charts';

export default function DashboardPage() {
  const { events, loading: eventsLoading } = useEvents();
  const [selectedEvent, setSelectedEvent] = useState('');
  const { stats, loading: statsLoading, fetchStats } = useAnalytics(selectedEvent);
  const { trend: trendData, loading: trendLoading } = useWeeklyTrend(selectedEvent);
  const { overview: eventsOverview, loading: overviewLoading } = useEventsOverview(events);
  const { activity, loading: activityLoading } = useRecentActivity(selectedEvent);

  // Set first event as selected when events load
  useEffect(() => {
    if (events.length > 0 && !selectedEvent) {
      setSelectedEvent(events[0]?.id || '');
    }
  }, [events]);

  // Fetch stats when selected event changes
  useEffect(() => {
    if (selectedEvent) {
      fetchStats();
    }
  }, [selectedEvent, fetchStats]);

  // Prepare attendance data with proper colors
  const attendanceData = [
    { name: 'Confirmed', value: stats?.confirmed || 0, color: '#10B981' },
    { name: 'Pending', value: stats?.pending || 0, color: '#F59E0B' },
    { name: 'Declined', value: stats?.declined || 0, color: '#EF4444' },
  ];

  // GuestChart expects { name, guests, confirmed, pending } per row
  const guestChartData = eventsOverview.map((e) => ({
    name: e.name,
    guests: e.guests,
    confirmed: e.confirmed,
    pending: e.pending,
  }));

  if (eventsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white">
        <div className="flex flex-col @2xl:flex-row @2xl:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Welcome to EventPro</h1>
            <p className="text-blue-100 mt-1">
              Manage your events, guests, and invitations all in one place
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/events/create">
              <Button variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-0">
                <Calendar className="mr-2 h-4 w-4" />
                Create Event
              </Button>
            </Link>
            <Link href="/invitations/builder">
              <Button variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-0">
                <Sparkles className="mr-2 h-4 w-4" />
                Create Invitation
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Event Selector */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium mb-1">Viewing Analytics For</label>
              <select
                value={selectedEvent}
                onChange={(e) => setSelectedEvent(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
              >
                {events.map((event: any) => (
                  <option key={event.id} value={event.id}>
                    {event.eventName}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analytics Stats - Pass stats directly */}
      <AnalyticsStats stats={stats} loading={statsLoading} />

      {/* Charts Section - selected event */}
      <div className="grid grid-cols-1 @3xl:grid-cols-2 gap-6">
        <AttendanceChart 
          data={trendData} 
          title="Attendance Trend (Last 7 Days)"
          type="area"
        />
        <StatusDistribution 
          data={attendanceData}
          title="Status Distribution"
        />
      </div>

      {/* Charts Section - across all events */}
      <div className="grid grid-cols-1 @3xl:grid-cols-2 gap-6">
        <EventStatsChart 
          data={eventsOverview}
          title="Guests by Event"
        />
        <GuestChart 
          data={guestChartData}
          title="Guest Breakdown by Event"
        />
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 @3xl:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Activity</CardTitle>
            <Link href="/analytics">
              <Button variant="ghost" size="sm">
                View All <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {activityLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse flex items-center justify-between py-2">
                    <div className="space-y-2 w-2/3">
                      <div className="h-3 bg-gray-200 rounded w-full" />
                      <div className="h-2 bg-gray-200 rounded w-1/3" />
                    </div>
                    <div className="h-5 bg-gray-200 rounded w-16" />
                  </div>
                ))}
              </div>
            ) : activity.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">No recent activity yet</p>
            ) : (
              <div className="space-y-4">
                {activity.map((item) => (
                  <div 
                    key={item.id} 
                    className="flex items-center justify-between gap-3 py-2 border-b border-gray-100 dark:border-gray-700 last:border-0"
                  >
                    <div className="min-w-0">
                      <p className="text-sm truncate">
                        <span className="font-medium">{item.user}</span>
                        {' '}{item.action}
                      </p>
                      <p className="text-xs text-gray-500">{item.time}</p>
                    </div>
                    <Badge 
                      variant={
                        item.status === 'Confirmed' || item.status === 'Added' 
                          ? 'success' 
                          : item.status === 'Pending'
                          ? 'warning'
                          : 'danger'
                      }
                      className="shrink-0"
                    >
                      {item.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Link href="/events/create">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors cursor-pointer group">
                  <Calendar className="h-8 w-8 mx-auto text-blue-600 group-hover:scale-110 transition-transform mb-2" />
                  <p className="text-sm font-medium">Create Event</p>
                </div>
              </Link>
              <Link href="/invitations/builder">
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-center hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors cursor-pointer group">
                  <Mail className="h-8 w-8 mx-auto text-purple-600 group-hover:scale-110 transition-transform mb-2" />
                  <p className="text-sm font-medium">Send Invites</p>
                </div>
              </Link>
              <Link href="/guests">
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg text-center hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors cursor-pointer group">
                  <Users className="h-8 w-8 mx-auto text-green-600 group-hover:scale-110 transition-transform mb-2" />
                  <p className="text-sm font-medium">Manage Guests</p>
                </div>
              </Link>
              <Link href="/whatsapp">
                <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-center hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors cursor-pointer group">
                  <MessageSquare className="h-8 w-8 mx-auto text-orange-600 group-hover:scale-110 transition-transform mb-2" />
                  <p className="text-sm font-medium">WhatsApp</p>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Events */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Upcoming Events
          </CardTitle>
          <Link href="/events">
            <Button variant="ghost" size="sm">
              View All <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 @2xl:grid-cols-2 @5xl:grid-cols-3 gap-4">
            {events.slice(0, 3).map((event: any) => (
              <Link key={event.id} href={`/events/${event.id}`}>
                <div className="p-4 border rounded-lg hover:border-blue-500 hover:shadow-md transition-all cursor-pointer">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{event.eventName}</h3>
                    <Badge variant="success">{event.eventType}</Badge>
                  </div>
                  <div className="space-y-1 text-sm text-gray-500">
                    <p className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {new Date(event.eventDate).toLocaleDateString()}
                    </p>
                    <p className="flex items-center gap-2">
                      <Hotel className="h-4 w-4" />
                      {event.venue}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
            {events.length === 0 && (
              <div className="col-span-3 text-center py-8 text-gray-500">
                <p>No upcoming events</p>
                <Link href="/events/create">
                  <Button variant="link" className="mt-2">
                    Create your first event
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}