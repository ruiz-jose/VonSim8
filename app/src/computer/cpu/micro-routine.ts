import { executeSteps, FETCH_STEPS, type Flags, type InstructionInfo } from "./next-step";

export type MicroRow = {
  /** Texto de la microinstrucción, con la notación del panel (null si todavía no se conoce) */
  step: string | null;
  /** Etapa del ciclo a la que pertenece la microinstrucción */
  stage: "fetch" | "execute";
};

/**
 * Contenido de la memoria de control que usa una instrucción: la rutina de
 * captación (igual para todas) seguida de la rutina de ejecución de la
 * instrucción. Si la rutina de ejecución no está documentada, se arma con los
 * pasos que ya ocurrieron (`recorded`) y un lugar para el paso en curso.
 */
export function microRoutine(
  ins: InstructionInfo | null | undefined,
  flags: Flags,
  recorded: string[] = [],
  activeIndex: number | null = null,
): MicroRow[] {
  const rows: MicroRow[] = FETCH_STEPS.map(step => ({ step, stage: "fetch" as const }));
  if (!ins) return rows;

  const execute = executeSteps(ins, flags);
  if (execute) return [...rows, ...execute.map(step => ({ step, stage: "execute" as const }))];

  // Rutina sin documentar: los pasos ya hechos y el que se está haciendo
  const known = recorded.slice(FETCH_STEPS.length);
  const extra = known.map(step => ({ step, stage: "execute" as const }));
  const total = Math.max(rows.length + extra.length, (activeIndex ?? -1) + 1);
  while (rows.length + extra.length < total) extra.push({ step: null, stage: "execute" });
  return [...rows, ...extra];
}
