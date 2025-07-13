import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import clsx from "clsx";
import { forwardRef, memo } from "react";

type ButtonVariant =
  | "default"
  | "destructive"
  | "outline"
  | "secondary"
  | "ghost"
  | "link"
  | "primary"
  | "success"
  | "warning"
  | "error";

type ButtonSize = "sm" | "md" | "lg" | "xl";

type ButtonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  disabled?: boolean;
  fullWidth?: boolean;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  "aria-label"?: string;
  title?: string;
};

const variantClasses: Record<ButtonVariant, string> = {
  default: "bg-stone-800 text-white hover:bg-stone-700 focus:ring-stone-500",
  destructive: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
  outline:
    "border border-stone-600 bg-transparent text-white hover:bg-stone-800 focus:ring-stone-500",
  secondary: "bg-stone-700 text-white hover:bg-stone-600 focus:ring-stone-500",
  ghost: "bg-transparent text-stone-300 hover:bg-stone-800 hover:text-white focus:ring-stone-500",
  link: "bg-transparent text-mantis-400 hover:text-mantis-300 hover:underline focus:ring-mantis-500",
  primary: "bg-mantis-600 text-white hover:bg-mantis-700 focus:ring-mantis-500",
  success: "bg-green-600 text-white hover:bg-green-700 focus:ring-green-500",
  warning: "bg-yellow-600 text-white hover:bg-yellow-700 focus:ring-yellow-500",
  error: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
  xl: "h-14 px-8 text-lg",
};

export const Button = memo(
  forwardRef<HTMLButtonElement, ButtonProps>(
    (
      {
        variant = "default",
        size = "md",
        isLoading = false,
        loadingText,
        leftIcon,
        rightIcon,
        disabled = false,
        fullWidth = false,
        className,
        children,
        onClick,
        type = "button",
        "aria-label": ariaLabel,
        title,
        ...props
      },
      ref,
    ) => {
      const isDisabled = disabled || isLoading;

      return (
        <button
          ref={ref}
          type={type}
          disabled={isDisabled}
          onClick={onClick}
          aria-label={ariaLabel}
          title={title}
          className={clsx(
            "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200",
            "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-stone-900",
            "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
            "hover:scale-105 active:scale-95",
            variantClasses[variant],
            sizeClasses[size],
            fullWidth && "w-full",
            className,
          )}
          {...props}
        >
          {isLoading && (
            <FontAwesomeIcon icon={faSpinner} className="animate-spin" aria-hidden="true" />
          )}
          {!isLoading && leftIcon && (
            <span className="flex items-center" aria-hidden="true">
              {leftIcon}
            </span>
          )}
          <span>{isLoading && loadingText ? loadingText : children}</span>
          {!isLoading && rightIcon && (
            <span className="flex items-center" aria-hidden="true">
              {rightIcon}
            </span>
          )}
        </button>
      );
    },
  ),
);

Button.displayName = "Button";

// Componente de botón de icono
type IconButtonProps = {
  icon: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
  onClick?: () => void;
  "aria-label": string;
  title?: string;
};

export const IconButton = memo(
  forwardRef<HTMLButtonElement, IconButtonProps>(
    (
      {
        icon,
        variant = "ghost",
        size = "md",
        isLoading = false,
        disabled = false,
        className,
        onClick,
        "aria-label": ariaLabel,
        title,
        ...props
      },
      ref,
    ) => {
      const isDisabled = disabled || isLoading;

      const iconSizeClasses: Record<ButtonSize, string> = {
        sm: "size-8",
        md: "size-10",
        lg: "size-12",
        xl: "size-14",
      };

      return (
        <button
          ref={ref}
          disabled={isDisabled}
          onClick={onClick}
          aria-label={ariaLabel}
          title={title}
          className={clsx(
            "inline-flex items-center justify-center rounded-lg transition-all duration-200",
            "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-stone-900",
            "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
            "hover:scale-105 active:scale-95",
            variantClasses[variant],
            iconSizeClasses[size],
            className,
          )}
          {...props}
        >
          {isLoading ? (
            <FontAwesomeIcon icon={faSpinner} className="animate-spin" aria-hidden="true" />
          ) : (
            <span className="flex items-center justify-center" aria-hidden="true">
              {icon}
            </span>
          )}
        </button>
      );
    },
  ),
);

IconButton.displayName = "IconButton";

// Componente de botón de grupo
type ButtonGroupProps = {
  children: React.ReactNode;
  orientation?: "horizontal" | "vertical";
  className?: string;
};

export const ButtonGroup = memo(
  ({ children, orientation = "horizontal", className }: ButtonGroupProps) => {
    return (
      <div
        className={clsx(
          "inline-flex",
          orientation === "horizontal" ? "flex-row" : "flex-col",
          className,
        )}
        role="group"
      >
        {children}
      </div>
    );
  },
);

ButtonGroup.displayName = "ButtonGroup";
