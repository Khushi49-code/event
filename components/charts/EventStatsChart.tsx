// components/charts/EventStatsChart.tsx
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
  Cell
} from 'recharts';
import { BarChart3 } from 'lucide-react';

interface EventStatsChartProps {
  data: Array<{
    name: string;
    guests: number;
    confirmed: number;
    pending: number;
  }>;
  title?: string;
  height?: number;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B'];

export function EventStatsChart({ 
  data, 
  title = 'Event Statistics',
  height = 300
}: EventStatsChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ height: `${height}px` }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Bar dataKey="guests" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="confirmed" fill="#10B981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="pending" fill="#F59E0B" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}