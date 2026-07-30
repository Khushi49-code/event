// components/ui/Button.tsx
import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-lg text-sm font-medium ring-offset-white transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: 
          "bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-md dark:bg-blue-600 dark:hover:bg-blue-700",
        secondary: 
          "bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700",
        outline: 
          "border border-gray-300 bg-transparent hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800",
        ghost: 
          "hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-gray-100",
        link: 
          "text-blue-600 underline-offset-4 hover:underline dark:text-blue-400",
        danger: 
          "bg-red-600 text-white hover:bg-red-700 shadow-sm hover:shadow-md dark:bg-red-600 dark:hover:bg-red-700",
        success: 
          "bg-green-600 text-white hover:bg-green-700 shadow-sm hover:shadow-md dark:bg-green-600 dark:hover:bg-green-700",
        warning: 
          "bg-yellow-500 text-white hover:bg-yellow-600 shadow-sm hover:shadow-md dark:bg-yellow-500 dark:hover:bg-yellow-600",
        info: 
          "bg-cyan-500 text-white hover:bg-cyan-600 shadow-sm hover:shadow-md dark:bg-cyan-500 dark:hover:bg-cyan-600",
        purple: 
          "bg-purple-600 text-white hover:bg-purple-700 shadow-sm hover:shadow-md dark:bg-purple-600 dark:hover:bg-purple-700",
        gradient: 
          "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-sm hover:shadow-md",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-12 px-6 text-base",
        xl: "h-14 px-8 text-lg",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
        "icon-lg": "h-12 w-12",
      },
      fullWidth: {
        true: "w-full",
      },
      loading: {
        true: "cursor-not-allowed",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      fullWidth: false,
      loading: false,
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      loading = false,
      loadingText,
      leftIcon,
      rightIcon,
      children,
      disabled,
      asChild = false,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button';
    const isDisabled = disabled || loading;

    return (
      <Comp
        className={cn(
          buttonVariants({ 
            variant, 
            size, 
            fullWidth, 
            loading,
            className 
          })
        )}
        ref={ref}
        disabled={isDisabled}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {loadingText || children || 'Loading...'}
          </>
        ) : (
          <>
            {leftIcon && <span className="mr-2">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="ml-2">{rightIcon}</span>}
          </>
        )}
      </Comp>
    );
  }
);

Button.displayName = 'Button';

// Button group component
interface ButtonGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical';
  spacing?: 'sm' | 'md' | 'lg';
}

const ButtonGroup = React.forwardRef<HTMLDivElement, ButtonGroupProps>(
  ({ className, orientation = 'horizontal', spacing = 'md', children, ...props }, ref) => {
    const spacingClasses = {
      sm: orientation === 'horizontal' ? 'space-x-1' : 'space-y-1',
      md: orientation === 'horizontal' ? 'space-x-2' : 'space-y-2',
      lg: orientation === 'horizontal' ? 'space-x-3' : 'space-y-3',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'flex',
          orientation === 'horizontal' ? 'flex-row' : 'flex-col',
          spacingClasses[spacing],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

ButtonGroup.displayName = 'ButtonGroup';

// Icon button component
interface IconButtonProps extends Omit<ButtonProps, 'children'> {
  icon: React.ReactNode;
  label?: string;
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, label, className, size = 'icon', ...props }, ref) => {
    return (
      <Button
        ref={ref}
        size={size}
        className={cn('relative', className)}
        aria-label={label}
        {...props}
      >
        {icon}
        {label && <span className="sr-only">{label}</span>}
      </Button>
    );
  }
);

IconButton.displayName = 'IconButton';

export { Button, ButtonGroup, IconButton, buttonVariants };