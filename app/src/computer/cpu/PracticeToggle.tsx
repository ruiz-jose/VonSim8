import clsx from "clsx";

/**
 * Interruptor del modo práctica en el encabezado del panel, con el puntaje
 * de la ejecución actual.
 */
export function PracticeToggle({
  enabled,
  onToggle,
  score,
}: {
  enabled: boolean;
  onToggle: () => void;
  score: { correct: number; answered: number };
}) {
  return (
    <div className="flex items-center gap-2">
      {enabled && score.answered > 0 && (
        <span className="text-xs text-amber-200" title="Respuestas correctas en esta ejecución">
          {score.correct}/{score.answered}
        </span>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={onToggle}
        title="Modo práctica: antes de ver cada paso, elegí qué hizo la CPU"
        className={clsx(
          "rounded-full border px-2 py-0.5 text-xs font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-300",
          enabled
            ? "border-amber-300 bg-amber-500/20 text-amber-200"
            : "border-stone-500 text-stone-300 hover:border-amber-300 hover:text-amber-200",
        )}
      >
        <span aria-hidden="true">❓ </span>Practicar
      </button>
    </div>
  );
}
