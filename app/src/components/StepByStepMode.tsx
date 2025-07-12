import { memo, useState, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlay, faPause, faStepForward, faStepBackward, faRedo } from "@fortawesome/free-solid-svg-icons";
import clsx from "clsx";

import { Button } from "@/components/ui/Button";
import { ExecutionPhases } from "@/computer/cpu/ExecutionPhases";

export interface Step {
  id: string;
  phase: 'fetch' | 'decode' | 'execute';
  title: string;
  description: string;
  instruction?: string;
  registers?: Record<string, string>;
  memory?: Record<string, string>;
}

interface StepByStepModeProps {
  steps: Step[];
  onStepChange?: (stepIndex: number) => void;
  onComplete?: () => void;
  className?: string;
}

export const StepByStepMode = memo(({ 
  steps, 
  onStepChange, 
  onComplete,
  className 
}: StepByStepModeProps) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(2000); // ms

  const currentStep = steps[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;

  const goToStep = useCallback((stepIndex: number) => {
    const newIndex = Math.max(0, Math.min(stepIndex, steps.length - 1));
    setCurrentStepIndex(newIndex);
    onStepChange?.(newIndex);
  }, [steps.length, onStepChange]);

  const nextStep = useCallback(() => {
    if (!isLastStep) {
      goToStep(currentStepIndex + 1);
    } else {
      setIsPlaying(false);
      onComplete?.();
    }
  }, [currentStepIndex, isLastStep, goToStep, onComplete]);

  const prevStep = useCallback(() => {
    if (!isFirstStep) {
      goToStep(currentStepIndex - 1);
    }
  }, [currentStepIndex, isFirstStep, goToStep]);

  const reset = useCallback(() => {
    goToStep(0);
    setIsPlaying(false);
  }, [goToStep]);

  // Auto-play functionality
  const togglePlay = useCallback(() => {
    if (isPlaying) {
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
    }
  }, [isPlaying]);

  // Auto-advance when playing
  const autoAdvance = useCallback(() => {
    if (isPlaying && !isLastStep) {
      const timer = setTimeout(nextStep, playbackSpeed);
      return () => clearTimeout(timer);
    }
  }, [isPlaying, isLastStep, nextStep, playbackSpeed]);

  // Effect for auto-advance
  if (isPlaying && !isLastStep) {
    setTimeout(nextStep, playbackSpeed);
  }

  return (
    <div className={clsx(
      "bg-stone-900 border border-stone-600 rounded-lg p-4",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-mantis-400">
          Modo Paso a Paso
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-stone-400">
            Paso {currentStepIndex + 1} de {steps.length}
          </span>
        </div>
      </div>

      {/* Indicador de fases de ejecución */}
      <ExecutionPhases 
        currentPhase={currentStep?.phase} 
        className="mb-4"
      />

      {/* Contenido del paso actual */}
      <div className="bg-stone-800 rounded-lg p-4 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-medium text-mantis-400">
            {currentStep?.title}
          </span>
        </div>
        <p className="text-sm text-stone-300 mb-3">
          {currentStep?.description}
        </p>

        {/* Información de la instrucción */}
        {currentStep?.instruction && (
          <div className="bg-stone-700 rounded p-2 mb-3">
            <span className="text-xs text-stone-400">Instrucción:</span>
            <div className="font-mono text-sm text-mantis-400">
              {currentStep.instruction}
            </div>
          </div>
        )}

        {/* Estado de registros */}
        {currentStep?.registers && (
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div>
              <span className="text-xs text-stone-400">Registros:</span>
              <div className="space-y-1 mt-1">
                {Object.entries(currentStep.registers).map(([reg, value]) => (
                  <div key={reg} className="flex justify-between text-xs">
                    <span className="text-stone-300">{reg}:</span>
                    <span className="font-mono text-mantis-400">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Estado de memoria */}
        {currentStep?.memory && (
          <div>
            <span className="text-xs text-stone-400">Memoria:</span>
            <div className="grid grid-cols-4 gap-1 mt-1">
              {Object.entries(currentStep.memory).map(([addr, value]) => (
                <div key={addr} className="text-xs text-center">
                  <div className="text-stone-500">{addr}</div>
                  <div className="font-mono text-mantis-400">{value}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Controles */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={reset}
            disabled={isFirstStep && !isPlaying}
            className="flex items-center gap-1"
          >
            <FontAwesomeIcon icon={faRedo} />
            Reiniciar
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={prevStep}
            disabled={isFirstStep}
            className="flex items-center gap-1"
          >
            <FontAwesomeIcon icon={faStepBackward} />
            Anterior
          </Button>

          <Button
            variant={isPlaying ? "secondary" : "default"}
            size="sm"
            onClick={togglePlay}
            className="flex items-center gap-1"
          >
            <FontAwesomeIcon icon={isPlaying ? faPause : faPlay} />
            {isPlaying ? "Pausar" : "Reproducir"}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={nextStep}
            disabled={isLastStep}
            className="flex items-center gap-1"
          >
            Siguiente
            <FontAwesomeIcon icon={faStepForward} />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-stone-400">Velocidad:</span>
          <select
            value={playbackSpeed}
            onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
            className="bg-stone-800 border border-stone-600 rounded px-2 py-1 text-xs"
          >
            <option value={1000}>Rápida</option>
            <option value={2000}>Normal</option>
            <option value={4000}>Lenta</option>
          </select>
        </div>
      </div>

      {/* Barra de progreso */}
      <div className="mt-4">
        <div className="w-full bg-stone-700 rounded-full h-2">
          <div
            className="bg-mantis-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
});

StepByStepMode.displayName = 'StepByStepMode'; 