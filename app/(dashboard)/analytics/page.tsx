// app/(dashboard)/analytics/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAnalytics, useEvents } from '@/hooks/useFirebase';
import { 
  Loader2, 
  Users, 
  CheckCircle, 
  XCircle, 
  Hotel, 
  Calendar,
  Download,
  TrendingUp,
  TrendingDown,
  PieChart as PieChartIcon,
  BarChart3,
  Activity
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  ComposedChart,
  Scatter
} from 'recharts';
import toast from 'react-hot-toast';

const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#8B5CF6', '#EC4899'];

export default function AnalyticsPage() {
  const [selectedEvent, setSelectedEvent] = useState('');
  const [timeRange, setTimeRange] = useState('7days');
  const [chartType, setChartType] = useState<'bar' | 'line' | 'area'>('bar');
  
  const { events, loading: eventsLoading } = useEvents();
  const { stats, loading, fetchStats } = useAnalytics(selectedEvent);

  useEffect(() => {
    if (selectedEvent) {
      fetchStats();
    }
  }, [selectedEvent, fetchStats]);

  const handleExportReport = () => {
    if (!stats) {
      toast.error('No data to export');
      return;
    }

    const reportData = {
      event: events.find((e: any) => e.id === selectedEvent),
      stats: stats,
      generatedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics_report_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Report exported successfully!');
  };

  if (eventsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Prepare chart data
  const attendanceData = [
    { name: 'Confirmed', value: stats?.confirmed || 0, color: '#10B981' },
    { name: 'Pending', value: stats?.pending || 0, color: '#F59E0B' },
    { name: 'Declined', value: stats?.declined || 0, color: '#EF4444' },
  ];

  const guestBreakdown = [
    { name: 'With Hotel', value: stats?.hotelGuests || 0, color: '#3B82F6' },
    { name: 'Without Hotel', value: (stats?.totalGuests || 0) - (stats?.hotelGuests || 0), color: '#8B5CF6' },
  ];

  // Mock trend data for demonstration
  const trendData = [
    { date: 'Day 1', confirmed: 10, pending: 5, declined: 2 },
    { date: 'Day 2', confirmed: 15, pending: 8, declined: 3 },
    { date: 'Day 3', confirmed: 20, pending: 10, declined: 4 },
    { date: 'Day 4', confirmed: 25, pending: 12, declined: 5 },
    { date: 'Day 5', confirmed: 30, pending: 15, declined: 6 },
    { date: 'Day 6', confirmed: 35, pending: 18, declined: 7 },
    { date: 'Day 7', confirmed: 40, pending: 20, declined: 8 },
  ];

  // Status distribution for pie chart
  const statusData = [
    { name: 'Confirmed', value: stats?.confirmed || 0 },
    { name: 'Pending', value: stats?.pending || 0 },
    { name: 'Declined', value: stats?.declined || 0 },
  ];

  const renderChart = () => {
    switch (chartType) {
      case 'line':
        return (
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="confirmed" stroke="#10B981" strokeWidth={2} />
            <Line type="monotone" dataKey="pending" stroke="#F59E0B" strokeWidth={2} />
            <Line type="monotone" dataKey="declined" stroke="#EF4444" strokeWidth={2} />
          </LineChart>
        );
      case 'area':
        return (
          <AreaChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey="confirmed" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.3} />
            <Area type="monotone" dataKey="pending" stackId="1" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.3} />
            <Area type="monotone" dataKey="declined" stackId="1" stroke="#EF4444" fill="#EF4444" fillOpacity={0.3} />
          </AreaChart>
        );
      default:
        return (
          <BarChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="confirmed" fill="#10B981" />
            <Bar dataKey="pending" fill="#F59E0B" />
            <Bar dataKey="declined" fill="#EF4444" />
          </BarChart>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Real-time insights and statistics for your events
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleExportReport}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Event Selector */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium mb-1">Select Event</label>
              <select
                value={selectedEvent}
                onChange={(e) => setSelectedEvent(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
              >
                <option value="">Choose an event...</option>
                {events.map((event: any) => (
                  <option key={event.id} value={event.id}>
                    {event.eventName}
                  </option>
                ))}
              </select>
            </div>
            <div className="min-w-[150px]">
              <label className="block text-sm font-medium mb-1">Time Range</label>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
              >
                <option value="7days">Last 7 Days</option>
                <option value="14days">Last 14 Days</option>
                <option value="30days">Last 30 Days</option>
                <option value="all">All Time</option>
              </select>
            </div>
            <div className="min-w-[150px]">
              <label className="block text-sm font-medium mb-1">Chart Type</label>
              <select
                value={chartType}
                onChange={(e) => setChartType(e.target.value as 'bar' | 'line' | 'area')}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
              >
                <option value="bar">Bar Chart</option>
                <option value="line">Line Chart</option>
                <option value="area">Area Chart</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedEvent ? (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Guests</p>
                    <p className="text-2xl font-bold mt-1">{stats?.totalGuests || 0}</p>
                  </div>
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-1 text-xs">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  <span className="text-green-500">+12%</span>
                  <span className="text-gray-500">from last week</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Confirmed</p>
                    <p className="text-2xl font-bold mt-1 text-green-600">{stats?.confirmed || 0}</p>
                  </div>
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-1 text-xs">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  <span className="text-green-500">+8%</span>
                  <span className="text-gray-500">from last week</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Pending</p>
                    <p className="text-2xl font-bold mt-1 text-yellow-600">{stats?.pending || 0}</p>
                  </div>
                  <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                    <Activity className="h-6 w-6 text-yellow-600" />
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-1 text-xs">
                  <TrendingDown className="h-3 w-3 text-red-500" />
                  <span className="text-red-500">-3%</span>
                  <span className="text-gray-500">from last week</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Hotel Guests</p>
                    <p className="text-2xl font-bold mt-1 text-purple-600">{stats?.hotelGuests || 0}</p>
                  </div>
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Hotel className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-1 text-xs">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  <span className="text-green-500">+5%</span>
                  <span className="text-gray-500">from last week</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Attendance Trend Chart */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Attendance Trend
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant={chartType === 'bar' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setChartType('bar')}
                    >
                      Bar
                    </Button>
                    <Button
                      variant={chartType === 'line' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setChartType('line')}
                    >
                      Line
                    </Button>
                    <Button
                      variant={chartType === 'area' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setChartType('area')}
                    >
                      Area
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    {renderChart()}
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Attendance Distribution Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5" />
                  Attendance Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={attendanceData}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {attendanceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  {attendanceData.map((item) => (
                    <div key={item.name}>
                      <div className="text-sm font-medium">{item.value}</div>
                      <div className="text-xs text-gray-500">{item.name}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Hotel Occupancy */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Hotel className="h-5 w-5" />
                  Hotel Occupancy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={guestBreakdown}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {guestBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 flex justify-around">
                  <div className="text-center">
                    <div className="text-sm font-medium">{stats?.hotelGuests || 0}</div>
                    <div className="text-xs text-gray-500">With Hotel</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-medium">
                      {(stats?.totalGuests || 0) - (stats?.hotelGuests || 0)}
                    </div>
                    <div className="text-xs text-gray-500">Without Hotel</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-medium">{stats?.occupancy?.toFixed(1) || 0}%</div>
                    <div className="text-xs text-gray-500">Occupancy Rate</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Status Breakdown */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Status Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
                    <p className="text-3xl font-bold text-green-600">{stats?.confirmed || 0}</p>
                    <p className="text-sm text-green-600">Confirmed</p>
                    <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full"
                        style={{ 
                          width: `${stats?.totalGuests ? (stats.confirmed / stats.totalGuests) * 100 : 0}%` 
                        }}
                      />
                    </div>
                  </div>
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-center">
                    <p className="text-3xl font-bold text-yellow-600">{stats?.pending || 0}</p>
                    <p className="text-sm text-yellow-600">Pending</p>
                    <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-yellow-600 h-2 rounded-full"
                        style={{ 
                          width: `${stats?.totalGuests ? (stats.pending / stats.totalGuests) * 100 : 0}%` 
                        }}
                      />
                    </div>
                  </div>
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-center">
                    <p className="text-3xl font-bold text-red-600">{stats?.declined || 0}</p>
                    <p className="text-sm text-red-600">Declined</p>
                    <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-red-600 h-2 rounded-full"
                        style={{ 
                          width: `${stats?.totalGuests ? (stats.declined / stats.totalGuests) * 100 : 0}%` 
                        }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Total Invited</p>
                  <p className="text-lg font-bold">{stats?.totalGuests || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Response Rate</p>
                  <p className="text-lg font-bold">
                    {stats?.totalGuests ? 
                      ((((stats.confirmed || 0) + (stats.declined || 0)) / stats.totalGuests) * 100).toFixed(1) 
                      : 0}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Confirmation Rate</p>
                  <p className="text-lg font-bold">
                    {stats?.totalGuests ? 
                      ((stats.confirmed || 0) / stats.totalGuests * 100).toFixed(1) 
                      : 0}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Hotel Occupancy</p>
                  <p className="text-lg font-bold">{stats?.occupancy?.toFixed(1) || 0}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Calendar className="h-16 w-16 mx-auto text-gray-400" />
              <h3 className="mt-4 text-lg font-medium">Select an Event</h3>
              <p className="text-gray-500">Choose an event to view detailed analytics and insights</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}