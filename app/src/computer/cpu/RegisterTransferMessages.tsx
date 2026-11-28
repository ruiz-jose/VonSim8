import clsx from "clsx";
import { useAtomValue } from "jotai";
import { useEffect, useRef } from "react";

import { isHaltExecutionAtom, simulationAtom, useSimulation } from "@/computer/simulation";
import { programModifiedAtom } from "@/editor/state";
import { store } from "@/lib/jotai";
import { useSettings } from "@/lib/settings";
import { toast } from "@/lib/toast";

import { CycleStepList } from "./CycleStepList";
import { PracticeToggle } from "./PracticeToggle";
import {
  animationSyncAtom,
  currentInstructionCycleCountAtom,
  instructionCompleteAtom,
  instructionCountAtom,
  liveStepAtom,
  messageHistoryAtom,
} from "./state";
import { usePracticeMode } from "./usePracticeMode";

function clearHistory() {
  store.set(messageHistoryAtom, []);
  store.set(liveStepAtom, null);
  store.set(animationSyncAtom, { canAnimate: true, pendingMessage: null });
}

/**
 * Panel "Ciclo de instrucción": muestra, paso a paso, qué hace la CPU en la
 * instrucción actual, con la notación de transferencia de registros y una
 * explicación en lenguaje simple.
 */
export function RegisterTransferMessages() {
  const messageHistory = useAtomValue(messageHistoryAtom);
  const liveStep = useAtomValue(liveStepAtom);
  const instructionComplete = useAtomValue(instructionCompleteAtom);
  const cycleCount = useAtomValue(currentInstructionCycleCountAtom);
  const simulationStatus = useAtomValue(simulationAtom);
  const programModified = useAtomValue(programModifiedAtom);
  const { devices } = useSimulation();
  const [settings] = useSettings();
  const containerRef = useRef<HTMLDivElement>(null);

  // Limpiar el historial cuando se detiene la simulación (salvo si terminó con HLT,
  // para que el alumno pueda revisar el último ciclo)
  useEffect(
    () =>
      store.sub(simulationAtom, () => {
        if (store.get(simulationAtom).type === "stopped" && !store.get(isHaltExecutionAtom)) {
          clearHistory();
        }
      }),
    [],
  );

  // Avisar si el programa en ejecución es modificado
  useEffect(() => {
    if (simulationStatus.type === "running" && programModified) {
      toast({
        title: "El programa ha sido modificado",
        description: "La ejecución se reiniciará desde el principio para aplicar los cambios.",
        variant: "info",
      });
    }
  }, [simulationStatus, programModified]);

  // Limpiar el historial al empezar una nueva ejecución (pero no al ejecutar HLT)
  useEffect(
    () =>
      store.sub(instructionCountAtom, () => {
        const isNewRun =
          store.get(instructionCountAtom) === 0 && store.get(simulationAtom).type === "running";
        if (isNewRun && !store.get(isHaltExecutionAtom)) {
          clearHistory();
          store.set(isHaltExecutionAtom, false);
        }
      }),
    [],
  );

  // Mantener a la vista el paso actual (siempre es el último de la lista)
  useEffect(() => {
    const container = containerRef.current;
    if (container) container.scrollTop = container.scrollHeight;
  }, [messageHistory, liveStep, instructionComplete]);

  const {
    enabled: practiceEnabled,
    toggle,
    practice,
    score,
  } = usePracticeMode(
    messageHistory,
    simulationStatus.type === "paused",
    instructionComplete === true,
  );

  // Mantener a la vista la pregunta del modo práctica
  const askIndex = practice?.question?.index ?? null;
  useEffect(() => {
    const container = containerRef.current;
    if (container && askIndex !== null) container.scrollTop = container.scrollHeight;
  }, [askIndex]);

  if (!settings.showCyclePanel) return null;

  const showLive = simulationStatus.type === "running" ? liveStep : null;

  return (
    <section
      // La clave cambia con el PIC para que la vista vuelva a encuadrar todo al moverse el panel
      key={devices.pic ? "con-pic" : "sin-pic"}
      aria-label="Ciclo de instrucción"
      className={clsx(
        "absolute z-10 flex h-[440px] w-[420px] flex-col rounded-xl border-2 border-stone-500/60 bg-stone-900 shadow-2xl",
        // Con el PIC activo, el panel va a la izquierda de la CPU para no taparlo
        devices.pic ? "left-[-460px] top-0" : "left-[20px] top-[520px]",
      )}
    >
      <header className="flex items-center justify-between rounded-t-xl border-b border-stone-600/60 bg-stone-800 px-4 py-2.5">
        <h3 className="text-sm font-bold uppercase tracking-wide text-mantis-400">
          Ciclo de instrucción
        </h3>
        <div className="flex items-center gap-3">
          <PracticeToggle enabled={practiceEnabled} onToggle={toggle} score={score} />
          <span className="text-xs text-stone-400" title="Ciclos de reloj de la instrucción actual">
            Ciclos: {cycleCount}
          </span>
        </div>
      </header>

      <div ref={containerRef} className="scrollbar-thin flex-1 overflow-y-auto p-3">
        {messageHistory.length === 0 && !showLive ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
            <span className="text-4xl" aria-hidden="true">
              ⏳
            </span>
            <p className="text-sm font-bold text-stone-300">Todavía no hay pasos</p>
            <p className="text-xs text-stone-400">
              Presioná <kbd className="rounded bg-stone-700 px-1 font-mono">F7</kbd> para avanzar un
              ciclo y ver qué hace la CPU en cada paso.
            </p>
          </div>
        ) : (
          <CycleStepList
            messages={messageHistory}
            liveStep={showLive}
            lastInstructionComplete={instructionComplete === true}
            practice={practice}
          />
        )}
      </div>
    </section>
  );
}
