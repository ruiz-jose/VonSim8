import { faGraduationCap, faQuestionCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import clsx from "clsx";
import { useAtom } from "jotai";
import { memo, useCallback, useEffect, useMemo, useState } from "react";

import { Controls } from "@/components/Controls";
import { EducationalMenu, EducationalProgress } from "@/components/educational";
import { NotificationCenter } from "@/components/NotificationCenter";
import { settingsOpenAtom } from "@/components/Settings";
import { IconButton } from "@/components/ui/Button";
import { Tooltip } from "@/components/ui/Tooltip";
import { useSimulation } from "@/computer/simulation";
import { cycleAtom } from "@/computer/cpu/state";
import { useTranslate } from "@/lib/i18n";
import { useAtomValue } from "jotai";

// Hook personalizado para manejar el tour
const useTourControl = () => {
  const handleShowTour = useCallback(() => {
    // Usar la función global startWelcomeTour si está disponible
    if ((window as any).startWelcomeTour) {
      (window as any).startWelcomeTour();
    } else {
      // Fallback: recargar la página si la función no está disponible
      localStorage.removeItem("vonsim8-tour-completed");
      window.location.reload();
    }
  }, []);

  return { handleShowTour };
};

// Componente de estado de simulación optimizado
const SimulationStatus = memo(({ status, isMobile }: { status: any; isMobile: boolean }) => {
  const cycle = useAtomValue(cycleAtom);
  
  const statusText = useMemo(
    () => {
      switch (status.type) {
        case "running":
          return "Ejecutando";
        case "paused":
          return "Pausado";
        default:
          return "Detenido";
      }
    },
    [status.type],
  );
  const statusColor = useMemo(
    () => {
      switch (status.type) {
        case "running":
          return "bg-green-600";
        case "paused":
          return "bg-yellow-600";
        default:
          return "bg-stone-600";
      }
    },
    [status.type],
  );
  
  // Función para obtener el texto de la fase
  const getPhaseText = useMemo(() => {
    if (status.type !== "running" && cycle.phase !== "halting") return "";
    
    switch (cycle.phase) {
      case "fetching":
        return "Captación";
      case "fetching-operands":
        return "Obtención de operandos";
      case "executing":
        return "Ejecución";
      case "writeback":
        return "Escritura";
      case "interrupt":
        return "Interrupción";
      case "int6":
      case "int7":
        return "Interrupción";
      case "halting":
        return "Detener CPU";
      default:
        return "";
    }
  }, [cycle.phase, status.type]);

  // Función para obtener el color de la fase (igual que en Control.tsx)
  const getPhaseColor = useMemo(() => {
    if (status.type !== "running" && cycle.phase !== "halting") return "";
    
    switch (cycle.phase) {
      case "fetching":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "fetching-operands":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "executing":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "writeback":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      case "interrupt":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "int6":
      case "int7":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      case "halting":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-stone-500/20 text-stone-400 border-stone-500/30";
    }
  }, [cycle.phase, status.type]);
  
  return (
    <div className="flex items-center gap-2">
      {/* Estado de ejecución */}
      <div
        className={clsx(
          "flex items-center gap-1.5 rounded-full px-2 py-1 font-medium text-white",
          statusColor,
          status.type === "running" && "animate-pulse-glow",
        )}
      >
        <div
          className={clsx(
            "size-2 rounded-full",
            status.type === "running" 
              ? "bg-green-300" 
              : status.type === "paused"
                ? "bg-yellow-300"
                : "bg-stone-300",
          )}
        />
        {!isMobile && statusText}
      </div>
      
      {/* Fase actual */}
      {(status.type === "running" || cycle.phase === "halting") && getPhaseText && !isMobile && (
        <div className={clsx(
          "px-2 py-1 rounded-xl text-[10px] font-semibold uppercase tracking-wider backdrop-blur-sm transition-all duration-200 ease-in-out border animate-pulse-glow",
          getPhaseColor
        )}>
          {getPhaseText}
        </div>
      )}
    </div>
  );
});

SimulationStatus.displayName = "SimulationStatus";

// Componente de botones de acción optimizado
const ActionButtons = memo(
  ({
    onShowTour,
    onToggleSettings,
    settingsOpen,
    onToggleEducational,
    educationalOpen,
  }: {
    onShowTour: () => void;
    onToggleSettings: () => void;
    settingsOpen: boolean;
    onToggleEducational: () => void;
    educationalOpen: boolean;
  }) => {
    const translate = useTranslate();

    return (
      <div className="flex items-center gap-1">
        <NotificationCenter />

        <Tooltip content="Centro de aprendizaje" position="bottom">
          <IconButton
            icon={<FontAwesomeIcon icon={faGraduationCap} className="size-4" />}
            onClick={onToggleEducational}
            variant={educationalOpen ? "secondary" : "ghost"}
            size="md"
            aria-label="Centro de aprendizaje"
            className={clsx("hover-lift", educationalOpen && "animate-pulse-glow")}
            data-testid="educational-button"
          />
        </Tooltip>

        <Tooltip content="Mostrar tour de bienvenida" position="bottom">
          <IconButton
            icon={<FontAwesomeIcon icon={faQuestionCircle} className="size-4" />}
            onClick={onShowTour}
            variant="ghost"
            size="md"
            aria-label="Mostrar tour de bienvenida"
            className="hover-lift"
          />
        </Tooltip>

        <Tooltip content={translate("settings.title")} position="bottom">
          <IconButton
            icon={<span className="icon-[lucide--settings] block size-5" />}
            onClick={onToggleSettings}
            variant={settingsOpen ? "secondary" : "ghost"}
            size="md"
            aria-label={translate("settings.title")}
            className={clsx("hover-lift", settingsOpen && "animate-pulse-glow")}
            data-testid="settings-button"
          />
        </Tooltip>
      </div>
    );
  },
);

ActionButtons.displayName = "ActionButtons";

// Componente principal optimizado
export const Header = memo(() => {
  const [settingsOpen, setSettingsOpen] = useAtom(settingsOpenAtom);
  const [educationalOpen, setEducationalOpen] = useState(false);
  const [progressOpen, setProgressOpen] = useState(false);
  const { status } = useSimulation();
  const { handleShowTour } = useTourControl();

  // Detectar si es móvil/PWA
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(
        window.innerWidth <= 600 ||
          (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches),
      );
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Callbacks optimizados
  const handleToggleSettings = useCallback(() => {
    setSettingsOpen(prev => !prev);
  }, [setSettingsOpen]);

  const handleToggleEducational = useCallback(() => {
    setEducationalOpen(prev => !prev);
  }, []);

  const handleToggleProgress = useCallback(() => {
    setProgressOpen(prev => !prev);
  }, []);

  // Memoizar el logo y título
  const logoSection = useMemo(
    () => (
      <div className="hover-scale flex select-none items-center justify-center">
        <div className="w-10 h-10 bg-gradient-to-br from-mantis-500 to-mantis-600 rounded-xl flex items-center justify-center shadow-soft hover-lift relative overflow-hidden group">
          {/* Fondo con patrón de circuitos */}
          <div className="absolute inset-0 opacity-10">
            <div className="w-full h-full bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.1)_1px,transparent_1px),radial-gradient(circle_at_70%_70%,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[length:8px_8px]"></div>
          </div>
          
          {/* Logo principal */}
          <div className="relative z-10 flex items-center justify-center">
            <span className="text-white font-bold text-lg tracking-tight">V8</span>
          </div>
          
          {/* Efecto de brillo */}
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          
          {/* Indicador de actividad */}
          <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-mantis-300 rounded-full animate-pulse"></div>
        </div>
        <div className="flex flex-col ml-3">
          <h1 className="text-lg font-bold max-sm:hidden">
            Von<span className="text-mantis-400">Sim</span>8
          </h1>
          <span className="text-xs text-stone-400 max-sm:hidden">Simulador CPU 8-bit</span>
        </div>
      </div>
    ),
    [],
  );

  return (
    <>
      <header className="relative bg-black p-2 text-sm text-white" data-testid="header">
        <div className="grid grid-cols-3 items-center">
          {/* Lado izquierdo: Logo */}
          <div className="flex items-center">
            {logoSection}
          </div>

          {/* Centro: Estado del CPU */}
          <div className="flex justify-center">
            <SimulationStatus status={status} isMobile={isMobile} />
          </div>

          {/* Lado derecho: Controles y botones de acción */}
          <div className="flex items-center gap-6 justify-end">
            {/* Controles */}
            <div className="flex justify-end">
              <Controls />
            </div>

            {/* Botones de acción */}
            {!isMobile && (
              <ActionButtons
                onShowTour={handleShowTour}
                onToggleSettings={handleToggleSettings}
                settingsOpen={settingsOpen}
                onToggleEducational={handleToggleEducational}
                educationalOpen={educationalOpen}
              />
            )}
          </div>
        </div>
      </header>

      {/* Componentes educativos */}
      {!isMobile && educationalOpen && (
        <EducationalMenu
          isOpen={educationalOpen}
          onClose={() => setEducationalOpen(false)}
          onShowProgress={handleToggleProgress}
        />
      )}
      {!isMobile && progressOpen && (
        <EducationalProgress isVisible={progressOpen} onClose={() => setProgressOpen(false)} />
      )}
    </>
  );
});

Header.displayName = "Header";
