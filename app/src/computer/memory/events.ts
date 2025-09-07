import { MemoryAddress } from "@vonsim/common/address";

import { showReadBusAnimationAtom, showWriteBusAnimationAtom } from "@/computer/bus/state";
import { MBRAtom } from "@/computer/cpu/state";
import {
  activateRegister,
  anim,
  deactivateRegister,
  hideReadControlText,
  hideWriteControlText,
  showReadControlText,
  showWriteControlText,
} from "@/computer/shared/animate";
import type { SimulatorEvent } from "@/computer/shared/types";
import { finishSimulation, notifyWarning } from "@/computer/simulation";
import { store } from "@/lib/jotai";
import { getSettings } from "@/lib/settings";
import { colors } from "@/lib/tailwind";

import { memoryAtom, operatingAddressAtom, writtenAddressesAtom } from "./state";

/**
 * Genera el path SVG para el bus de datos externo (memoria ↔ MBR)
 * similar a como funciona el bus interno del CPU
 */
function generateExternalDataPath(direction: "memory-to-mbr" | "mbr-to-memory"): string {
  // Coordenadas que coinciden exactamente con las líneas grises estáticas en DataLines.tsx

  // Coordenadas exactas que coinciden con las líneas grises estáticas en DataLines.tsx
  const mbrCenterX = 615; // Coordenada x del centro exacto del MBR
  const mbrTopY = 233; // Coordenada y de entrada superior (coincide con línea gris)
  const mbrBottomY = 274; // Coordenada y de la parte inferior del MBR (coincide con línea gris)
  const mbrUpperY = 222; // Coordenada y más arriba para la ruta de entrada (coincide con línea gris)
  const mbrLowerY = 285; // Coordenada y más abajo para la ruta de salida (coincide con línea gris)

  // Coordenadas de la memoria (coinciden con dataPath)
  const memoryX = 800;
  const memoryY = 249; // Misma altura que el centro del MBR

  // Coordenadas intermedias para el path con ángulos de 90 grados (coinciden con línea gris)
  const cpuBoundaryX = 645; // Punto donde la línea llega al área del CPU (coincide con línea gris)

  if (direction === "memory-to-mbr") {
    // Animación desde la memoria hacia el MBR por la parte superior (simétrica a la de salida)
    // Ruta: Memoria → CPU boundary → subir más arriba → centro MBR superior → bajar hacia el centro
    return `M ${memoryX} ${memoryY} L ${cpuBoundaryX} ${memoryY} L ${cpuBoundaryX} ${mbrUpperY} L ${mbrCenterX} ${mbrUpperY} L ${mbrCenterX} ${mbrTopY}`;
  } else {
    // Animación desde el MBR hacia la memoria - RUTA POR LA PARTE INFERIOR
    // Ruta: Parte inferior MBR → bajar más → salir horizontalmente hasta CPU boundary → ir hasta memoria
    return `M ${mbrCenterX} ${mbrBottomY} L ${mbrCenterX} ${mbrLowerY} L ${cpuBoundaryX} ${mbrLowerY} L ${cpuBoundaryX} ${memoryY} L ${memoryX} ${memoryY}`;
  }
}

// Función para animar el bus de datos externo (igual que el interno del CPU)
export const drawExternalDataPath = (
  direction: "memory-to-mbr" | "mbr-to-memory",
  duration?: number,
) => {
  try {
    const path = generateExternalDataPath(direction);
    if (!path) {
      console.warn("❌ No se generó path para drawExternalDataPath");
      return Promise.resolve();
    }

    // Usar la configuración de velocidad de animación si no se especifica duración
    const settings = getSettings();
    const MAX_EXECUTION_UNIT_MS = 250;
    const eu = Math.min(settings.executionUnit, MAX_EXECUTION_UNIT_MS);
    const actualDuration = duration ?? (settings.animations ? eu : 1);

    return anim(
      [
        { key: "bus.data.path", from: path },
        { key: "bus.data.opacity", from: 1 },
        { key: "bus.data.strokeDashoffset", from: 1, to: 0 },
      ],
      { duration: actualDuration, easing: "easeInOutSine", forceMs: true },
    );
  } catch (error) {
    console.warn("Error en drawExternalDataPath:", error);
    return Promise.resolve();
  }
};

// Función para resetear el bus de datos externo
const resetExternalDataPath = () =>
  anim({ key: "bus.data.opacity", to: 0 }, { duration: 1, easing: "easeInSine" });

/**
 * Genera el path SVG para el bus de direcciones (MAR → memoria)
 * usando las mismas coordenadas que el path estático en DataLines.tsx
 * La animación comienza más a la derecha del registro MAR
 */
function generateExternalAddressPath(): string {
  // Comienza más a la derecha del registro MAR (645, 349) y va hacia la memoria
  // Usando el mismo patrón que los buses de control pero desde una posición más a la derecha del MAR
  return "M 635 349 H 800";
}

// Función para animar el bus de direcciones externo (igual que el interno del CPU)
export const drawExternalAddressPath = (duration?: number) => {
  try {
    const path = generateExternalAddressPath();
    if (!path) return Promise.resolve();

    // Usar la configuración de velocidad de animación si no se especifica duración
    const settings = getSettings();
    const MAX_EXECUTION_UNIT_MS = 250;
    const eu = Math.min(settings.executionUnit, MAX_EXECUTION_UNIT_MS);
    const actualDuration = duration ?? (settings.animations ? eu : 1);

    return anim(
      [
        { key: "bus.address.path", from: path },
        { key: "bus.address.opacity", from: 1 },
        { key: "bus.address.strokeDashoffset", from: 1, to: 0 },
      ],
      { duration: actualDuration, easing: "easeInOutSine", forceMs: true },
    );
  } catch (error) {
    console.warn("Error en drawExternalAddressPath:", error);
    return Promise.resolve();
  }
};

// Función para resetear el bus de direcciones externo
const resetExternalAddressPath = () =>
  anim({ key: "bus.address.opacity", to: 0 }, { duration: 1, easing: "easeInSine" });

// Función para animar el bus de control RD (CPU -> dispositivos)
const drawRDControlPath = (duration?: number) => {
  try {
    // Path desde CPU hacia memoria y otros dispositivos
    const path = "M 380 420 H 800"; // Path básico CPU -> Memory

    // Usar la configuración de velocidad de animación si no se especifica duración
    const settings = getSettings();
    const MAX_EXECUTION_UNIT_MS = 250;
    const eu = Math.min(settings.executionUnit, MAX_EXECUTION_UNIT_MS);
    const actualDuration = duration ?? (settings.animations ? eu : 1);

    return anim(
      [
        { key: "bus.rd.path", from: path },
        { key: "bus.rd.opacity", from: 1 },
        { key: "bus.rd.strokeDashoffset", from: 1, to: 0 },
      ],
      { duration: actualDuration, easing: "easeInOutSine", forceMs: true },
    );
  } catch (error) {
    console.warn("Error en drawRDControlPath:", error);
    return Promise.resolve();
  }
};

// Función para animar el bus de control WR (CPU -> dispositivos)
const drawWRControlPath = (duration?: number) => {
  try {
    // Path desde CPU hacia memoria y otros dispositivos
    const path = "M 380 440 H 800"; // Path básico CPU -> Memory

    // Usar la configuración de velocidad de animación si no se especifica duración
    const settings = getSettings();
    const MAX_EXECUTION_UNIT_MS = 250;
    const eu = Math.min(settings.executionUnit, MAX_EXECUTION_UNIT_MS);
    const actualDuration = duration ?? (settings.animations ? eu : 1);

    return anim(
      [
        { key: "bus.wr.path", from: path },
        { key: "bus.wr.opacity", from: 1 },
        { key: "bus.wr.strokeDashoffset", from: 1, to: 0 },
      ],
      { duration: actualDuration, easing: "easeInOutSine", forceMs: true },
    );
  } catch (error) {
    console.warn("Error en drawWRControlPath:", error);
    return Promise.resolve();
  }
};

// Función para resetear el bus de control RD
const resetRDControlPath = () =>
  anim({ key: "bus.rd.opacity", to: 0 }, { duration: 1, easing: "easeInSine" });

// Función para resetear el bus de control WR
const resetWRControlPath = () =>
  anim({ key: "bus.wr.opacity", to: 0 }, { duration: 1, easing: "easeInSine" });

// Declarar la propiedad global para TypeScript
// (esto puede estar ya en otro archivo, pero lo repetimos aquí por seguridad)
declare global {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface Window {
    VONSIM_PARALLEL_ANIMATIONS?: boolean;
  }
}

// Eliminar la función y el uso de triggerParallelMemoryReadAnimations y la comprobación de 'cpu:mar.set' en este archivo, ya que no corresponde a eventos de memoria.
// Mantener solo el feedback inmediato y la animación en memory:read como antes, usando window.VONSIM_PARALLEL_ANIMATIONS para decidir si lanzar la animación o no.

export async function handleMemoryEvent(event: SimulatorEvent<"memory:">): Promise<void> {
  // Hook para animaciones paralelas (modo principiante)
  if (typeof window !== "undefined" && window.VONSIM_PARALLEL_ANIMATIONS) {
    window.addEventListener("vonsim:parallel-memory-read-visual", () => {
      // Feedback visual inmediato: destello en el bus de direcciones y bus RD
      store.set(showReadBusAnimationAtom, true);
      anim(
        [
          { key: "bus.address.opacity", to: 0.7 },
          { key: "bus.rd.opacity", to: 0.7 },
        ],
        { duration: 0.15, easing: "easeOutQuad" },
      ).then(() => {
        anim(
          [
            { key: "bus.address.opacity", to: 1 },
            { key: "bus.rd.opacity", to: 1 },
          ],
          { duration: 0.15, easing: "easeInQuad" },
        );
      });
      // Animar el bus de direcciones desde MAR hacia la memoria y el bus de control RD en simultáneo
      Promise.all([
        drawExternalAddressPath(),
        (async () => {
          showReadControlText();
          await drawRDControlPath();
          hideReadControlText();
        })(),
      ]);
    });
  }
  switch (event.type) {
    case "memory:read": {
      if (!window.VONSIM_PARALLEL_ANIMATIONS) {
        // Feedback visual inmediato: destello en el bus de direcciones y bus RD
        store.set(showReadBusAnimationAtom, true);
        anim(
          [
            { key: "bus.address.opacity", to: 0.7 },
            { key: "bus.rd.opacity", to: 0.7 },
          ],
          { duration: 0.15, easing: "easeOutQuad" },
        ).then(() => {
          anim(
            [
              { key: "bus.address.opacity", to: 1 },
              { key: "bus.rd.opacity", to: 1 },
            ],
            { duration: 0.15, easing: "easeInQuad" },
          );
        });
        // Animar el bus de direcciones y el bus de control RD en simultáneo
        await Promise.all([
          drawExternalAddressPath(),
          (async () => {
            showReadControlText();
            await drawRDControlPath();
            hideReadControlText();
          })(),
        ]);
        // Una vez terminadas ambas animaciones, ocultar el bus de direcciones antes de la animación de datos
        await resetExternalAddressPath();
        // Aquí NO se lanza la animación de datos, eso ocurre en memory:read.ok
      }
      return;
    }

    case "memory:read.ok": {
      store.set(operatingAddressAtom, MemoryAddress.from(event.address));

      // Animar la celda de memoria como punto de origen
      await anim(
        { key: "memory.operating-cell.color", to: colors.mantis[400] },
        { duration: 1, easing: "easeOutQuart" },
      );

      // Animar el bus de datos desde la memoria hacia el MBR (igual que bus interno)
      await drawExternalDataPath("memory-to-mbr");

      // Actualizar el valor primero
      store.set(MBRAtom, event.value);

      // (Eliminado) No ejecutar animación individual de MBR aquí
      // const nextTransferIsToIP = window.__nextTransferMBRtoIP === true;
      // if (!nextTransferIsToIP) {
      //   await updateRegisterWithGlow("cpu.MBR");
      // }
      // window.__nextTransferMBRtoIP = false;

      // Resetear animaciones
      await Promise.all([
        anim(
          { key: "memory.operating-cell.color", to: colors.white },
          { duration: 1, easing: "easeOutQuart" },
        ),
        resetExternalDataPath(),
        resetExternalAddressPath(), // Resetear también el bus de direcciones
        resetRDControlPath(), // Resetear bus de control RD
        resetWRControlPath(), // Resetear bus de control WR
      ]);
      return;
    }

    case "memory:write": {
      // Activar la animación del texto 'Write' en el bus de control WR
      store.set(showWriteBusAnimationAtom, true);
      // Mostrar texto "Write" al animar el bus de control WR
      showWriteControlText();

      // Animar el bus de direcciones y el bus de control WR en simultáneo
      await Promise.all([drawExternalAddressPath(), drawWRControlPath()]);

      // Ocultar texto "Write" al terminar la animación
      hideWriteControlText();
      // Desactivar la animación del texto 'Write' en el bus de control WR
      store.set(showWriteBusAnimationAtom, false);
      return;
    }

    case "memory:write.ok": {
      store.set(operatingAddressAtom, MemoryAddress.from(event.address));

      // Para escritura, usar el color específico del MBR
      await activateRegister("cpu.MBR");

      // Animar el bus de datos desde el MBR hacia la memoria (igual que bus interno)
      await drawExternalDataPath("mbr-to-memory");

      // Animar la celda de memoria de destino
      await anim(
        { key: "memory.operating-cell.color", to: colors.mantis[400] },
        { duration: 1, easing: "easeOutQuart" },
      );

      store.set(memoryAtom, arr => [
        ...arr.slice(0, event.address.value),
        event.value,
        ...arr.slice(event.address.value + 1),
      ]);

      // Marcar esta dirección como escrita recientemente
      store.set(writtenAddressesAtom, prev => {
        const newSet = new Set(prev);
        newSet.add(event.address.value);
        return newSet;
      });

      // Programar la eliminación de la marca después de unos segundos
      setTimeout(() => {
        store.set(writtenAddressesAtom, prev => {
          const newSet = new Set(prev);
          newSet.delete(event.address.value);
          return newSet;
        });
      }, 3000); // 3 segundos

      // Resetear animaciones
      await Promise.all([
        deactivateRegister("cpu.MBR"),
        anim(
          { key: "memory.operating-cell.color", to: colors.white },
          { duration: 1, easing: "easeOutQuart" },
        ),
        resetExternalDataPath(),
        resetExternalAddressPath(), // Resetear también el bus de direcciones
        resetRDControlPath(), // Resetear bus de control RD
        resetWRControlPath(), // Resetear bus de control WR
      ]);
      return;
    }

    case "memory:read.error":
    case "memory:write.error": {
      finishSimulation(event.error);
      return;
    }
    case "memory:write.warning": {
      // Reemplazar el toast por notifyWarning en el warning de memoria
      notifyWarning("Advertencia de Memoria", `${event.warning}`);
      return;
    }

    default: {
      const _exhaustiveCheck: never = event;
      return _exhaustiveCheck;
    }
  }
}
