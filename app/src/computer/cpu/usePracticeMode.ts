import { useCallback, useEffect, useState } from "react";

import { useSettings } from "@/lib/settings";

import type { PracticeState } from "./CycleStepList";
import { isQuizzable } from "./practice-quiz";
import type { CycleMessage } from "./state";

/**
 * Estado del modo práctica del panel del ciclo: qué paso se pregunta ahora,
 * las respuestas dadas y el puntaje de la ejecución actual.
 */
export function usePracticeMode(messages: CycleMessage[], isRunning: boolean) {
  const [settings, setSettings] = useSettings();
  const enabled = settings.practiceMode === true;
  const [answers, setAnswers] = useState<Record<number, string>>({});

  // Una ejecución nueva empieza con el puntaje en cero
  useEffect(() => {
    if (messages.length === 0) setAnswers({});
  }, [messages.length]);

  const onAnswer = useCallback((index: number, chosen: string) => {
    setAnswers(prev => (index in prev ? prev : { ...prev, [index]: chosen }));
  }, []);

  const toggle = useCallback(
    () => setSettings(prev => ({ ...prev, practiceMode: !prev.practiceMode })),
    [setSettings],
  );

  const lastIndex = messages.length - 1;
  const last = messages[lastIndex];
  const askIndex =
    enabled && !isRunning && last && !(lastIndex in answers) && isQuizzable(last.action)
      ? lastIndex
      : null;

  const answered = Object.entries(answers);
  const correct = answered.filter(([i, chosen]) => messages[Number(i)]?.action === chosen).length;
  const practice: PracticeState | undefined = enabled ? { answers, askIndex, onAnswer } : undefined;

  return {
    enabled,
    toggle,
    practice,
    score: { correct, answered: answered.length },
  };
}
