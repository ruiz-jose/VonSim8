import clsx from "clsx";
import { useMemo } from "react";

import { buildOptions } from "./practice-quiz";
import type { CycleMessage } from "./state";

/**
 * Pregunta del modo práctica: reemplaza la notación y la explicación del paso
 * hasta que el alumno elige una opción.
 */
export function PracticeQuestion({
  msg,
  seed,
  onAnswer,
}: {
  msg: CycleMessage;
  seed: number;
  onAnswer: (chosen: string) => void;
}) {
  const options = useMemo(
    () => buildOptions(msg.action, msg.stage, seed),
    [msg.action, msg.stage, seed],
  );
  return (
    <div className="min-w-0 flex-1" role="group" aria-label="Pregunta de práctica">
      <p className="mb-1.5 text-xs font-bold text-amber-200">
        <span aria-hidden="true">❓ </span>¿Qué hizo la CPU en este paso?
      </p>
      <p className="mb-1.5 text-[11px] leading-snug text-stone-400">
        Mirá qué registros y buses se marcaron en la CPU y elegí la opción correcta.
      </p>
      <div className="flex flex-col gap-1">
        {options.map(option => (
          <button
            key={option}
            type="button"
            onClick={() => onAnswer(option)}
            className="rounded border border-stone-500 bg-stone-800 px-2 py-1 text-left font-mono text-xs text-stone-100 transition hover:border-amber-300 hover:bg-stone-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-300"
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Marca que queda en un paso ya respondido. */
export function PracticeBadge({ correct }: { correct: boolean }) {
  return (
    <span
      className={clsx(
        "ml-1 shrink-0 self-start rounded px-1 text-[10px] font-bold",
        correct ? "bg-green-700/60 text-green-100" : "bg-red-700/60 text-red-100",
      )}
      title={correct ? "Respondiste bien" : "Respondiste otra opción"}
    >
      {correct ? "✓ Bien" : "✗ Era esta"}
    </span>
  );
}
