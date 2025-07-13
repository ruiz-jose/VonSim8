import { faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import clsx from "clsx";
import { memo, useCallback,useEffect, useRef, useState } from "react";

type TooltipPosition = "top" | "bottom" | "left" | "right" | "top-start" | "top-end" | "bottom-start" | "bottom-end";

type TooltipProps = {
  content: string;
  children: React.ReactNode;
  position?: TooltipPosition;
  delay?: number;
  className?: string;
  maxWidth?: number;
  showArrow?: boolean;
  disabled?: boolean;
};

const positionClasses: Record<TooltipPosition, string> = {
  top: "bottom-full left-1/2 transform -translate-x-1/2 mb-2",
  bottom: "top-full left-1/2 transform -translate-x-1/2 mt-2",
  left: "right-full top-1/2 transform -translate-y-1/2 mr-2",
  right: "left-full top-1/2 transform -translate-y-1/2 ml-2",
  "top-start": "bottom-full left-0 mb-2",
  "top-end": "bottom-full right-0 mb-2",
  "bottom-start": "top-full left-0 mt-2",
  "bottom-end": "top-full right-0 mt-2"
};

const arrowClasses: Record<TooltipPosition, string> = {
  top: "top-full left-1/2 transform -translate-x-1/2 border-t-stone-800",
  bottom: "bottom-full left-1/2 transform -translate-x-1/2 border-b-stone-800",
  left: "left-full top-1/2 transform -translate-y-1/2 border-l-stone-800",
  right: "right-full top-1/2 transform -translate-y-1/2 border-r-stone-800",
  "top-start": "top-full left-4 border-t-stone-800",
  "top-end": "top-full right-4 border-t-stone-800",
  "bottom-start": "bottom-full left-4 border-b-stone-800",
  "bottom-end": "bottom-full right-4 border-b-stone-800"
};

export const Tooltip = memo(({
  content,
  children,
  position = "top",
  delay = 200,
  className,
  maxWidth = 200,
  showArrow = true,
  disabled = false
}: TooltipProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState(position);
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const showTooltip = useCallback(() => {
    if (disabled) return;
    
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  }, [disabled, delay]);

  const hideTooltip = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  }, []);

  // Reposicionar tooltip si se sale de la pantalla
  useEffect(() => {
    if (!isVisible || !tooltipRef.current || !triggerRef.current) return;

    const tooltip = tooltipRef.current;
    const trigger = triggerRef.current;
    const rect = trigger.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();

    let newPosition = position;

    // Verificar si se sale por la derecha
    if (rect.left + tooltipRect.width > window.innerWidth) {
      if (position.includes("right")) newPosition = "left" as TooltipPosition;
      else if (position.includes("top")) newPosition = "top-end" as TooltipPosition;
      else if (position.includes("bottom")) newPosition = "bottom-end" as TooltipPosition;
    }

    // Verificar si se sale por la izquierda
    if (rect.left - tooltipRect.width < 0) {
      if (position.includes("left")) newPosition = "right" as TooltipPosition;
      else if (position.includes("top")) newPosition = "top-start" as TooltipPosition;
      else if (position.includes("bottom")) newPosition = "bottom-start" as TooltipPosition;
    }

    // Verificar si se sale por arriba
    if (rect.top - tooltipRect.height < 0) {
      if (position.includes("top")) newPosition = "bottom" as TooltipPosition;
    }

    // Verificar si se sale por abajo
    if (rect.bottom + tooltipRect.height > window.innerHeight) {
      if (position.includes("bottom")) newPosition = "top" as TooltipPosition;
    }

    setTooltipPosition(newPosition);
  }, [isVisible, position]);

  return (
    <div
      ref={triggerRef}
      className={clsx("relative inline-block", className)}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      {isVisible && (
        <div
          ref={tooltipRef}
          className={clsx(
            "absolute z-50 rounded-lg border border-stone-600 bg-stone-800 px-3 py-2 text-sm text-white shadow-lg",
            "animate-fade-in",
            positionClasses[tooltipPosition]
          )}
          style={{ maxWidth: `${maxWidth}px` }}
          role="tooltip"
        >
          {content}
          {showArrow && (
            <div
              className={clsx(
                "absolute size-0 border-4 border-transparent",
                arrowClasses[tooltipPosition]
              )}
            />
          )}
        </div>
      )}
    </div>
  );
});

Tooltip.displayName = 'Tooltip';

// Componente de información con tooltip
type InfoTooltipProps = {
  content: string;
  className?: string;
  size?: "sm" | "md" | "lg";
};

export const InfoTooltip = memo(({
  content,
  className,
  size = "md"
}: InfoTooltipProps) => {
  const sizeClasses = {
    sm: "size-3",
    md: "size-4",
    lg: "size-5"
  };

  return (
    <Tooltip content={content} className={className}>
      <FontAwesomeIcon
        icon={faInfoCircle}
        className={clsx("cursor-help text-stone-400 transition-colors hover:text-stone-300", sizeClasses[size])}
      />
    </Tooltip>
  );
});

InfoTooltip.displayName = 'InfoTooltip';

// Componente de tooltip con trigger personalizado
type CustomTooltipProps = {
  content: React.ReactNode;
  trigger: React.ReactNode;
  position?: TooltipPosition;
  delay?: number;
  className?: string;
  maxWidth?: number;
  showArrow?: boolean;
  disabled?: boolean;
};

export const CustomTooltip = memo(({
  content,
  trigger,
  position = "top",
  delay = 200,
  className,
  maxWidth = 200,
  showArrow = true,
  disabled = false
}: CustomTooltipProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const showTooltip = useCallback(() => {
    if (disabled) return;
    
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  }, [disabled, delay]);

  const hideTooltip = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  }, []);

  return (
    <div
      ref={triggerRef}
      className={clsx("relative inline-block", className)}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {trigger}
      {isVisible && (
        <div
          ref={tooltipRef}
          className={clsx(
            "absolute z-50 rounded-lg border border-stone-600 bg-stone-800 px-3 py-2 text-sm text-white shadow-lg",
            "animate-fade-in",
            positionClasses[position]
          )}
          style={{ maxWidth: `${maxWidth}px` }}
          role="tooltip"
        >
          {content}
          {showArrow && (
            <div
              className={clsx(
                "absolute size-0 border-4 border-transparent",
                arrowClasses[position]
              )}
            />
          )}
        </div>
      )}
    </div>
  );
});

CustomTooltip.displayName = 'CustomTooltip'; 