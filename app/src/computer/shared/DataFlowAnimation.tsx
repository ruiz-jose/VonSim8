import clsx from "clsx";
import { memo, useEffect, useState } from "react";

type DataFlowAnimationProps = {
  from: string;
  to: string;
  data: string;
  duration?: number;
  className?: string;
  onComplete?: () => void;
};

export const DataFlowAnimation = memo(
  ({ from, to, data, duration = 2000, className, onComplete }: DataFlowAnimationProps) => {
    const [isVisible, setIsVisible] = useState(false);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
      setIsVisible(true);
      setProgress(0);

      const startTime = Date.now();
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const newProgress = Math.min(elapsed / duration, 1);

        setProgress(newProgress);

        if (newProgress < 1) {
          requestAnimationFrame(animate);
        } else {
          setTimeout(() => {
            setIsVisible(false);
            onComplete?.();
          }, 500);
        }
      };

      requestAnimationFrame(animate);
    }, [from, to, data, duration, onComplete]);

    if (!isVisible) return null;

    return (
      <div className={clsx("pointer-events-none absolute inset-0", className)}>
        {/* Línea de flujo */}
        <svg className="absolute inset-0 size-full">
          <defs>
            <linearGradient id="dataFlowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#10b981" stopOpacity="1" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.8" />
            </linearGradient>
          </defs>

          <path
            d={`M ${from} L ${to}`}
            stroke="url(#dataFlowGradient)"
            strokeWidth="3"
            strokeDasharray="10,5"
            strokeDashoffset={20 - progress * 20}
            fill="none"
            className="animate-pulse"
          />
        </svg>

        {/* Paquete de datos */}
        <div
          className={clsx(
            "absolute rounded bg-mantis-500 px-2 py-1 font-mono text-xs text-white",
            "border border-mantis-400 shadow-lg",
            "transition-all duration-300 ease-out",
          )}
          style={{
            left: `${progress * 100}%`,
            transform: "translateX(-50%)",
            top: "50%",
            marginTop: "-12px",
          }}
        >
          {data}
          <div className="absolute -top-1 left-1/2 size-0 -translate-x-1/2 border-x-4 border-b-4 border-transparent border-b-mantis-500" />
        </div>
      </div>
    );
  },
);

DataFlowAnimation.displayName = "DataFlowAnimation";

// Hook para manejar múltiples animaciones de flujo de datos
export const useDataFlow = () => {
  const [flows, setFlows] = useState<
    {
      id: string;
      from: string;
      to: string;
      data: string;
      duration?: number;
    }[]
  >([]);

  const addFlow = (flow: Omit<(typeof flows)[0], "id">) => {
    const id = `${flow.from}-${flow.to}-${Date.now()}`;
    setFlows(prev => [...prev, { ...flow, id }]);

    // Remover automáticamente después de la animación
    setTimeout(
      () => {
        setFlows(prev => prev.filter(f => f.id !== id));
      },
      (flow.duration || 2000) + 500,
    );
  };

  const clearFlows = () => setFlows([]);

  return { flows, addFlow, clearFlows };
};
