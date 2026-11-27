import clsx from "clsx";
import { Fragment } from "react";

import { STAGE_DESCRIPTIONS } from "./cycle-explanations";
import type { CycleMessage } from "./state";

type StageStyle = { icon: string; title: string; card: string; badge: string; text: string };

const STAGE_STYLES: Record<string, StageStyle> = {
  Captación: {
    icon: "📥",
    title: "text-blue-300",
    card: "border-blue-400/40 bg-blue-900/20",
    badge: "bg-blue-600",
    text: "text-blue-100",
  },
  "Obtención de operandos": {
    icon: "🔍",
    title: "text-yellow-300",
    card: "border-yellow-400/40 bg-yellow-900/20",
    badge: "bg-yellow-600",
    text: "text-yellow-100",
  },
  Ejecución: {
    icon: "⚡",
    title: "text-green-300",
    card: "border-green-400/40 bg-green-900/20",
    badge: "bg-green-600",
    text: "text-green-100",
  },
  Escritura: {
    icon: "💾",
    title: "text-purple-300",
    card: "border-purple-400/40 bg-purple-900/20",
    badge: "bg-purple-600",
    text: "text-purple-100",
  },
  Interrupción: {
    icon: "🚨",
    title: "text-red-300",
    card: "border-red-400/40 bg-red-900/20",
    badge: "bg-red-600",
    text: "text-red-100",
  },
};

const DEFAULT_STYLE: StageStyle = {
  icon: "⚙️",
  title: "text-stone-300",
  card: "border-stone-500/40 bg-stone-800/40",
  badge: "bg-stone-600",
  text: "text-stone-100",
};

const styleFor = (stage: string) => STAGE_STYLES[stage] ?? DEFAULT_STYLE;

function StageHeader({ stage }: { stage: string }) {
  const style = styleFor(stage);
  return (
    <li className="mb-1.5 mt-3 flex list-none items-center gap-2 first:mt-0">
      <span className="text-base" aria-hidden="true">
        {style.icon}
      </span>
      <div className="min-w-0">
        <h4 className={clsx("text-sm font-bold", style.title)}>{stage}</h4>
        {STAGE_DESCRIPTIONS[stage] && (
          <p className="text-xs leading-tight text-stone-400">{STAGE_DESCRIPTIONS[stage]}</p>
        )}
      </div>
    </li>
  );
}

function StepCard({ msg, isCurrent }: { msg: CycleMessage; isCurrent: boolean }) {
  const style = styleFor(msg.stage);
  return (
    <li
      aria-current={isCurrent ? "step" : undefined}
      className={clsx(
        "ml-6 flex gap-2.5 rounded-lg border-l-2 py-1.5 pl-3 pr-2 transition-colors",
        style.card,
        isCurrent ? "ring-2 ring-white/40" : "opacity-75",
      )}
    >
      <span
        className={clsx(
          "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white",
          style.badge,
        )}
        title={`Ciclo ${msg.cycle} de esta instrucción`}
      >
        {msg.cycle}
      </span>
      <div className="min-w-0 flex-1">
        <code className={clsx("block font-mono text-xs font-semibold", style.text)}>
          {msg.action}
        </code>
        {msg.explanation && (
          <p
            className={clsx(
              "mt-0.5 text-xs leading-snug",
              isCurrent ? "text-stone-200" : "text-stone-400",
            )}
          >
            {msg.explanation}
          </p>
        )}
      </div>
    </li>
  );
}

/**
 * Lista de pasos del ciclo de instrucción, agrupados por fase. El último paso
 * registrado se destaca; si hay una animación en curso, se muestra al final
 * qué se está haciendo en ese momento.
 */
export function CycleStepList({
  messages,
  liveStep,
}: {
  messages: CycleMessage[];
  liveStep: string | null;
}) {
  return (
    <ol className="space-y-1.5">
      {messages.map((msg, index) => {
        const prev = messages[index - 1];
        // Una nueva instrucción empieza cuando el contador de ciclos vuelve a 1
        const isNewInstruction = index === 0 || msg.cycle <= prev.cycle;
        const isNewStage = isNewInstruction || prev.stage !== msg.stage;
        const isCurrent = !liveStep && index === messages.length - 1;
        return (
          <Fragment key={index}>
            {isNewInstruction && msg.instruction && (
              <li className="mt-4 flex list-none items-center gap-2 first:mt-0">
                <span className="h-px flex-1 bg-stone-600" aria-hidden="true" />
                <span className="font-mono text-xs font-bold text-mantis-300">
                  {msg.instruction}
                </span>
                <span className="h-px flex-1 bg-stone-600" aria-hidden="true" />
              </li>
            )}
            {isNewStage && <StageHeader stage={msg.stage} />}
            <StepCard msg={msg} isCurrent={isCurrent} />
          </Fragment>
        );
      })}
      {liveStep && (
        <li
          className="ml-6 flex items-center gap-2.5 rounded-lg border border-dashed border-mantis-400/60 bg-mantis-900/20 py-1.5 pl-3 pr-2 text-xs font-medium text-mantis-200"
          aria-live="polite"
        >
          <span className="relative flex size-2.5 shrink-0" aria-hidden="true">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-mantis-400 opacity-75" />
            <span className="relative inline-flex size-2.5 rounded-full bg-mantis-400" />
          </span>
          <span>
            <span className="text-stone-400">Ahora: </span>
            {liveStep}…
          </span>
        </li>
      )}
    </ol>
  );
}
