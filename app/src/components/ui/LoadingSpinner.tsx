import clsx from "clsx";
import { memo } from "react";

type LoadingSpinnerProps = {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "default" | "primary" | "secondary" | "success" | "warning" | "error";
  className?: string;
  text?: string;
  showText?: boolean;
};

const sizeClasses = {
  sm: "size-4",
  md: "size-6",
  lg: "size-8",
  xl: "size-12"
};

const variantClasses = {
  default: "border-stone-600 border-t-stone-300",
  primary: "border-mantis-600 border-t-mantis-300",
  secondary: "border-stone-600 border-t-stone-300",
  success: "border-green-600 border-t-green-300",
  warning: "border-yellow-600 border-t-yellow-300",
  error: "border-red-600 border-t-red-300"
};

export const LoadingSpinner = memo(({
  size = "md",
  variant = "default",
  className,
  text,
  showText = false
}: LoadingSpinnerProps) => {
  return (
    <div className={clsx("flex flex-col items-center justify-center gap-2", className)}>
      <div
        className={clsx(
          "animate-spin rounded-full border-2 border-solid",
          sizeClasses[size],
          variantClasses[variant]
        )}
        role="status"
        aria-label="Cargando"
      />
      {showText && (
        <span className="animate-pulse text-sm text-stone-400">
          {text || "Cargando..."}
        </span>
      )}
    </div>
  );
});

LoadingSpinner.displayName = 'LoadingSpinner';

// Componente de skeleton loading
type SkeletonProps = {
  className?: string;
  lines?: number;
  variant?: "text" | "card" | "button" | "avatar";
};

export const Skeleton = memo(({
  className,
  lines = 1,
  variant = "text"
}: SkeletonProps) => {
  const baseClasses = "animate-shimmer bg-stone-700 rounded";
  
  const variantClasses = {
    text: "h-4 w-full",
    card: "h-32 w-full",
    button: "h-10 w-24",
    avatar: "size-12 rounded-full"
  };

  if (variant === "text" && lines > 1) {
    return (
      <div className={clsx("space-y-2", className)}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={clsx(baseClasses, variantClasses[variant], {
              "w-3/4": i === lines - 1 && lines > 1
            })}
          />
        ))}
      </div>
    );
  }

  return (
    <div className={clsx(baseClasses, variantClasses[variant], className)} />
  );
});

Skeleton.displayName = 'Skeleton';

// Componente de loading overlay
type LoadingOverlayProps = {
  isLoading: boolean;
  children: React.ReactNode;
  text?: string;
  backdrop?: boolean;
};

export const LoadingOverlay = memo(({
  isLoading,
  children,
  text = "Cargando...",
  backdrop = true
}: LoadingOverlayProps) => {
  if (!isLoading) return <>{children}</>;

  return (
    <div className="relative">
      {children}
      <div className={clsx(
        "absolute inset-0 z-50 flex items-center justify-center",
        backdrop ? "bg-black/50 backdrop-blur-sm" : "bg-stone-900/90"
      )}>
        <div className="text-center">
          <LoadingSpinner size="lg" variant="primary" />
          <p className="mt-2 text-sm text-stone-300">{text}</p>
        </div>
      </div>
    </div>
  );
});

LoadingOverlay.displayName = 'LoadingOverlay'; 