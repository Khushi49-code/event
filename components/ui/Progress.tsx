// components/ui/Progress.tsx
import * as React from 'react';
import { cn } from '@/lib/utils';

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  showLabel?: boolean;
  label?: string;
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value, max = 100, showLabel = false, label, ...props }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    return (
      <div className="w-full" ref={ref} {...props}>
        {showLabel && (
          <div className="flex justify-between text-sm mb-1">
            <span>{label || 'Progress'}</span>
            <span>{Math.round(percentage)}%</span>
          </div>
        )}
        <div
          className={cn(
            "relative h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700",
            className
          )}
        >
          <div
            className="h-full transition-all duration-300 ease-in-out rounded-full bg-blue-600"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  }
);

Progress.displayName = 'Progress';

export { Progress };