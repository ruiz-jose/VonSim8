import { useAtomValue } from "jotai";
import { useCallback, useEffect, useState } from "react";

import { useSettings } from "@/lib/settings";

import { groupByInstruction } from "./instruction-summary";
import { type Flags, predictNextStep, sameStep } from "./next-step";
import { buildOptions, isQuizzable } from "./practice-quiz";
import { cycleAtom, type CycleMessage, registerAtoms } from "./state";

export type PracticeResult = { chosen: string; status: "ok" | "fail" | "void" };

export type PracticeQuestionState = {
  /** Posición que va a tener el próximo paso en el historial. */
  index: number;
  options: string[];
  /** Opción elegida, si el alumno ya respondió. */
  chosen: string | null;
};

export type PracticeState = {
  results: Record<number, PracticeResult>;
  question: PracticeQuestionState | null;
  onChoose: (option: string) => void;
};

type Pending = { index: number; chosen: string; predicted: string };

function readFlags(value: { bit?: (i: number) => boolean } | undefined): Flags {
  const bit = (i: number) => (typeof value?.bit === "function" ? value.bit(i) : false);
  return { ZF: bit(0), CF: bit(1), OF: bit(2), SF: bit(3) };
}

/**
 * Modo práctica del panel del ciclo: cuando la simulación está en pausa,
 * pregunta qué va a hacer la CPU en el próximo paso. Al ocurrir el paso, se
 * compara la respuesta con lo que realmente hizo la CPU.
 */
export function usePracticeMode(
  messages: CycleMessage[],
  isPaused: boolean,
  instructionComplete: boolean,
) {
  const [settings, setSettings] = useSettings();
  const enabled = settings.practiceMode === true;
  const cycle = useAtomValue(cycleAtom);
  const flagsValue = useAtomValue(registerAtoms.FLAGS);
  const [pending, setPending] = useState<Pending | null>(null);
  const [results, setResults] = useState<Record<number, PracticeResult>>({});

  // Una ejecución nueva empieza con el puntaje en cero
  useEffect(() => {
    if (messages.length === 0) {
      setResults({});
      setPending(null);
    }
  }, [messages.length]);

  // Cuando ocurre el paso por el que se preguntó, se califica la respuesta.
  // Si el paso real no es el que se esperaba, la pregunta se anula.
  useEffect(() => {
    if (!pending || messages.length <= pending.index) return;
    const actual = messages[pending.index].action;
    const status = !sameStep(pending.predicted, actual)
      ? "void"
      : sameStep(pending.chosen, actual)
        ? "ok"
        : "fail";
    setResults(prev => ({ ...prev, [pending.index]: { chosen: pending.chosen, status } }));
    setPending(null);
  }, [messages, pending]);

  // Próximo paso esperado
  const groups = groupByInstruction(messages);
  const current = groups[groups.length - 1];
  const inInterrupt = current?.some(step => step.stage === "Interrupción") === true;
  const stepsDone = !current || instructionComplete ? 0 : current.length;
  const info =
    "metadata" in cycle && cycle.metadata
      ? { name: cycle.metadata.name, operands: cycle.metadata.operands }
      : null;
  const predicted =
    enabled && isPaused && messages.length > 0 && !inInterrupt
      ? predictNextStep(stepsDone, info, readFlags(flagsValue))
      : null;

  const index = messages.length;
  const question: PracticeQuestionState | null =
    predicted && isQuizzable(predicted)
      ? {
          index,
          options: buildOptions(predicted, stepsDone < 3 ? "Captación" : "Ejecución", index),
          chosen: pending?.index === index ? pending.chosen : null,
        }
      : null;

  const onChoose = useCallback(
    (option: string) => {
      if (predicted) setPending({ index, chosen: option, predicted });
    },
    [index, predicted],
  );

  const toggle = useCallback(
    () => setSettings(prev => ({ ...prev, practiceMode: !prev.practiceMode })),
    [setSettings],
  );

  const graded = Object.values(results).filter(r => r.status !== "void");
  const practice: PracticeState | undefined = enabled ? { results, question, onChoose } : undefined;

  return {
    enabled,
    toggle,
    practice,
    score: { correct: graded.filter(r => r.status === "ok").length, answered: graded.length },
  };
}
