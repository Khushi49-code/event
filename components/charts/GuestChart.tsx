// components/charts/GuestChart.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList
} from 'recharts';
import { Users, TrendingUp, TrendingDown } from 'lucide-react';

interface GuestChartProps {
  data: Array<{
    name: string;
    guests: number;
    confirmed?: number;
    pending?: number;
  }>;
  title?: string;
  height?: number;
}

export function GuestChart({ 
  data, 
  title = 'Guest Distribution',
  height = 300
}: GuestChartProps) {
  const totalGuests = data.reduce((sum, item) => sum + item.guests, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-gray-500">Total Guests</p>
            <p className="text-2xl font-bold">{totalGuests}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500 rounded" />
              <span className="text-xs">Confirmed</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-yellow-500 rounded" />
              <span className="text-xs">Pending</span>
            </div>
          </div>
        </div>
        <div style={{ height: `${height}px` }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" stroke="#9ca3af" />
              <YAxis dataKey="name" type="category" stroke="#9ca3af" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Bar dataKey="confirmed" fill="#10B981" radius={[0, 4, 4, 0]}>
                <LabelList dataKey="confirmed" position="right" />
              </Bar>
              <Bar dataKey="pending" fill="#F59E0B" radius={[0, 4, 4, 0]}>
                <LabelList dataKey="pending" position="right" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}