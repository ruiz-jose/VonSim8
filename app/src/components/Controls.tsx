import {
  faForward,
  faInfinity,
  faPlay,
  faRedo,
  faStepForward,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import clsx from "clsx";
import { useCallback, useEffect, useState } from "react";
import { useKey } from "react-use";

import { useSimulation } from "@/computer/simulation";
import { useTranslate } from "@/lib/i18n";

import { RunButton } from "./RunButton";

// Definir el tipo localmente
type RunUntil = "cycle-change" | "end-of-phase" | "end-of-instruction" | "infinity";

export function Controls({ className }: { className?: string }) {
  const translate = useTranslate();
  const { status, dispatch } = useSimulation();

  // Nuevo estado para recordar el modo de ejecución activo
  const [activeRunMode, setActiveRunMode] = useState<null | RunUntil>(null);

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

  // Cuando la simulación se detiene, limpiar el modo activo
  useEffect(() => {
    if (status.type !== "running") {
      setActiveRunMode(null);
    }
  }, [status.type]);

  const runCycle = useCallback(() => {
    if (status.type === "running") return;
    setActiveRunMode("cycle-change");
    dispatch("cpu.run", "cycle-change");
  }, [status.type, dispatch]);
  useKey(
    "F7",
    ev => {
      ev.preventDefault();
      runCycle();
    },
    undefined,
    [runCycle],
  );

  const runPhase = useCallback(() => {
    if (status.type === "running") return;
    setActiveRunMode("end-of-phase");
    dispatch("cpu.run", "end-of-phase");
  }, [status.type, dispatch]);
  useKey(
    "F6",
    ev => {
      ev.preventDefault();
      runPhase();
    },
    undefined,
    [runPhase],
  );

  const runInstruction = useCallback(() => {
    if (status.type === "running") return;
    setActiveRunMode("end-of-instruction");
    dispatch("cpu.run", "end-of-instruction");
  }, [status.type, dispatch]);
  useKey(
    "F8",
    ev => {
      ev.preventDefault();
      runInstruction();
    },
    undefined,
    [runInstruction],
  );

  const runInfinity = useCallback(() => {
    if (status.type === "running") return;
    setActiveRunMode("infinity");
    dispatch("cpu.run", "infinity");
  }, [status.type, dispatch]);
  useKey(
    "F4",
    ev => {
      ev.preventDefault();
      runInfinity();
    },
    undefined,
    [runInfinity],
  );

  const handlePause = useCallback(() => {
    if (status.type === "running") {
      dispatch("cpu.stop", false); // pausar
    }
  }, [status.type, dispatch]);

  const handleReset = useCallback(() => {
    if (status.type !== "running") {
      dispatch("cpu.stop", true); // reset
    }
  }, [status.type, dispatch]);

  // Agregar tecla F9 para reset
  useKey(
    "F9",
    ev => {
      ev.preventDefault();
      handleReset();
    },
    undefined,
    [handleReset],
  );

  // Tecla Space solo para pausar cuando está corriendo y no estamos en un input/textarea
  useKey(
    " ",
    ev => {
      // Solo prevenir si no estamos en un elemento de entrada de texto
      const target = ev.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.contentEditable === "true"
      ) {
        return; // No interferir con la escritura
      }

      ev.preventDefault();
      if (status.type === "running") {
        handlePause();
      }
    },
    { event: "keydown" },
    [status.type, handlePause],
  );

  // Determinar si mostrar texto y atajos según el tamaño de pantalla
  const showText = screenSize === "desktop" || screenSize === "tablet";
  const showShortcuts = screenSize === "desktop";
  const common = {
    disabled: status.type === "running",
    compact: screenSize === "mobile",
    showText,
    showShortcuts,
    pauseLabel: translate("control.action.pause"),
    onPause: handlePause,
  };

  return (
    <div
      data-testid="controls"
      className={clsx(
        // Ajustar padding según el tamaño de pantalla
        "flex items-center justify-center gap-4 rounded-xl border border-stone-700 bg-stone-900/80 shadow-lg",
        screenSize === "mobile"
          ? "gap-2 px-2 py-0.5"
          : screenSize === "compact"
            ? "gap-3 px-2 py-1"
            : "gap-4 px-3 py-1",
        className,
      )}
    >
      <RunButton
        testId="cycle-button"
        icon={faPlay}
        label={translate("control.action.run.cycle-change")}
        shortcut="F7"
        isActive={status.type === "running" && activeRunMode === "cycle-change"}
        {...common}
        onRun={runCycle}
      />
      <RunButton
        testId="phase-button"
        icon={faForward}
        label={translate("control.action.run.end-of-phase")}
        title={translate("control.action.run.end-of-phase-hint")}
        shortcut="F6"
        isActive={status.type === "running" && activeRunMode === "end-of-phase"}
        {...common}
        onRun={runPhase}
      />
      <RunButton
        testId="new-button"
        icon={faStepForward}
        label={translate("control.action.run.end-of-instruction")}
        shortcut="F8"
        isActive={status.type === "running" && activeRunMode === "end-of-instruction"}
        {...common}
        onRun={runInstruction}
      />
      <RunButton
        testId="open-button"
        icon={faInfinity}
        label={translate("control.action.run.infinity")}
        shortcut="F4"
        isActive={status.type === "running" && activeRunMode === "infinity"}
        {...common}
        onRun={runInfinity}
      />
      {/* Botón reset/reiniciar (no cambia a pausa) */}
      <button
        data-testid="assemble-button"
        onClick={handleReset}
        disabled={status.type === "stopped" || status.type === "running"}
        title={translate("control.action.reset")}
        className={clsx(
          "group relative flex flex-col items-center rounded-lg transition hover:bg-red-600/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-300 disabled:opacity-50",
          screenSize === "mobile" ? "px-1 py-0.5" : "px-1.5 py-0.5",
        )}
      >
        <span className="flex items-center justify-center">
          <FontAwesomeIcon
            icon={faRedo}
            size="lg"
            className="text-red-400 transition group-hover:scale-110"
          />
          {showShortcuts && (
            <span className="pointer-events-none ml-1 font-mono text-[10px] text-stone-300">
              F9
            </span>
          )}
        </span>
        {showText && <span className="mt-0.5 text-xs">{translate("control.action.reset")}</span>}
      </button>
    </div>
  );
}
