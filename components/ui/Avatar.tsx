// components/ui/Avatar.tsx
import * as React from 'react';
import { cn } from '@/lib/utils';

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-xl',
};

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, alt = '', fallback, size = 'md', ...props }, ref) => {
    const [hasError, setHasError] = React.useState(false);

    const getInitials = (name: string) => {
      return name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    };

    return (
      <div
        ref={ref}
        className={cn(
          "relative flex shrink-0 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700",
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {src && !hasError ? (
          <img
            src={src}
            alt={alt}
            className="h-full w-full object-cover"
            onError={() => setHasError(true)}
          />
        ) : fallback ? (
          <div className="flex h-full w-full items-center justify-center bg-blue-500 text-white font-semibold">
            {getInitials(fallback)}
          </div>
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300">
            <UserIcon className="h-1/2 w-1/2" />
          </div>
        )}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';

// User icon for fallback
const UserIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
    />
  </svg>
);

export { Avatar };