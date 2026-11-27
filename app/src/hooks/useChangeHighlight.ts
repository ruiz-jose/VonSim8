import { useAtomValue } from "jotai";
import { useEffect, useRef, useState } from "react";

import { simulationAtom } from "@/computer/simulation";

/**
 * Indica si un valor (registro, celda de memoria, etc.) cambió durante el
 * último paso de la simulación.
 *
 * - El resaltado se mantiene mientras la simulación está pausada, para que el
 *   alumno pueda ver con calma qué se modificó.
 * - Se borra cuando comienza el siguiente paso (la simulación vuelve a
 *   "running").
 * - Los cambios producidos al cargar el programa (stopped → running) o al
 *   reiniciar no se resaltan.
 *
 * Es puramente visual: no modifica el estado del simulador.
 */
export function useChangeHighlight(value: number | bigint): boolean {
  const status = useAtomValue(simulationAtom).type;
  const prevValue = useRef(value);
  const prevStatus = useRef(status);
  const [changed, setChanged] = useState(false);

  useEffect(() => {
    const valueChanged = prevValue.current !== value;
    const wasStatus = prevStatus.current;
    prevValue.current = value;
    prevStatus.current = status;

    if (status === "stopped") {
      // Un reinicio cambia los valores con la CPU detenida: limpiar.
      // Al terminar por HLT los valores no cambian: se conserva el último resaltado.
      if (valueChanged) setChanged(false);
      return;
    }

    if (status === "running" && wasStatus !== "running") {
      // Comienza un nuevo paso
      setChanged(false);
    }

    if (valueChanged && wasStatus !== "stopped") {
      setChanged(true);
    }
  }, [value, status]);

  return changed;
}
