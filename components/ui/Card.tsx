// components/ui/Card.tsx
import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

// Card variants
const cardVariants = cva(
  "rounded-lg border bg-white text-gray-950 shadow-sm dark:bg-gray-800 dark:text-gray-50 transition-all duration-200",
  {
    variants: {
      variant: {
        default: "border-gray-200 dark:border-gray-700",
        elevated: "border-0 shadow-lg hover:shadow-xl dark:border-gray-700",
        outline: "border-2 border-gray-200 dark:border-gray-700 bg-transparent",
        ghost: "border-0 shadow-none bg-transparent",
        primary: "border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-800",
        success: "border-green-200 bg-green-50 dark:bg-green-950/30 dark:border-green-800",
        danger: "border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-800",
        warning: "border-yellow-200 bg-yellow-50 dark:bg-yellow-950/30 dark:border-yellow-800",
        info: "border-cyan-200 bg-cyan-50 dark:bg-cyan-950/30 dark:border-cyan-800",
      },
      size: {
        default: "p-6",
        sm: "p-4",
        lg: "p-8",
        xl: "p-10",
      },
      hoverable: {
        true: "hover:shadow-lg hover:scale-[1.01] transition-all duration-200 cursor-pointer",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      hoverable: false,
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ 
    className, 
    variant, 
    size, 
    hoverable, 
    loading = false,
    children, 
    ...props 
  }, ref) => {
    if (loading) {
      return (
        <div
          ref={ref}
          className={cn(
            cardVariants({ variant, size, hoverable, className }),
            "flex items-center justify-center min-h-[100px]"
          )}
          {...props}
        >
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(cardVariants({ variant, size, hoverable, className }))}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = 'Card';

// Card Header
interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'bordered' | 'subtle';
}

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const variantClasses = {
      default: "",
      bordered: "border-b border-gray-200 dark:border-gray-700 pb-4",
      subtle: "bg-gray-50 dark:bg-gray-800/50 -m-6 p-6 rounded-t-lg",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col space-y-1.5",
          variantClasses[variant],
          className
        )}
        {...props}
      />
    );
  }
);
CardHeader.displayName = 'CardHeader';

// Card Title
interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  icon?: React.ReactNode;
}

const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, as: Component = 'h3', icon, children, ...props }, ref) => {
    return (
      <Component
        ref={ref}
        className={cn(
          "text-lg font-semibold leading-none tracking-tight flex items-center gap-2",
          className
        )}
        {...props}
      >
        {icon && <span className="flex-shrink-0">{icon}</span>}
        {children}
      </Component>
    );
  }
);
CardTitle.displayName = 'CardTitle';

// Card Description
interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  withIcon?: boolean;
}

const CardDescription = React.forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ className, withIcon = false, ...props }, ref) => {
    return (
      <p
        ref={ref}
        className={cn(
          "text-sm text-gray-500 dark:text-gray-400",
          withIcon && "ml-7",
          className
        )}
        {...props}
      />
    );
  }
);
CardDescription.displayName = 'CardDescription';

// Card Content
interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  noPadding?: boolean;
}

const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, noPadding = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          !noPadding && "p-6 pt-0",
          className
        )}
        {...props}
      />
    );
  }
);
CardContent.displayName = 'CardContent';

// Card Footer
interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'bordered' | 'subtle';
  align?: 'left' | 'center' | 'right' | 'between';
}

const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, variant = 'default', align = 'left', ...props }, ref) => {
    const variantClasses = {
      default: "",
      bordered: "border-t border-gray-200 dark:border-gray-700 pt-4",
      subtle: "bg-gray-50 dark:bg-gray-800/50 -m-6 p-6 rounded-b-lg",
    };

    const alignClasses = {
      left: "justify-start",
      center: "justify-center",
      right: "justify-end",
      between: "justify-between",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center",
          variantClasses[variant],
          alignClasses[align],
          className
        )}
        {...props}
      />
    );
  }
);
CardFooter.displayName = 'CardFooter';

// Card Image
interface CardImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  aspectRatio?: 'auto' | 'square' | 'video' | 'portrait' | 'landscape';
  overlay?: boolean;
}

const CardImage = React.forwardRef<HTMLImageElement, CardImageProps>(
  ({ className, aspectRatio = 'auto', overlay = false, ...props }, ref) => {
    const aspectClasses = {
      auto: "",
      square: "aspect-square",
      video: "aspect-video",
      portrait: "aspect-[3/4]",
      landscape: "aspect-[4/3]",
    };

    return (
      <div className="relative overflow-hidden rounded-t-lg">
        <img
          ref={ref}
          className={cn(
            "w-full object-cover",
            aspectClasses[aspectRatio],
            overlay && "hover:opacity-90 transition-opacity",
            className
          )}
          {...props}
        />
        {overlay && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        )}
      </div>
    );
  }
);
CardImage.displayName = 'CardImage';

// Card Actions
interface CardActionsProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: 'left' | 'center' | 'right' | 'between';
  direction?: 'horizontal' | 'vertical';
}

const CardActions = React.forwardRef<HTMLDivElement, CardActionsProps>(
  ({ className, align = 'left', direction = 'horizontal', ...props }, ref) => {
    const alignClasses = {
      left: "justify-start",
      center: "justify-center",
      right: "justify-end",
      between: "justify-between",
    };

    const directionClasses = {
      horizontal: "flex-row",
      vertical: "flex-col",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "flex gap-2",
          alignClasses[align],
          directionClasses[direction],
          className
        )}
        {...props}
      />
    );
  }
);
CardActions.displayName = 'CardActions';

// Card Grid
interface CardGridProps extends React.HTMLAttributes<HTMLDivElement> {
  cols?: 1 | 2 | 3 | 4 | 5 | 6;
  gap?: 'sm' | 'md' | 'lg' | 'xl';
}

const CardGrid = React.forwardRef<HTMLDivElement, CardGridProps>(
  ({ className, cols = 3, gap = 'md', ...props }, ref) => {
    const colClasses = {
      1: "grid-cols-1",
      2: "grid-cols-1 sm:grid-cols-2",
      3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
      4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
      5: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5",
      6: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6",
    };

    const gapClasses = {
      sm: "gap-3",
      md: "gap-4",
      lg: "gap-6",
      xl: "gap-8",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "grid",
          colClasses[cols],
          gapClasses[gap],
          className
        )}
        {...props}
      />
    );
  }
);
CardGrid.displayName = 'CardGrid';

// Card Skeleton
interface CardSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  count?: number;
  variant?: 'default' | 'image' | 'profile' | 'stats';
}

const CardSkeleton = React.forwardRef<HTMLDivElement, CardSkeletonProps>(
  ({ className, count = 1, variant = 'default', ...props }, ref) => {
    const renderSkeleton = () => {
      switch (variant) {
        case 'image':
          return (
            <div className="space-y-3">
              <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse" />
              </div>
            </div>
          );
        case 'profile':
          return (
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse" />
              </div>
            </div>
          );
        case 'stats':
          return (
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 animate-pulse" />
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3 animate-pulse" />
            </div>
          );
        default:
          return (
            <div className="space-y-3">
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-2/3 animate-pulse" />
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6 animate-pulse" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-4/6 animate-pulse" />
              </div>
              <div className="h-9 bg-gray-200 dark:bg-gray-700 rounded w-1/3 animate-pulse" />
            </div>
          );
      }
    };

    if (count > 1) {
      return (
        <div
          ref={ref}
          className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", className)}
          {...props}
        >
          {Array.from({ length: count }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">{renderSkeleton()}</CardContent>
            </Card>
          ))}
        </div>
      );
    }

    return (
      <Card ref={ref} className={className} {...props}>
        <CardContent className="p-6">{renderSkeleton()}</CardContent>
      </Card>
    );
  }
);
CardSkeleton.displayName = 'CardSkeleton';

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  CardImage,
  CardActions,
  CardGrid,
  CardSkeleton,
  cardVariants,
};