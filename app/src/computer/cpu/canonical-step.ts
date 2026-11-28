import { executeSteps, FETCH_STEPS, type Flags } from "./next-step";

type Metadata = { name: string; operands: string[] } | undefined;

/**
 * Paso del ciclo tal como está documentado (docs/instructioncycle), para el
 * paso número `index` (desde 0) de la instrucción. El panel lo usa en lugar
 * del texto armado a partir de los eventos del simulador, que en algunas
 * instrucciones no coincide con la documentación. Devuelve null si la
 * instrucción no tiene ciclo documentado o el paso está fuera de rango.
 */
export function canonicalStep(index: number, metadata: Metadata, flags: Flags): string | null {
  if (index < FETCH_STEPS.length) return FETCH_STEPS[index];
  if (!metadata) return null;
  const execute = executeSteps(metadata, flags);
  return execute?.[index - FETCH_STEPS.length] ?? null;
}

export function flagsFromByte(value: { bit?: (i: number) => boolean } | undefined): Flags {
  const bit = (i: number) => (typeof value?.bit === "function" ? value.bit(i) : false);
  return { ZF: bit(0), CF: bit(1), OF: bit(2), SF: bit(3) };
}
