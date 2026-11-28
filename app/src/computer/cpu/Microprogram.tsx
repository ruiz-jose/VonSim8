import clsx from "clsx";
import { useAtomValue } from "jotai";
import { Fragment, useEffect, useRef } from "react";

import { flagsFromByte } from "./canonical-step";
import { controlSignals, type SignalKind } from "./control-signals";
import { controlStepAtom } from "./control-step";
import { microRoutine } from "./micro-routine";
import { cycleAtom, messageHistoryAtom, registerAtoms } from "./state";

const SIGNAL_COLORS: Record<SignalKind, string> = {
  out: "border-amber-400/70 bg-amber-500/20 text-amber-200",
  load: "border-sky-400/70 bg-sky-500/20 text-sky-200",
  mem: "border-rose-400/70 bg-rose-500/25 text-rose-200",
  alu: "border-mantis-400/70 bg-mantis-500/20 text-mantis-200",
  inc: "border-violet-400/70 bg-violet-500/20 text-violet-200",
};

// Momentos de la animación, como fracción de la duración total:
// 1) se lee la microinstrucción, 2) viaja al secuenciador, 3) salen las señales
const READ_END = 0.45;
const TRAVEL_START = 0.4;
const SIGNALS_START = 0.65;

const KEYFRAMES = `
@keyframes vsCtrlRead { from { transform: translateX(-100%); opacity: .9 } to { transform: translateX(100%); opacity: .9 } }
@keyframes vsCtrlTravel { 0% { left: 0; opacity: 0 } 15% { opacity: 1 } 85% { opacity: 1 } 100% { left: calc(100% - 6px); opacity: 0 } }
@keyframes vsCtrlSignal { from { transform: scale(.6); opacity: 0; filter: brightness(2) } 60% { transform: scale(1.08); opacity: 1 } to { transform: scale(1); opacity: 1; filter: none } }
@keyframes vsCtrlOut { 0% { opacity: .15 } 40% { opacity: 1 } 100% { opacity: .5 } }
@keyframes vsCtrlFlash { 0% { background-color: rgba(232,121,249,.55) } 100% { background-color: transparent } }
`;

// Notación corta para que el paso entre en la fila (el texto completo queda en el title)
const shortStep = (step: string) =>
  step.replace(/(read|write)\(Memoria\[MAR\]\)/g, "M[MAR]").replace(/\s*\|\s*/g, " | ");

const ms = (fraction: number, total: number) => `${Math.round(fraction * total)}ms`;

/** Pasos ya registrados de la instrucción en curso (para rutinas sin documentar). */
function useRecordedSteps(activeIndex: number | null): string[] {
  const history = useAtomValue(messageHistoryAtom);
  if (activeIndex === null || !Array.isArray(history)) return [];
  let start = -1;
  history.forEach((m, i) => {
    if (m.cycle === 1) start = i;
  });
  const tail = start === -1 ? [] : history.slice(start).map(m => m.action);
  return tail.length <= activeIndex + 1 ? tail : [];
}

/**
 * Memoria de control y secuenciador de la unidad de control. En cada paso del
 * ciclo se lee la microinstrucción de la memoria de control, viaja al
 * secuenciador y este envía las señales de control a los componentes de la CPU.
 */
export function Microprogram() {
  const cycle = useAtomValue(cycleAtom);
  const controlStep = useAtomValue(controlStepAtom);
  const flagsByte = useAtomValue(registerAtoms.FLAGS);
  const listRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);

  const metadata = cycle && "metadata" in cycle ? cycle.metadata : null;
  const active = controlStep?.index ?? null;
  const recorded = useRecordedSteps(active);
  const rows = microRoutine(metadata, flagsFromByte(flagsByte), recorded, active);
  const activeRow = active !== null ? rows[active] : undefined;
  const signals = controlSignals(activeRow?.step);
  const lead = controlStep?.leadMs ?? 0;
  const seq = controlStep?.seq ?? 0;
  const firstExecute = rows.findIndex(r => r.stage === "execute");
  const routineName = activeRow?.stage === "execute" ? metadata?.name : "captación";

  // Mantener la microinstrucción leída a la vista, sin mover la página
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const row = active !== null ? rowRefs.current[active] : null;
    const top = row ? row.offsetTop - list.clientHeight / 2 + row.offsetHeight / 2 : 0;
    if (typeof list.scrollTo === "function") list.scrollTo({ top, behavior: "smooth" });
  }, [active, seq, rows.length]);

  return (
    <div
      className="flex size-full items-stretch gap-0"
      aria-label="Memoria de control y secuenciador"
    >
      <style>{KEYFRAMES}</style>

      {/* Memoria de control */}
      <div className="flex w-[196px] shrink-0 flex-col overflow-hidden rounded-md border border-fuchsia-500/60 bg-fuchsia-950/40">
        <div className="flex items-center justify-between gap-1 border-b border-fuchsia-500/40 bg-fuchsia-900/50 px-1.5 py-px">
          <span className="whitespace-nowrap text-[9px] font-bold uppercase tracking-wider text-fuchsia-100">
            Memoria de control
          </span>
          {active !== null && (
            <span
              key={`routine-${routineName}`}
              className="min-w-0 truncate rounded px-1 font-mono text-[9px] text-fuchsia-200"
              style={lead ? { animation: `vsCtrlFlash ${lead}ms ease-out` } : undefined}
              title="Rutina que eligió el decodificador a partir de IR"
            >
              {routineName}
            </span>
          )}
        </div>
        <div ref={listRef} className="relative flex-1 overflow-hidden py-0.5">
          {rows.map((row, i) => {
            const isActive = i === active;
            const isDone = active !== null && i < active;
            return (
              <Fragment key={i}>
                {(i === 0 || i === firstExecute) && (
                  <div className="px-1.5 pt-0.5 text-[8px] font-semibold uppercase tracking-wider text-fuchsia-300/80">
                    {row.stage === "fetch" ? "Captación" : `Ejecución · ${metadata?.name ?? ""}`}
                  </div>
                )}
                <div
                  ref={el => {
                    rowRefs.current[i] = el;
                  }}
                  data-active={isActive || undefined}
                  title={row.step ?? "Paso en curso"}
                  className={clsx(
                    "relative mx-0.5 flex h-[15px] items-center gap-1 overflow-hidden rounded-sm px-1 font-mono text-[10px] leading-none",
                    isActive && "bg-fuchsia-600/50 text-white ring-1 ring-fuchsia-300",
                    isDone && "text-fuchsia-200/50",
                    !isActive && !isDone && "text-stone-400",
                  )}
                >
                  <span
                    className={clsx(
                      "w-3 shrink-0 text-right text-[8px]",
                      isActive ? "text-fuchsia-100" : "text-fuchsia-400/60",
                    )}
                  >
                    {i + 1}
                  </span>
                  <span className="truncate">{row.step ? shortStep(row.step) : "…"}</span>
                  {isActive && lead > 0 && (
                    <span
                      key={seq}
                      aria-hidden
                      className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-fuchsia-200/70 to-transparent"
                      style={{ animation: `vsCtrlRead ${ms(READ_END, lead)} ease-in-out both` }}
                    />
                  )}
                </div>
              </Fragment>
            );
          })}
        </div>
      </div>

      {/* La microinstrucción viaja al secuenciador */}
      <div className="relative w-[14px] shrink-0 self-center" aria-hidden>
        <div className="h-[2px] w-full bg-fuchsia-500/40" />
        <div className="absolute -right-px top-1/2 size-0 -translate-y-1/2 border-y-4 border-l-[5px] border-y-transparent border-l-fuchsia-400/70" />
        {lead > 0 && active !== null && (
          <span
            key={seq}
            className="absolute top-1/2 size-[6px] -translate-y-1/2 rounded-full bg-fuchsia-200 shadow-[0_0_6px_2px_rgba(232,121,249,0.8)]"
            style={{
              animation: `vsCtrlTravel ${ms(SIGNALS_START - TRAVEL_START, lead)} linear ${ms(TRAVEL_START, lead)} both`,
            }}
          />
        )}
      </div>

      {/* Secuenciador */}
      <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden rounded-md border border-sky-500/60 bg-sky-950/40">
        <div className="border-b border-sky-500/40 bg-sky-900/50 px-1.5 py-px text-[9px] font-bold uppercase tracking-wider text-sky-100">
          Secuenciador
        </div>
        <div className="flex flex-1 flex-wrap content-start gap-[3px] p-1 pr-3">
          {signals.length > 0 ? (
            signals.map((signal, i) => (
              <span
                key={`${seq}-${signal.label}`}
                title={signal.hint}
                className={clsx(
                  "rounded border px-1 font-mono text-[9px] leading-[13px]",
                  SIGNAL_COLORS[signal.kind],
                )}
                style={
                  lead > 0
                    ? {
                        animation: `vsCtrlSignal ${ms(0.3, lead)} ease-out ${ms(SIGNALS_START + i * 0.05, lead)} both`,
                      }
                    : undefined
                }
              >
                {signal.label}
              </span>
            ))
          ) : (
            <span className="text-[9px] italic text-stone-500">
              {active === null ? "esperando microinstrucción" : "señales del paso en curso"}
            </span>
          )}
        </div>
        {/* Líneas de control que salen hacia los componentes */}
        <div className="absolute inset-y-4 right-0 flex flex-col justify-around" aria-hidden>
          {[0, 1, 2, 3].map(i => (
            <span
              key={`${seq}-${i}`}
              className={clsx(
                "block h-[2px] w-2 rounded-l",
                signals.length > 0 ? "bg-sky-300" : "bg-sky-800",
              )}
              style={
                lead > 0 && signals.length > 0
                  ? { animation: `vsCtrlOut ${ms(0.35, lead)} ease-out ${ms(0.8, lead)} both` }
                  : undefined
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
}
