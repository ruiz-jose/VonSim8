import { faPause, faPlay, faRotateLeft, faStop } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import clsx from "clsx";
import { memo } from "react";

import { Button } from "@/components/ui/Button";
import { Tooltip } from "@/components/ui/Tooltip";
import { useSimulation } from "@/computer/simulation";

export const Toolbar = memo(() => {
  const { status, dispatch } = useSimulation();

  const isRunning = status.type === "running";
  const isPaused = status.type === "paused";

  const handleRun = () => {
    if (isRunning) {
      dispatch("cpu.stop");
    } else {
      dispatch("cpu.run", "infinity");
    }
  };

  const handlePause = () => {
    if (isPaused) {
      dispatch("cpu.run", "infinity");
    } else {
      dispatch("cpu.stop");
    }
  };

  const handleReset = () => {
    dispatch("cpu.stop", true);
  };

  return (
    <div className="flex items-center justify-start border-b border-stone-700 bg-gradient-to-r from-stone-800 to-stone-900 px-4 py-2 shadow-sm">
      {/* Controles de simulación */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 rounded-lg bg-stone-800/50 p-1">
          <Tooltip
            content={isRunning ? "Detener simulación" : "Ejecutar simulación"}
            position="bottom"
          >
            <Button
              variant={isRunning ? "destructive" : "default"}
              size="sm"
              onClick={handleRun}
              className={clsx("size-8 p-0 transition-all", isRunning && "animate-pulse-glow")}
              aria-label={isRunning ? "Detener" : "Ejecutar"}
            >
              <FontAwesomeIcon icon={isRunning ? faStop : faPlay} className="size-3" />
            </Button>
          </Tooltip>

          <Tooltip
            content={isPaused ? "Reanudar simulación" : "Pausar simulación"}
            position="bottom"
          >
            <Button
              variant={isPaused ? "secondary" : "ghost"}
              size="sm"
              onClick={handlePause}
              className="size-8 p-0"
              aria-label={isPaused ? "Reanudar" : "Pausar"}
            >
              <FontAwesomeIcon icon={faPause} className="size-3" />
            </Button>
          </Tooltip>

          <Tooltip content="Reiniciar simulación" position="bottom">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="size-8 p-0"
              aria-label="Reiniciar"
            >
              <FontAwesomeIcon icon={faRotateLeft} className="size-3" />
            </Button>
          </Tooltip>
        </div>

        {/* Separador */}
        <div className="h-6 w-px bg-stone-600" />

        {/* Estado de simulación */}
        <div className="flex items-center gap-2 text-xs">
          <div
            className={clsx(
              "flex items-center gap-1.5 rounded-full px-2 py-1 font-medium",
              isRunning
                ? "border border-green-500/30 bg-green-500/20 text-green-300"
                : isPaused
                  ? "border border-yellow-500/30 bg-yellow-500/20 text-yellow-300"
                  : "border border-stone-600/30 bg-stone-600/20 text-stone-300",
            )}
          >
            <div
              className={clsx(
                "size-2 rounded-full",
                isRunning ? "animate-pulse bg-green-400" : "bg-stone-400",
              )}
            />
            {isRunning ? "Ejecutando" : isPaused ? "Pausado" : "Detenido"}
          </div>
        </div>
      </div>
    </div>
  );
});

Toolbar.displayName = "Toolbar";
