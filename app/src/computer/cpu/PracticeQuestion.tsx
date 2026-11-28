import clsx from "clsx";

import type { PracticeQuestionState, PracticeResult } from "./usePracticeMode";

/**
 * Pregunta del modo práctica, al final de la lista de pasos: el alumno
 * predice qué va a hacer la CPU antes de avanzar.
 */
export function PracticeQuestion({
  question,
  onChoose,
}: {
  question: PracticeQuestionState;
  onChoose: (option: string) => void;
}) {
  return (
    <li
      className="ml-6 list-none rounded-lg border border-amber-300/60 bg-amber-950/30 px-3 py-2"
      role="group"
      aria-label="Pregunta de práctica"
    >
      <p className="mb-1 text-xs font-bold text-amber-200">
        <span aria-hidden="true">❓ </span>¿Qué va a hacer la CPU ahora?
      </p>
      <p className="mb-1.5 text-[11px] leading-snug text-stone-400">
        Pensá en qué parte del ciclo está y elegí el próximo paso antes de avanzar.
      </p>
      <div className="flex flex-col gap-1">
        {question.options.map(option => (
          <button
            key={option}
            type="button"
            aria-pressed={question.chosen === option}
            onClick={() => onChoose(option)}
            className={clsx(
              "rounded border px-2 py-1 text-left font-mono text-xs transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-300",
              question.chosen === option
                ? "border-amber-300 bg-amber-500/25 text-amber-50"
                : "border-stone-500 bg-stone-800 text-stone-100 hover:border-amber-300 hover:bg-stone-700",
            )}
          >
            {option}
          </button>
        ))}
      </div>
      {question.chosen && (
        <p className="mt-1.5 text-[11px] text-amber-200">
          Ahora presioná <kbd className="rounded bg-stone-700 px-1 font-mono">F7</kbd> para ver si
          acertaste.
        </p>
      )}
    </li>
  );
}

const BADGES: Record<PracticeResult["status"], { text: string; title: string; style: string }> = {
  ok: {
    text: "✓ Acertaste",
    title: "Predijiste bien este paso",
    style: "bg-green-700/60 text-green-100",
  },
  fail: { text: "✗ Era este", title: "Predijiste otro paso", style: "bg-red-700/60 text-red-100" },
  void: {
    text: "Anulada",
    title: "El simulador mostró un paso distinto al esperado: esta pregunta no cuenta",
    style: "bg-stone-600/60 text-stone-200",
  },
};

/** Marca que queda en un paso por el que se preguntó. */
export function PracticeBadge({ status }: { status: PracticeResult["status"] }) {
  const badge = BADGES[status];
  return (
    <span
      className={clsx("ml-1 shrink-0 self-start rounded px-1 text-[10px] font-bold", badge.style)}
      title={badge.title}
    >
      {badge.text}
    </span>
  );
}
