import clsx from "clsx";
import { Fragment } from "react";

import { STAGE_DESCRIPTIONS } from "./cycle-explanations";
import { groupByInstruction, summarizeInstruction } from "./instruction-summary";
import { InstructionSummaryCard } from "./InstructionSummaryCard";
import { PracticeBadge, PracticeQuestion } from "./PracticeQuestion";
import type { CycleMessage } from "./state";
import type { PracticeResult, PracticeState } from "./usePracticeMode";

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

type StepCardProps = {
  msg: CycleMessage;
  isCurrent: boolean;
  /** Modo práctica: resultado de la predicción de este paso, si la hubo. */
  result?: PracticeResult;
};

function StepCard({ msg, isCurrent, result }: StepCardProps) {
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
        {result && result.status !== "ok" && (
          <p className="mt-0.5 text-[11px] text-red-300">
            Elegiste: <code className="font-mono">{result.chosen}</code>
          </p>
        )}
      </div>
      {result && <PracticeBadge status={result.status} />}
    </li>
  );
}

/**
 * Lista de pasos del ciclo de instrucción, agrupados por instrucción y por
 * fase. El último paso registrado se destaca; si hay una animación en curso,
 * se muestra al final qué se está haciendo en ese momento. Cada instrucción
 * terminada cierra con un resumen.
 */
export function CycleStepList({
  messages,
  liveStep,
  lastInstructionComplete = false,
  practice,
}: {
  messages: CycleMessage[];
  liveStep: string | null;
  /** La última instrucción de la lista ya terminó (muestra su resumen). */
  lastInstructionComplete?: boolean;
  practice?: PracticeState;
}) {
  const groups = groupByInstruction(messages);
  let index = -1;
  return (
    <ol className="space-y-1.5">
      {groups.map((steps, groupIndex) => {
        const isLastGroup = groupIndex === groups.length - 1;
        const showSummary = !isLastGroup || lastInstructionComplete;
        return (
          <Fragment key={groupIndex}>
            {steps[0].instruction && (
              <li className="mt-4 flex list-none items-center gap-2 first:mt-0">
                <span className="h-px flex-1 bg-stone-600" aria-hidden="true" />
                <span className="font-mono text-xs font-bold text-mantis-300">
                  {steps[0].instruction}
                </span>
                <span className="h-px flex-1 bg-stone-600" aria-hidden="true" />
              </li>
            )}
            {steps.map((msg, i) => {
              index++;
              const isNewStage = i === 0 || steps[i - 1].stage !== msg.stage;
              const isCurrent = !liveStep && index === messages.length - 1;
              return (
                <Fragment key={i}>
                  {isNewStage && <StageHeader stage={msg.stage} />}
                  <StepCard msg={msg} isCurrent={isCurrent} result={practice?.results[index]} />
                </Fragment>
              );
            })}
            {showSummary && <InstructionSummaryCard summary={summarizeInstruction(steps)} />}
          </Fragment>
        );
      })}
      {practice?.question && !liveStep && (
        <PracticeQuestion question={practice.question} onChoose={practice.onChoose} />
      )}
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
