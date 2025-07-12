import { faTimes } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import clsx from "clsx";
import { memo, useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/Button";

type UsageStats = {
  totalSessions: number;
  totalSimulationTime: number;
  totalInstructionsExecuted: number;
  totalFilesCreated: number;
  lastSession: Date | null;
  averageSessionTime: number;
};

// Hook personalizado para manejar las estadísticas
const useUsageStats = () => {
  const [stats, setStats] = useState<UsageStats>({
    totalSessions: 0,
    totalSimulationTime: 0,
    totalInstructionsExecuted: 0,
    totalFilesCreated: 0,
    lastSession: null,
    averageSessionTime: 0
  });

  // Cargar estadísticas al inicializar
  useEffect(() => {
    const savedStats = localStorage.getItem("vonsim8-usage-stats");
    if (savedStats) {
      try {
        const parsed = JSON.parse(savedStats) as any;
        if (parsed && typeof parsed === 'object') {
          setStats({
            totalSessions: Number(parsed.totalSessions) || 0,
            totalSimulationTime: Number(parsed.totalSimulationTime) || 0,
            totalInstructionsExecuted: Number(parsed.totalInstructionsExecuted) || 0,
            totalFilesCreated: Number(parsed.totalFilesCreated) || 0,
            lastSession: parsed.lastSession ? new Date(parsed.lastSession) : null,
            averageSessionTime: Number(parsed.averageSessionTime) || 0
          });
        }
      } catch {
        // Usar valores por defecto si hay error
      }
    }
  }, []);

  // Guardar estadísticas cuando cambien
  useEffect(() => {
    localStorage.setItem("vonsim8-usage-stats", JSON.stringify(stats));
  }, [stats]);

  const updateStats = useCallback((type: 'session' | 'simulation' | 'instruction' | 'file', value = 1) => {
    setStats(prev => {
      const newStats = { ...prev };
      
      switch (type) {
        case 'session':
          newStats.totalSessions += value;
          newStats.lastSession = new Date();
          break;
        case 'simulation':
          newStats.totalSimulationTime += value;
          break;
        case 'instruction':
          newStats.totalInstructionsExecuted += value;
          break;
        case 'file':
          newStats.totalFilesCreated += value;
          break;
      }

      // Calcular tiempo promedio por sesión
      if (newStats.totalSessions > 0) {
        newStats.averageSessionTime = Math.floor(newStats.totalSimulationTime / newStats.totalSessions);
      }

      return newStats;
    });
  }, []);

  return { stats, updateStats };
};

// Hook personalizado para formatear datos
const useFormatters = () => {
  const formatTime = useCallback((seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  }, []);

  const formatDate = useCallback((date: Date | null): string => {
    if (!date) return "Nunca";
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  const formatNumber = useCallback((num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  }, []);

  return { formatTime, formatDate, formatNumber };
};

// Componente de estadística individual optimizado
const StatItem = memo(({ 
  label, 
  value, 
  icon, 
  className = "" 
}: {
  label: string;
  value: string | number;
  icon?: string;
  className?: string;
}) => (
  <div className={clsx("flex items-center justify-between rounded-lg bg-stone-800 p-3", className)}>
    <div className="flex items-center gap-2">
      {icon && <span className={clsx("size-4", icon)} />}
      <span className="text-sm text-stone-300">{label}</span>
    </div>
    <span className="font-mono text-sm font-semibold text-white">{value}</span>
  </div>
));

StatItem.displayName = 'StatItem';

// Componente principal optimizado
export const UsageStats = memo(() => {
  const [isOpen, setIsOpen] = useState(false);
  const { stats } = useUsageStats();
  const { formatTime, formatDate, formatNumber } = useFormatters();

  const toggleOpen = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  // Memoizar las estadísticas calculadas
  const calculatedStats = useMemo(() => ({
    totalTimeFormatted: formatTime(stats.totalSimulationTime),
    averageTimeFormatted: formatTime(stats.averageSessionTime),
    lastSessionFormatted: formatDate(stats.lastSession),
    instructionsFormatted: formatNumber(stats.totalInstructionsExecuted),
    filesFormatted: formatNumber(stats.totalFilesCreated),
    sessionsFormatted: formatNumber(stats.totalSessions)
  }), [stats, formatTime, formatDate, formatNumber]);

  if (!isOpen) return null;

  return (
    <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-lg border border-stone-600 bg-stone-900 p-4 shadow-xl">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">
          Estadísticas de Uso
        </h3>
        <button
          onClick={toggleOpen}
          className="rounded p-1 text-stone-400 hover:text-white transition-colors"
        >
          <FontAwesomeIcon icon={faTimes} size="sm" />
        </button>
      </div>

      <div className="space-y-3">
        <StatItem
          label="Sesiones totales"
          value={calculatedStats.sessionsFormatted}
          icon="icon-[lucide--users]"
        />
        
        <StatItem
          label="Tiempo total de simulación"
          value={calculatedStats.totalTimeFormatted}
          icon="icon-[lucide--clock]"
        />
        
        <StatItem
          label="Tiempo promedio por sesión"
          value={calculatedStats.averageTimeFormatted}
          icon="icon-[lucide--timer]"
        />
        
        <StatItem
          label="Instrucciones ejecutadas"
          value={calculatedStats.instructionsFormatted}
          icon="icon-[lucide--cpu]"
        />
        
        <StatItem
          label="Archivos creados"
          value={calculatedStats.filesFormatted}
          icon="icon-[lucide--file-text]"
        />
        
        <StatItem
          label="Última sesión"
          value={calculatedStats.lastSessionFormatted}
          icon="icon-[lucide--calendar]"
        />
      </div>

      <div className="mt-4 flex justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            localStorage.removeItem("vonsim8-usage-stats");
            window.location.reload();
          }}
          className="text-xs text-red-400 hover:text-red-300"
        >
          Resetear estadísticas
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleOpen}
          className="text-xs text-stone-400 hover:text-white"
        >
          Cerrar
        </Button>
      </div>
    </div>
  );
});

UsageStats.displayName = 'UsageStats';

// Función para actualizar estadísticas desde otros componentes
export const updateUsageStats = (type: 'session' | 'simulation' | 'instruction' | 'file', value = 1) => {
  const savedStats = localStorage.getItem("vonsim8-usage-stats");
  let stats: UsageStats = {
    totalSessions: 0,
    totalSimulationTime: 0,
    totalInstructionsExecuted: 0,
    totalFilesCreated: 0,
    lastSession: null,
    averageSessionTime: 0
  };

  if (savedStats) {
    try {
      const parsed = JSON.parse(savedStats) as any;
      if (parsed && typeof parsed === 'object') {
        stats = {
          totalSessions: Number(parsed.totalSessions) || 0,
          totalSimulationTime: Number(parsed.totalSimulationTime) || 0,
          totalInstructionsExecuted: Number(parsed.totalInstructionsExecuted) || 0,
          totalFilesCreated: Number(parsed.totalFilesCreated) || 0,
          lastSession: parsed.lastSession ? new Date(parsed.lastSession) : null,
          averageSessionTime: Number(parsed.averageSessionTime) || 0
        };
      }
    } catch {
      // Usar valores por defecto si hay error
    }
  }

  switch (type) {
    case 'session':
      stats.totalSessions += value;
      stats.lastSession = new Date();
      break;
    case 'simulation':
      stats.totalSimulationTime += value;
      break;
    case 'instruction':
      stats.totalInstructionsExecuted += value;
      break;
    case 'file':
      stats.totalFilesCreated += value;
      break;
  }

  // Calcular tiempo promedio por sesión
  if (stats.totalSessions > 0) {
    stats.averageSessionTime = Math.floor(stats.totalSimulationTime / stats.totalSessions);
  }

  localStorage.setItem("vonsim8-usage-stats", JSON.stringify(stats));
}; 