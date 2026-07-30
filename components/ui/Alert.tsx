// components/ui/Alert.tsx
import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from 'lucide-react';

const alertVariants = cva(
  "relative w-full rounded-lg border p-4 [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
  {
    variants: {
      variant: {
        default: "bg-white text-gray-950 dark:bg-gray-800 dark:text-gray-50",
        success: "border-green-500/50 bg-green-50 text-green-800 dark:border-green-500/50 dark:bg-green-900/20 dark:text-green-200 [&>svg]:text-green-600",
        warning: "border-yellow-500/50 bg-yellow-50 text-yellow-800 dark:border-yellow-500/50 dark:bg-yellow-900/20 dark:text-yellow-200 [&>svg]:text-yellow-600",
        error: "border-red-500/50 bg-red-50 text-red-800 dark:border-red-500/50 dark:bg-red-900/20 dark:text-red-200 [&>svg]:text-red-600",
        info: "border-blue-500/50 bg-blue-50 text-blue-800 dark:border-blue-500/50 dark:bg-blue-900/20 dark:text-blue-200 [&>svg]:text-blue-600",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const icons = {
  success: CheckCircle,
  warning: AlertTriangle,
  error: AlertCircle,
  info: Info,
  default: Info,
};

interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  dismissible?: boolean;
  onDismiss?: () => void;
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = 'default', dismissible, onDismiss, children, ...props }, ref) => {
    const [isVisible, setIsVisible] = React.useState(true);
    const Icon = icons[variant as keyof typeof icons] || icons.default;

    const handleDismiss = () => {
      setIsVisible(false);
      onDismiss?.();
    };

    if (!isVisible) return null;

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(
          alertVariants({ variant }),
          className,
          dismissible && "pr-12"
        )}
        {...props}
      >
        <Icon className="h-4 w-4" />
        <div className="ml-8">{children}</div>
        {dismissible && (
          <button
            onClick={handleDismiss}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        )}
      </div>
    );
  }
);

Alert.displayName = 'Alert';

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-medium leading-none tracking-tight", className)}
    {...props}
  />
));
AlertTitle.displayName = 'AlertTitle';

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
));
AlertDescription.displayName = 'AlertDescription';

export { Alert, AlertTitle, AlertDescription };