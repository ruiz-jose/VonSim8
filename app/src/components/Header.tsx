import { faGraduationCap, faQuestionCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import clsx from "clsx";
import { useAtom, useAtomValue } from "jotai";
import { memo, useCallback, useEffect, useMemo, useState } from "react";

import { Controls } from "@/components/Controls";
import { EducationalMenu, EducationalProgress } from "@/components/educational";
import { NotificationCenter } from "@/components/NotificationCenter";
import { settingsOpenAtom } from "@/components/Settings";
import { UpdateSettings } from "@/components/UpdateSettings";
import { IconButton } from "@/components/ui/Button";
import { Tooltip } from "@/components/ui/Tooltip";
import { cycleAtom } from "@/computer/cpu/state";
import { useSimulation } from "@/computer/simulation";
import { useTranslate } from "@/lib/i18n";

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
const SimulationStatus = memo(
  ({ status, isMobile, isCompact }: { status: any; isMobile: boolean; isCompact?: boolean }) => {
    const cycle = useAtomValue(cycleAtom);
    const [previousPhase, setPreviousPhase] = useState<string | null>(null);
    const [isAnimating, setIsAnimating] = useState(false);

    const statusText = useMemo(() => {
      switch (status.type) {
        case "running":
          return "Ejecutando";
        case "paused":
          return "Pausado";
        default:
          return "Detenido";
      }
    }, [status.type]);
    const statusColor = useMemo(() => {
      switch (status.type) {
        case "running":
          return "bg-green-600";
        case "paused":
          return "bg-yellow-600";
        default:
          return "bg-stone-600";
      }
    }, [status.type]);

    // Detectar cambios de fase y activar animación
    useEffect(() => {
      if (cycle && cycle.phase && cycle.phase !== previousPhase) {
        setPreviousPhase(cycle.phase);
        setIsAnimating(true);

        // Detener la animación después de 0.8s
        const timer = setTimeout(() => {
          setIsAnimating(false);
        }, 800);

        return () => clearTimeout(timer);
      }
    }, [cycle, previousPhase]);

    // Función para obtener el texto de la fase
    const getPhaseText = useMemo(() => {
      if (!cycle || (status.type !== "running" && cycle.phase !== "halting")) return "";

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
    }, [cycle, status.type]);

    // Función para obtener el color de la fase (igual que en Control.tsx)
    const getPhaseColor = useMemo(() => {
      if (!cycle || (status.type !== "running" && cycle.phase !== "halting")) return "";

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
    }, [cycle, status.type]);

    // Función para obtener la clase de animación según la fase
    const getPhaseAnimation = useMemo(() => {
      if (!isAnimating || !cycle) return "";

      switch (cycle.phase) {
        case "fetching":
          return "animate-phase-pulse-blue";
        case "fetching-operands":
          return "animate-phase-pulse-yellow";
        case "executing":
          return "animate-phase-pulse-green";
        case "writeback":
          return "animate-phase-pulse-purple";
        case "interrupt":
          return "animate-phase-pulse-red";
        case "int6":
        case "int7":
          return "animate-phase-pulse-orange";
        case "halting":
          return "animate-phase-pulse-red";
        default:
          return "animate-phase-pulse-stone";
      }
    }, [isAnimating, cycle]);

    return (
      <div className="flex items-center gap-2">
        {/* Estado de ejecución */}
        <div
          className={clsx(
            "flex items-center gap-1.5 rounded-full px-2 py-1 font-medium text-white",
            statusColor,
            status.type === "running" && "animate-pulse-glow",
            isMobile && "px-1.5 py-0.5", // Más compacto en móvil
            isCompact && "px-1 py-0.5", // Aún más compacto cuando el espacio es limitado
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
          {/* Ocultar texto en móvil o cuando está compacto */}
          {!isMobile && !isCompact && statusText}
        </div>

        {/* Fase actual - mostrar en móvil también pero más compacta */}
        {(status.type === "running" || (cycle && cycle.phase === "halting")) && getPhaseText && (
          <div
            className={clsx(
              "rounded-xl border text-[10px] font-semibold uppercase tracking-wider backdrop-blur-sm transition-all duration-200 ease-in-out",
              getPhaseColor,
              getPhaseAnimation, // Aplicar animación solo cuando cambia la fase
              isMobile
                ? "flex min-h-[20px] items-center justify-center whitespace-nowrap px-2 py-0.5 text-[8px]" // Compacto pero adaptable en móvil
                : isCompact
                  ? "flex min-h-[18px] items-center justify-center whitespace-nowrap px-1.5 py-0.5 text-[8px]" // Muy compacto
                  : "px-2 py-1", // Tamaño normal en desktop
            )}
          >
            {getPhaseText} {/* Mostrar texto completo en móvil y desktop */}
          </div>
        )}
      </div>
    );
  },
);

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
        <UpdateSettings />

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

  // Detectar diferentes tamaños de pantalla para mejor responsividad
  const [screenSize, setScreenSize] = useState<"mobile" | "compact" | "tablet" | "desktop">(
    "desktop",
  );

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      if (width <= 480) {
        setScreenSize("mobile");
      } else if (width <= 768) {
        setScreenSize("compact");
      } else if (width <= 1024) {
        setScreenSize("tablet");
      } else {
        setScreenSize("desktop");
      }
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
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
        <div className="group relative flex size-10 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-mantis-500 to-mantis-600 shadow-lg hover:scale-105">
          {/* Fondo con patrón de circuitos */}
          <div className="absolute inset-0 opacity-10">
            <div className="size-full bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.1)_1px,transparent_1px),radial-gradient(circle_at_70%_70%,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[length:8px_8px]"></div>
          </div>

          {/* Logo principal */}
          <div className="relative z-10 flex items-center justify-center">
            <span className="text-lg font-bold tracking-tight text-white">V8</span>
          </div>

          {/* Efecto de brillo */}
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>

          {/* Indicador de actividad */}
          <div className="absolute -right-0.5 -top-0.5 size-2 animate-pulse rounded-full bg-mantis-300"></div>
        </div>
        <div className="ml-3 flex flex-col">
          <h1 className="text-lg font-bold max-sm:hidden">
            Von<span className="text-mantis-400">Sim</span>8
          </h1>
          <span className="text-xs text-stone-400 max-sm:hidden">Simulador CPU 8-bit</span>
        </div>
      </div>
    ),
    [],
  );

  // Determinar el layout según el tamaño de pantalla
  const getLayoutConfig = () => {
    switch (screenSize) {
      case "mobile":
        return {
          gridCols: "grid-cols-2",
          showStatusLeft: true,
          showStatusCenter: false,
          showActionButtons: false,
          isCompact: true,
          isMobile: true,
        };
      case "compact":
        return {
          gridCols: "grid-cols-3",
          showStatusLeft: false,
          showStatusCenter: true,
          showActionButtons: false,
          isCompact: true,
          isMobile: false,
        };
      case "tablet":
        return {
          gridCols: "grid-cols-3",
          showStatusLeft: false,
          showStatusCenter: true,
          showActionButtons: true,
          isCompact: false,
          isMobile: false,
        };
      case "desktop":
        return {
          gridCols: "grid-cols-3",
          showStatusLeft: false,
          showStatusCenter: true,
          showActionButtons: true,
          isCompact: false,
          isMobile: false,
        };
    }
  };

  const layout = getLayoutConfig();

  return (
    <>
      <header
        className={clsx(
          "relative bg-black text-sm text-white",
          screenSize === "mobile"
            ? "header-mobile p-2"
            : screenSize === "compact"
              ? "header-compact p-2"
              : screenSize === "tablet"
                ? "header-tablet p-2"
                : "p-2",
        )}
        data-testid="header"
      >
        <div className={clsx("grid items-center", layout.gridCols)}>
          {/* Lado izquierdo: Logo y estado (cuando corresponde) */}
          <div className="flex items-center gap-3">
            {logoSection}
            {/* Mostrar estado en móvil a la izquierda */}
            {layout.showStatusLeft && (
              <SimulationStatus
                status={status}
                isMobile={layout.isMobile}
                isCompact={layout.isCompact}
              />
            )}
          </div>

          {/* Centro: Estado del CPU (cuando corresponde) */}
          {layout.showStatusCenter && (
            <div className="flex justify-center">
              <SimulationStatus
                status={status}
                isMobile={layout.isMobile}
                isCompact={layout.isCompact}
              />
            </div>
          )}

          {/* Lado derecho: Controles y botones de acción */}
          <div className="flex items-center justify-end gap-6">
            {/* Controles */}
            <div className="flex justify-end">
              <Controls />
            </div>

            {/* Botones de acción */}
            {layout.showActionButtons && (
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
      {!layout.isMobile && educationalOpen && (
        <EducationalMenu
          isOpen={educationalOpen}
          onClose={() => setEducationalOpen(false)}
          onShowProgress={handleToggleProgress}
        />
      )}
      {!layout.isMobile && progressOpen && (
        <EducationalProgress isVisible={progressOpen} onClose={() => setProgressOpen(false)} />
      )}
    </>
  );
});

Header.displayName = "Header";
