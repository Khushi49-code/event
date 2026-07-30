// components/ui/Skeleton.tsx
import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}

const Skeleton = ({
  className,
  variant = 'text',
  width,
  height,
  ...props
}: SkeletonProps) => {
  const variants = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  return (
    <div
      className={cn(
        'animate-pulse bg-gray-200 dark:bg-gray-700',
        variants[variant],
        className
      )}
      style={{
        width: width || '100%',
        height: height || '1rem',
      }}
      {...props}
    />
  );
};

// Skeleton Card for loading states
const SkeletonCard = ({ count = 1 }: { count?: number }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700"
        >
          <Skeleton className="h-6 w-3/4 mb-4" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-2/3 mb-4" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
      ))}
    </>
  );
};

export { Skeleton, SkeletonCard };