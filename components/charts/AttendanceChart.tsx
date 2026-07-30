// components/charts/AttendanceChart.tsx
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
  Line,
  ComposedChart,
  Area,
  AreaChart
} from 'recharts';
import { Activity, TrendingUp, TrendingDown } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

interface AttendanceChartProps {
  data: any[];
  title?: string;
  type?: 'bar' | 'line' | 'area';
  height?: number;
}

export function AttendanceChart({ 
  data, 
  title = 'Attendance Overview',
  type = 'bar',
  height = 300
}: AttendanceChartProps) {
  const renderChart = () => {
    switch (type) {
      case 'line':
        return (
          <LineChart data={data}>
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
            <Line 
              type="monotone" 
              dataKey="confirmed" 
              stroke="#10B981" 
              strokeWidth={3}
              dot={{ fill: '#10B981' }}
            />
            <Line 
              type="monotone" 
              dataKey="pending" 
              stroke="#F59E0B" 
              strokeWidth={3}
              dot={{ fill: '#F59E0B' }}
            />
            <Line 
              type="monotone" 
              dataKey="declined" 
              stroke="#EF4444" 
              strokeWidth={3}
              dot={{ fill: '#EF4444' }}
            />
          </LineChart>
        );
      case 'area':
        return (
          <AreaChart data={data}>
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
            <Area 
              type="monotone" 
              dataKey="confirmed" 
              stackId="1"
              stroke="#10B981" 
              fill="#10B981" 
              fillOpacity={0.3}
            />
            <Area 
              type="monotone" 
              dataKey="pending" 
              stackId="1"
              stroke="#F59E0B" 
              fill="#F59E0B" 
              fillOpacity={0.3}
            />
            <Area 
              type="monotone" 
              dataKey="declined" 
              stackId="1"
              stroke="#EF4444" 
              fill="#EF4444" 
              fillOpacity={0.3}
            />
          </AreaChart>
        );
      default:
        return (
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
            <Bar dataKey="confirmed" fill="#10B981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="pending" fill="#F59E0B" radius={[4, 4, 0, 0]} />
            <Bar dataKey="declined" fill="#EF4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        );
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          {title}
        </CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant="success">Confirmed</Badge>
          <Badge variant="warning">Pending</Badge>
          <Badge variant="danger">Declined</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div style={{ height: `${height}px` }}>
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}