// components/charts/StatusDistribution.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

interface StatusDistributionProps {
  data: Array<{
    name: string;
    value: number;
  }>;
  title?: string;
  height?: number;
}

const STATUS_COLORS = {
  'Confirmed': '#10B981',
  'Pending': '#F59E0B',
  'Declined': '#EF4444'
};

const STATUS_ICONS = {
  'Confirmed': CheckCircle,
  'Pending': Clock,
  'Declined': XCircle
};

export function StatusDistribution({ 
  data, 
  title = 'Status Distribution',
  height = 300
}: StatusDistributionProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div style={{ height: `${height}px` }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => 
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {data.map((entry) => (
                    <Cell 
                      key={`cell-${entry.name}`} 
                      fill={STATUS_COLORS[entry.name as keyof typeof STATUS_COLORS] || '#8884d8'} 
                    />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-col justify-center space-y-3">
            {data.map((item) => {
              const Icon = STATUS_ICONS[item.name as keyof typeof STATUS_ICONS] || CheckCircle;
              const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0;
              const color = STATUS_COLORS[item.name as keyof typeof STATUS_COLORS] || '#8884d8';
              
              return (
                <div key={item.name} className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg`} style={{ backgroundColor: `${color}20` }}>
                    <Icon className="h-4 w-4" style={{ color }} />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{item.name}</span>
                      <span className="text-gray-500">{item.value}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
                      <div 
                        className="h-2 rounded-full transition-all duration-500"
                        style={{ 
                          width: `${percentage}%`,
                          backgroundColor: color
                        }}
                      />
                    </div>
                    <span className="text-xs text-gray-500">{percentage}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}