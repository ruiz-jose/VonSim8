import {
  faCheckCircle,
  faChevronLeft,
  faChevronRight,
  faExclamationTriangle,
  faTimes,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { atom, useAtom } from "jotai";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { settingsOpenAtom } from "@/components/Settings";
import { Button } from "@/components/ui/Button";

export const tourActiveAtom = atom(false);

type TourStep = {
  id: string;
  target: string;
  title: string;
  content: string;
  icon?: any;
  position: "top" | "bottom" | "left" | "right";
};

// Pasos del tour - Los targets deben coincidir exactamente con los data-testid de los componentes
const tourSteps: TourStep[] = [
  {
    id: "welcome",
    target: "app-container",
    title: "¡Bienvenido a VonSim8!",
    content:
      "Te acompañaré en un recorrido por las funciones principales de la plataforma. VonSim8 es un simulador de computadora de 8 bits que te permite programar en lenguaje ensamblador y ver cómo funciona internamente una computadora.",
    icon: faUser,
    position: "top",
  },
  {
    id: "header",
    target: "header",
    title: "Barra de Navegación",
    content:
      "Aquí encontrarás el logo, el estado de la simulación, los controles principales y acceso a notificaciones, tour de ayuda y configuración.",
    icon: "icon-[lucide--navigation]",
    position: "bottom",
  },
  {
    id: "controls",
    target: "controls",
    title: "Controles de Simulación",
    content:
      "Controla la simulación: F7 (ejecutar ciclo), F8 (ejecutar instrucción), F4 (ejecución infinita), F9 (resetear). También puedes usar los botones visuales.",
    icon: "icon-[lucide--cpu]",
    position: "bottom",
  },
  {
    id: "editor-buttons",
    target: "panel-editor",
    title: "Editor de Código",
    content:
      "Aquí es donde escribirás tu código ensamblador. El editor tiene resaltado de sintaxis, autocompletado y validación en tiempo real. Usa los botones de arriba para crear, abrir, guardar y ensamblar tu programa.",
    icon: "icon-[lucide--file-terminal]",
    position: "right",
  },
  {
    id: "computer-view",
    target: "panel-computer",
    title: "Simulador de Computadora",
    content:
      "Aquí verás la computadora virtual con CPU, memoria RAM, registros, ALU, buses de datos y control, y todos los periféricos como pantalla, teclado, LEDs y switches.",
    icon: "icon-[lucide--monitor]",
    position: "left",
  },
  {
    id: "cpu-architecture",
    target: "cpu-component",
    title: "Arquitectura CPU",
    content:
      "Observa cómo la CPU ejecuta instrucciones paso a paso: fetch, decode, execute. Ve los valores en los registros, el contador de programa y el estado de las banderas.",
    icon: "icon-[lucide--microchip]",
    position: "left",
  },
  {
    id: "memory-ram",
    target: "memory-component",
    title: "Memoria RAM",
    content:
      "Explora la memoria RAM de 256 bytes. Ve cómo se almacenan datos e instrucciones, y cómo la CPU accede a diferentes direcciones de memoria. Cada celda muestra su dirección y valor en hexadecimal.",
    icon: "icon-[lucide--database]",
    position: "left",
  },

  {
    id: "settings-button",
    target: "settings-button",
    title: "Botón de Configuración",
    content:
      "Haz clic en este engranaje para acceder a las configuraciones avanzadas. Aquí podrás ajustar la velocidad de simulación, cambiar el tema visual, seleccionar el idioma y personalizar atajos de teclado.",
    icon: "icon-[lucide--settings]",
    position: "bottom",
  },
  {
    id: "settings-panel",
    target: "panel-settings",
    title: "Panel de Configuración",
    content:
      "En este panel encontrarás todas las opciones de configuración organizadas por categorías: simulación, interfaz, idioma y atajos de teclado. Los cambios se aplican automáticamente.",
    icon: "icon-[lucide--settings]",
    position: "left",
  },
  {
    id: "footer",
    target: "footer-links",
    title: "Recursos y Soporte",
    content:
      "Encuentra documentación completa, código fuente en GitHub, reporta bugs y accede a recursos de aprendizaje para dominar la programación en ensamblador.",
    icon: "icon-[lucide--help-circle]",
    position: "top",
  },
  {
    id: "final",
    target: "cycle-button",
    title: "¡Listo para Programar!",
    content:
      "Ya conoces las funciones principales de VonSim8. Comienza escribiendo código en el editor, ejecuta la simulación paso a paso con el botón 'Por Ciclo' y observa cómo funciona tu programa en la computadora virtual. ¡Disfruta programando!",
    icon: "icon-[lucide--rocket]",
    position: "bottom",
  },
];

const useTourState = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [targetFound, setTargetFound] = useState(true);
  const [, setSettingsOpen] = useAtom(settingsOpenAtom);

  const isLastStep = useMemo(() => currentStep === tourSteps.length - 1, [currentStep]);
  const isFirstStep = useMemo(() => currentStep === 0, [currentStep]);

  const completeTour = useCallback(() => {
    setIsVisible(false);
    localStorage.setItem("vonsim8-tour-completed", "true");
  }, []);

  const handleNext = useCallback(() => {
    setCurrentStep(prev => Math.min(prev + 1, tourSteps.length - 1));
  }, []);

  const handlePrev = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  }, []);

  const handleSkip = useCallback(() => {
    completeTour();
  }, [completeTour]);

  const startTour = useCallback(() => {
    setIsVisible(true);
    setCurrentStep(0);
  }, []);

  useEffect(() => {
    // El tour ya no se inicia automáticamente
    // Solo se iniciará cuando el usuario haga clic en el botón del tour
  }, []);

  // Verificar si el target existe y manejar apertura/cierre de configuración
  useEffect(() => {
    const step = tourSteps[currentStep];

    // Usar un timeout para dar tiempo a que los elementos se rendericen
    const checkTarget = () => {
      const el = document.querySelector(`[data-testid="${step.target}"]`);
      setTargetFound(!!el);
    };

    // Verificar inmediatamente
    checkTarget();

    // Verificar nuevamente después de un breve delay para elementos que se renderizan dinámicamente
    const timeoutId = setTimeout(checkTarget, 100);

    // Abrir configuración automáticamente cuando llegamos al paso del botón
    if (step.id === "settings-button") {
      setSettingsOpen(true);
    }
    // Cerrar configuración cuando salimos de los pasos de configuración
    else if (step.id !== "settings-panel" && step.id !== "settings-button") {
      setSettingsOpen(false);
    }

    return () => clearTimeout(timeoutId);
  }, [currentStep, setSettingsOpen]);

  return {
    currentStep,
    isVisible,
    isLastStep,
    isFirstStep,
    handleNext,
    handlePrev,
    handleSkip,
    completeTour,
    startTour,
    targetFound,
  };
};

const useTooltipPosition = (step: TourStep) => {
  return useMemo(() => {
    const targetElement = document.querySelector(`[data-testid="${step.target}"]`);
    if (!targetElement) return null;

    const rect = targetElement.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Si es el primer paso (welcome) y está en posición top, centrar en pantalla
    if (step.id === "welcome" && step.position === "top") {
      const positionStyles = {
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      };
      const highlightStyles = {
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
      };
      return { positionStyles, highlightStyles };
    }

    // Caso especial para los enlaces del footer: usar posicionamiento estándar pero ajustar para que no cree espacios
    if (step.id === "footer") {
      // Usar el posicionamiento estándar de "top" pero con ajustes específicos
      const tooltipWidth = 320;
      const tooltipHeight = 200;

      let top = rect.top - tooltipHeight - 60; // Posicionar mucho más arriba para evitar scroll
      let left = rect.right + 20; // Posicionar a la derecha de los enlaces
      const transform = "translateX(0)"; // Sin centrado, alineado a la izquierda del tooltip

      // Asegurar que el tooltip no se salga de la pantalla y no active scroll
      if (top < 40) {
        top = 40; // Margen mínimo desde el borde superior
      }
      // Si aún está muy abajo, posicionarlo en el centro superior de la pantalla
      if (top + tooltipHeight > viewportHeight - 100) {
        top = Math.max(40, viewportHeight / 2 - tooltipHeight / 2);
      }
      // Ajustar horizontalmente para que no se salga por la derecha
      if (left + tooltipWidth > viewportWidth) {
        left = viewportWidth - tooltipWidth - 20;
      }

      const positionStyles = { top, left, transform };
      const highlightStyles = {
        top: rect.top - 2,
        left: rect.left - 2,
        width: rect.width + 4,
        height: rect.height + 4,
      };
      return { positionStyles, highlightStyles };
    }

    // Calcular posición base
    let top, left, transform;

    switch (step.position) {
      case "top":
        top = rect.top - 20;
        left = rect.left + rect.width / 2;
        transform = "translateX(-50%)";
        break;
      case "bottom":
        top = rect.bottom + 20;
        left = rect.left + rect.width / 2;
        transform = "translateX(-50%)";
        break;
      case "left":
        top = rect.top + rect.height / 2;
        left = rect.left - 20;
        transform = "translateY(-50%)";
        break;
      case "right":
        top = rect.top + rect.height / 2;
        left = rect.right + 20;
        transform = "translateY(-50%)";
        break;
    }

    // Ajustar posición para mantener el tooltip dentro de la pantalla
    const tooltipWidth = 320; // Ancho estimado del tooltip
    const tooltipHeight = 200; // Alto estimado del tooltip

    // Ajustar horizontalmente
    if (left + tooltipWidth / 2 > viewportWidth) {
      left = viewportWidth - tooltipWidth / 2 - 20;
    } else if (left - tooltipWidth / 2 < 0) {
      left = tooltipWidth / 2 + 20;
    }

    // Ajustar verticalmente
    if (top + tooltipHeight > viewportHeight) {
      top = viewportHeight - tooltipHeight - 20;
    } else if (top < 0) {
      top = 20;
    }

    const positionStyles = { top, left, transform };
    const highlightStyles = {
      top: rect.top - 8,
      left: rect.left - 8,
      width: rect.width + 16,
      height: rect.height + 16,
    };

    return { positionStyles, highlightStyles };
  }, [step]);
};

const ProgressBar = memo(({ current, total }: { current: number; total: number }) => (
  <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-stone-700">
    <div
      className="h-full bg-mantis-500 transition-all duration-300"
      style={{ width: `${((current + 1) / total) * 100}%` }}
    />
  </div>
));
ProgressBar.displayName = "ProgressBar";

const TourTooltip = memo(
  ({
    step,
    currentStep,
    isLastStep,
    isFirstStep,
    onNext,
    onPrev,
    onSkip,
    onFinish,
    totalSteps,
    targetFound,
  }: {
    step: TourStep;
    currentStep: number;
    isLastStep: boolean;
    isFirstStep: boolean;
    onNext: () => void;
    onPrev: () => void;
    onSkip: () => void;
    onFinish: () => void;
    totalSteps: number;
    targetFound: boolean;
  }) => {
    const positionData = useTooltipPosition(step);
    const tooltipRef = useRef<HTMLDivElement>(null);

    // Foco automático para accesibilidad
    useEffect(() => {
      tooltipRef.current?.focus();
    }, [currentStep]);

    // Animación de entrada
    const animationClass = "animate-fade-in";

    if (!targetFound || !positionData) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="max-w-sm rounded-lg border-2 border-mantis-400 bg-stone-900 p-8 text-center shadow-2xl">
            <FontAwesomeIcon
              icon={faExclamationTriangle}
              className="mb-4 text-4xl text-yellow-400"
            />
            <h3 className="mb-2 text-lg font-semibold text-mantis-400">Elemento no encontrado</h3>
            <p className="mb-2 text-stone-300">
              No se pudo encontrar el elemento:{" "}
              <code className="text-mantis-400">{step.target}</code>
            </p>
            <p className="mb-4 text-xs text-stone-400">
              Paso {currentStep + 1} de {totalSteps}: {step.title}
            </p>
            <div className="flex gap-2">
              <Button onClick={onPrev} disabled={isFirstStep} variant="outline" size="sm">
                Anterior
              </Button>
              <Button onClick={onSkip} className="bg-mantis-600 hover:bg-mantis-700">
                Saltar tour
              </Button>
            </div>
          </div>
        </div>
      );
    }

    const { positionStyles, highlightStyles } = positionData;

    return (
      <div className="fixed inset-0 z-50 bg-black/50">
        {/* Overlay con agujero */}
        <div className="relative size-full">
          <div
            className="absolute rounded-lg border-2 border-mantis-400 bg-transparent shadow-2xl transition-all duration-300"
            style={highlightStyles}
          />
          {/* Tooltip */}
          <div
            ref={tooltipRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            className={`absolute max-w-sm rounded-lg border border-mantis-400 bg-stone-900 p-6 text-white shadow-xl focus:outline-none ${animationClass}`}
            style={positionStyles}
          >
            <ProgressBar current={currentStep} total={totalSteps} />
            <div className="mb-2 flex items-center gap-3">
              {step.icon &&
                (typeof step.icon === "string" ? (
                  <span className={`${step.icon} text-2xl text-mantis-400`} />
                ) : (
                  <FontAwesomeIcon icon={step.icon} className="text-2xl text-mantis-400" />
                ))}
              <h3 className="text-lg font-semibold text-mantis-400">{step.title}</h3>
            </div>
            <p className="mb-4 text-sm text-stone-300">{step.content}</p>
            <div className="mt-4 flex items-center justify-between gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onSkip}
                className="text-stone-400 hover:text-white"
                aria-label="Saltar tour"
              >
                Saltar
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onPrev}
                  disabled={isFirstStep}
                  className="flex items-center gap-1"
                  aria-label="Anterior"
                >
                  <FontAwesomeIcon icon={faChevronLeft} />
                  Anterior
                </Button>
                {!isLastStep ? (
                  <Button
                    size="sm"
                    onClick={onNext}
                    className="flex items-center gap-1 bg-mantis-600 hover:bg-mantis-700"
                    aria-label="Siguiente"
                  >
                    Siguiente
                    <FontAwesomeIcon icon={faChevronRight} />
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={onFinish}
                    className="flex items-center gap-1 bg-mantis-600 hover:bg-mantis-700"
                    aria-label="Finalizar"
                  >
                    Finalizar
                    <FontAwesomeIcon icon={faCheckCircle} />
                  </Button>
                )}
              </div>
            </div>
            <div className="mt-2 text-right text-xs text-stone-500">
              Paso {currentStep + 1} de {totalSteps}
            </div>
            <button
              onClick={onSkip}
              className="absolute right-2 top-2 rounded p-1 text-stone-400 hover:text-white focus:outline-none"
              aria-label="Cerrar"
            >
              <FontAwesomeIcon icon={faTimes} size="sm" />
            </button>
          </div>
        </div>
      </div>
    );
  },
);
TourTooltip.displayName = "TourTooltip";

export const WelcomeTour = memo(() => {
  const {
    currentStep,
    isVisible,
    isLastStep,
    isFirstStep,
    handleNext,
    handlePrev,
    handleSkip,
    completeTour,
    startTour,
    targetFound,
  } = useTourState();

  // Exponer la función startTour globalmente para que el header pueda usarla
  useEffect(() => {
    (window as any).startWelcomeTour = startTour;
    return () => {
      delete (window as any).startWelcomeTour;
    };
  }, [startTour]);

  const currentStepData = useMemo(() => tourSteps[currentStep], [currentStep]);

  // Accesibilidad: cerrar con Escape
  useEffect(() => {
    if (!isVisible) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleSkip();
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isVisible, handleSkip, handleNext, handlePrev]);

  if (!isVisible || !currentStepData) return null;

  return (
    <TourTooltip
      step={currentStepData}
      currentStep={currentStep}
      isLastStep={isLastStep}
      isFirstStep={isFirstStep}
      onNext={handleNext}
      onPrev={handlePrev}
      onSkip={handleSkip}
      onFinish={completeTour}
      totalSteps={tourSteps.length}
      targetFound={targetFound}
    />
  );
});

WelcomeTour.displayName = "WelcomeTour";

// Animación fade-in
// Agrega en tu CSS global:
// @keyframes fade-in { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
// .animate-fade-in { animation: fade-in 0.3s cubic-bezier(.4,0,.2,1); }
