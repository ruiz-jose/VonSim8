import { MemoryAddress } from "@vonsim/common/address";

import { MBRAtom } from "@/computer/cpu/state";
import { anim, activateRegister, deactivateRegister, updateRegisterWithGlow, showReadControlText, hideReadControlText, showWriteControlText, hideWriteControlText } from "@/computer/shared/animate";
import type { SimulatorEvent } from "@/computer/shared/types";
import { finishSimulation } from "@/computer/simulation";
import { store } from "@/lib/jotai";
import { colors } from "@/lib/tailwind";
import { toast } from "@/lib/toast";

import { memoryAtom, operatingAddressAtom } from "./state";

/**
 * Genera el path SVG para el bus de datos externo (memoria ↔ MBR)
 * similar a como funciona el bus interno del CPU
 */
function generateExternalDataPath(direction: "memory-to-mbr" | "mbr-to-memory"): string {
  // Coordenadas que coinciden exactamente con el dataPath estático en DataLines.tsx
  const mbrX = 629; // Coordenada x del MBR (coincide con dataPath)
  const mbrY = 249; // Coordenada y del MBR (coincide con dataPath)
  
  // Coordenadas de la memoria (coinciden con dataPath)
  const memoryX = 800;
  const memoryY = 249; // Misma altura que el MBR
  
  if (direction === "memory-to-mbr") {
    // Animación desde la memoria hacia el MBR
    return `M ${memoryX} ${memoryY} L ${mbrX} ${mbrY}`;
  } else {
    // Animación desde el MBR hacia la memoria
    return `M ${mbrX} ${mbrY} L ${memoryX} ${memoryY}`;
  }
}

// Función para animar el bus de datos externo (igual que el interno del CPU)
const drawExternalDataPath = (direction: "memory-to-mbr" | "mbr-to-memory") => {
  try {
    const path = generateExternalDataPath(direction);
    if (!path) return Promise.resolve();
    
    return anim(
      [
        { key: "bus.data.path", from: path },
        { key: "bus.data.opacity", from: 1 },
        { key: "bus.data.strokeDashoffset", from: 1, to: 0 },
      ],
      { duration: 5, easing: "easeInOutSine" },
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
 */
function generateExternalAddressPath(): string {
  // Siempre desde MAR hacia la memoria (como indica el usuario)
  // Coordenadas que coinciden con el addressPath estático en DataLines.tsx
  return "M 659 349 H 800";
}

// Función para animar el bus de direcciones externo (igual que el interno del CPU)
export const drawExternalAddressPath = () => {
  try {
    const path = generateExternalAddressPath();
    if (!path) return Promise.resolve();
    
    return anim(
      [
        { key: "bus.address.path", from: path },
        { key: "bus.address.opacity", from: 1 },
        { key: "bus.address.strokeDashoffset", from: 1, to: 0 },
      ],
      { duration: 5, easing: "easeInOutSine" },
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
const drawRDControlPath = () => {
  try {
    // Path desde CPU hacia memoria y otros dispositivos
    const path = "M 380 420 H 800"; // Path básico CPU -> Memory
    
    return anim(
      [
        { key: "bus.rd.path", from: path },
        { key: "bus.rd.opacity", from: 1 },
        { key: "bus.rd.strokeDashoffset", from: 1, to: 0 },
      ],
      { duration: 5, easing: "easeInOutSine" },
    );
  } catch (error) {
    console.warn("Error en drawRDControlPath:", error);
    return Promise.resolve();
  }
};

// Función para animar el bus de control WR (CPU -> dispositivos)
const drawWRControlPath = () => {
  try {
    // Path desde CPU hacia memoria y otros dispositivos
    const path = "M 380 440 H 800"; // Path básico CPU -> Memory
    
    return anim(
      [
        { key: "bus.wr.path", from: path },
        { key: "bus.wr.opacity", from: 1 },
        { key: "bus.wr.strokeDashoffset", from: 1, to: 0 },
      ],
      { duration: 5, easing: "easeInOutSine" },
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

export async function handleMemoryEvent(event: SimulatorEvent<"memory:">): Promise<void> {
  switch (event.type) {
    case "memory:read": {
      // Animar el bus de direcciones desde MAR hacia la memoria al iniciar la lectura
      await drawExternalAddressPath();
      // Mostrar texto "Read" al animar el bus de control RD
      showReadControlText();
      // Animar el bus de control RD desde CPU hacia dispositivos
      await drawRDControlPath();
      // Ocultar texto "Read" al terminar la animación
      hideReadControlText();
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
      
      // DESPUÉS usar la nueva animación para el MBR (después del bus)
      await updateRegisterWithGlow("cpu.MBR");
      
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
      // Animar el bus de direcciones desde MAR hacia la memoria al iniciar la escritura
      await drawExternalAddressPath();
      // Mostrar texto "Write" al animar el bus de control WR
      showWriteControlText();
      // Animar el bus de control WR desde CPU hacia dispositivos
      await drawWRControlPath();
      // Ocultar texto "Write" al terminar la animación
      hideWriteControlText();
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
      // Mostrar un mensaje de advertencia con toast
      toast({
        title: "Advertencia de Memoria",
        description: `${event.warning}`,
        variant: "info", // Usar el estilo de advertencia
      });
      return;
    }

    default: {
      const _exhaustiveCheck: never = event;
      return _exhaustiveCheck;
    }
  }
}
