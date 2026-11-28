import { atom, PrimitiveAtom } from "jotai";

import { store } from "@/lib/jotai";
import { getSettings } from "@/lib/settings";

/**
 * Paso del ciclo que la unidad de control está ejecutando. Cambia al empezar
 * cada paso, antes de que se animen los buses: así la unidad de control
 * muestra primero la lectura de la memoria de control y el envío de las
 * señales, y después los componentes las obedecen.
 */
export type ControlStep = {
  /** Posición del paso dentro de la instrucción (desde 0) */
  index: number;
  /** Cambia en cada paso, para reiniciar la animación */
  seq: number;
  /** Cuánto dura la animación de la unidad de control antes del paso (ms) */
  leadMs: number;
};

export const controlStepAtom = atom<ControlStep | null>(
  null as ControlStep | null,
) as PrimitiveAtom<ControlStep | null>;

/** Mostrar la memoria de control y el secuenciador dentro de la unidad de control */
export const showMicroprogramAtom = atom(true);

let lastIndex = -1;
let seq = 0;

export function resetControlStep() {
  lastIndex = -1;
  store.set(controlStepAtom, null);
}

/** Duración de la lectura de la memoria de control, según la velocidad de simulación */
export function controlLeadMs(): number {
  const settings = getSettings();
  if (!settings.animations || store.get(showMicroprogramAtom) !== true) return 0;
  return Math.round(1200 / settings.simulationSpeed);
}

/**
 * Se llama con cada evento del simulador que describe un paso. Si el evento
 * es el primero de un paso nuevo, anuncia el paso a la unidad de control y
 * espera a que termine de leer la microinstrucción y enviar las señales.
 *
 * @param index pasos de la instrucción ya registrados en el panel
 * @param newStep true si el paso anterior ya quedó registrado
 */
export async function announceControlStep(index: number, eventType: string, newStep: boolean) {
  // Instrucción nueva: todavía no se leyó ninguna microinstrucción
  if (eventType === "cpu:cycle.start") return resetControlStep();
  // El decodificador no es un paso del ciclo: elige la rutina de ejecución
  if (eventType === "cpu:decode") return;
  if (index === lastIndex && !newStep) return;
  lastIndex = index;
  const leadMs = controlLeadMs();
  store.set(controlStepAtom, { index, seq: ++seq, leadMs });
  if (leadMs > 0) await new Promise(resolve => setTimeout(resolve, leadMs));
}
