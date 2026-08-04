// components/charts/PieChart.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { PieChart as PieChartIcon } from 'lucide-react';

interface PieChartProps {
  data: Array<{
    name: string;
    value: number;
    color?: string;
  }>;
  title?: string;
  height?: number;
  showLegend?: boolean;
  showLabels?: boolean;
}

const DEFAULT_COLORS = ['#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#8B5CF6', '#EC4899'];

export function PieChartComponent({
  data,
  title = 'Distribution',
  height = 300,
  showLegend = true,
  showLabels = true
}: PieChartProps) {
  const chartData = data.map((item, index) => ({
    ...item,
    color: item.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChartIcon className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ height: `${height}px` }}>
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={showLabels}
                label={showLabels ? ({ name, percent }) => 
                  `${name} ${((percent ?? 0) * 100).toFixed(0)}%` : undefined
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
              />
              {showLegend && <Legend />}
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-2 text-center">
          {chartData.map((item) => (
            <div key={item.name}>
              <div className="text-sm font-bold" style={{ color: item.color }}>
                {item.value}
              </div>
              <div className="text-xs text-gray-500">{item.name}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}