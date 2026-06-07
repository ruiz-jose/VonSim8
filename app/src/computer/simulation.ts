/**
 * @fileoverview
 * This file exposes methods/state that the UI uses to interact with the simulator.
 */
import { assemble } from "@vonsim/assembler";
import { Byte } from "@vonsim/common/byte";
import { ComputerState, EventGenerator, Simulator, SimulatorError } from "@vonsim/simulator";
import { atom, useAtomValue } from "jotai";
import { useMemo } from "react";

import {
  hasINT5InstructionAtom,
  hasINT6InstructionAtom,
  hasINT7InstructionAtom,
  hasINTInstructionAtom,
  mayUsePICAtom,
} from "@/computer/cpu/state";
import { dataAddressesAtom, programAddressesAtom } from "@/computer/memory/state";
import { highlightCurrentInstruction, highlightLine, setReadOnly } from "@/editor/methods";
import { programModifiedAtom } from "@/editor/state"; // Importar programModifiedAtom
import { translate } from "@/lib/i18n";
import { store } from "@/lib/jotai";
import { posthog } from "@/lib/posthog";
import { getSettings, settingsAtom, useDevices } from "@/lib/settings";
import { toast } from "@/lib/toast";

import { generateDataPath } from "./cpu/DataBus";
import {
  connectScreenAndKeyboardAtom,
  currentInstructionCycleCountAtom,
  cycleAtom,
  cycleCountAtom,
  instructionCountAtom,
  messageAtom,
  messageHistoryAtom,
  resetCPUState,
  showriAtom,
  showSPAtom,
  totalCycleCountAtom,
} from "./cpu/state";
import { eventIsRunning, handleEvent } from "./handle-event";
import { resetHandshakeState } from "./handshake/state";
import { resetLedsState } from "./leds/state";
import { resetMemoryState } from "./memory/state";
import { resetPICState } from "./pic/state";
import { resetPIOState } from "./pio/state";
import { resetPrinterState } from "./printer/state";
import { resetScreenState } from "./screen/state";
import { anim, pauseAllAnimations, resumeAllAnimations, stopAllAnimations } from "./shared/animate";
import { resetSwitchesState, switchesAtom } from "./switches/state";
import { resetTimerState } from "./timer/state";

// Extend the Window type to include generateDataPath
declare global {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface Window {
    generateDataPath?: (from: string, to: string, instruction: string, mode: string) => void;
  }
}

const simulator = new Simulator();

/**
 * Función auxiliar para establecer mensaje Y agregarlo al historial de forma síncrona
 * Esto garantiza que tanto en desarrollo como en producción se registren los mensajes de la misma manera
 */
function setMessageAndAddToHistory(message: string): void {
  if (!message) return;

  // Reemplazar "Ejecución:" por "Interrupción:" si estamos en una rutina de interrupción
  let finalMessage = message;
  if (isExecutingInterruptRoutine && message.startsWith("Ejecución:")) {
    finalMessage = message.replace("Ejecución:", "Interrupción:");
  }

  // Establecer el mensaje actual
  store.set(messageAtom, finalMessage);

  // Agregar al historial inmediatamente de forma síncrona
  const currentCycleCount = store.get(currentInstructionCycleCountAtom);
  const [stage, ...actionParts] = finalMessage.split(":");
  const action = actionParts.join(":").trim();

  // Agregar al historial evitando duplicados
  // NOTA: Mostramos currentCycleCount + 1 porque el contador se incrementa DESPUÉS de llamar a esta función
  store.set(messageHistoryAtom, prev => {
    const lastMessage = prev[prev.length - 1];
    const displayCycle = currentCycleCount + 1; // Mostrar ciclo desde 1 en lugar de 0
    // Evitar duplicados basados en ciclo y acción
    if (lastMessage && lastMessage.cycle === displayCycle && lastMessage.action === action) {
      return prev;
    }
    return [...prev, { cycle: displayCycle, stage: stage.trim(), action }];
  });
}

// Listener para recargar automáticamente el programa cuando se active el PIO
if (typeof window !== "undefined") {
  window.addEventListener("pioActivated", (event: CustomEvent) => {
    const { address, registerName, shouldReload } = event.detail;

    if (shouldReload) {
      console.log(
        `🔄 Recargando programa debido a activación automática del PIO (${registerName} - ${address.toString(16).toUpperCase()}h)`,
      );

      // Parar la simulación actual si está corriendo
      const currentStatus = store.get(simulationAtom);
      if (currentStatus.type === "running") {
        finishSimulation();
      }

      // Esperar un momento para que se complete el finish, luego reiniciar
      setTimeout(() => {
        // Reiniciar la ejecución con la nueva configuración
        dispatch("cpu.run", "infinity");
      }, 100);
    }
  });

  // Listener para recargar automáticamente el programa cuando se active el Handshake
  window.addEventListener("handshakeActivated", (event: CustomEvent) => {
    const { address, registerName, shouldReload } = event.detail;

    if (shouldReload) {
      console.log(
        `🔄 Recargando programa debido a activación automática de la impresora con Handshake (${registerName} - ${address.toString(16).toUpperCase()}h)`,
      );

      // Parar la simulación actual si está corriendo
      const currentStatus = store.get(simulationAtom);
      if (currentStatus.type === "running") {
        finishSimulation();
      }

      // Esperar un momento para que se complete el finish, luego reiniciar
      setTimeout(() => {
        // Reiniciar la ejecución con la nueva configuración
        dispatch("cpu.run", "infinity");
      }, 100);
    }
  });

  // Listener para recargar automáticamente el programa cuando se active el PIC
  window.addEventListener("picActivated", (event: CustomEvent) => {
    const { address, registerName, shouldReload } = event.detail;

    if (shouldReload) {
      console.log(
        `🔄 Recargando programa debido a activación automática del PIC (${registerName} - ${address.toString(16).toUpperCase()}h)`,
      );

      // Parar la simulación actual si está corriendo
      const currentStatus = store.get(simulationAtom);
      if (currentStatus.type === "running") {
        finishSimulation();
      }

      // Esperar un momento para que se complete el finish, luego reiniciar
      setTimeout(() => {
        // Reiniciar la ejecución con la nueva configuración
        dispatch("cpu.run", "infinity");
      }, 100);
    }
  });

  // Listener para recargar automáticamente el programa cuando se modifique el código
  window.addEventListener("programModified", (event: CustomEvent) => {
    const { shouldReload, until } = event.detail;

    if (shouldReload) {
      console.log("🔄 Recargando programa debido a modificación del código");

      // Resetear la bandera de HLT al recargar
      store.set(isHaltExecutionAtom, false);

      // Parar la simulación actual si está corriendo
      const currentStatus = store.get(simulationAtom);
      if (currentStatus.type === "running") {
        finishSimulation();
      }

      // Esperar un momento para que se complete el finish, luego reiniciar
      setTimeout(() => {
        // Reiniciar la ejecución con la configuración anterior
        dispatch("cpu.run", until);
      }, 100);
    }
  });
}

type RunUntil = "cycle-change" | "end-of-instruction" | "infinity";
type SimulationStatus =
  | { type: "running"; until: RunUntil; waitingForInput: boolean }
  | { type: "paused" }
  | { type: "stopped"; error?: SimulatorError<any> };

export const simulationAtom = atom<SimulationStatus>({ type: "stopped" });

// Atom para rastrear si la simulación se detuvo por HLT
export const isHaltExecutionAtom = atom(false);

// Obtener el sistema de notificaciones (solo si estamos en un entorno React)
let addNotification: ((n: { type: string; title: string; message: string }) => void) | null = null;
try {
  // Esto solo funcionará si estamos en un contexto React
  // (en hooks o componentes, useNotifications funciona, pero aquí es módulo global)
  // Por eso, lo exponemos globalmente si existe
  if ((window as any).VonSimAddNotification) {
    addNotification = (window as any).VonSimAddNotification;
  }
} catch (e) {
  // No se pudo acceder a VonSimAddNotification, se ignora el error.
}

function tryNotifyGlobal(
  notification: { type: string; title: string; message: string },
  retries = 10,
) {
  if ((window as any).VonSimAddNotification) {
    (window as any).VonSimAddNotification(notification);
  } else if (retries > 0) {
    setTimeout(() => tryNotifyGlobal(notification, retries - 1), 100);
  }
}

function notifyError(error: SimulatorError<any>) {
  const message = error.translate(getSettings().language);
  toast({ title: message, variant: "error" });
  if (addNotification) {
    addNotification({
      type: "error",
      title: "Error de simulación",
      message,
    });
  } else {
    tryNotifyGlobal({
      type: "error",
      title: "Error de simulación",
      message,
    });
  }
}

export function notifyWarning(
  title: string,
  message: string,
  options?: { inline?: boolean; targetId?: string },
) {
  // Para notificaciones inline, usar un sistema diferente
  if (options?.inline && options?.targetId) {
    const event = new CustomEvent("showInlineNotification", {
      detail: {
        title,
        message,
        targetId: options.targetId,
        duration: 3000, // 3 segundos por defecto
      },
    });
    window.dispatchEvent(event);
    return;
  }

  // Mantener el comportamiento original para notificaciones normales
  toast({ title, description: message, variant: "info" }); // 'warning' no es válido, usar 'info' para toast
  if (addNotification) {
    addNotification({
      type: "warning",
      title,
      message,
    });
  }
}

export function finishSimulation(error?: SimulatorError<any>) {
  // Limpiar hilos activos
  mainCpuThreadActive = false;
  activeThreads.clear();
  console.log("🧹 [DEBUG] Hilos activos limpiados");

  // Llamar a la función original
  if (error) {
    notifyError(error);
    if (error.code === "no-instruction") {
      store.set(simulationAtom, { type: "paused" });
      return;
    }
  }

  highlightLine(null);
  highlightCurrentInstruction(null);
  setReadOnly(false);
  store.set(simulationAtom, { type: "stopped", error });
  store.set(cycleAtom, { phase: "stopped", error });
  stopAllAnimations();

  // Resetear la bandera de HLT para futuras ejecuciones
  store.set(isHaltExecutionAtom, false);

  console.log("✅ [DEBUG] Simulación finalizada - todos los hilos y procesos limpiados");
}

export function pauseSimulation() {
  store.set(simulationAtom, { type: "paused" });
  pauseAllAnimations();
}

function assembleError() {
  const message = translate(getSettings().language, "messages.assemble-error");
  toast({ title: message, variant: "error" });
  if (addNotification) {
    addNotification({
      type: "error",
      title: "Error de ensamblado",
      message,
    });
  } else {
    tryNotifyGlobal({
      type: "error",
      title: "Error de ensamblado",
      message,
    });
  }
}

function invalidAction() {
  toast({ title: translate(getSettings().language, "messages.invalid-action"), variant: "error" });
}

function resetState(state: ComputerState, clearRegisters = false) {
  resetCPUState(state, clearRegisters);
  resetMemoryState(state, clearRegisters);

  resetHandshakeState(state);
  resetPICState(state);
  resetPIOState(state);
  resetTimerState(state);

  resetLedsState(state);
  resetPrinterState(state);
  resetScreenState(state);
  resetSwitchesState(state);

  cycleCount = 0;
  instructionCount = 0;
  fetchStageCounter = 0;
  executeStageCounter = 0;
  store.set(cycleCountAtom, cycleCount);
  store.set(instructionCountAtom, instructionCount);
  store.set(messageAtom, ""); // Limpiar el mensaje actual
  // Limpiar el historial de mensajes si clearRegisters es true
  if (clearRegisters) {
    store.set(messageHistoryAtom, []); // Limpia el historial de mensajes
    store.set(isHaltExecutionAtom, false); // Resetear bandera de HLT
  }
  // Resetear el total de ciclos acumulados al reiniciar el programa
  store.set(totalCycleCountAtom, 0);

  // Resetear la bandera de rutina de interrupción
  isExecutingInterruptRoutine = false;
  interruptFlagNotificationShown = false;
}

let currentInstructionName: string | null = null;
let fetchStageCounter = 0;
let executeStageCounter = 0;
let messageReadWrite = "";
let shouldDisplayMessage = true;
let currentInstructionModeid = false;
let currentInstructionModeri = false;
let currentInstructionOperands: string[] = [];
let cycleCount = 0;
let currentInstructionCycleCount = 0; // Contador de ciclos para la instrucción actual
let instructionCount = 0;
let fuenteALU = "";
let destinoALU = "";
let MBRALU = "";
let mbridirmar = false;
let resultmbrimar = false;
let displayMessageresultmbr = "";
let displayMessagepop = "";
let blBxToRiProcessed = false; // Flag para rastrear cuando BL/BX→ri ya fue procesado
let blBxRegisterName = ""; // Para recordar si era BL o BX
let idToMbrCombinedMessage = false; // Flag para rastrear cuando id ← MBR debe combinarse con MAR ← ri
let lastMemoryOperationWasWrite = false; // Flag para rastrear si la última operación de memoria fue escritura

let shouldPauseAfterEvent = false; // Nueva bandera para pausar después del evento

// Bandera para rastrear si ya se mostró la notificación del flag I
let interruptFlagNotificationShown = false;

// Bandera para rastrear si estamos ejecutando una rutina de interrupción (INT 6 o INT 7)
let isExecutingInterruptRoutine = false;

// Exportar una función para que otros módulos puedan verificar si estamos en rutina de interrupción
export function getIsExecutingInterruptRoutine(): boolean {
  return isExecutingInterruptRoutine;
}

// Tipos para mejorar la legibilidad y mantenibilidad
type InstructionContext = {
  name: string;
  modeId: boolean; // Direccionamiento inmediato
  modeRi: boolean; // Direccionamiento directo
  executeStage: number;
  cycleCount: number;
};

type MessageConfig = {
  message: string;
  shouldDisplay: boolean;
  shouldPause: boolean;
};

// Función auxiliar para determinar el tipo de direccionamiento
function getAddressingMode(instruction: InstructionContext): string {
  if (instruction.modeId && instruction.modeRi) {
    return "directo-inmediato";
  } else if (instruction.modeId) {
    return "inmediato";
  } else if (instruction.modeRi) {
    return "directo";
  }
  return "registro";
}

// Función auxiliar para determinar si una instrucción MOV es lectura o escritura
function isMOVReadOperation(operands: string[]): boolean {
  if (operands.length !== 2) return false;

  const [dest, src] = operands;

  // Si el destino es un registro y la fuente es memoria, es lectura (reg<-mem)
  // Ejemplo: MOV AL, [0F] -> ["AL", "[0F]"] -> true (lectura)
  const isDestRegister = /^[A-D][LH]$/.test(dest) || /^[A-D]X$/.test(dest);
  const isSrcMemory = src.startsWith("[") && src.endsWith("]");

  return isDestRegister && isSrcMemory;
}

// Función auxiliar para generar mensajes de transferencia de registros
function generateRegisterTransferMessage(
  sourceRegister: string,
  instruction: InstructionContext,
): MessageConfig {
  const { name, modeId, modeRi, executeStage } = instruction;

  // Casos especiales para instrucciones MOV con direccionamiento directo e inmediato
  if (name === "MOV" && modeId && modeRi) {
    return handleDirectImmediateMOV(sourceRegister, executeStage);
  }

  // Casos especiales para instrucciones MOV con solo direccionamiento directo
  if (name === "MOV" && modeRi && !modeId) {
    return handleDirectMOV(sourceRegister, executeStage);
  }

  // Casos especiales para instrucciones MOV con solo direccionamiento inmediato
  if (name === "MOV" && modeId && !modeRi) {
    return handleImmediateMOV(sourceRegister);
  }

  // Casos especiales para otras instrucciones
  if (name === "INT") {
    return handleINTInstruction(sourceRegister, executeStage, modeRi);
  }

  if (name === "CALL") {
    return handleCALLInstruction(sourceRegister);
  }

  // Caso especial para OUT en executeStage === 2 (paso 4): solo pausar, mensaje ya mostrado en cpu:register.copy
  if (name === "OUT" && sourceRegister === "ri" && executeStage === 2) {
    return {
      message: "",
      shouldDisplay: false,
      shouldPause: true,
    };
  }

  // Caso especial para OUT: MBR ← registro
  if (name === "OUT" && executeStage === 5) {
    return {
      message: `Ejecución: MBR ← ${sourceRegister}`,
      shouldDisplay: true,
      shouldPause: true,
    };
  }

  // Casos especiales para instrucciones aritméticas con solo direccionamiento directo
  if (["ADD", "SUB", "CMP", "AND", "OR", "XOR"].includes(name) && modeRi && !modeId) {
    return handleDirectArithmetic(sourceRegister, executeStage);
  }

  // Casos especiales para instrucciones aritméticas (ADD, SUB, CMP, AND, OR, XOR)
  if (["ADD", "SUB", "CMP", "AND", "OR", "XOR"].includes(name) && sourceRegister === "ri") {
    if (executeStage === 5) {
      return {
        message: "",
        shouldDisplay: false,
        shouldPause: false,
      };
    }
    return {
      message: "Ejecución: MAR ← MBR",
      shouldDisplay: true,
      shouldPause: true,
    };
  }

  // Caso general
  return {
    message: `Ejecución: MAR ← ${sourceRegister}`,
    shouldDisplay: true,
    shouldPause: true,
  };
}

// Función específica para MOV con direccionamiento directo e inmediato
function handleDirectImmediateMOV(sourceRegister: string, executeStage: number): MessageConfig {
  switch (executeStage) {
    case 2:
      return {
        message: "Ejecución: MAR ← IP",
        shouldDisplay: true,
        shouldPause: true,
      };
    case 4:
      return {
        message: "Ejecución: ri ← MBR; MAR ← IP",
        shouldDisplay: true,
        shouldPause: true,
      };
    case 5:
      return {
        message: "Ejecución: MAR ← IP | ri ← MBR",
        shouldDisplay: true,
        shouldPause: true,
      };
    default:
      return {
        message: `Ejecución: MAR ← ${sourceRegister}`,
        shouldDisplay: true,
        shouldPause: true,
      };
  }
}

// Función específica para MOV con solo direccionamiento directo
function handleDirectMOV(sourceRegister: string, executeStage: number): MessageConfig {
  if (executeStage === 2) {
    return {
      message: "Ejecución: MAR ← IP",
      shouldDisplay: true,
      shouldPause: true,
    };
  }

  // En la etapa 4, para direccionamiento directo, copiar directamente del MBR al MAR
  if (executeStage === 4 && sourceRegister === "ri") {
    return {
      message: "Ejecución: MAR ← MBR",
      shouldDisplay: true,
      shouldPause: true,
    };
  }

  return {
    message: `Ejecución: MAR ← ${sourceRegister}`,
    shouldDisplay: true,
    shouldPause: true,
  };
}

// Función específica para MOV con solo direccionamiento inmediato
function handleImmediateMOV(sourceRegister: string): MessageConfig {
  if (sourceRegister === "ri") {
    return {
      message: "Ejecución: MAR ← MBR",
      shouldDisplay: true,
      shouldPause: true,
    };
  }

  if (sourceRegister === "IP") {
    return {
      message: "Ejecución: MAR ← IP",
      shouldDisplay: true,
      shouldPause: true,
    };
  }

  return {
    message: `Ejecución: MAR ← ${sourceRegister}`,
    shouldDisplay: true,
    shouldPause: true,
  };
}

// Función específica para instrucciones aritméticas con solo direccionamiento directo
function handleDirectArithmetic(sourceRegister: string, executeStage: number): MessageConfig {
  if (executeStage === 2) {
    return {
      message: "Ejecución: MAR ← IP",
      shouldDisplay: true,
      shouldPause: true,
    };
  }

  // En la etapa 4, para direccionamiento directo, copiar directamente del MBR al MAR
  if (executeStage === 4 && sourceRegister === "ri") {
    return {
      message: "Ejecución: MAR ← MBR",
      shouldDisplay: true,
      shouldPause: true,
    };
  }

  return {
    message: `Ejecución: MAR ← ${sourceRegister}`,
    shouldDisplay: true,
    shouldPause: true,
  };
}

// Función específica para instrucciones INT
function handleINTInstruction(
  sourceRegister: string,
  executeStage: number,
  _modeRi: boolean,
): MessageConfig {
  // Para INT, en el paso 4 (executeStage: 2) cuando el registro es IP
  if (executeStage === 2 && sourceRegister === "IP") {
    return {
      message: "Ejecución: MAR ← IP",
      shouldDisplay: true,
      shouldPause: false, // No pausar - se pausará en cpu:cycle.end
    };
  }

  // Para otros casos de INT con _modeRi
  if (executeStage === 2 && _modeRi) {
    return {
      message: "Ejecución: ri ← MBR; MAR ← SP",
      shouldDisplay: true,
      shouldPause: false, // No pausar - se pausará en cpu:cycle.end
    };
  }

  // Para INT paso 8 (executeStage: 7) cuando el registro es SP
  // Este caso ya no debería mostrar mensaje porque se maneja en cpu:mbr.set
  // pero mantenemos la lógica por si acaso
  if (executeStage === 7 && sourceRegister === "SP") {
    return {
      message: "", // Mensaje ya mostrado en cpu:mbr.set
      shouldDisplay: false,
      shouldPause: false,
    };
  }

  return {
    message: `Ejecución: MAR ← ${sourceRegister}`,
    shouldDisplay: true,
    shouldPause: false, // No pausar - se pausará en cpu:cycle.end
  };
}

// Función específica para instrucciones CALL
function handleCALLInstruction(_sourceRegister: string): MessageConfig {
  return {
    message: `Ejecución: MAR ← ${_sourceRegister}`,
    shouldDisplay: true,
    shouldPause: true,
  };
}

// Función auxiliar para generar mensajes de actualización de registros
function generateRegisterUpdateMessage(
  sourceRegister: string,
  instruction: InstructionContext,
): MessageConfig {
  const { name, modeId, modeRi, executeStage } = instruction;

  // Casos especiales para SP
  if (sourceRegister === "SP") {
    return handleSPRegisterUpdate(name, executeStage);
  }

  // Casos especiales para FLAGS
  if (sourceRegister === "FLAGS") {
    return handleFLAGSRegisterUpdate(name, executeStage, modeRi);
  }

  // Casos especiales para instrucciones INT
  if (name === "INT") {
    return handleINTRegisterUpdate(sourceRegister);
  }

  // Casos especiales para instrucciones MOV con direccionamiento indirecto e inmediato (ej: MOV [BL], 4)
  if (
    name === "MOV" &&
    modeId &&
    modeRi &&
    currentInstructionOperands &&
    currentInstructionOperands.length === 2 &&
    /^\[[A-Z]{2}\]$/i.test(currentInstructionOperands[0]) &&
    /^[0-9A-F]+h?$/i.test(currentInstructionOperands[1]) &&
    (executeStage === 4 || executeStage === 5)
  ) {
    return {
      message: "",
      shouldDisplay: false,
      shouldPause: false,
    };
  }
  // Casos especiales para instrucciones MOV con direccionamiento directo e inmediato
  if (name === "MOV" && modeId && modeRi) {
    return handleDirectImmediateMOVUpdate();
  }

  // Casos especiales para instrucciones MOV con solo direccionamiento directo
  if (name === "MOV" && modeRi && !modeId) {
    return handleDirectMOVUpdate();
  }

  // Casos especiales para instrucciones aritméticas con solo direccionamiento directo
  if (["ADD", "SUB", "CMP", "AND", "OR", "XOR"].includes(name) && modeRi && !modeId) {
    return handleDirectArithmeticUpdate();
  }

  // Casos especiales para instrucciones CALL
  if (name === "CALL") {
    return handleCALLRegisterUpdate(sourceRegister);
  }

  // Caso especial para OUT en executeStage === 3 (ciclo 5)
  if (name === "OUT" && sourceRegister === "IP" && executeStage === 3) {
    return {
      message: "Ejecución: MBR ← read(Memoria[MAR]) | IP ← IP + 1",
      shouldDisplay: true,
      shouldPause: true,
    };
  }

  // Caso especial para IP en instrucciones con direccionamiento directo durante la captación
  if (sourceRegister === "IP" && modeRi && !modeId && executeStage === 3) {
    return {
      message: "Ejecución: MBR ← read(Memoria[MAR]) | IP ← IP + 1",
      shouldDisplay: true,
      shouldPause: true,
    };
  }

  // Caso general
  return {
    message: `Ejecución: MBR ← ${sourceRegister}`,
    shouldDisplay: true,
    shouldPause: true,
  };
}

// Función específica para actualizaciones de SP
function handleSPRegisterUpdate(instructionName: string, executeStage: number): MessageConfig {
  // Caso especial para INT paso 6: ri ← MBR | SP ← SP - 1
  // Este es el paso donde se guarda el número de interrupción y se decrementa SP
  if (executeStage === 4 && instructionName === "INT") {
    return {
      message: "Ejecución: ri ← MBR | SP ← SP - 1",
      shouldDisplay: true,
      shouldPause: true, // SÍ pausar - paso importante para observar
    };
  }

  // Caso especial para INT paso 9 con SP (executeStage === 7): NO establecer mensaje aquí
  // El mensaje combinado "MBR ← IP | SP ← SP - 1" ya se mostró en cpu:mbr.set
  if (executeStage === 7 && instructionName === "INT") {
    return {
      message: "",
      shouldDisplay: false,
      shouldPause: false, // No pausar - ya se pausó en mbr.set
    };
  }

  switch (instructionName) {
    case "PUSH":
      return {
        message: "Ejecución: SP = SP - 1",
        shouldDisplay: true,
        shouldPause: true,
      };
    case "RET":
      // Caso especial para RET en el paso 6 (executeStage === 3): mensaje combinado sin pausa
      if (executeStage === 3) {
        return {
          message: "Ejecución: IP ← MBR | SP ← SP + 1",
          shouldDisplay: true,
          shouldPause: false, // No pausar en RET para mantener fluidez
        };
      }
      return {
        message: "Ejecución: SP = SP + 1",
        shouldDisplay: true,
        shouldPause: false, // No pausar en RET para mantener fluidez
      };
    case "IRET":
      // Caso especial para IRET en el paso 6 (executeStage === 3): mensaje combinado
      if (executeStage === 3) {
        return {
          message: "Ejecución: IP ← MBR | SP ← SP + 1",
          shouldDisplay: true,
          shouldPause: false, // No pausar - se pausará en cpu:cycle.end
        };
      }
      // Caso especial para IRET en el paso 9 (executeStage === 5): mensaje combinado FLAGS ← MBR | SP ← SP + 1
      if (executeStage === 5) {
        return {
          message: "Ejecución: Flags ← MBR | SP ← SP + 1",
          shouldDisplay: true,
          shouldPause: false, // No pausar - se pausará en cpu:cycle.end
        };
      }
      return {
        message: "Ejecución: SP = SP + 1",
        shouldDisplay: true,
        shouldPause: false, // No pausar - se pausará en cpu:cycle.end
      };
    case "POP":
      if (executeStage === 3) {
        return {
          message: `${displayMessagepop} | SP = SP + 1`,
          shouldDisplay: true,
          shouldPause: true,
        };
      }
      break;
  }

  return {
    message: "",
    shouldDisplay: false,
    shouldPause: false,
  };
}

// Función específica para actualizaciones de FLAGS
function handleFLAGSRegisterUpdate(
  instructionName: string,
  executeStage: number,
  modeRi: boolean,
): MessageConfig {
  // Caso especial para INT ciclo 8 (executeStage === 6 con FLAGS)
  // Mensaje combinado: write(Memoria[MAR]) ← MBR | update(Flags I=0)
  // SÍ pausar en modo ciclo a ciclo
  if (instructionName === "INT" && executeStage === 6) {
    return {
      message: "Ejecución: write(Memoria[MAR]) ← MBR | update(Flags I=0)",
      shouldDisplay: true,
      shouldPause: true, // SÍ pausar - momento importante para observar
    };
  }

  if (modeRi && executeStage === 5 && instructionName === "INT") {
    return {
      message: "Ejecución: write(Memoria[MAR]) ← MBR; SP ← SP - 1; update(Flags I=0)",
      shouldDisplay: true,
      shouldPause: false, // No pausar - se pausará en cpu:cycle.end
    };
  }

  // Distinguir entre CLI (I=0) y STI (I=1)
  // CLI y STI no deben pausar en modo ciclo a ciclo (son instrucciones simples)
  if (instructionName === "CLI") {
    return {
      message: "Ejecución: update(Flags I=0)",
      shouldDisplay: true,
      shouldPause: false, // No pausar - instrucción simple
    };
  }

  if (instructionName === "STI") {
    return {
      message: "Ejecución: update(Flags I=1)",
      shouldDisplay: true,
      shouldPause: false, // No pausar - instrucción simple
    };
  }

  // Para INT y otras instrucciones que modifican I, por defecto I=0
  // INT no debe pausar aquí, se pausará en cpu:cycle.end
  if (instructionName === "INT") {
    return {
      message: "Ejecución: update(Flags I=0)",
      shouldDisplay: true,
      shouldPause: false, // No pausar - se pausará en cpu:cycle.end
    };
  }

  return {
    message: "Ejecución: update(Flags I=0)",
    shouldDisplay: true,
    shouldPause: true,
  };
}

// Función específica para actualizaciones de registros en instrucciones INT
function handleINTRegisterUpdate(sourceRegister: string): MessageConfig {
  switch (sourceRegister) {
    case "IP":
      // Para INT en executeStageCounter === 3 (paso 5), mostrar el mensaje combinado y PAUSAR
      // Este es el paso de lectura del número de interrupción, importante para observar
      if (executeStageCounter === 3) {
        return {
          message: "Ejecución: MBR ← read(Memoria[MAR]) | IP ← IP + 1",
          shouldDisplay: true,
          shouldPause: true, // SÍ pausar - paso importante de lectura de operando
        };
      }
      break;
    case "DL":
      return {
        message: "Interrupción: AL ← ASCII",
        shouldDisplay: true,
        shouldPause: true, // Mantener pausa en interrupciones de sistema INT 6/7
      };
    case "right.l":
      return {
        message: "Interrupción: SUB AL, 1",
        shouldDisplay: true,
        shouldPause: true, // Mantener pausa en interrupciones de sistema INT 6/7
      };
    case "right":
      return {
        message: "Interrupción: ADD BL, 1",
        shouldDisplay: true,
        shouldPause: true, // Mantener pausa en interrupciones de sistema INT 6/7
      };
  }

  return {
    message: `Ejecución: MBR ← ${sourceRegister}`,
    shouldDisplay: true,
    shouldPause: false, // No pausar en otros casos - se pausará en cpu:cycle.end
  };
}

// Función específica para actualizaciones de registros en MOV con direccionamiento directo e inmediato
function handleDirectImmediateMOVUpdate(): MessageConfig {
  // Si el contexto es transferencia BL/BX→ri (indirecto-inmediato), no mostrar mensaje en register.copy ni mar.set
  if (
    currentInstructionName === "MOV" &&
    currentInstructionOperands &&
    currentInstructionOperands.length === 2 &&
    /^\[[A-Z]{2}\]$/i.test(currentInstructionOperands[0]) &&
    /^[0-9A-F]+h?$/i.test(currentInstructionOperands[1]) &&
    (executeStageCounter === 4 || executeStageCounter === 5)
  ) {
    return {
      message: "",
      shouldDisplay: false,
      shouldPause: false,
    };
  }
  return {
    message: "Ejecución: MBR ← read(Memoria[MAR]) | IP ← IP + 1",
    shouldDisplay: true,
    shouldPause: true,
  };
}

// Función específica para actualizaciones de registros en MOV con solo direccionamiento directo
function handleDirectMOVUpdate(): MessageConfig {
  return {
    message: "Ejecución: MBR ← read(Memoria[MAR]) | IP ← IP + 1",
    shouldDisplay: true,
    shouldPause: true,
  };
}

// Función específica para actualizaciones de registros en instrucciones aritméticas con solo direccionamiento directo
function handleDirectArithmeticUpdate(): MessageConfig {
  return {
    message: "Ejecución: MBR ← read(Memoria[MAR]) | IP ← IP + 1",
    shouldDisplay: true,
    shouldPause: true,
  };
}

// Función específica para actualizaciones de registros en CALL
function handleCALLRegisterUpdate(sourceRegister: string): MessageConfig {
  // Para CALL en executeStageCounter === 3, mostrar el mensaje combinado
  if (executeStageCounter === 3 && sourceRegister === "IP") {
    return {
      message: "Ejecución: MBR ← read(Memoria[MAR]) | IP ← IP + 1",
      shouldDisplay: true,
      shouldPause: true,
    };
  }

  return {
    message: `Ejecución: MBR ← ${sourceRegister}`,
    shouldDisplay: true,
    shouldPause: true,
  };
}

// Función auxiliar para crear el contexto de instrucción
function createInstructionContext(): InstructionContext {
  return {
    name: currentInstructionName || "",
    modeId: currentInstructionModeid,
    modeRi: currentInstructionModeri,
    executeStage: executeStageCounter,
    cycleCount: currentInstructionCycleCount,
  };
}

// Función de logging mejorada para debugging
function logInstructionExecution(
  eventType: string,
  sourceRegister: string,
  instructionContext: InstructionContext,
  messageConfig: MessageConfig,
): void {
  const addressingMode = getAddressingMode(instructionContext);

  console.log(`🔍 [${eventType}] Registro: ${sourceRegister}`);
  console.log(`   Instrucción: ${instructionContext.name}`);
  console.log(`   Modo de direccionamiento: ${addressingMode}`);
  console.log(`   Etapa de ejecución: ${instructionContext.executeStage}`);
  console.log(`   Ciclo: ${instructionContext.cycleCount}`);
  console.log(`   Mensaje: ${messageConfig.message}`);
  console.log(`   Mostrar: ${messageConfig.shouldDisplay}`);
  console.log(`   Pausar: ${messageConfig.shouldPause}`);
  console.log("---");
}

// Función para validar el contexto de instrucción
function validateInstructionContext(context: InstructionContext): boolean {
  if (!context.name) {
    console.warn("⚠️ Contexto de instrucción sin nombre");
    return false;
  }

  if (context.executeStage < 0) {
    console.warn("⚠️ Etapa de ejecución inválida:", context.executeStage);
    return false;
  }

  return true;
}

// Función para manejar animaciones de manera sincronizada
// async function handleSynchronizedAnimation(animationFunction: () => Promise<void>): Promise<void> {
//   const syncState = store.get(animationSyncAtom);

//   if (!syncState.canAnimate) {
//     // Esperar hasta que las animaciones estén permitidas
//     await new Promise<void>(resolve => {
//       const unsubscribe = store.sub(animationSyncAtom, () => {
//         const newSyncState = store.get(animationSyncAtom);
//         if (newSyncState.canAnimate) {
//           unsubscribe();
//           resolve();
//         }
//       });
//     });
//   }

//   // Ejecutar la animación
//   await animationFunction();
// }

// Variable global para controlar hilos activos
const activeThreads = new Set<Promise<void>>();
let mainCpuThreadActive = false;

/**
 * Starts an execution thread for the given generator. This is, run all the
 * events until the generator is done or the simulation is stopped.
 */
async function startThread(generator: EventGenerator, allowConcurrent = false): Promise<void> {
  // Si ya hay un hilo principal del CPU ejecutándose, no iniciar hilos secundarios
  // EXCEPTO si allowConcurrent es true (para dispositivos críticos como el reloj)
  if (mainCpuThreadActive && generator !== simulator.startCPU() && !allowConcurrent) {
    console.log("🔒 [DEBUG] Hilo secundario bloqueado - CPU principal activo");
    return;
  }

  // Marcar como hilo principal si es el CPU
  const isMainCpuThread = !mainCpuThreadActive && generator === simulator.startCPU();
  if (isMainCpuThread) {
    mainCpuThreadActive = true;
    console.log("🎯 [DEBUG] Iniciando hilo principal del CPU");
  } else if (allowConcurrent) {
    console.log("🕐 [DEBUG] Iniciando hilo concurrente del reloj");
  }

  const threadPromise = executeThread(generator);
  activeThreads.add(threadPromise);

  try {
    await threadPromise;
  } finally {
    activeThreads.delete(threadPromise);
    if (isMainCpuThread) {
      mainCpuThreadActive = false;
      console.log("✅ [DEBUG] Hilo principal del CPU terminado");
    }
  }
}

async function executeThread(generator: EventGenerator): Promise<void> {
  try {
    let iterationCount = 0;
    const MAX_ITERATIONS = 500000; // Límite de seguridad para detectar bucles infinitos

    // eslint-disable-next-line no-constant-condition
    while (true) {
      iterationCount++;

      // Protección contra bucle infinito
      if (iterationCount > MAX_ITERATIONS) {
        console.error(
          "❌ [DEBUG] Bucle infinito detectado - demasiadas iteraciones:",
          iterationCount,
        );
        finishSimulation(); // Detener la simulación sin error específico
        return;
      }

      const status = store.get(simulationAtom);
      const programModified = store.get(programModifiedAtom); // Obtener el estado de programModifiedAtom

      console.log(`🔄 [DEBUG] Iteración ${iterationCount} - Estado:`, {
        status: status.type,
        programModified,
        executeStageCounter,
        currentInstructionName,
      });

      // Verificar si el programa ha sido modificado
      if (programModified) {
        console.log("🔄 Programa modificado - disparando evento de recarga automática");
        // NO marcar como no modificado aquí, se hará en cpu.run

        // Disparar evento personalizado para recarga automática
        if (typeof window !== "undefined") {
          const reloadEvent = new CustomEvent("programModified", {
            detail: {
              shouldReload: true,
              until: status.type === "running" ? status.until : "infinity",
            },
          });
          window.dispatchEvent(reloadEvent);
        }

        // Reinicializar contadores al modificar el programa
        fetchStageCounter = 0;
        executeStageCounter = 0;
        finishSimulation(); // Detener la simulación actual
        return; // RETURN en lugar de break para salir completamente
      }
      if (status.type === "stopped") {
        fetchStageCounter = 0;
        executeStageCounter = 0;
        messageReadWrite = "";
        console.log("✅ [DEBUG] Simulación detenida, saliendo de startThread");
        //store.set(messageAtom, "Ejecución: Detenido");
        return; // RETURN en lugar de break para salir completamente
      }
      if (status.type === "paused") {
        // Wait until the simulation is resumed
        await new Promise<void>(resolve => {
          const unsubscribe = store.sub(simulationAtom, () => {
            unsubscribe();
            resolve();
          });
        });
        continue; // restart loop
      }

      // Handle event
      console.log("🔄 [DEBUG] Obteniendo siguiente evento del generador...");
      const event = generator.next();
      console.log("📋 [DEBUG] Evento obtenido:", {
        done: event.done,
        type: event.value ? (event.value as any).type : undefined,
        hasValue: !!event.value,
      });

      if (event.done) {
        console.log("✅ [DEBUG] Generador terminado, saliendo del bucle");
        return; // RETURN en lugar de break para salir completamente
      }

      if (event.value && typeof event.value !== "undefined") {
        const eventType = (event.value as any).type;
        console.log("🎯 [DEBUG] Procesando evento:", {
          type: eventType,
          executeStageCounter,
          currentInstructionName,
          isTraceEvent: eventType?.includes("trace"),
          isPrinterEvent: eventType?.includes("printer"),
          isPioEvent: eventType?.includes("pio"),
        });

        try {
          // Actualizar el contexto de la instrucción en events.ts
          console.log("📥 [DEBUG] Importando funciones de events.ts...");
          const eventsModule = await import("@/computer/cpu/events");
          console.log("✅ [DEBUG] Módulo events.ts importado correctamente");

          const { updateInstructionContext, getCurrentExecuteStageCounter } = eventsModule;

          if (typeof updateInstructionContext !== "function") {
            throw new Error("updateInstructionContext no es una función");
          }
          if (typeof getCurrentExecuteStageCounter !== "function") {
            throw new Error("getCurrentExecuteStageCounter no es una función");
          }

          console.log("🔄 [DEBUG] Actualizando contexto de instrucción...");
          updateInstructionContext(executeStageCounter, currentInstructionName || "");
          console.log("✅ [DEBUG] Contexto actualizado correctamente");

          // Caso especial: omitir completamente cpu:register.update (ri.l) en INT paso 11
          // Este evento es innecesario porque el registro ri ya tiene el valor correcto
          if (
            eventType === "cpu:register.update" &&
            currentInstructionName === "INT" &&
            executeStageCounter === 11 &&
            (event.value as any).register === "ri.l"
          ) {
            console.log(
              "⏭️ [DEBUG] Omitiendo evento cpu:register.update (ri.l) en INT paso 11 - registro ya actualizado",
            );
            continue; // Saltar al siguiente evento sin procesar este
          }

          // Caso especial: omitir completamente cpu:register.copy (ri → IP) en INT paso 11
          // Este evento es innecesario porque el valor de ri se copia directamente al MAR, no al IP
          if (
            eventType === "cpu:register.copy" &&
            currentInstructionName === "INT" &&
            executeStageCounter === 11 &&
            (event.value as any).src === "ri.l" &&
            (event.value as any).dest === "IP.l"
          ) {
            console.log(
              "⏭️ [DEBUG] Omitiendo evento cpu:register.copy (ri → IP) en INT paso 11 - el valor va directamente a MAR",
            );
            continue; // Saltar al siguiente evento sin procesar este
          }

          console.log("🎯 [DEBUG] Llamando a handleEvent...");
          const handleEventStart = performance.now();

          // Log específico para eventos del reloj
          if (event.value.type.startsWith("clock:")) {
            console.log("🕐 [DEBUG] Procesando evento del reloj:", event.value);
          }

          // Crear un timeout para detectar bloqueos en handleEvent
          // PERO: No aplicar timeout a eventos que requieren interacción del usuario
          const eventPromise = handleEvent(event.value);

          // Lista de eventos que requieren interacción del usuario y no deben tener timeout
          const interactiveEvents = ["keyboard:listen-key"];
          const isInteractiveEvent = interactiveEvents.some(ie => eventType.includes(ie));

          if (isInteractiveEvent) {
            // Para eventos interactivos, esperar sin timeout
            await eventPromise;
          } else {
            // Para eventos normales, aplicar timeout de 10 segundos
            const timeoutPromise = new Promise((_, reject) => {
              setTimeout(() => reject(new Error(`Timeout procesando evento: ${eventType}`)), 10000);
            });
            await Promise.race([eventPromise, timeoutPromise]);
          }

          const handleEventEnd = performance.now();
          console.log(
            `✅ [DEBUG] handleEvent completado en ${(handleEventEnd - handleEventStart).toFixed(2)}ms`,
          );

          // Después del evento, sincronizar el contador con el valor actualizado en events.ts
          console.log("🔄 [DEBUG] Sincronizando executeStageCounter...");
          executeStageCounter = getCurrentExecuteStageCounter();
          console.log("✅ [DEBUG] executeStageCounter sincronizado:", executeStageCounter);
        } catch (error) {
          console.error("❌ [DEBUG] Error procesando evento:", {
            eventType: eventType,
            error: error.message,
            stack: error.stack,
            executeStageCounter,
            currentInstructionName,
          });

          // Re-lanzar el error para que sea manejado por el catch externo
          throw error;
        }
      } else {
        console.log("⏭️ [DEBUG] Evento vacío o indefinido, continuando...");
        continue;
      }
      if (event.value.type === "cpu:cycle.start") {
        currentInstructionName = event.value.instruction.name;
        currentInstructionModeid = event.value.instruction.willUse.id ? true : false;
        currentInstructionModeri = event.value.instruction.willUse.ri ? true : false;
        currentInstructionOperands = event.value.instruction.operands;

        // Desactivar la bandera de rutina de interrupción cuando comience una nueva instrucción normal
        // (esto ocurre después de que INT 6/7 haya terminado con su IRET implícito)
        if (isExecutingInterruptRoutine && currentInstructionName !== "INT") {
          isExecutingInterruptRoutine = false;
          console.log("✅ Rutina de interrupción terminada - volviendo a modo normal");
        }

        // Para INT y CALL, siempre mostrar ri porque se usa en el paso 6
        const shouldShowRi =
          currentInstructionModeri ||
          currentInstructionName === "INT" ||
          currentInstructionName === "CALL";
        store.set(showriAtom, shouldShowRi);
        // Reiniciar el contador de ciclos para la nueva instrucción
        currentInstructionCycleCount = 0;
        store.set(currentInstructionCycleCountAtom, currentInstructionCycleCount);
        // Resetear la bandera de pausa al iniciar nueva instrucción
        shouldPauseAfterEvent = false;
        cycleCount = 0; // Reinicia el contador de ciclos al iniciar cada instrucción
        console.log(
          "🔄 Nueva instrucción iniciada:",
          currentInstructionName,
          "- Contador reiniciado a 0",
        );
        console.log(
          "🔍 Detalles de la instrucción:",
          "willUse.id:",
          event.value.instruction.willUse.id,
          "willUse.ri:",
          event.value.instruction.willUse.ri,
          "modeId:",
          currentInstructionModeid,
          "modeRi:",
          currentInstructionModeri,
        );
        console.log("🔍 Instrucción completa:", JSON.stringify(event.value.instruction, null, 2));
        mbridirmar = false;
        resultmbrimar = false;
        displayMessageresultmbr = "";
        blBxToRiProcessed = false;
        blBxRegisterName = "";
        idToMbrCombinedMessage = false; // Resetear bandera de mensaje combinado para nueva instrucción
      }

      if (
        status.until === "cycle-change" ||
        status.until === "end-of-instruction" ||
        status.until === "infinity"
      ) {
        if (event.value.type === "cpu:cycle.end") {
          fetchStageCounter = 0;
          executeStageCounter = 0;
          shouldDisplayMessage = true;
          messageReadWrite = "";
          instructionCount++;
          console.log(`Instrucciones: ${instructionCount}`);
          store.set(instructionCountAtom, instructionCount);
          //store.set(messageAtom, "-");
          if (status.until === "cycle-change" || status.until === "end-of-instruction") {
            pauseSimulation();
          }
          continue;
        } else if (event.value.type === "cpu:halt") {
          // Marcar que se está ejecutando HLT para preservar el historial ANTES de cualquier otra operación
          console.log(
            "🛑 HLT detected - setting isHaltExecutionAtom to true BEFORE any other operations",
          );
          store.set(isHaltExecutionAtom, true);

          instructionCount++;
          store.set(instructionCountAtom, instructionCount);

          console.log(
            "🛑 HLT - after setting instruction count, isHaltExecutionAtom:",
            store.get(isHaltExecutionAtom),
          );

          // Para HLT, incrementar a executeStageCounter = 4 antes de mostrar el mensaje
          // ya que los pasos 1-3 fueron para captación y el paso 4 es la ejecución de HLT
          //executeStageCounter = 4;
          console.log("🔄 fetchStageCounter", fetchStageCounter);
          cycleCount++;

          store.set(cycleCountAtom, cycleCount);

          // Actualizar el total de ciclos acumulados
          const prevTotal = store.get(totalCycleCountAtom);
          store.set(totalCycleCountAtom, prevTotal + cycleCount);

          // Establecer el mensaje antes de actualizar el contador de ciclos de instrucción
          setMessageAndAddToHistory("Ejecución: Detenido");

          currentInstructionCycleCount++;
          store.set(currentInstructionCycleCountAtom, currentInstructionCycleCount);

          console.log(
            "🛑 HLT ejecutado - executeStageCounter establecido a 4, cycleCount:",
            cycleCount,
          );
        } else if (event.value.type === "cpu:int.6") {
          //store.set(messageAtom, "PILA ← DL; DL ← ASCII; (BL) ← DL; IRET");
          setMessageAndAddToHistory("INT 6: Lectura de carácter del teclado");
          // Activar la bandera de rutina de interrupción
          isExecutingInterruptRoutine = true;
          //  if (status.until === "cycle-change") {
          //  pauseSimulation();
          // }
        } else if (event.value.type === "cpu:int.7") {
          //store.set(messageAtom, "PILA ← DL; Bucle: DL ← (BL); video ← DL; SUB AL, 1; JNZ Bucle; (BL) ← DL; IRET");
          setMessageAndAddToHistory("Interrupción: Rutina mostrar por pantalla");
          // Activar la bandera de rutina de interrupción
          isExecutingInterruptRoutine = true;
          if (status.until === "cycle-change") {
            pauseSimulation();
          }
        }
        if (fetchStageCounter < 3) {
          if (event.value.type === "cpu:mar.set") {
            const sourceRegister = event.value.register;
            if (sourceRegister === "SP") {
              fetchStageCounter = 3;
              executeStageCounter = 3;
              // Para CALL, no mostrar el mensaje aquí (se mostrará en cpu:mbr.set)
              if (currentInstructionName !== "CALL") {
                setMessageAndAddToHistory("Ejecución: MAR ← SP");
              }
            } else {
              // Si estamos en rutina de interrupción, usar "Interrupción:" en lugar de "Captación:"
              const prefix = isExecutingInterruptRoutine ? "Interrupción" : "Captación";
              setMessageAndAddToHistory(`${prefix}: MAR ← IP`);
              cycleCount++;
              currentInstructionCycleCount++;
              store.set(currentInstructionCycleCountAtom, currentInstructionCycleCount);
              executeStageCounter++;
            }
            if (status.until === "cycle-change") {
              pauseSimulation();
            }
            fetchStageCounter++;
          } else if (event.value.type === "cpu:register.update") {
            const sourceRegister = event.value.register;

            console.log(
              "🔍 Debug: Captación register.update - fetchStageCounter:",
              fetchStageCounter,
              "executeStageCounter:",
              executeStageCounter,
              "register:",
              sourceRegister,
              "isExecutingInterruptRoutine:",
              isExecutingInterruptRoutine,
            );

            // Caso especial: Si estamos en rutina de interrupción y el registro es SP,
            // este es el primer evento de la rutina (decrementar SP antes de hacer PUSH)
            if (isExecutingInterruptRoutine && sourceRegister === "SP") {
              setMessageAndAddToHistory("Interrupción: SP ← SP - 1");
              cycleCount++;
              currentInstructionCycleCount++;
              store.set(currentInstructionCycleCountAtom, currentInstructionCycleCount);
              if (status.until === "cycle-change") {
                pauseSimulation();
              }
              executeStageCounter++;
              fetchStageCounter++;
            } else {
              // Si estamos en rutina de interrupción (pero no es SP), usar "Interrupción:" en lugar de "Captación:"
              const prefix = isExecutingInterruptRoutine ? "Interrupción" : "Captación";
              setMessageAndAddToHistory(`${prefix}: MBR ← read(Memoria[MAR]) | IP ← IP + 1`);
              cycleCount++;
              currentInstructionCycleCount++;
              store.set(currentInstructionCycleCountAtom, currentInstructionCycleCount);
              if (status.until === "cycle-change") {
                pauseSimulation();
              }
              executeStageCounter++;
              fetchStageCounter++;
            }
          } else if (event.value.type === "cpu:mbr.get") {
            // Si estamos en rutina de interrupción, usar "Interrupción:" en lugar de "Captación:"
            const prefix = isExecutingInterruptRoutine ? "Interrupción" : "Captación";
            setMessageAndAddToHistory(`${prefix}: IR ← MBR`);
            cycleCount++;
            currentInstructionCycleCount++;
            store.set(currentInstructionCycleCountAtom, currentInstructionCycleCount);
            if (status.until === "cycle-change") {
              pauseSimulation();
            }
            fetchStageCounter++;
          } else if (event.value.type === "cpu:mbr.set") {
            // Caso especial: Si estamos en rutina de interrupción y el registro es DL
            // Este es el primer evento de guardado de registros en la rutina INT 6/7
            const sourceRegister = event.value.register;

            console.log("🔍 cpu:mbr.set en fase de captación - Debug:");
            console.log("  isExecutingInterruptRoutine:", isExecutingInterruptRoutine);
            console.log("  sourceRegister:", sourceRegister);
            console.log("  fetchStageCounter:", fetchStageCounter);
            console.log("  executeStageCounter:", executeStageCounter);

            if (isExecutingInterruptRoutine && sourceRegister === "DL") {
              console.log("🎯 Rutina de interrupción - MBR ← DL detectado en fase de captación");
              setMessageAndAddToHistory("Interrupción: MBR ← DL");
              cycleCount++;
              currentInstructionCycleCount++;
              store.set(currentInstructionCycleCountAtom, currentInstructionCycleCount);
              executeStageCounter++;

              // Pausar si estamos ejecutando por ciclos
              if (status.until === "cycle-change") {
                console.log("🛑 Pausando en rutina de interrupción - MBR ← DL");
                pauseSimulation();
              }
            }
          }
        } else {
          if (event.value.type === "cpu:rd.on" && executeStageCounter > 1) {
            messageReadWrite = "Ejecución: MBR ← read(Memoria[MAR])";
            lastMemoryOperationWasWrite = false; // Es una operación de lectura
          } else if (event.value.type === "cpu:wr.on") {
            // Para CALL en executeStageCounter >= 8, no establecer el mensaje aquí
            // porque cpu:register.copy manejará el mensaje combinado
            if (!(currentInstructionName === "CALL" && executeStageCounter >= 8)) {
              messageReadWrite = "Ejecución: write(Memoria[MAR]) ← MBR";
            } else {
              console.log(
                "✅ CALL paso",
                executeStageCounter,
                "- cpu:wr.on mensaje omitido para mensaje combinado",
              );
            }
            lastMemoryOperationWasWrite = true; // Es una operación de escritura

            // Detectar si es una instrucción MOV que escribe en memoria (solo para logging)
            if (
              currentInstructionName === "MOV" &&
              !isMOVReadOperation(currentInstructionOperands)
            ) {
              console.log("🔍 MOV Debug - Escritura en memoria detectada");
              console.log("🔍 MOV Debug - Operandos:", currentInstructionOperands);
              console.log(
                "🔍 MOV Debug - Es lectura:",
                isMOVReadOperation(currentInstructionOperands),
              );
            }
          } else if (event.value.type === "pio:write.ok") {
            setMessageAndAddToHistory("Ejecución: write(PIO[MAR]) ← MBR");
            cycleCount++;
            currentInstructionCycleCount++;
            store.set(currentInstructionCycleCountAtom, currentInstructionCycleCount);
            executeStageCounter++;
          }
          if (event.value.type === "cpu:mar.set") {
            const sourceRegister = event.value.register;

            // Condición especial: marcar para pausar en MOV CL, [BL] cuando esté en la etapa correspondiente al paso 4
            if (
              currentInstructionName === "MOV" &&
              executeStageCounter === 2 &&
              currentInstructionOperands &&
              currentInstructionOperands.length >= 2 &&
              currentInstructionOperands[0] === "CL" &&
              currentInstructionOperands[1] === "[BL]" &&
              sourceRegister === "ri" &&
              status.until === "cycle-change"
            ) {
              console.log(
                "🛑 Marcando pausa especial: MOV CL, [BL] en paso 4 (executeStageCounter=2) - se pausará al final del evento",
              );
              shouldPauseAfterEvent = true;
            }

            // Pausar siempre en cpu:mar.set si está en modo ciclo a ciclo
            // EXCEPTO para:
            // - CALL cuando sourceRegister === "SP" (se pausará en cpu:mbr.set)
            // - INT paso 6 cuando sourceRegister === "SP" (se pausará en cpu:register.update)
            // - INT paso 7 preparación cuando sourceRegister === "SP" (se pausará en cpu:mbr.set)
            // - INT después de paso 7 cuando sourceRegister === "SP" (después de FLAGS → MBR)
            if (status.until === "cycle-change") {
              if (
                !(currentInstructionName === "CALL" && sourceRegister === "SP") &&
                !(
                  currentInstructionName === "INT" &&
                  executeStageCounter === 4 &&
                  sourceRegister === "SP"
                ) &&
                !(
                  currentInstructionName === "INT" &&
                  executeStageCounter === 5 &&
                  sourceRegister === "SP"
                ) &&
                !(
                  currentInstructionName === "INT" &&
                  executeStageCounter === 7 &&
                  sourceRegister === "SP"
                )
              ) {
                pauseSimulation();
              }
            }

            // let showRI = false;
            // const showRI2 = false;

            // if (
            //   currentInstructionModeri &&
            //   executeStageCounter === 5 &&
            //   (currentInstructionName === "ADD" || currentInstructionName === "SUB")
            // ) {
            //   showRI = true;
            // }
            // if (currentInstructionModeri && executeStageCounter === 9 && "INT") {
            //   showRI = true;
            // }

            // if (
            //   currentInstructionModeri &&
            //   executeStageCounter === 2 &&
            //   (currentInstructionName === "ADD" || currentInstructionName === "SUB")
            // ) {
            //   showRI2 = true;
            // }
            console.log("executeStageCounter:", executeStageCounter);
            console.log("mbridirmar:", mbridirmar);
            console.log("resultmbrimar:", resultmbrimar);
            console.log("displayMessageresultmbr:", displayMessageresultmbr);
            console.log("shouldDisplayMessage:", shouldDisplayMessage);
            console.log("🔍 BL/BX Debug - blBxToRiProcessed:", blBxToRiProcessed);
            console.log("🔍 BL/BX Debug - blBxRegisterName:", blBxRegisterName);

            // Inicializar variable para controlar contabilización doble de ciclo
            let simultaneousCycleCounted = false;

            // Detectar si es MOV/ADD/SUB con direccionamiento indirecto para evitar contabilizar el ciclo adicional
            const isIndirectInstruction =
              (currentInstructionName === "MOV" ||
                currentInstructionName === "ADD" ||
                currentInstructionName === "SUB") &&
              sourceRegister === "ri" &&
              (executeStageCounter === 3 || blBxToRiProcessed) && // Ampliada: también cuando blBxToRiProcessed es true
              // Indirecto puro: no es directo ni inmediato
              ((!currentInstructionModeid && !currentInstructionModeri) ||
                // Indirecto-inmediato: es inmediato pero no directo
                (currentInstructionModeid && !currentInstructionModeri));

            // Detectar si es un caso donde ri → MAR no debe contabilizar ciclo ni mostrarse
            // porque la dirección ya está almacenada en MAR (para operaciones de escritura
            // o cuando ri → MAR es solo preparación interna del procesador)
            const isRiToMARSkipCycle =
              sourceRegister === "ri" &&
              (((currentInstructionName === "ADD" ||
                currentInstructionName === "SUB" ||
                currentInstructionName === "CMP" ||
                currentInstructionName === "AND" ||
                currentInstructionName === "OR" ||
                currentInstructionName === "XOR") &&
                ((executeStageCounter >= 5 && // En etapas avanzadas
                  (messageReadWrite === "Ejecución: write(Memoria[MAR]) ← MBR" || // Para escritura
                    executeStageCounter >= 7)) || // Para etapas muy avanzadas (preparación interna)
                  // Caso específico: ADD/SUB/etc [BL], n - paso 9 innecesario (executeStageCounter === 5)
                  // porque el MAR ya tiene la dirección de destino
                  (executeStageCounter === 5 &&
                    !currentInstructionModeri &&
                    currentInstructionModeid))) ||
                // Caso especial para IN: ri → MAR en ciclo 5 (executeStageCounter === 2)
                // No debe contabilizar ciclo, mostrar animación ni mensaje
                // porque la dirección del puerto ya está en MBR y se transferirá directamente
                (currentInstructionName === "IN" && executeStageCounter === 2));

            // Declarar isArithmeticRegToDirectStep5 antes de su uso
            const isArithmeticRegToDirectStep5 =
              ["ADD", "SUB", "CMP", "AND", "OR", "XOR"].includes(currentInstructionName) &&
              executeStageCounter === 5;

            // Usar las nuevas funciones auxiliares para generar mensajes
            const instructionContext = createInstructionContext();

            // Validar el contexto antes de procesar
            if (validateInstructionContext(instructionContext)) {
              const messageConfig = generateRegisterTransferMessage(
                sourceRegister,
                instructionContext,
              );

              // Logging para debugging
              logInstructionExecution("MAR.set", sourceRegister, instructionContext, messageConfig);

              // Debug adicional para MOV con IP
              if (
                sourceRegister === "IP" &&
                currentInstructionName === "MOV" &&
                executeStageCounter === 4
              ) {
                console.log("🔍 Debug MOV IP - Verificando condiciones:");
                console.log("   sourceRegister === 'IP':", sourceRegister === "IP");
                console.log(
                  "   currentInstructionName === 'MOV':",
                  currentInstructionName === "MOV",
                );
                console.log("   currentInstructionModeri:", currentInstructionModeri);
                console.log("   !currentInstructionModeid:", !currentInstructionModeid);
                console.log("   executeStageCounter === 4:", executeStageCounter === 4);
                console.log("   currentInstructionOperands:", currentInstructionOperands);
                console.log(
                  "   currentInstructionOperands.length === 2:",
                  currentInstructionOperands.length === 2,
                );
                if (currentInstructionOperands.length >= 2) {
                  console.log("   Segundo operando:", currentInstructionOperands[1]);
                  console.log(
                    "   !startsWith('['):",
                    !currentInstructionOperands[1].startsWith("["),
                  );
                  console.log("   !endsWith(']'):", !currentInstructionOperands[1].endsWith("]"));
                  console.log("   /^\\d+$/.test():", /^\d+$/.test(currentInstructionOperands[1]));
                  console.log(
                    "   /^\\d+h$/i.test():",
                    /^\d+h$/i.test(currentInstructionOperands[1]),
                  );
                  console.log(
                    "   Es valor inmediato (decimal o hex):",
                    /^\d+$/.test(currentInstructionOperands[1]) ||
                      /^\d+h$/i.test(currentInstructionOperands[1]),
                  );
                }
              }

              // Manejar casos especiales que requieren lógica adicional
              // PRIORIDAD 0: Caso especial para INT paso 6 con SP: mostrar MAR ← SP
              if (
                currentInstructionName === "INT" &&
                executeStageCounter === 4 &&
                sourceRegister === "SP"
              ) {
                console.log("🎯 INT paso 6 detectado en cpu:mar.set");
                console.log("   currentInstructionName:", currentInstructionName);
                console.log("   executeStageCounter:", executeStageCounter);
                console.log("   sourceRegister:", sourceRegister);
                console.log("   Estableciendo mensaje: MAR ← SP");
                setMessageAndAddToHistory("Ejecución: MAR ← SP");
                // Limpiar mbridirmar para evitar mensaje incorrecto
                mbridirmar = false;
              } else if (
                // PRIORIDAD 1: Caso especial para INT paso 7 con SP - DESPUÉS de FLAGS → MBR
                // executeStageCounter === 6 porque se incrementó en cpu:mbr.set con FLAGS
                // AQUÍ es donde se muestra el mensaje combinado, se contabiliza ciclo y se pausa
                currentInstructionName === "INT" &&
                executeStageCounter === 6 &&
                sourceRegister === "SP"
              ) {
                console.log("🎯 INT paso 7 (ciclo 7) detectado en cpu:mar.set - SP → MAR");
                console.log("   currentInstructionName:", currentInstructionName);
                console.log("   executeStageCounter:", executeStageCounter);
                console.log("   sourceRegister:", sourceRegister);
                console.log("   Estableciendo mensaje combinado: MBR ← FLAGS | MAR ← SP");
                setMessageAndAddToHistory("Ejecución: MBR ← FLAGS | MAR ← SP");
                // Limpiar mbridirmar para evitar mensaje incorrecto
                mbridirmar = false;
              } else if (
                // PRIORIDAD 2: Caso especial para INT paso 7 - ANTES de FLAGS → MBR (executeStageCounter === 5)
                // Este caso no debería ocurrir porque el orden es FLAGS → MBR primero, luego SP → MAR
                currentInstructionName === "INT" &&
                executeStageCounter === 5 &&
                sourceRegister === "SP"
              ) {
                console.log("⚠️ INT paso 7 (preparación) detectado en cpu:mar.set - NO ESPERADO");
                console.log("   Este caso no debería ocurrir - verificar orden de eventos");
                // Limpiar mbridirmar para evitar mensaje incorrecto
                mbridirmar = false;
              } else if (
                // PRIORIDAD 3: Caso especial para INT después del paso 7 (ejecuteStageCounter === 7)
                // NO debería ocurrir después de los cambios
                currentInstructionName === "INT" &&
                executeStageCounter === 7 &&
                sourceRegister === "SP"
              ) {
                console.log("⚠️ INT después de paso 7 detectado en cpu:mar.set - NO ESPERADO");
                console.log("   Este caso no debería ocurrir - verificar lógica");
                // Limpiar mbridirmar para evitar mensaje incorrecto
                mbridirmar = false;
              } else if (
                currentInstructionName === "INT" &&
                executeStageCounter === 8 &&
                sourceRegister === "SP"
              ) {
                // PRIORIDAD 3: Caso especial para INT paso 10 (ciclo 10) con SP: mostrar solo MAR ← SP
                // NOTA: executeStageCounter es 8 aquí porque viene del paso 9 que no incrementó el contador
                console.log("🎯 INT paso 10 (ciclo 10) detectado en cpu:mar.set");
                console.log("   currentInstructionName:", currentInstructionName);
                console.log("   executeStageCounter:", executeStageCounter);
                console.log("   sourceRegister:", sourceRegister);
                console.log("   Estableciendo mensaje: MAR ← SP");
                setMessageAndAddToHistory("Ejecución: MAR ← SP");
                // Limpiar mbridirmar para evitar mensaje incorrecto
                mbridirmar = false;
              } else if (
                // Priorizar el mensaje especial para MOV x, 5 (directo-inmediato) en ciclo 5
                sourceRegister === "IP" &&
                currentInstructionModeri &&
                cycleCount === 5 &&
                currentInstructionOperands.length === 2
              ) {
                // Mostrar el mensaje especial de simultaneidad solo en el ciclo 6 para MOV x, 5 (directo-inmediato)
                setMessageAndAddToHistory("Ejecución: MAR ← IP | ri ← MBR");
                simultaneousCycleCounted = false;
              } else if (resultmbrimar) {
                setMessageAndAddToHistory(displayMessageresultmbr);
              } else if (
                // Caso especial: rutina de interrupción con ri → MAR
                // Mostrar "Interrupción: MAR ← BL" (el registro que se guardó originalmente)
                isExecutingInterruptRoutine &&
                sourceRegister === "ri" &&
                blBxToRiProcessed &&
                blBxRegisterName
              ) {
                console.log("🎯 Rutina de interrupción - MAR ← BL detectado (ri → MAR)");
                // Incrementar ciclo ANTES de mostrar el mensaje
                cycleCount++;
                currentInstructionCycleCount++;
                setMessageAndAddToHistory(`Interrupción: MAR ← ${blBxRegisterName}`);
                store.set(currentInstructionCycleCountAtom, currentInstructionCycleCount);
                console.log(
                  "🔢 Ciclo incrementado en rutina de interrupción - MAR ← BL - cycleCount:",
                  cycleCount,
                  "currentInstructionCycleCount:",
                  currentInstructionCycleCount,
                );
                // Marcar que ya se contabilizó el ciclo para evitar doble contabilización
                simultaneousCycleCounted = true;
                // Resetear banderas
                mbridirmar = false;
                blBxToRiProcessed = false;
                blBxRegisterName = "";

                // Pausar si estamos ejecutando por ciclos
                if (status.until === "cycle-change") {
                  console.log("🛑 Pausando en rutina de interrupción - MAR ← BL");
                  pauseSimulation();
                }
              } else if (
                mbridirmar &&
                !isRiToMARSkipCycle &&
                !(
                  currentInstructionName === "INT" &&
                  executeStageCounter === 6 &&
                  sourceRegister === "SP"
                ) &&
                !(
                  currentInstructionName === "INT" &&
                  executeStageCounter === 11 &&
                  sourceRegister === "ri"
                )
              ) {
                // Para MOV con direccionamiento directo e inmediato, mostrar el mensaje correcto
                if (
                  currentInstructionName === "MOV" &&
                  currentInstructionModeri &&
                  currentInstructionModeid
                ) {
                  setMessageAndAddToHistory("Ejecución: MAR ← IP; MBR→MBR");
                } else if (
                  sourceRegister === "ri" &&
                  currentInstructionName === "MOV" &&
                  !currentInstructionModeri &&
                  !currentInstructionModeid
                ) {
                  // Caso especial para MOV [BL], n - incrementar ciclo ANTES de mostrar el mensaje
                  // para que aparezca como ciclo 4 (después de MBR ← read que fue ciclo 3)
                  cycleCount++;
                  currentInstructionCycleCount++;
                  setMessageAndAddToHistory(`Ejecución: MAR ← ${blBxRegisterName}`);
                  store.set(currentInstructionCycleCountAtom, currentInstructionCycleCount);
                  console.log(
                    "🔢 Ciclo incrementado ANTES de mostrar MAR ← BL/BX - cycleCount:",
                    cycleCount,
                    "currentInstructionCycleCount:",
                    currentInstructionCycleCount,
                  );
                  // Marcar que ya se contabilizó el ciclo para evitar doble contabilización
                  simultaneousCycleCounted = true;
                  // Ahora mostrar el mensaje usando el registro almacenado

                  mbridirmar = false;
                  blBxToRiProcessed = false; // También resetear esta bandera
                  blBxRegisterName = ""; // Limpiar el nombre almacenado
                } else if (
                  sourceRegister === "ri" &&
                  (currentInstructionName === "ADD" || currentInstructionName === "SUB") &&
                  !currentInstructionModeri &&
                  !currentInstructionModeid
                ) {
                  // Caso especial para ADD/SUB [BL], CL - incrementar ciclo ANTES de mostrar el mensaje
                  // para que aparezca como ciclo 4 (después de MBR ← read que fue ciclo 3)
                  cycleCount++;
                  currentInstructionCycleCount++;
                  store.set(currentInstructionCycleCountAtom, currentInstructionCycleCount);
                  console.log(
                    "🔢 Ciclo incrementado ANTES de mostrar MAR ← BL/BX - cycleCount:",
                    cycleCount,
                    "currentInstructionCycleCount:",
                    currentInstructionCycleCount,
                  );
                  // Marcar que ya se contabilizó el ciclo para evitar doble contabilización
                  simultaneousCycleCounted = true;
                  // Ahora mostrar el mensaje usando el registro almacenado
                  setMessageAndAddToHistory(`Ejecución: MAR ← ${blBxRegisterName}`);
                  mbridirmar = false;
                  blBxToRiProcessed = false; // También resetear esta bandera
                  blBxRegisterName = ""; // Limpiar el nombre almacenado
                } else {
                  // Para instrucciones aritméticas (ADD, SUB, CMP, AND, OR, XOR) con registro y memoria,
                  // NO mostrar animación del bus (MBR → id), solo mostrar MBR → MAR como en MOV al, x
                  if (
                    ["ADD", "SUB", "CMP", "AND", "OR", "XOR"].includes(currentInstructionName) &&
                    currentInstructionModeri && // registro-memoria
                    !currentInstructionModeid &&
                    sourceRegister === "ri"
                  ) {
                    // Solo mostrar MAR ← MBR, nunca MBR → id
                    if (!isArithmeticRegToDirectStep5) {
                      setMessageAndAddToHistory("Ejecución: MAR ← MBR");
                    }
                    return; // Evita que se muestre cualquier animación de id
                  }
                  if (idToMbrCombinedMessage) {
                    setMessageAndAddToHistory("Ejecución: MAR ← ri | id ← MBR");
                    idToMbrCombinedMessage = false; // Reset the flag after use
                  } else if (
                    // Solo para instrucciones que realmente usan el registro id
                    // INT y CALL no usan id, por lo que no deben mostrar mensajes con id
                    currentInstructionName !== "INT" &&
                    currentInstructionName !== "CALL"
                  ) {
                    // Animación combinada especial: BL → MAR (direcciones) + MBR → id (datos)
                    cycleCount++;
                    currentInstructionCycleCount++;
                    setMessageAndAddToHistory(`Ejecución: MAR ← BL | id ← MBR`);
                    if (
                      currentInstructionName &&
                      ["ADD", "SUB", "CMP", "AND", "OR", "XOR"].includes(currentInstructionName) &&
                      currentInstructionModeid && // destino indirecto
                      !currentInstructionModeri && // fuente inmediato
                      typeof anim === "function" &&
                      typeof generateDataPath === "function"
                    ) {
                      await Promise.all([
                        // Animación del bus de direcciones IP → MAR
                        anim(
                          [
                            {
                              key: "cpu.internalBus.address.path",
                              from: generateDataPath("BL", "MAR", currentInstructionName),
                            },
                            { key: "cpu.internalBus.address.opacity", from: 1 },
                            { key: "cpu.internalBus.address.strokeDashoffset", from: 1, to: 0 },
                          ],
                          { duration: 300, easing: "easeInOutSine", forceMs: true },
                        ),
                        // Animación del bus de datos MBR → id
                        anim(
                          [
                            {
                              key: "cpu.internalBus.data.path",
                              from: generateDataPath(
                                "MBR",
                                "id",
                                currentInstructionName,
                                "mem<-imd",
                              ),
                            },
                            { key: "cpu.internalBus.data.opacity", from: 1 },
                            { key: "cpu.internalBus.data.strokeDashoffset", from: 1, to: 0 },
                          ],
                          { duration: 300, easing: "easeInOutSine", forceMs: true },
                        ),
                      ]);
                    }
                  }
                }
              } else if (
                sourceRegister === "ri" &&
                currentInstructionName === "MOV" &&
                executeStageCounter === 4
              ) {
                // Caso especial para MOV con direccionamiento directo: copiar directamente del MBR al MAR
                setMessageAndAddToHistory("Ejecución: MAR ← MBR");
              } else if (
                // Caso especial para IN en ciclo 6 (executeStageCounter === 4): MAR ← MBR
                // Se debe mostrar la animación especial MBR → MAR en lugar de ri → MAR
                sourceRegister === "ri" &&
                currentInstructionName === "IN" &&
                executeStageCounter === 4
              ) {
                console.log("🎯 IN ciclo 6 detectado - MAR ← MBR (animación especial MBR → MAR)");
                setMessageAndAddToHistory("Ejecución: MAR ← MBR");
              } else if (
                // Caso especial para instrucciones ALU con direccionamiento indirecto e inmediato
                // cuando se copia el contenido de BL al MAR - paso 6 de ADD [BL], 6
                // PERO NO mostrar si isRiToMARSkipCycle es true (MAR ya tiene la dirección correcta)
                sourceRegister === "ri" &&
                (currentInstructionName === "ADD" ||
                  currentInstructionName === "SUB" ||
                  currentInstructionName === "CMP" ||
                  currentInstructionName === "AND" ||
                  currentInstructionName === "OR" ||
                  currentInstructionName === "XOR") &&
                !currentInstructionModeri &&
                currentInstructionModeid &&
                (executeStageCounter === 4 || executeStageCounter === 5) &&
                !isRiToMARSkipCycle // NUEVA CONDICIÓN: Solo mostrar si NO se debe omitir
              ) {
                // Mensaje simultáneo: MAR ← BL | id ← MBR

                setMessageAndAddToHistory("Ejecución: MAR ← BL | id ← MBR");
                console.log("🎯 Paso 6 de ADD [BL], 6 - Mensaje simultáneo: MAR ← BL | id ← MBR");
              } else if (isRiToMARSkipCycle && sourceRegister === "ri") {
                // Caso especial: ri → MAR se debe omitir completamente (no mostrar mensaje ni contabilizar)
                console.log(
                  "⏭️ ri → MAR omitido completamente - no mostrar mensaje ni contabilizar ciclo",
                );
              } else if (
                currentInstructionName === "INT" &&
                executeStageCounter === 8 &&
                sourceRegister === "ri"
              ) {
                // Caso especial para INT paso 12 (ciclo 12) con ri: SÍ mostrar mensaje "MAR ← ri"
                // NOTA: executeStageCounter es 8 aquí (ya no hay register.update previo con ri.l)
                console.log(
                  "🎯 INT paso 12 (ciclo 12) detectado en cpu:mar.set - Mostrando MAR ← ri",
                );
                setMessageAndAddToHistory("Ejecución: MAR ← ri");
                // Limpiar mbridirmar para evitar mensaje incorrecto
                mbridirmar = false;
              } else if (
                // Para INT cuando sourceRegister === "SP": mostrar mensaje combinado
                (currentInstructionName === "INT" && sourceRegister === "SP") ||
                shouldDisplayMessage ||
                (sourceRegister === "SP" &&
                  currentInstructionName !== "CALL" &&
                  currentInstructionName !== "INT") ||
                (currentInstructionModeid && sourceRegister === "IP") ||
                messageConfig.shouldDisplay
              ) {
                // No mostrar mensaje para MOV/ADD/SUB con direccionamiento indirecto cuando se copia ri al MAR
                // Tampoco mostrar mensaje cuando ri → MAR en instrucciones aritméticas en etapas avanzadas
                // No mostrar mensaje para CALL cuando sourceRegister === "SP" (se mostrará en cpu:mbr.set)
                if (
                  !isIndirectInstruction &&
                  !isRiToMARSkipCycle &&
                  !(currentInstructionName === "CALL" && sourceRegister === "SP")
                ) {
                  // Caso especial para INT con SP: mostrar mensaje combinado
                  if (currentInstructionName === "INT" && sourceRegister === "SP") {
                    setMessageAndAddToHistory("Ejecución: MAR ← SP | MBR ← FLAGS");
                  } else {
                    setMessageAndAddToHistory(messageConfig.message);
                  }
                } else if (isRiToMARSkipCycle) {
                  console.log(
                    "⏭️ Mensaje NO mostrado para ri → MAR en etapa avanzada (dirección ya en MAR)",
                  );
                } else if (currentInstructionName === "CALL" && sourceRegister === "SP") {
                  console.log(
                    "⏭️ Mensaje NO mostrado para CALL MAR ← SP (se mostrará en cpu:mbr.set)",
                  );
                }
              }
            }

            // Limpiar mbridirmar si es un caso ri → MAR que se debe omitir completamente
            if (mbridirmar && isRiToMARSkipCycle && sourceRegister === "ri") {
              mbridirmar = false;
              console.log("🧹 mbridirmar limpiado para ri → MAR omitido en etapa avanzada");
            }

            // Para MOV/ADD/SUB con direccionamiento indirecto, no contabilizar el ciclo pero permitir la pausa
            // PERO cuando blBxToRiProcessed era true, ya se contabilizó el ciclo arriba antes de mostrar el mensaje
            // También skip cuando ri → MAR en instrucciones aritméticas en etapas avanzadas
            // Y skip cuando ya se contabilizó para el mensaje simultáneo
            // Nueva lógica: instrucciones aritméticas fuente registro y destino directo en mar.set y executeStageCounter === 5
            // También skip para CALL cuando sourceRegister === "SP" (se contabilizará en cpu:mbr.set)
            // También skip para INT paso 6 con SP (se contabilizará en cpu:register.update)

            const skipCycleCount =
              isIndirectInstruction ||
              isRiToMARSkipCycle ||
              simultaneousCycleCounted ||
              isArithmeticRegToDirectStep5 ||
              (currentInstructionName === "CALL" && sourceRegister === "SP") ||
              (currentInstructionName === "INT" &&
                executeStageCounter === 4 &&
                sourceRegister === "SP") ||
              (currentInstructionName === "INT" &&
                executeStageCounter === 5 &&
                sourceRegister === "SP") ||
              // NO skip para executeStageCounter === 6 (INT paso 7 con SP) - debe contar ciclo
              (currentInstructionName === "INT" &&
                executeStageCounter === 7 &&
                sourceRegister === "SP") ||
              // Skip para OUT cuando sourceRegister === "ri" y executeStageCounter === 2 (paso 4)
              // El ciclo ya se contabilizó en cpu:register.copy cuando se mostró la animación DL→MAR
              (currentInstructionName === "OUT" &&
                sourceRegister === "ri" &&
                executeStageCounter === 2);
            // NO skip para INT paso 12 con ri (executeStageCounter === 8) - debe contar ciclo 12

            if (!skipCycleCount) {
              cycleCount++;
              currentInstructionCycleCount++;
              if (!isArithmeticRegToDirectStep5) {
                store.set(currentInstructionCycleCountAtom, currentInstructionCycleCount);
              }
              console.log(
                "🔢 Ciclo contabilizado en cpu:mar.set - cycleCount:",
                cycleCount,
                "currentInstructionCycleCount:",
                currentInstructionCycleCount,
              );
            } else {
              console.log(
                "⏭️ Ciclo NO contabilizado en cpu:mar.set - skipCycleCount:",
                skipCycleCount,
                "isIndirectInstruction:",
                isIndirectInstruction,
                "isRiToMARSkipCycle:",
                isRiToMARSkipCycle,
                "isArithmeticRegToDirectStep5:",
                isArithmeticRegToDirectStep5,
                "CALL con SP:",
                currentInstructionName === "CALL" && sourceRegister === "SP",
                "(dirección ya almacenada en MAR o será manejado en mbr.set)",
              );
            }

            // Siempre permitir la pausa en modo cycle-change, independientemente de si se contabiliza el ciclo
            // Las excepciones son: casos ri → MAR que se omiten completamente
            // Para instrucciones indirectas, sí pausar si es la transferencia BL/BX → MAR (blBxToRiProcessed)
            if (status.until === "cycle-change") {
              // Condición especial para MOV CL, [BL] en el paso 4 (MAR ← ri)
              if (
                currentInstructionName === "MOV" &&
                sourceRegister === "ri" &&
                executeStageCounter === 4 &&
                !currentInstructionModeri &&
                !currentInstructionModeid &&
                currentInstructionOperands.length === 2 &&
                currentInstructionOperands[1].startsWith("[") &&
                currentInstructionOperands[1].endsWith("]")
              ) {
                console.log("🔍 MOV CL, [BL] paso 4 detectado - pausando en mar.set");
                pauseSimulation();
              }
              // Para INT en el paso 6: NO pausar en cpu:mar.set (SP → MAR)
              // La pausa ocurrirá en cpu:register.update cuando se actualice SP
              else if (
                currentInstructionName === "INT" &&
                sourceRegister === "SP" &&
                executeStageCounter === 4
              ) {
                console.log(
                  "⏭️ INT paso 6 detectado - NO pausando en cpu:mar.set (pausará en register.update)",
                );
              }
              // Para INT paso 7 con executeStageCounter === 5: NO pausar (caso inesperado)
              else if (
                currentInstructionName === "INT" &&
                sourceRegister === "SP" &&
                executeStageCounter === 5
              ) {
                console.log(
                  "⚠️ INT paso 7 (executeStageCounter === 5) detectado - NO ESPERADO - NO pausando",
                );
              }
              // Para INT paso 7 con executeStageCounter === 6: SÍ pausar en cpu:mar.set (SP → MAR)
              // Este es el caso correcto después de FLAGS → MBR
              else if (
                currentInstructionName === "INT" &&
                sourceRegister === "SP" &&
                executeStageCounter === 6
              ) {
                console.log(
                  "🛑 INT paso 7 (ciclo 7) detectado - pausando en cpu:mar.set (SP → MAR)",
                );
                pauseSimulation();
              }
              // Para CALL en el paso 7: SÍ pausar en cpu:mar.set (SP → MAR)
              // La pausa ahora ocurre aquí en lugar de en cpu:mbr.set
              else if (
                currentInstructionName === "CALL" &&
                sourceRegister === "SP" &&
                executeStageCounter === 6
              ) {
                console.log("🛑 CALL paso 7 detectado - pausando en cpu:mar.set (SP → MAR)");
                pauseSimulation();
              }
              // Solo omitir la pausa para ri → MAR que se omiten completamente
              // Para instrucciones indirectas con BL/BX → MAR, SÍ pausar porque es un evento visible
              else if (!isRiToMARSkipCycle && !(isIndirectInstruction && !blBxToRiProcessed)) {
                pauseSimulation();
              }
            }

            // Solo incrementar executeStageCounter si no es un caso de ri → MAR que se omite
            // Tampoco incrementar para:
            // - INT paso 6 con SP (executeStageCounter === 4, se incrementará en cpu:register.update)
            // - INT paso 7 con SP (executeStageCounter === 6, ciclo 7)
            // - INT paso 7 con SP preparación (executeStageCounter === 5, caso inesperado)
            // - INT después de paso 7 con SP (executeStageCounter === 7)
            if (
              !isRiToMARSkipCycle &&
              !(
                currentInstructionName === "INT" &&
                executeStageCounter === 4 &&
                sourceRegister === "SP"
              ) &&
              !(
                currentInstructionName === "INT" &&
                executeStageCounter === 5 &&
                sourceRegister === "SP"
              ) &&
              !(
                currentInstructionName === "INT" &&
                executeStageCounter === 6 &&
                sourceRegister === "SP"
              ) &&
              !(
                currentInstructionName === "INT" &&
                executeStageCounter === 7 &&
                sourceRegister === "SP"
              )
            ) {
              executeStageCounter++;
              console.log(
                "🔍 cpu:mar.set - executeStageCounter después del incremento:",
                executeStageCounter,
              );
            } else {
              console.log(
                "⏭️ executeStageCounter NO incrementado para ri → MAR omitido o INT paso 6/7",
              );
            }
          } else if (event.value.type === "cpu:register.update") {
            const sourceRegister = event.value.register;

            // Debug: verificar si estamos en la etapa correcta
            console.log(
              "🔍 Debug register.update - fetchStageCounter:",
              fetchStageCounter,
              "executeStageCounter:",
              executeStageCounter,
            );
            console.log(
              "🔍 Debug register.update - currentInstructionModeri:",
              currentInstructionModeri,
              "currentInstructionModeid:",
              currentInstructionModeid,
            );

            // Usar las nuevas funciones auxiliares para generar mensajes de actualización
            const instructionContext = createInstructionContext();

            // Validar el contexto antes de procesar
            if (validateInstructionContext(instructionContext)) {
              const messageConfig = generateRegisterUpdateMessage(
                sourceRegister,
                instructionContext,
              );

              // Logging para debugging
              logInstructionExecution(
                "register.update",
                sourceRegister,
                instructionContext,
                messageConfig,
              );

              let displayMessage = messageConfig.message;
              shouldDisplayMessage = messageConfig.shouldDisplay;
              let pause = messageConfig.shouldPause;

              // Manejar casos especiales adicionales que requieren lógica específica
              if (
                currentInstructionModeri &&
                executeStageCounter === 8 &&
                currentInstructionName === "INT"
              ) {
                displayMessage = "Ejecución: write(Memoria[MAR]) ← MBR; SP ← SP - 1";
              }
              if (executeStageCounter === 4 && currentInstructionName === "CALL") {
                displayMessage = "Ejecución: ri ← MBR | SP ← SP - 1";
                pause = true; // Asegurar que se pause en este paso
              }
              if (executeStageCounter === 4 && currentInstructionName === "INT") {
                console.log("🎯 INT paso 6 detectado en cpu:register.update");
                console.log("   sourceRegister:", sourceRegister);
                console.log("   executeStageCounter:", executeStageCounter);
                console.log("   isExecutingInterruptRoutine:", isExecutingInterruptRoutine);

                if (isExecutingInterruptRoutine) {
                  // Durante la rutina de interrupción INT 7, mostrar solo "ri ← Video:"
                  displayMessage = "Ejecución: ri ← Video:";
                } else {
                  // Durante la instrucción INT normal
                  displayMessage = "Ejecución: ri ← MBR | SP ← SP - 1";
                }
                pause = true; // SÍ pausar - paso importante para observar
                console.log("   displayMessage establecido a:", displayMessage);
                console.log("   pause establecido a:", pause);
              }
              if (
                executeStageCounter === 3 &&
                currentInstructionName === "CALL" &&
                sourceRegister === "IP"
              ) {
                displayMessage = "Ejecución: MBR ← read(Memoria[MAR]) | IP ← IP + 1";
                pause = true; // Asegurar que se pause en este paso
              }
              if (executeStageCounter === 6 && currentInstructionName === "CALL") {
                displayMessage = "Ejecución: write(Memoria[MAR]) ← MBR; SP ← SP - 1";
                pause = true; // Asegurar que se pause en este paso
              }
              // Caso especial para captación del segundo byte en instrucciones con direccionamiento directo
              if (
                executeStageCounter === 3 &&
                sourceRegister === "IP" &&
                (currentInstructionName === "MOV" ||
                  currentInstructionName === "ADD" ||
                  currentInstructionName === "SUB" ||
                  currentInstructionName === "CMP" ||
                  currentInstructionName === "AND" ||
                  currentInstructionName === "OR" ||
                  currentInstructionName === "XOR")
              ) {
                displayMessage = "Ejecución: MBR ← read(Memoria[MAR]) | IP ← IP + 1";
              }
              // Caso especial para instrucciones de salto: JMP, JZ, JNZ, JC, JNC, JO, JNO, JS, JNS, JP, JNP, JGE, JG, JL, JLE, etc.
              const jumpInstructions = ["JMP", "JZ", "JNZ", "JC", "JNC", "JO", "JNO", "JS", "JNS"];
              if (
                executeStageCounter === 3 &&
                sourceRegister === "IP" &&
                jumpInstructions.includes((currentInstructionName || "").toUpperCase())
              ) {
                displayMessage = "Ejecución: MBR ← read(Memoria[MAR]) | IP ← IP + 1";
              }

              // Caso especial para instrucción IN en el ciclo 5 (executeStageCounter === 3)
              // Mostrar mensaje combinado de lectura del PIO e incremento de IP
              if (
                executeStageCounter === 3 &&
                currentInstructionName === "IN" &&
                sourceRegister === "IP"
              ) {
                displayMessage = "Ejecución: MBR ← read(PIO[MAR]) | IP ← IP + 1";
                pause = true; // Asegurar que se pause en este paso
                console.log("🎯 IN ciclo 5 detectado - mensaje combinado establecido");
              }

              // Caso especial para el paso 7 de instrucciones ALU con direccionamiento directo e inmediato
              // Cuando se lee de memoria el valor apuntado por ri (después de captar dirección e inmediato)
              if (
                executeStageCounter === 5 &&
                sourceRegister === "IP" &&
                currentInstructionModeri &&
                currentInstructionModeid &&
                (currentInstructionName === "ADD" ||
                  currentInstructionName === "SUB" ||
                  currentInstructionName === "CMP" ||
                  currentInstructionName === "AND" ||
                  currentInstructionName === "OR" ||
                  currentInstructionName === "XOR")
              ) {
                displayMessage = "Ejecución: MBR ← read(Memoria[MAR]) | IP ← IP + 1";
              }
              console.log("displayMessage:", displayMessage);
              console.log("currentInstructionName:", currentInstructionName);
              console.log("currentInstructionModeri:", currentInstructionModeri);
              console.log("executeStageCounter:", executeStageCounter);
              console.log("pause:", pause);

              // Caso especial para PUSH con SP: NO mostrar mensaje (ya se mostró en cpu:mbr.set)
              // pero SÍ contabilizar el ciclo y pausar si corresponde
              // El mensaje combinado "MBR ← registro | SP ← SP - 1" ya se mostró en cpu:mbr.set
              if (currentInstructionName === "PUSH" && sourceRegister === "SP") {
                console.log(
                  "⏭️ PUSH (SP update) - omitiendo SOLO el mensaje (ya mostrado en mbr.set), pero SÍ contabilizando ciclo",
                  "executeStageCounter:",
                  executeStageCounter,
                );
                // SÍ contabilizar el ciclo
                cycleCount++;
                currentInstructionCycleCount++;
                store.set(currentInstructionCycleCountAtom, currentInstructionCycleCount);
                console.log(
                  "🔢 Ciclo contabilizado en cpu:register.update (PUSH SP) - cycleCount:",
                  cycleCount,
                );
                // NO mostrar mensaje (ya se mostró en mbr.set)
                // NO incrementar executeStageCounter aquí (se manejará más abajo)
              } else if (
                // Caso especial para INT paso 7 con SP: NO mostrar mensaje ni contabilizar ciclo
                // porque el mensaje combinado "MBR ← FLAGS | MAR ← SP" ya se mostró en cpu:mar.set
                // NOTA: executeStageCounter es 7 aquí después de sincronización
                currentInstructionName === "INT" &&
                sourceRegister === "SP" &&
                executeStageCounter === 7
              ) {
                console.log(
                  "⏭️ INT paso 7 (SP update) - omitiendo ciclo y mensaje (ya mostrado en mar.set)",
                );
                // NO incrementar executeStageCounter aquí
              } else if (
                // Caso especial para INT paso 9 con SP: NO mostrar mensaje ni contabilizar ciclo
                // porque el mensaje combinado "MBR ← IP | SP ← SP - 1" ya se mostró en cpu:mbr.set
                // NOTA: executeStageCounter es 8 aquí porque ya se incrementó en cpu:mbr.set (de 7 a 8)
                currentInstructionName === "INT" &&
                sourceRegister === "SP" &&
                executeStageCounter === 8
              ) {
                console.log(
                  "⏭️ INT paso 9 (SP update) - omitiendo ciclo y mensaje (ya mostrado en mbr.set)",
                );
                // NO incrementar executeStageCounter aquí, ya se incrementó en cpu:mbr.set
              } else if (
                currentInstructionName !== "DEC" &&
                currentInstructionName !== "INC" &&
                currentInstructionName !== "NOT" &&
                currentInstructionName !== "NEG" &&
                !(currentInstructionName === "INT" && executeStageCounter === 8)
              ) {
                setMessageAndAddToHistory(displayMessage);
                cycleCount++;
                currentInstructionCycleCount++;
                store.set(currentInstructionCycleCountAtom, currentInstructionCycleCount);
                console.log(
                  "🔢 Ciclo contabilizado en cpu:register.update - cycleCount:",
                  cycleCount,
                );
              }

              // Solo incrementar executeStageCounter si NO es PUSH con SP, INT paso 7 con SP, ni INT paso 9 con SP
              // NOTA: Para PUSH con SP, el mensaje combinado ya se mostró en cpu:mbr.set
              // y el executeStageCounter ya se incrementó allí
              if (
                !(currentInstructionName === "PUSH" && sourceRegister === "SP") &&
                !(
                  currentInstructionName === "INT" &&
                  sourceRegister === "SP" &&
                  executeStageCounter === 7
                ) &&
                !(
                  currentInstructionName === "INT" &&
                  sourceRegister === "SP" &&
                  executeStageCounter === 8
                )
              ) {
                executeStageCounter++;
              }
              if (displayMessage !== "Interrupción: MAR ← (video)") {
                if (status.until === "cycle-change") {
                  // Caso especial para PUSH con SP: SÍ pausar (el mensaje ya se mostró en mbr.set, el ciclo ya se contabilizó arriba)
                  if (currentInstructionName === "PUSH" && sourceRegister === "SP") {
                    console.log("🛑 PUSH (SP update) - pausando después de contabilizar ciclo");
                    pauseSimulation();
                  } else if (
                    currentInstructionName !== "DEC" &&
                    currentInstructionName !== "INC" &&
                    currentInstructionName !== "NOT" &&
                    currentInstructionName !== "NEG" &&
                    !(currentInstructionName === "INT" && executeStageCounter === 12) &&
                    !(
                      currentInstructionName === "INT" &&
                      sourceRegister === "SP" &&
                      executeStageCounter === 7
                    ) &&
                    !(
                      currentInstructionName === "INT" &&
                      sourceRegister === "SP" &&
                      executeStageCounter === 8
                    )
                  ) {
                    if (pause) {
                      pauseSimulation();
                    }
                  } else if (
                    currentInstructionName === "INT" &&
                    executeStageCounter === 6 &&
                    sourceRegister === "FLAGS"
                  ) {
                    // Para INT ciclo 8 (executeStageCounter=6 con FLAGS): SÍ pausar
                    console.log(
                      "🛑 INT ciclo 8 (FLAGS update) - pausando después de actualización",
                    );
                    pauseSimulation();
                  }
                }
              }
            } // Cerrar el bloque if de validateInstructionContext
          } else if (event.value.type === "cpu:alu.execute") {
            if (currentInstructionName === "CMP") {
              store.set(
                messageAtom,
                `Ejecución: ${destinoALU} ${currentInstructionName} ${fuenteALU} ; update(FLAGS)`,
              );
              cycleCount++;
              currentInstructionCycleCount++;
              store.set(currentInstructionCycleCountAtom, currentInstructionCycleCount);
              if (status.until === "cycle-change") {
                pauseSimulation();
              }
            }
          } else if (event.value.type === "cpu:mbr.get") {
            const originalRegister = event.value.register; // Mantener el registro original
            const sourceRegister =
              event.value.register === "id.l"
                ? "id"
                : event.value.register === "IP.l"
                  ? "IP"
                  : event.value.register === "FLAGS.l"
                    ? "FLAGS"
                    : event.value.register === "ri.l"
                      ? "MBR"
                      : event.value.register;

            if (String(sourceRegister) === "right.l" || String(sourceRegister) === "left.l") {
              fuenteALU = "MBR";
            }

            if (
              (currentInstructionModeri &&
                executeStageCounter === 3 &&
                (currentInstructionName === "ADD" ||
                  currentInstructionName === "SUB" ||
                  currentInstructionName === "CMP")) ||
              // Para instrucciones aritméticas con direccionamiento directo (no indirecto)
              // Ejemplo: ADD CL, [05] necesita id ← MBR; MAR ← IP
              // Pero ADD CL, [BL] NO lo necesita
              (executeStageCounter === 3 &&
                (currentInstructionName === "ADD" ||
                  currentInstructionName === "SUB" ||
                  currentInstructionName === "CMP") &&
                currentInstructionModeri && // Solo para direccionamiento directo
                currentInstructionOperands.length >= 2 &&
                // Verificar que es direccionamiento directo con dirección fija (no registro)
                ((currentInstructionOperands[0].startsWith("[") &&
                  currentInstructionOperands[0].endsWith("]") &&
                  /^\[[0-9A-F]+h?\]$/i.test(currentInstructionOperands[0])) ||
                  (currentInstructionOperands[1].startsWith("[") &&
                    currentInstructionOperands[1].endsWith("]") &&
                    /^\[[0-9A-F]+h?\]$/i.test(currentInstructionOperands[1])))) ||
              (executeStageCounter === 3 && currentInstructionName === "POP") ||
              (currentInstructionModeri &&
                currentInstructionModeid &&
                executeStageCounter === 4 &&
                currentInstructionName === "MOV") ||
              // Caso especial para instrucciones ALU con direccionamiento directo e inmediato
              // cuando se copia MBR a id - preparar para mensaje combinado id ← MBR; MAR ← ri
              (originalRegister === "id.l" &&
                currentInstructionModeri &&
                currentInstructionModeid &&
                (currentInstructionName === "ADD" ||
                  currentInstructionName === "SUB" ||
                  currentInstructionName === "CMP" ||
                  currentInstructionName === "AND" ||
                  currentInstructionName === "OR" ||
                  currentInstructionName === "XOR")) ||
              // Caso especial para TODAS las instrucciones con direccionamiento directo e inmediato
              // cuando se copia MBR a ri - preparar para animación simultánea
              (originalRegister === "ri.l" &&
                currentInstructionModeri &&
                currentInstructionModeid &&
                executeStageCounter === 4 &&
                (currentInstructionName === "MOV" ||
                  currentInstructionName === "ADD" ||
                  currentInstructionName === "SUB" ||
                  currentInstructionName === "CMP" ||
                  currentInstructionName === "AND" ||
                  currentInstructionName === "OR" ||
                  currentInstructionName === "XOR")) ||
              // Caso especial para INT y CALL cuando se copia MBR a ri (paso 6)
              (originalRegister === "ri.l" &&
                executeStageCounter === 4 &&
                (currentInstructionName === "INT" || currentInstructionName === "CALL"))
            ) {
              // Marcar que se debe usar el mensaje combinado
              if (
                originalRegister === "id.l" &&
                currentInstructionModeri &&
                currentInstructionModeid &&
                (currentInstructionName === "ADD" ||
                  currentInstructionName === "SUB" ||
                  currentInstructionName === "CMP" ||
                  currentInstructionName === "AND" ||
                  currentInstructionName === "OR" ||
                  currentInstructionName === "XOR")
              ) {
                idToMbrCombinedMessage = true;
              }
              mbridirmar = true;
            }

            if (currentInstructionName === "POP" && executeStageCounter === 3) {
              displayMessagepop = `Ejecución: ${sourceRegister} ← MBR`;
            }

            // Caso especial: ADD/SUB/etc [BL], n - paso 6 (executeStageCounter === 4)
            // MBR → ID sin contabilizar ciclo ni mostrar mensaje (antes del mar.set)
            const isALUIndirectImmediateMBRtoID =
              originalRegister === "id.l" &&
              (currentInstructionName === "ADD" ||
                currentInstructionName === "SUB" ||
                currentInstructionName === "CMP" ||
                currentInstructionName === "AND" ||
                currentInstructionName === "OR" ||
                currentInstructionName === "XOR") &&
              !currentInstructionModeri && // Direccionamiento indirecto
              currentInstructionModeid && // Con valor inmediato
              executeStageCounter === 4; // Paso 6 según el log

            // Caso especial para RET en paso 6: no contabilizar ciclo ni mostrar mensaje aquí
            // El mensaje combinado se mostrará en cpu:register.update
            const isRETStep6 =
              currentInstructionName === "RET" &&
              executeStageCounter === 3 &&
              sourceRegister === "IP";

            // Caso especial para IRET en paso 6: no contabilizar ciclo ni mostrar mensaje aquí
            // El mensaje combinado se mostrará en cpu:register.update
            const isIRETStep6 =
              currentInstructionName === "IRET" &&
              executeStageCounter === 3 &&
              sourceRegister === "IP";

            // Caso especial para IRET en paso 9: no contabilizar ciclo ni mostrar mensaje aquí
            // El mensaje combinado "Flags ← MBR | SP ← SP + 1" se mostrará en cpu:register.update
            const isIRETStep9 =
              currentInstructionName === "IRET" &&
              executeStageCounter === 5 &&
              sourceRegister === "FLAGS";

            if (isALUIndirectImmediateMBRtoID) {
              console.log(
                "🎯 Caso especial detectado: MBR → ID sin contabilizar ciclo ni mostrar mensaje",
              );
              console.log("   Instrucción:", currentInstructionName);
              console.log("   executeStageCounter:", executeStageCounter);
              console.log("   originalRegister:", originalRegister);
            }

            if (isRETStep6) {
              console.log(
                "🎯 Caso especial RET paso 6 detectado: IP ← MBR sin contabilizar ciclo ni mostrar mensaje",
              );
              console.log("   Se mostrará mensaje combinado en cpu:register.update");
            }

            if (isIRETStep6) {
              console.log(
                "🎯 Caso especial IRET paso 6 detectado: IP ← MBR sin contabilizar ciclo ni mostrar mensaje",
              );
              console.log("   Se mostrará mensaje combinado en cpu:register.update");
            }

            if (isIRETStep9) {
              console.log(
                "🎯 Caso especial IRET paso 9 detectado: FLAGS ← MBR sin contabilizar ciclo ni mostrar mensaje",
              );
              console.log(
                "   Se mostrará mensaje combinado en cpu:register.update: Flags ← MBR | SP ← SP + 1",
              );
            }

            // Caso especial para INT y CALL: Log para debugging
            const isINTOrCALLriUpdate =
              originalRegister === "ri.l" &&
              executeStageCounter === 4 &&
              (currentInstructionName === "INT" || currentInstructionName === "CALL");

            if (isINTOrCALLriUpdate) {
              console.log(
                `🎯 ${currentInstructionName} paso 6 detectado: MBR → ri con mbridirmar=${mbridirmar}`,
              );
              console.log(`🎯 showriAtom debería estar habilitado para ${currentInstructionName}`);
            }

            // Caso especial para INT paso 13 (ciclo 14): IP ← MBR (último paso antes de saltar a la rutina de interrupción)
            // IMPORTANTE: NO pausar aquí - la pausa se manejará en cpu:cycle.end
            const isINTStep13 =
              currentInstructionName === "INT" &&
              executeStageCounter === 10 &&
              originalRegister === "IP.l";

            if (isINTStep13) {
              console.log(
                "🎯 INT paso 13 (ciclo 14) detectado: IP ← MBR - NO pausar aquí (pausará en cycle.end)",
              );
              setMessageAndAddToHistory("Ejecución: IP ← MBR");
              cycleCount++;
              currentInstructionCycleCount++;
              store.set(currentInstructionCycleCountAtom, currentInstructionCycleCount);
              // NO pausar aquí - dejar que cpu:cycle.end lo haga
              console.log("⏭️ INT paso 13: Omitiendo pausa - se pausará en cpu:cycle.end");
            } else if (
              !mbridirmar &&
              !isALUIndirectImmediateMBRtoID &&
              !isRETStep6 &&
              !isIRETStep6 &&
              !isIRETStep9
            ) {
              if (
                String(sourceRegister) !== "MBR" &&
                String(sourceRegister) !== "right.l" &&
                String(sourceRegister) !== "left.l"
              ) {
                setMessageAndAddToHistory(`Ejecución: ${sourceRegister} ← MBR`);
                cycleCount++;
                currentInstructionCycleCount++;
                store.set(currentInstructionCycleCountAtom, currentInstructionCycleCount);

                // Detectar si este es el último evento de la instrucción
                // Para MOV con direccionamiento directo, cuando se copia al registro destino, es el final
                const isLastEvent =
                  currentInstructionName === "MOV" &&
                  (sourceRegister === "AL" ||
                    sourceRegister === "AH" ||
                    sourceRegister === "BL" ||
                    sourceRegister === "BH" ||
                    sourceRegister === "CL" ||
                    sourceRegister === "CH" ||
                    sourceRegister === "DL" ||
                    sourceRegister === "DH");

                if (status.until === "cycle-change" && !isLastEvent) {
                  pauseSimulation();
                }
              }
            }
          } else if (event.value.type === "cpu:register.buscopy") {
            console.log("📋 Evento cpu:register.buscopy detectado");
            const sourceRegister = event.value.src.replace(/\.l$/, "");
            const destRegister = event.value.dest.replace(/\.l$/, "");

            // Para instrucciones MOV entre registros, siempre contabilizar el ciclo
            if (currentInstructionName === "MOV") {
              const displayMessage = `Ejecución: ${destRegister} ← ${sourceRegister}`;
              setMessageAndAddToHistory(displayMessage);
              cycleCount++;
              currentInstructionCycleCount++;
              store.set(currentInstructionCycleCountAtom, currentInstructionCycleCount);
              console.log(
                "✅ Ciclo contabilizado para MOV register.buscopy - cycleCount:",
                cycleCount,
                "currentInstructionCycleCount:",
                currentInstructionCycleCount,
              );
            }
          } else if (event.value.type === "cpu:register.copy") {
            console.log("📋 Evento cpu:register.copy detectado");
            const sourceRegister = event.value.src.replace(/\.l$/, "");
            const destRegister = event.value.dest.replace(/\.l$/, "");

            // Debug para todos los eventos register.copy cuando hay una instrucción CALL activa
            if (currentInstructionName === "CALL") {
              console.log("🔍 CALL Debug en register.copy:");
              console.log("   sourceRegister:", sourceRegister, "(original:", event.value.src, ")");
              console.log("   destRegister:", destRegister, "(original:", event.value.dest, ")");
              console.log("   executeStageCounter:", executeStageCounter);
              console.log("   currentInstructionName:", currentInstructionName);
              console.log("   ¿Es ri → IP?:", sourceRegister === "ri" && destRegister === "IP");
              console.log(
                "   ¿Destino contiene IP?:",
                destRegister.includes("IP") || event.value.dest.includes("IP"),
              );
            }

            let displaySource = "";

            if (
              currentInstructionName === "DEC" ||
              currentInstructionName === "INC" ||
              currentInstructionName === "NOT" ||
              currentInstructionName === "NEG"
            ) {
              displaySource =
                sourceRegister === "result"
                  ? `${currentInstructionName} ${fuenteALU}`
                  : sourceRegister;
            } else {
              displaySource =
                sourceRegister === "result"
                  ? `${destRegister} ${currentInstructionName} ${fuenteALU}`
                  : sourceRegister === "ri"
                    ? "MBR"
                    : sourceRegister;
              // Para instrucciones aritméticas, el formato correcto es: MBR ADD id
              // No importa el orden de sourceRegister y fuenteALU, siempre debe ser MBR [operación] id
              MBRALU =
                `MBR ${currentInstructionName} ${currentInstructionOperands[1]}` +
                "; update(FLAGS)";
            }
            if (currentInstructionName === "CMP" && String(destRegister) === "right") {
              fuenteALU = sourceRegister;
            }
            if (currentInstructionName === "CMP" && String(destRegister) === "left") {
              destinoALU = sourceRegister;
            }

            let displayMessage = `Ejecución: ${destRegister === "ri" ? "MAR" : destRegister} ← ${displaySource}`;
            const displayMessageFLAGS = "; update(FLAGS)"; // Agregar el mensaje de FLAGS aquí

            // Solo agregar "; update(FLAGS)" para instrucciones aritméticas que NO sean transferencias a left/right de ALU
            if (
              (currentInstructionName === "ADD" ||
                currentInstructionName === "SUB" ||
                currentInstructionName === "CMP") &&
              destRegister !== "left" &&
              destRegister !== "right"
            ) {
              displayMessage += displayMessageFLAGS;
            }

            if (sourceRegister === "ri" && destRegister === "IP") {
              displayMessage = "Ejecución: IP ← MBR";
              if (currentInstructionName === "CALL") {
                console.log("🔍 CALL Debug - CONDICIÓN ri→IP CUMPLIDA");
                console.log("🔍 CALL Debug - sourceRegister === 'ri':", sourceRegister === "ri");
                console.log("🔍 CALL Debug - destRegister === 'IP':", destRegister === "IP");
                console.log("🔍 CALL Debug - executeStageCounter:", executeStageCounter);
                console.log("🔍 CALL Debug - currentInstructionName:", currentInstructionName);

                // Para CALL: NO contabilizar ciclo ni establecer mensaje aquí
                // Dejar que se maneje automáticamente en cpu:cycle.end
                console.log("🔄 CALL ri→IP: Delegando contabilización y mensaje a cpu:cycle.end");

                // NO pausar aquí para CALL - la pausa real ocurre en cpu:cycle.end
                // Si pausamos aquí, el simulador nunca llegará a cpu:cycle.end
                console.log("🔄 CALL ri→IP: NO pausando, esperando cpu:cycle.end");

                // IMPORTANTE: NO hacer return aquí para permitir que el simulador continúe
                // El evento debe procesarse completamente para permitir cpu:cycle.end
              } else {
                setMessageAndAddToHistory(displayMessage);
              }
              if (status.until === "cycle-change" && currentInstructionName !== "CALL") {
                pauseSimulation();
              }
            } else if (
              // Condición ampliada para CALL: cualquier transferencia a IP en paso >= 8
              currentInstructionName === "CALL" &&
              executeStageCounter >= 8 &&
              (destRegister === "IP" || event.value.dest.includes("IP"))
            ) {
              console.log("🔍 CALL Debug - CONDICIÓN AMPLIADA PARA IP");
              console.log("🔍 CALL Debug - sourceRegister:", sourceRegister);
              console.log("🔍 CALL Debug - destRegister:", destRegister);
              console.log("🔍 CALL Debug - executeStageCounter:", executeStageCounter);

              // Para CALL ampliada: NO contabilizar ciclo ni establecer mensaje aquí
              // Dejar que se maneje automáticamente en cpu:cycle.end
              console.log(
                "🔄 CALL transferencia ampliada: Delegando contabilización y mensaje a cpu:cycle.end",
              );

              // NO pausar aquí para CALL - la pausa real ocurre en cpu:cycle.end
              // Si pausamos aquí, el simulador nunca llegará a cpu:cycle.end
              console.log(
                "🔄 CALL transferencia a IP (ampliada): NO pausando, esperando cpu:cycle.end",
              );

              // IMPORTANTE: NO hacer return aquí para permitir que el simulador continúe
              // El evento debe procesarse completamente para permitir cpu:cycle.end
            } else if (destRegister === "left" && currentInstructionName === "INT") {
              displayMessage = "ADD BL, 1";
            } else if (sourceRegister === "result" && currentInstructionName === "INT") {
              if (status.until === "cycle-change") {
                pauseSimulation();
              }
            } else if (sourceRegister === "IP" && destRegister === "id") {
              displayMessage = "Ejecución: id ← IP";
              setMessageAndAddToHistory(displayMessage);
              if (status.until === "cycle-change") {
                pauseSimulation();
              }
            } else if (sourceRegister === "id" && destRegister === "ri") {
              displayMessage = "Ejecución: MAR ← id";
              shouldDisplayMessage = false; // No mostrar el mensaje en el próximo ciclo
              setMessageAndAddToHistory(displayMessage);
            } else if (sourceRegister === "MBR" && destRegister === "ri") {
              displayMessage = "Ejecución: MAR ← MBR";
              setMessageAndAddToHistory(displayMessage);
              // pauseSimulation();
            } else if (sourceRegister === "id" && destRegister === "IP") {
              displayMessage = "Ejecución: IP ← MBR";
              setMessageAndAddToHistory(displayMessage);
              if (status.until === "cycle-change") {
                pauseSimulation();
              }
            } else if (
              (sourceRegister === "BL" && destRegister === "ri") ||
              (sourceRegister === "BX" && destRegister === "ri")
            ) {
              // Para MOV [BL], n - NO guardar mensaje aquí, se guardará en cpu:mar.set
              const registerName = sourceRegister === "BL" ? "BL" : "BX";
              blBxRegisterName = registerName; // Recordar el nombre del registro
              displayMessage = `Ejecución: MAR ← ${registerName}`;
              // NO guardar el mensaje aquí: setMessageAndAddToHistory(displayMessage);
              shouldDisplayMessage = false;
              // Marcar que ya se procesó esta transferencia para mostrar el mensaje correcto en cpu:mar.set
              mbridirmar = true;
              blBxToRiProcessed = true; // Marcar que se procesó BL/BX→ri
              // NO incrementar executeStageCounter aquí - se maneja en cpu:mar.set
            } else {
              if (String(sourceRegister) === "right.l") {
                fuenteALU = sourceRegister;
              }

              //setMessageAndAddToHistory(displayMessage);
              // pauseSimulation();
            }
            // Debug: mostrar información del evento register.copy
            console.log(
              "cpu:register.copy - sourceRegister:",
              sourceRegister,
              "destRegister:",
              destRegister,
              "currentInstructionName:",
              currentInstructionName,
              "executeStageCounter:",
              executeStageCounter,
            );

            // Para instrucciones MOV/ADD/SUB entre registros, siempre contabilizar el ciclo
            // Para BL/BX a ri, NO contabilizar el ciclo aquí (se contabilizará en cpu:mar.set)
            // Para transferencias a left/right de ALU, usar la lógica especial más abajo
            if (
              (currentInstructionName === "MOV" ||
                currentInstructionName === "ADD" ||
                currentInstructionName === "SUB") &&
              destRegister !== "left" &&
              destRegister !== "right"
            ) {
              const isBLorBXToRi =
                (sourceRegister === "BL" || sourceRegister === "BX") && destRegister === "ri";
              // Detectar caso MOV [BL], 4 (indirecto-inmediato)
              const isIndirectImmediate =
                currentInstructionName === "MOV" &&
                destRegister === "ri" &&
                currentInstructionOperands &&
                currentInstructionOperands.length === 2 &&
                /^\[[A-Z]{2}\]$/i.test(currentInstructionOperands[0]) &&
                /^[0-9A-F]+h?$/i.test(currentInstructionOperands[1]);

              if (!isBLorBXToRi && !isIndirectImmediate) {
                setMessageAndAddToHistory(displayMessage);
                cycleCount++;
                currentInstructionCycleCount++;
                store.set(currentInstructionCycleCountAtom, currentInstructionCycleCount);
                console.log(
                  `✅ Ciclo contabilizado para ${currentInstructionName} register.copy - cycleCount:`,
                  cycleCount,
                  "currentInstructionCycleCount:",
                  currentInstructionCycleCount,
                );
              } else {
                console.log(
                  `⏭️ Ciclo NO contabilizado para ${currentInstructionName} register.copy (BL/BX→ri o indirecto-inmediato) - se contabilizará en cpu:mar.set`,
                );
              }
            } else if (
              // Contabilizar ciclos para todas las transferencias de registros normales
              // EXCEPTO BL/BX → ri que se maneja en cpu:mar.set
              // EXCEPTO transferencias a left/right de ALU que no se contabilizan
              // EXCEPTO CALL paso 8 (ri → IP) que ya se contabilizó arriba
              // EXCEPTO INT que maneja su propia contabilización de ciclos
              ((destRegister !== "result" && sourceRegister !== "result") ||
                // También contabilizar cuando se transfiere resultado a un registro (no a MBR)
                (sourceRegister === "result" && destRegister !== "MBR")) &&
              // Excluir específicamente BL/BX → ri
              !((sourceRegister === "BL" || sourceRegister === "BX") && destRegister === "ri") &&
              // Excluir específicamente transferencias a left/right de ALU
              !(destRegister === "left" || destRegister === "right") &&
              // Excluir específicamente CALL (ri → IP) que se manejará en cpu:cycle.end
              !(
                currentInstructionName === "CALL" &&
                sourceRegister === "ri" &&
                destRegister === "IP"
              ) &&
              // Excluir específicamente INT que maneja su propia contabilización de ciclos
              currentInstructionName !== "INT"
            ) {
              // Para transferencias a left/right de ALU, NO mostrar mensaje ni contabilizar ciclo
              if (destRegister === "left" || destRegister === "right") {
                // No hacer nada - estas transferencias no se muestran ni contabilizan
              } else {
                setMessageAndAddToHistory(displayMessage);
              }

              cycleCount++;
              currentInstructionCycleCount++;
              store.set(currentInstructionCycleCountAtom, currentInstructionCycleCount);
              console.log(
                "✅ Ciclo contabilizado para register.copy - cycleCount:",
                cycleCount,
                "currentInstructionCycleCount:",
                currentInstructionCycleCount,
                "destRegister:",
                destRegister,
                "sourceRegister:",
                sourceRegister,
              );
            } else {
              console.log(
                "❌ Ciclo NO contabilizado para register.copy - condición no cumplida:",
                "destRegister:",
                destRegister,
                "sourceRegister:",
                sourceRegister,
              );
            }
          } else if (
            event.value.type === "bus:reset" &&
            executeStageCounter > 1 &&
            (currentInstructionName === "MOV" ||
              currentInstructionName === "ADD" ||
              currentInstructionName === "SUB" ||
              currentInstructionName === "CMP" ||
              currentInstructionName === "AND" ||
              currentInstructionName === "OR" ||
              currentInstructionName === "XOR" ||
              currentInstructionName === "CALL" ||
              currentInstructionName === "INT" ||
              currentInstructionName === "PUSH" ||
              currentInstructionName === "POP" ||
              currentInstructionName === "IN" ||
              currentInstructionName === "RET" ||
              currentInstructionName === "IRET")
          ) {
            /*(currentInstructionMode &&
              (currentInstructionName === "MOV" ||
               currentInstructionName === "ADD" ||
               currentInstructionName === "SUB" ||
               currentInstructionName === "CMP" ||
               currentInstructionName === "CALL"))*/

            // Establecer mensaje por defecto para lectura de memoria
            if (
              currentInstructionName === "ADD" ||
              currentInstructionName === "SUB" ||
              currentInstructionName === "CMP" ||
              currentInstructionName === "AND" ||
              currentInstructionName === "OR" ||
              currentInstructionName === "XOR"
            ) {
              // Condición especial: ADD/SUB/etc [mem], reg en ciclo 6 (escritura)
              if (
                !currentInstructionModeri && // No es directo
                !currentInstructionModeid && // No es inmediato
                executeStageCounter === 6 &&
                currentInstructionOperands.length === 2 &&
                currentInstructionOperands[0].startsWith("[") &&
                currentInstructionOperands[0].endsWith("]") &&
                /^[0-9A-F]+h?$/i.test(currentInstructionOperands[0].replace(/\[|\]/g, "")) &&
                /^[A-Z]+$/i.test(currentInstructionOperands[1]) // El segundo operando es registro
              ) {
                messageReadWrite = "Ejecución: write(Memoria[MAR]) ← MBR";
              } else {
                messageReadWrite = "Ejecución: MBR ← read(Memoria[MAR])";
              }
            }

            if (currentInstructionName === "RET") {
              messageReadWrite = "Ejecución: MBR ← read(Memoria[MAR])";
            }
            if (currentInstructionName === "IRET") {
              messageReadWrite = "Ejecución: MBR ← read(Memoria[MAR])";
            }
            if (currentInstructionName === "IN") {
              messageReadWrite = "Ejecución: MBR ← read(PIO[MAR])";
            }
            // Para INT, establecer mensajes de lectura o escritura según el executeStageCounter
            // Solo establecer escritura en los pasos específicos donde realmente se escribe en memoria
            if (currentInstructionName === "INT") {
              if (executeStageCounter === 11) {
                // Paso 11 de INT: escritura de IP en la pila
                messageReadWrite = "Ejecución: write(Memoria[MAR]) ← MBR";
                console.log(
                  "🎯 INT paso 11 detectado - estableciendo mensaje de escritura:",
                  messageReadWrite,
                );
              } else if (executeStageCounter === 6) {
                // Paso 7 de INT (ciclo 8): escritura de FLAGS en la pila
                // NOTA: executeStageCounter es 6 aquí en bus:reset, será 7 en register.update
                messageReadWrite = "Ejecución: write(Memoria[MAR]) ← MBR";
                console.log(
                  "🎯 INT ciclo 8 detectado en bus:reset - executeStageCounter:",
                  executeStageCounter,
                );
              } else {
                // Otros pasos de INT: por defecto lectura, pero verificar lastMemoryOperationWasWrite
                if (lastMemoryOperationWasWrite) {
                  messageReadWrite = "Ejecución: write(Memoria[MAR]) ← MBR";
                } else {
                  messageReadWrite = "Ejecución: MBR ← read(Memoria[MAR])";
                }
              }
            }
            // Para MOV, determinar si es lectura o escritura basado en los operandos
            if (currentInstructionName === "MOV" && executeStageCounter === 5) {
              console.log("🔍 MOV Debug - Operandos:", currentInstructionOperands);
              console.log(
                "🔍 MOV Debug - Es lectura:",
                isMOVReadOperation(currentInstructionOperands),
              );

              // Usar la función auxiliar para determinar si es lectura o escritura
              if (isMOVReadOperation(currentInstructionOperands)) {
                // Es lectura de memoria (reg<-mem)
                messageReadWrite = "Ejecución: MBR ← read(Memoria[MAR])";
              } else {
                // Es escritura a memoria (mem<-reg o mem<-imd)
                messageReadWrite = "Ejecución: write(Memoria[MAR]) ← MBR";
              }
            }
            // Para ADD/SUB/CMP/AND/OR/XOR con direccionamiento indirecto e inmediato, determinar el mensaje apropiado
            // IMPORTANTE: Las condiciones más específicas deben ir ANTES que las generales
            if (
              (currentInstructionName === "ADD" ||
                currentInstructionName === "SUB" ||
                currentInstructionName === "CMP" ||
                currentInstructionName === "AND" ||
                currentInstructionName === "OR" ||
                currentInstructionName === "XOR") &&
              currentInstructionModeid &&
              !currentInstructionModeri &&
              executeStageCounter === 5
            ) {
              // Para instrucciones ALU con direccionamiento indirecto e inmediato en el paso 7 (lectura del operando de memoria)
              // Este paso solo trae el operando de memoria sin incrementar el IP
              if (lastMemoryOperationWasWrite) {
                messageReadWrite = "Ejecución: write(Memoria[MAR]) ← MBR";
              } else {
                messageReadWrite = "Ejecución: MBR ← read(Memoria[MAR])";
              }
            } else if (
              (currentInstructionName === "ADD" ||
                currentInstructionName === "SUB" ||
                currentInstructionName === "CMP" ||
                currentInstructionName === "AND" ||
                currentInstructionName === "OR" ||
                currentInstructionName === "XOR") &&
              currentInstructionModeid &&
              !currentInstructionModeri &&
              executeStageCounter === 9
            ) {
              // Para instrucciones ALU con direccionamiento indirecto e inmediato en el paso 9 (escritura del resultado a memoria)
              // Este paso almacena el resultado de la ALU en la memoria
              messageReadWrite = "Ejecución: write(Memoria[MAR]) ← MBR";
              console.log(
                "🎯 Paso 9 ADD [BL], 2 - Estableciendo mensaje de escritura:",
                messageReadWrite,
              );
            } else if (
              (currentInstructionName === "ADD" ||
                currentInstructionName === "SUB" ||
                currentInstructionName === "CMP" ||
                currentInstructionName === "AND" ||
                currentInstructionName === "OR" ||
                currentInstructionName === "XOR") &&
              currentInstructionModeid &&
              currentInstructionModeri &&
              executeStageCounter === 8
            ) {
              // Para instrucciones ALU con direccionamiento directo e inmediato en el paso 8 (escritura del resultado a memoria)
              // Ejemplo: ADD [04], 02h - Este paso almacena el resultado de la ALU en la dirección de memoria
              if (lastMemoryOperationWasWrite) {
                messageReadWrite = "Ejecución: write(Memoria[MAR]) ← MBR";
                console.log(
                  "🎯 Paso 8 ADD [04], 02h - Estableciendo mensaje de escritura:",
                  messageReadWrite,
                );
              } else {
                messageReadWrite = "Ejecución: MBR ← read(Memoria[MAR])";
                console.log(
                  "🎯 Paso 8 ADD [04], 02h - Estableciendo mensaje de lectura:",
                  messageReadWrite,
                );
              }
            } else if (
              (currentInstructionName === "ADD" ||
                currentInstructionName === "SUB" ||
                currentInstructionName === "CMP" ||
                currentInstructionName === "AND" ||
                currentInstructionName === "OR" ||
                currentInstructionName === "XOR") &&
              !currentInstructionModeid &&
              !currentInstructionModeri
            ) {
              if (lastMemoryOperationWasWrite) {
                messageReadWrite = "Ejecución: write(Memoria[MAR]) ← MBR";
              } else {
                messageReadWrite = "Ejecución: MBR ← read(Memoria[MAR])";
              }
            }
            let ContinuarSinGuardar = false;
            // Identificar si este bus:reset es el último paso antes del cycle.end
            let isLastStepBeforeCycleEnd = false;

            // Para MOV/ADD/SUB con escritura en memoria:
            // - Direccionamiento directo: bus:reset en executeStageCounter === 6 es el último paso
            // - Direccionamiento indirecto: bus:reset en executeStageCounter === 5 es el último paso
            // - Direccionamiento indirecto con inmediato (ADD [BL], 2): bus:reset en executeStageCounter === 9 es el último paso
            // - Direccionamiento directo con inmediato (ADD [04], 02h): bus:reset en executeStageCounter === 8 es el último paso
            if (
              (currentInstructionName === "MOV" ||
                currentInstructionName === "ADD" ||
                currentInstructionName === "SUB") &&
              messageReadWrite === "Ejecución: write(Memoria[MAR]) ← MBR"
            ) {
              // Direccionamiento directo (modeRi = true): último paso en executeStageCounter === 6
              if (
                currentInstructionModeri &&
                !currentInstructionModeid &&
                executeStageCounter === 6
              ) {
                isLastStepBeforeCycleEnd = true;
              }
              // Direccionamiento indirecto (modeRi = false, modeId = false): último paso en executeStageCounter === 5
              else if (!currentInstructionModeid && executeStageCounter === 5) {
                isLastStepBeforeCycleEnd = true;
              }

              // Direccionamiento directo con inmediato (ADD [04], 02h): último paso en executeStageCounter === 8
              else if (
                currentInstructionModeri &&
                currentInstructionModeid &&
                executeStageCounter === 8
              ) {
                isLastStepBeforeCycleEnd = true;
              }
            }

            if (
              (currentInstructionModeri &&
                (executeStageCounter === 4 || executeStageCounter === 8) &&
                currentInstructionName === "INT" &&
                !isExecutingInterruptRoutine) || // NO aplicar en rutinas de interrupción
              // Para MOV/ADD/SUB con direccionamiento directo durante la captación del operando en executeStageCounter === 3,
              // no mostrar el mensaje de bus:reset porque cpu:register.update manejará el mensaje correcto
              (executeStageCounter === 3 &&
                (currentInstructionName === "MOV" ||
                  currentInstructionName === "ADD" ||
                  currentInstructionName === "SUB") &&
                currentInstructionModeri) ||
              // Para MOV/ADD/SUB con direccionamiento directo en executeStageCounter === 3 (captación de dirección),
              // no contabilizar el ciclo porque cpu:register.update ya lo maneja
              (executeStageCounter === 3 &&
                (currentInstructionName === "MOV" ||
                  currentInstructionName === "ADD" ||
                  currentInstructionName === "SUB") &&
                !currentInstructionModeri &&
                !currentInstructionModeid &&
                currentInstructionOperands.length >= 2 && // Direccionamiento directo simple: MOV/ADD/SUB X, AL o MOV/ADD/SUB AL, X (sin corchetes, con direcciones/registros)
                // Excluir cuando se está captando la dirección (cualquier operando con dirección directa)
                ((!currentInstructionOperands[0].startsWith("[") &&
                  !currentInstructionOperands[0].endsWith("]") &&
                  !currentInstructionOperands[1].startsWith("[") &&
                  !currentInstructionOperands[1].endsWith("]") &&
                  (/^\d+$/.test(currentInstructionOperands[1]) ||
                    /^\d+h$/i.test(currentInstructionOperands[1]) ||
                    /^[0-9A-F]+h?$/i.test(currentInstructionOperands[1]) ||
                    /^\d+$/.test(currentInstructionOperands[0]) ||
                    /^\d+h$/i.test(currentInstructionOperands[0]) ||
                    /^[0-9A-F]+h?$/i.test(currentInstructionOperands[0]))) ||
                  // Direccionamiento directo con corchetes: MOV/ADD/SUB [09], CL o MOV/ADD/SUB AL, [0F] (captación de dirección)
                  (currentInstructionOperands[0].startsWith("[") &&
                    currentInstructionOperands[0].endsWith("]") &&
                    /^\[[0-9A-F]+h?\]$/i.test(currentInstructionOperands[0])) ||
                  (currentInstructionOperands[1].startsWith("[") &&
                    currentInstructionOperands[1].endsWith("]") &&
                    /^\[[0-9A-F]+h?\]$/i.test(currentInstructionOperands[1])))) ||
              // Para MOV/ADD/SUB con direccionamiento indirecto + inmediato (MOV/ADD/SUB [BL], 4) en executeStageCounter === 3,
              // no contabilizar el ciclo porque cpu:register.update ya maneja la captación del valor inmediato
              (executeStageCounter === 3 &&
                (currentInstructionName === "MOV" ||
                  currentInstructionName === "ADD" ||
                  currentInstructionName === "SUB") &&
                !currentInstructionModeri &&
                !currentInstructionModeid &&
                currentInstructionOperands.length >= 2 &&
                // Detectar MOV/ADD/SUB [registro], valor_inmediato
                ((currentInstructionOperands[0].startsWith("[") &&
                  currentInstructionOperands[0].endsWith("]") &&
                  /^\[[A-Z]+\]$/i.test(currentInstructionOperands[0]) && // [BL], [BH], [CL], etc.
                  (/^\d+$/.test(currentInstructionOperands[1]) ||
                    /^\d+h$/i.test(currentInstructionOperands[1]))) || // valor inmediato
                  // También detectar MOV/ADD/SUB valor_inmediato, [registro]
                  (currentInstructionOperands[1].startsWith("[") &&
                    currentInstructionOperands[1].endsWith("]") &&
                    /^\[[A-Z]+\]$/i.test(currentInstructionOperands[1]) && // [BL], [BH], [CL], etc.
                    (/^\d+$/.test(currentInstructionOperands[0]) ||
                      /^\d+h$/i.test(currentInstructionOperands[0]))))) ||
              // Para MOV/ADD/SUB con direccionamiento directo en executeStageCounter === 5,
              // no mostrar el mensaje de bus:reset porque cpu:register.update manejará el mensaje correcto
              // (se está leyendo el tercer byte - valor inmediato)
              (executeStageCounter === 5 &&
                (currentInstructionName === "MOV" ||
                  currentInstructionName === "ADD" ||
                  currentInstructionName === "SUB") &&
                currentInstructionModeri) ||
              (currentInstructionModeid &&
                executeStageCounter === 4 &&
                (currentInstructionName === "ADD" ||
                  currentInstructionName === "SUB" ||
                  currentInstructionName === "CMP")) ||
              // Para instrucciones aritméticas con direccionamiento directo en executeStageCounter === 3,
              // no mostrar el mensaje de bus:reset porque cpu:register.update manejará el mensaje correcto
              // PERO NO aplicar esto cuando se está leyendo de memoria (direccionamiento indirecto)
              (executeStageCounter === 3 &&
                (currentInstructionName === "ADD" ||
                  currentInstructionName === "SUB" ||
                  currentInstructionName === "CMP" ||
                  currentInstructionName === "AND" ||
                  currentInstructionName === "OR" ||
                  currentInstructionName === "XOR") &&
                messageReadWrite !== "Ejecución: MBR ← read(Memoria[MAR])") || // NUEVA CONDICIÓN: No aplicar cuando se está leyendo de memoria
              // Para instrucciones ALU con direccionamiento indirecto e inmediato en executeStageCounter === 3,
              // no contabilizar el ciclo porque cpu:register.update ya maneja el mensaje con "| IP ← IP + 1"
              (executeStageCounter === 3 &&
                (currentInstructionName === "ADD" ||
                  currentInstructionName === "SUB" ||
                  currentInstructionName === "CMP" ||
                  currentInstructionName === "AND" ||
                  currentInstructionName === "OR" ||
                  currentInstructionName === "XOR") &&
                currentInstructionModeid &&
                !currentInstructionModeri &&
                messageReadWrite === "Ejecución: MBR ← read(Memoria[MAR])") || // Solo para lectura de memoria
              // Para CALL en executeStageCounter === 3 (lectura del segundo byte),
              // no mostrar mensaje, no pausar, ni contabilizar ciclo porque cpu:register.update ya maneja todo
              (executeStageCounter === 3 &&
                currentInstructionName === "CALL" &&
                messageReadWrite === "Ejecución: MBR ← read(Memoria[MAR])") ||
              // Para CALL en executeStageCounter === 7 con mensaje de escritura (corresponde al ciclo 8),
              // no mostrar mensaje, no pausar, ni contabilizar ciclo porque cpu:register.copy ya manejará todo
              (executeStageCounter === 7 &&
                currentInstructionName === "CALL" &&
                messageReadWrite === "Ejecución: write(Memoria[MAR]) ← MBR") ||
              // Para CALL en executeStageCounter >= 8 (otros pasos de escritura en la pila),
              // no mostrar mensaje, no pausar, ni contabilizar ciclo porque cpu:register.copy ya manejará todo
              (executeStageCounter >= 8 && currentInstructionName === "CALL") ||
              // Para INT en executeStageCounter === 3 (paso 5 - lectura de memoria),
              // no mostrar mensaje, no pausar, ni contabilizar ciclo porque cpu:register.update ya manejará todo
              (executeStageCounter === 3 &&
                currentInstructionName === "INT" &&
                messageReadWrite === "Ejecución: MBR ← read(Memoria[MAR])") ||
              // Para IN en executeStageCounter === 3 (ciclo 5 - lectura del PIO),
              // no mostrar mensaje, no pausar, ni contabilizar ciclo porque cpu:register.update ya manejará todo
              (executeStageCounter === 3 &&
                currentInstructionName === "IN" &&
                messageReadWrite === "Ejecución: MBR ← read(PIO[MAR])")
            ) {
              ContinuarSinGuardar = true;
              console.log("🔄 ContinuarSinGuardar establecido a true - condición cumplida");
              if (currentInstructionName === "CALL" && executeStageCounter >= 8) {
                console.log(
                  "✅ CALL paso",
                  executeStageCounter,
                  "- bus:reset omitido correctamente",
                );
              }
              if (currentInstructionName === "IN" && executeStageCounter === 3) {
                console.log(
                  "✅ IN paso",
                  executeStageCounter,
                  "(ciclo 5) - bus:reset omitido correctamente",
                );
              }
            } else {
              console.log(
                "🔄 ContinuarSinGuardar mantenido como false - ninguna condición cumplida",
              );

              // Debug específico para MOV/ADD/SUB en step 3
              if (
                executeStageCounter === 3 &&
                (currentInstructionName === "MOV" ||
                  currentInstructionName === "ADD" ||
                  currentInstructionName === "SUB") &&
                !currentInstructionModeri &&
                !currentInstructionModeid
              ) {
                console.log(`🔍 Debug ${currentInstructionName} step 3:`);
                console.log("   Operandos length >= 2:", currentInstructionOperands.length >= 2);
                console.log(
                  "   Operando[0] no tiene []:",
                  !currentInstructionOperands[0].startsWith("[") &&
                    !currentInstructionOperands[0].endsWith("]"),
                );
                console.log(
                  "   Operando[1] no tiene []:",
                  !currentInstructionOperands[1].startsWith("[") &&
                    !currentInstructionOperands[1].endsWith("]"),
                );
                console.log(
                  "   Test operando[0] es dirección:",
                  /^\d+$/.test(currentInstructionOperands[0]) ||
                    /^\d+h$/i.test(currentInstructionOperands[0]) ||
                    /^[0-9A-F]+h?$/i.test(currentInstructionOperands[0]),
                );
                console.log(
                  "   Test operando[1] es inmediato:",
                  /^\d+$/.test(currentInstructionOperands[1]) ||
                    /^\d+h$/i.test(currentInstructionOperands[1]) ||
                    /^[0-9A-F]+h?$/i.test(currentInstructionOperands[1]),
                );
              }
            }
            console.log("ContinuarSinGuarda:", ContinuarSinGuardar);
            console.log("executeStageCounter:", executeStageCounter);
            console.log("isLastStepBeforeCycleEnd:", isLastStepBeforeCycleEnd);
            console.log("🔍 bus:reset Debug - messageReadWrite:", messageReadWrite);
            console.log("🔍 bus:reset Debug - currentInstructionModeri:", currentInstructionModeri);
            console.log("🔍 bus:reset Debug - currentInstructionModeid:", currentInstructionModeid);
            console.log(
              "🔍 bus:reset Debug - currentInstructionOperands:",
              currentInstructionOperands,
            );
            console.log("🔍 bus:reset Debug - Operando[0]:", currentInstructionOperands[0]);
            console.log("🔍 bus:reset Debug - Operando[1]:", currentInstructionOperands[1]);
            console.log(
              "🔍 bus:reset Debug - Condición MOV/ADD/SUB directo step 3:",
              executeStageCounter === 3 &&
                (currentInstructionName === "MOV" ||
                  currentInstructionName === "ADD" ||
                  currentInstructionName === "SUB") &&
                !currentInstructionModeri &&
                !currentInstructionModeid,
            );
            console.log(
              "🔍 bus:reset Debug - Es lectura de memoria:",
              messageReadWrite === "Ejecución: MBR ← read(Memoria[MAR])",
            );
            console.log(
              "🔍 bus:reset Debug - MOV/ADD/SUB indirecto debe mostrar:",
              (currentInstructionName === "MOV" ||
                currentInstructionName === "ADD" ||
                currentInstructionName === "SUB") &&
                !currentInstructionModeri &&
                !currentInstructionModeid &&
                executeStageCounter === 5 &&
                messageReadWrite === "Ejecución: MBR ← read(Memoria[MAR])",
            );

            // Caso especial: INT en executeStageCounter === 6 (ciclo 8)
            // NO establecer mensaje, NO contabilizar ciclo, NO pausar
            // Todo se manejará en cpu:register.update con FLAGS
            const isINTStep8 =
              currentInstructionName === "INT" &&
              executeStageCounter === 6 &&
              messageReadWrite === "Ejecución: write(Memoria[MAR]) ← MBR";

            if (isINTStep8) {
              // NO hacer nada aquí - todo se manejará en cpu:register.update
              console.log("🎯 INT ciclo 8 detectado en bus:reset (executeStageCounter=6)");
              console.log(
                "⏭️ Omitiendo mensaje, ciclo y pausa - se manejará en cpu:register.update",
              );
            } else if (!ContinuarSinGuardar) {
              setMessageAndAddToHistory(messageReadWrite);
              cycleCount++;
              currentInstructionCycleCount++;
              store.set(currentInstructionCycleCountAtom, currentInstructionCycleCount);

              // Pausar si se está ejecutando por ciclos
              if (status.until === "cycle-change") {
                pauseSimulation();
              }
            } else if (isLastStepBeforeCycleEnd) {
              // Para el último paso antes de cycle.end: mostrar mensaje y contabilizar ciclo, pero NO pausar
              setMessageAndAddToHistory(messageReadWrite);
              cycleCount++;
              currentInstructionCycleCount++;
              store.set(currentInstructionCycleCountAtom, currentInstructionCycleCount);
              // No pausar aquí - la pausa ocurrirá en cycle.end
            }
          } else if (event.value.type === "cpu:mbr.set") {
            // NOTA: La animación del bus se maneja en events.ts
            // Aquí solo manejamos casos especiales de mensajes que requieren lógica específica
            const sourceRegister =
              event.value.register === "id.l"
                ? "id"
                : event.value.register === "FLAGS.l"
                  ? "FLAGS"
                  : event.value.register === "IP.l"
                    ? "IP"
                    : event.value.register === "result.l"
                      ? MBRALU
                      : event.value.register;

            // Debug: mostrar el estado de la rutina de interrupción
            console.log("🔍 cpu:mbr.set Debug:");
            console.log("  isExecutingInterruptRoutine:", isExecutingInterruptRoutine);
            console.log("  sourceRegister:", sourceRegister);
            console.log("  event.value.register:", event.value.register);
            console.log("  executeStageCounter:", executeStageCounter);
            console.log("  currentInstructionName:", currentInstructionName);

            // Caso especial: Si estamos en rutina de interrupción y el registro es DL
            // Este es el primer evento de guardado de registros en la rutina INT 6/7
            if (isExecutingInterruptRoutine && sourceRegister === "DL") {
              console.log("🎯 Rutina de interrupción - MBR ← DL detectado");
              setMessageAndAddToHistory("Interrupción: MBR ← DL");
              cycleCount++;
              currentInstructionCycleCount++;
              store.set(currentInstructionCycleCountAtom, currentInstructionCycleCount);
              executeStageCounter++;

              // Pausar si estamos ejecutando por ciclos
              if (status.until === "cycle-change") {
                console.log("🛑 Pausando en rutina de interrupción - MBR ← DL");
                pauseSimulation();
              }
            } else if (
              currentInstructionModeri &&
              executeStageCounter === 5 &&
              (currentInstructionName === "ADD" || currentInstructionName === "SUB")
            ) {
              resultmbrimar = true;
              displayMessageresultmbr = `Ejecución: MBR ← ${sourceRegister} ; MAR ← MBR`;
            } else if (
              // Para PUSH cuando se copia el registro al MBR en el paso 4-5 (ciclo 4)
              // Mostrar mensaje combinado: MBR ← registro | SP ← SP - 1
              // NOTA: executeStageCounter puede ser 2 o 3 dependiendo de la sincronización
              currentInstructionName === "PUSH" &&
              (executeStageCounter === 2 || executeStageCounter === 3) &&
              ["AL", "BL", "CL", "DL", "AH", "BH", "CH", "DH", "AX", "BX", "CX", "DX"].includes(
                sourceRegister,
              )
            ) {
              console.log(
                `🎯 PUSH paso 4 detectado (executeStageCounter: ${executeStageCounter}): ${sourceRegister} → MBR | SP ← SP - 1`,
              );
              setMessageAndAddToHistory(`Ejecución: MBR ← ${sourceRegister} | SP ← SP - 1`);
              cycleCount++;
              currentInstructionCycleCount++;
              store.set(currentInstructionCycleCountAtom, currentInstructionCycleCount);
              executeStageCounter++;
              // NO pausar aquí para PUSH - la pausa ocurrirá en cpu:register.update cuando se actualice SP
              console.log(
                "⏭️ PUSH paso 4 (MBR ← registro) - NO pausando, pausará en cpu:register.update",
              );
            } else if (
              // Para instrucciones aritméticas con direccionamiento directo e inmediato
              // Etapa 5: copiar el tercer byte (valor inmediato) al registro id
              currentInstructionModeri &&
              currentInstructionModeid &&
              executeStageCounter === 5 &&
              (currentInstructionName === "ADD" ||
                currentInstructionName === "SUB" ||
                currentInstructionName === "CMP" ||
                currentInstructionName === "AND" ||
                currentInstructionName === "OR" ||
                currentInstructionName === "XOR")
            ) {
              setMessageAndAddToHistory(`Ejecución: id ← MBR`);
              if (status.until === "cycle-change") {
                pauseSimulation();
              }
              executeStageCounter++;
              cycleCount++;
              currentInstructionCycleCount++;
              store.set(currentInstructionCycleCountAtom, currentInstructionCycleCount);
            } else if (
              // Para instrucciones aritméticas con direccionamiento directo e inmediato
              // Etapa 6: copiar el MBR al registro ri (para la animación simultánea MBR → ri + IP → MAR)
              // Esta es la condición que estaba faltando para generar la animación simultánea correcta
              currentInstructionModeri &&
              currentInstructionModeid &&
              executeStageCounter === 6 &&
              (currentInstructionName === "ADD" ||
                currentInstructionName === "SUB" ||
                currentInstructionName === "CMP" ||
                currentInstructionName === "AND" ||
                currentInstructionName === "OR" ||
                currentInstructionName === "XOR")
            ) {
              // IMPORTANTE: No manejar aquí - dejar que events.ts maneje completamente
              // para generar la animación simultánea MBR → ri + IP → MAR
              console.log(
                "🎯 Ciclo 6 detectado - delegando a events.ts para animación simultánea MBR → ri + IP → MAR",
              );
            } else if (
              // Para instrucciones aritméticas con direccionamiento directo e inmediato
              // Etapa 7: depositar el resultado de la ALU en MBR
              currentInstructionModeri &&
              currentInstructionModeid &&
              executeStageCounter === 7 &&
              event.value.register === "result.l" &&
              (currentInstructionName === "ADD" ||
                currentInstructionName === "SUB" ||
                currentInstructionName === "CMP" ||
                currentInstructionName === "AND" ||
                currentInstructionName === "OR" ||
                currentInstructionName === "XOR")
            ) {
              // Usar el formato de mensaje que ya tienes implementado: MBR ← MBR ADD id; update(FLAGS)
              const formattedMessage = sourceRegister.replace("; write(FLAGS)", "; update(FLAGS)");
              setMessageAndAddToHistory(`Ejecución: MBR ← ${formattedMessage}`);
              if (status.until === "cycle-change") {
                pauseSimulation();
              }
              executeStageCounter++;
              cycleCount++;
              currentInstructionCycleCount++;
              store.set(currentInstructionCycleCountAtom, currentInstructionCycleCount);
            } else if (
              // Para instrucciones MOV de registro a memoria - paso 5
              // Cuando el registro origen se copia al MBR para escribir en memoria
              currentInstructionName === "MOV" &&
              (executeStageCounter === 5 ||
                executeStageCounter === 6 ||
                executeStageCounter === 3) &&
              ["AL", "BL", "CL", "DL", "AH", "BH", "CH", "DH"].includes(sourceRegister) &&
              !currentInstructionModeri && // No es direccionamiento directo
              !currentInstructionModeid // No es direccionamiento inmediato
            ) {
              // Para MOV [memoria], registro - el paso 5 (o 3 en algunos microciclos) es el registro → MBR
              console.log(`🎯 MOV paso 5/3 detectado: ${sourceRegister} → MBR`);
              setMessageAndAddToHistory(`Ejecución: MBR ← ${sourceRegister}`);
              cycleCount++;
              currentInstructionCycleCount++;
              store.set(currentInstructionCycleCountAtom, currentInstructionCycleCount);
              executeStageCounter++;
              // Pausar aquí si se ejecuta por ciclos
              if (status.until === "cycle-change") {
                pauseSimulation();
              }
            } else if (
              // Para CALL cuando se copia IP al MBR en el paso 7
              currentInstructionName === "CALL" &&
              sourceRegister === "IP"
            ) {
              // Mostrar mensaje combinado pero NO pausar aquí
              // La pausa ocurrirá en el siguiente cpu:mar.set con SP
              setMessageAndAddToHistory("Ejecución: MAR ← SP | MBR ← IP");
              cycleCount++;
              currentInstructionCycleCount++;
              store.set(currentInstructionCycleCountAtom, currentInstructionCycleCount);
              executeStageCounter++;

              // NO pausar aquí para CALL - la pausa ocurrirá en cpu:mar.set con SP
              console.log("⏭️ CALL IP → MBR: NO pausando, pausará en siguiente cpu:mar.set con SP");
            } else if (
              // Para INT cuando se copian FLAGS al MBR en el paso 7 (ciclo 7)
              // Mostrar mensaje combinado: MBR ← FLAGS | MAR ← SP
              currentInstructionName === "INT" &&
              sourceRegister === "FLAGS" &&
              executeStageCounter === 5
            ) {
              console.log(
                "🎯 INT paso 7 (ciclo 7) detectado: FLAGS → MBR (sin mensaje, sin ciclo, sin pausa)",
              );
              // NO mostrar mensaje aquí - se mostrará en cpu:mar.set
              // NO contabilizar ciclo aquí - se contabilizará en cpu:mar.set
              // NO pausar aquí - se pausará en cpu:mar.set

              // Solo incrementar executeStageCounter para avanzar al siguiente evento
              executeStageCounter++;
            } else if (
              // Para INT cuando se copia IP al MBR en el paso 9 (ciclo 9)
              // NOTA: executeStageCounter es 7 aquí DESPUÉS de la sincronización
              // (viene del paso 7 que termina con executeStageCounter === 7)
              currentInstructionName === "INT" &&
              sourceRegister === "IP" &&
              executeStageCounter === 7
            ) {
              console.log("🎯 INT paso 9 (ciclo 9) detectado: IP → MBR | SP ← SP - 1");
              // Mostrar mensaje combinado que incluye SP ← SP - 1 (que se omitió en register.update)
              setMessageAndAddToHistory("Ejecución: MBR ← IP | SP ← SP - 1");
              cycleCount++;
              currentInstructionCycleCount++;
              store.set(currentInstructionCycleCountAtom, currentInstructionCycleCount);
              executeStageCounter++;

              // SÍ pausar aquí en modo ciclo a ciclo
              if (status.until === "cycle-change") {
                console.log("🛑 INT paso 9 - pausando en cpu:mbr.set (IP → MBR | SP ← SP - 1)");
                pauseSimulation();
              }
            } else if (event.value.register === "result.l") {
              // Caso especial para cuando se copia el resultado de la ALU al MBR
              const displayMessage = `Ejecución: MBR ← ${sourceRegister.replace("; write(FLAGS)", " ; update(FLAGS)")}`;
              setMessageAndAddToHistory(displayMessage);
              cycleCount++;
              currentInstructionCycleCount++;
              store.set(currentInstructionCycleCountAtom, currentInstructionCycleCount);

              // Pausar si estamos ejecutando por ciclos
              if (status.until === "cycle-change") {
                pauseSimulation();
              }
            } else if (
              // Para OUT cuando se copia el registro AL al MBR en el paso 5 (ciclo 5)
              currentInstructionName === "OUT" &&
              executeStageCounter === 3 &&
              ["AL", "BL", "CL", "DL", "AH", "BH", "CH", "DH"].includes(sourceRegister)
            ) {
              console.log(`🎯 OUT paso 5 (ciclo 5) detectado: ${sourceRegister} → MBR`);
              setMessageAndAddToHistory(`Ejecución: MBR ← ${sourceRegister}`);
              cycleCount++;
              currentInstructionCycleCount++;
              store.set(currentInstructionCycleCountAtom, currentInstructionCycleCount);
              executeStageCounter++;

              // Pausar si estamos ejecutando por ciclos
              if (status.until === "cycle-change") {
                console.log("🛑 OUT paso 5 - pausando en cpu:mbr.set (registro → MBR)");
                pauseSimulation();
              }
            } else if (
              // Para OUT cuando se copia el registro al MBR en el paso 7 (ciclo 7)
              currentInstructionName === "OUT" &&
              executeStageCounter === 5 &&
              ["AL", "BL", "CL", "DL", "AH", "BH", "CH", "DH"].includes(sourceRegister)
            ) {
              console.log(`🎯 OUT paso 7 (ciclo 7) detectado: ${sourceRegister} → MBR`);
              setMessageAndAddToHistory(`Ejecución: MBR ← ${sourceRegister}`);
              cycleCount++;
              currentInstructionCycleCount++;
              store.set(currentInstructionCycleCountAtom, currentInstructionCycleCount);
              executeStageCounter++;

              // Pausar si estamos ejecutando por ciclos
              if (status.until === "cycle-change") {
                console.log("🛑 OUT paso 7 - pausando en cpu:mbr.set (registro → MBR)");
                pauseSimulation();
              }
            } else {
              // Dejar que events.ts maneje completamente el evento, incluyendo animación
              // NO modificar contadores aquí para permitir que events.ts maneje las animaciones normalmente
              console.log(
                "🎬 Permitiendo que events.ts maneje cpu:mbr.set para animaciones normales",
              );
            }
          }
        }
      } else {
        store.set(messageAtom, ""); // Set messageAtom to blank if not executing by cycle
      }
      console.log(`Ciclos ejecutados: ${cycleCount}`);
      store.set(cycleCountAtom, cycleCount);

      // Verificar si se debe pausar después del evento
      if (shouldPauseAfterEvent && status.until === "cycle-change") {
        console.log("🛑 Ejecutando pausa especial después del evento");
        shouldPauseAfterEvent = false; // Resetear la bandera
        pauseSimulation();
        continue; // Continuar el bucle para procesar la pausa
      }

      const eventInstruction = new CustomEvent("instructionChange", {
        detail: {
          instruction: currentInstructionName,
          modeid: currentInstructionModeid,
          moderi: currentInstructionModeri,
        },
      });
      window.dispatchEvent(eventInstruction);

      if (event.value.type === "cpu:cycle.update" || event.value.type === "cpu:cycle.interrupt") {
        if (status.until === "cycle-change") {
          // pauseSimulation();
        }
        // Remove the setTimeout delay - this was causing slowdown when animations are disabled
      } else if (event.value.type === "cpu:cycle.end") {
        if (status.until === "end-of-instruction" || status.until === "cycle-change") {
          pauseSimulation();
        }
        // Remove the setTimeout delay - this was causing slowdown when animations are disabled
      }
    }

    generator.return();
  } catch (error) {
    const err = SimulatorError.from(error);
    finishSimulation(err);
  }
}

type Action =
  | [action: "cpu.run", until: RunUntil]
  | [action: "cpu.stop", reset?: boolean]
  | [action: "f10.press"]
  | [action: "switch.toggle", index: number]
  | [action: "keyboard.sendChar", char: string]
  | [action: "screen.clean"]
  | [action: "printer.clean"];

async function dispatch(...args: Action) {
  const action = args[0];
  const status = store.get(simulationAtom);

  switch (action) {
    case "cpu.run": {
      if (status.type === "running") return invalidAction();

      const until = args[1];

      if (status.type === "stopped") {
        if (!window.codemirror) return;
        cycleCount = 0; // Reiniciar el contador de ciclos
        instructionCount = 0; // Reiniciar el contador de instrucciones
        store.set(cycleCountAtom, cycleCount); // Actualizar el átomo
        store.set(instructionCountAtom, instructionCount); // Actualizar el átomo
        // Limpiar el historial de mensajes al reiniciar o ejecutar
        store.set(messageHistoryAtom, []);
        const code = window.codemirror.state.doc.toString();
        const result = assemble(code);

        if (!result.success) return assembleError();

        //setReadOnly(true);

        // Verificar si el programa contiene alguna instrucción que afecte al registro SP
        const instructions = result.instructions.map(instruction => instruction.instruction);
        const hasSPInstruction = instructions.some(instruction =>
          ["CALL", "RET", "INT", "IRET", "POP", "PUSH"].includes(instruction),
        );

        // Actualizar el estado showSP en consecuencia
        store.set(showSPAtom, hasSPInstruction);

        const hasINT = instructions.includes("INT");

        // Verificar si el programa tiene instrucciones que afectan al flag I (interrupción)
        const hasInterruptFlagInstructions = instructions.some(instruction =>
          ["INT", "CLI", "STI", "IRET"].includes(instruction),
        );

        // Verificar si el programa contiene INT 6, INT 7 o usa el teclado via IRQ1 (puerto 0x25)
        const connectScreenAndKeyboard = result.instructions.some(instruction => {
          if (instruction.instruction === "INT") {
            return instruction.operands.some((operand: any) => {
              if (operand.type === "number-expression" && typeof operand.value.value === "number") {
                return operand.value.value === 6 || operand.value.value === 7;
              }
              return false;
            });
          }
          // Detectar teclado via PIC IRQ1 (puerto 0x25)
          if (instruction.instruction === "OUT") {
            return instruction.operands.some((operand: any) => {
              if (operand.type === "number-expression") {
                if (typeof operand.value.value === "number") {
                  return operand.value.value === 0x25;
                }
                try {
                  if (operand.value && typeof operand.value.resolve === "function") {
                    const resolvedValue = operand.value.resolve();
                    if (typeof resolvedValue === "number") {
                      return resolvedValue === 0x25;
                    }
                  }
                } catch (error) {
                  console.warn("No se pudo resolver operando IRQ1:", error);
                }
              }
              return false;
            });
          }
          return false;
        });

        // Verificar si el programa usa INT 5 específicamente (para colorear la rutina de interrupción)
        const hasINT5 = result.instructions.some(instruction => {
          if (instruction.instruction === "INT") {
            return instruction.operands.some((operand: any) => {
              if (operand.type === "number-expression" && typeof operand.value.value === "number") {
                return operand.value.value === 5;
              }
              return false;
            });
          }
          return false;
        });

        // Verificar si el programa usa INT 6 específicamente (para colorear la rutina de interrupción)
        const hasINT6 = result.instructions.some(instruction => {
          if (instruction.instruction === "INT") {
            return instruction.operands.some((operand: any) => {
              if (operand.type === "number-expression" && typeof operand.value.value === "number") {
                return operand.value.value === 6;
              }
              return false;
            });
          }
          return false;
        });

        // Verificar si el programa usa INT 7 específicamente (para colorear la rutina de interrupción)
        const hasINT7 = result.instructions.some(instruction => {
          if (instruction.instruction === "INT") {
            return instruction.operands.some((operand: any) => {
              if (operand.type === "number-expression" && typeof operand.value.value === "number") {
                return operand.value.value === 7;
              }
              return false;
            });
          }
          return false;
        });

        // Verificar si el programa usa PIO (direcciones 30h-33h: PA, PB, CA, CB)
        const usesPIO = result.instructions.some(instruction => {
          if (instruction.instruction === "IN" || instruction.instruction === "OUT") {
            return instruction.operands.some((operand: any) => {
              if (operand.type === "number-expression" && typeof operand.value.value === "number") {
                // 0x30-0x33 = 48-51 decimal (PA, PB, CA, CB)
                return operand.value.value >= 0x30 && operand.value.value <= 0x33;
              }
              return false;
            });
          }
          return false;
        });

        // Verificar si el programa usa PIC (registros 0x20-0x2B)
        const usesPIC = result.instructions.some(instruction => {
          if (instruction.instruction === "IN" || instruction.instruction === "OUT") {
            return instruction.operands.some((operand: any) => {
              if (operand.type === "number-expression") {
                // Verificar valores directos
                if (typeof operand.value.value === "number") {
                  const isPIC = operand.value.value >= 0x20 && operand.value.value <= 0x2b;
                  if (isPIC) {
                    console.log(
                      `🎯 PIC detectado: ${instruction.instruction} con operando ${operand.value.value.toString(16)}h`,
                    );
                  }
                  return isPIC;
                }
                // Verificar expresiones que se resuelven a direcciones PIC
                try {
                  if (operand.value && typeof operand.value.resolve === "function") {
                    const resolvedValue = operand.value.resolve();
                    if (typeof resolvedValue === "number") {
                      const isPIC = resolvedValue >= 0x20 && resolvedValue <= 0x2b;
                      if (isPIC) {
                        console.log(
                          `🎯 PIC detectado: ${instruction.instruction} con operando resuelto ${resolvedValue.toString(16)}h`,
                        );
                      }
                      return isPIC;
                    }
                  }
                } catch (error) {
                  // Si no se puede resolver, continuar sin error
                  console.warn("No se pudo resolver operando PIC:", error);
                }
              }
              return false;
            });
          }
          return false;
        });

        console.log(`🔍 Análisis de instrucciones para PIC:`, {
          totalInstructions: result.instructions.length,
          inOutInstructions: result.instructions.filter(
            i => i.instruction === "IN" || i.instruction === "OUT",
          ).length,
          usesPIC,
          mayUsePICFromAssembler: result.mayUsePIC,
          firstFewInstructions: result.instructions.slice(0, 5).map(i => ({
            instruction: i.instruction,
            operands: i.operands?.map((op: any) => ({
              type: op.type,
              value: op.type === "number-expression" ? op.value.value : op.value,
            })),
          })),
        });

        // Verificar si el programa usa Handshake (registros 0x40-0x41)
        const usesHandshake = result.instructions.some(instruction => {
          if (instruction.instruction === "IN" || instruction.instruction === "OUT") {
            return instruction.operands.some((operand: any) => {
              if (operand.type === "number-expression") {
                // Verificar valores directos
                if (typeof operand.value.value === "number") {
                  return operand.value.value === 0x40 || operand.value.value === 0x41;
                }
                // Verificar expresiones que se resuelven a direcciones Handshake
                try {
                  if (operand.value && typeof operand.value.resolve === "function") {
                    const resolvedValue = operand.value.resolve();
                    if (typeof resolvedValue === "number") {
                      return resolvedValue === 0x40 || resolvedValue === 0x41;
                    }
                  }
                } catch (error) {
                  // Si no se puede resolver, continuar sin error
                  console.warn("No se pudo resolver operando Handshake:", error);
                }
              }
              return false;
            });
          }
          return false;
        });

        // Verificar si el programa usa Timer (registros 0x10-0x11)
        const usesTimer = result.instructions.some(instruction => {
          if (instruction.instruction === "IN" || instruction.instruction === "OUT") {
            return instruction.operands.some((operand: any) => {
              if (operand.type === "number-expression") {
                // Verificar valores directos
                if (typeof operand.value.value === "number") {
                  return operand.value.value === 0x10 || operand.value.value === 0x11;
                }
                // Verificar expresiones que se resuelven a direcciones Timer
                try {
                  if (operand.value && typeof operand.value.resolve === "function") {
                    const resolvedValue = operand.value.resolve();
                    if (typeof resolvedValue === "number") {
                      return resolvedValue === 0x10 || resolvedValue === 0x11;
                    }
                  }
                } catch (error) {
                  // Si no se puede resolver, continuar sin error
                  console.warn("No se pudo resolver operando Timer:", error);
                }
              }
              return false;
            });
          }
          return false;
        });

        // Configurar dispositivos basado en detección
        const currentSettings = getSettings();

        // Verificar si el programa fue modificado para forzar reset de registros
        const programModified = store.get(programModifiedAtom);
        console.log("🔍 Verificando si programa fue modificado:", programModified);

        // Combinar las detecciones: usesPIC (análisis de instrucciones) y result.mayUsePIC (análisis del ensamblador)
        const shouldActivatePIC = usesPIC || (result.mayUsePIC ?? false);

        // Notificar si se activa automáticamente el PIC
        if (shouldActivatePIC && !currentSettings.devices.pic) {
          notifyWarning(
            "PIC activado automáticamente",
            `Se detectó que el programa utiliza el PIC (direcciones 20h-2Bh). El módulo PIC se ha activado automáticamente, se ha reservado espacio para el vector de interrupciones y se ha configurado la visualización del flag I (interrupt flag).`,
          );
          console.log("🔧 PIC activado automáticamente debido a detección de uso en el código");
          console.log("🔧 Flag I configurado para mostrarse automáticamente");
        }

        // Notificar si se activa la visualización del flag I por instrucciones de interrupción
        // Solo mostrar la notificación la primera vez en la sesión actual
        if (
          hasInterruptFlagInstructions &&
          !shouldActivatePIC &&
          !currentSettings.devices.pic &&
          !interruptFlagNotificationShown
        ) {
          notifyWarning("Flag I activado", "Se detectó uso de instrucciones de interrupción", {
            inline: true,
            targetId: "flag-i-indicator",
          });
          console.log(
            "🔧 Flag I configurado para mostrarse debido a instrucciones de interrupción en el código",
          );
          // Marcar que ya se mostró la notificación para no repetirla
          interruptFlagNotificationShown = true;
        } else if (!hasInterruptFlagInstructions) {
          // Resetear la bandera si el nuevo programa no tiene instrucciones de interrupción
          // Esto permite que la notificación se muestre nuevamente si se carga otro programa con estas instrucciones
          interruptFlagNotificationShown = false;
        }

        // Notificar si se activa automáticamente el Timer (que requiere PIC)
        if (usesTimer && !currentSettings.devices.pic) {
          notifyWarning(
            "Timer y Reloj activados automáticamente",
            `Se detectó que el programa utiliza el Timer (direcciones 10h-11h). El módulo PIC se ha activado automáticamente ya que el Timer requiere el PIC para funcionar.`,
          );
          console.log(
            "🔧 PIC y Timer activados automáticamente debido a detección de uso del Timer en el código",
          );
        }

        // Determinar si necesitamos mostrar el flag I
        // Se debe mostrar si:
        // 1. Se activa el PIC automáticamente y no estaba activado antes
        // 2. El programa tiene instrucciones INT, CLI, STI o IRET
        const shouldShowInterruptFlag =
          ((shouldActivatePIC || usesTimer) && !currentSettings.devices.pic) ||
          hasInterruptFlagInstructions;

        store.set(settingsAtom, (prev: any) => ({
          ...prev,
          devices: {
            ...prev.devices,
            keyboardAndScreen: connectScreenAndKeyboard,
            pio: usesPIO ? "switches-and-leds" : usesHandshake ? "printer" : prev.devices.pio,
            handshake: usesHandshake ? "printer" : prev.devices.handshake,
            pic: shouldActivatePIC || usesTimer || prev.devices.pic,
            "switches-and-leds": usesPIO,
          },
          // Cambiar automáticamente la visibilidad de flags cuando se active el PIC o haya instrucciones de interrupción
          flagsVisibility: shouldShowInterruptFlag
            ? prev.flagsVisibility === "SF_OF_CF_ZF"
              ? "IF_SF_OF_CF_ZF"
              : prev.flagsVisibility === "CF_ZF"
                ? "IF_CF_ZF"
                : prev.flagsVisibility
            : prev.flagsVisibility,
        }));

        // Actualizar el átomo con el valor de connectScreenAndKeyboard
        store.set(connectScreenAndKeyboardAtom, connectScreenAndKeyboard);

        // Determinar si se necesita mostrar el vector de interrupciones
        // Se muestra SOLO si hay INT o si se usa PIC (no otros dispositivos como Handshake, Timer)
        const hasINTOrInterruptDevices = hasINT || shouldActivatePIC;
        store.set(hasINTInstructionAtom, hasINTOrInterruptDevices);
        store.set(hasINT5InstructionAtom, hasINT5);
        store.set(hasINT6InstructionAtom, hasINT6);
        store.set(hasINT7InstructionAtom, hasINT7);
        store.set(mayUsePICAtom, result.mayUsePIC ?? false);

        console.log("🔍 DEBUG Vector de Interrupciones:", {
          hasINT,
          usesPIC,
          shouldActivatePIC,
          usesHandshake,
          usesTimer,
          connectScreenAndKeyboard,
          hasINTOrInterruptDevices,
          hasInterruptFlagInstructions,
          shouldShowInterruptFlag,
          currentHandshakeConfig: getSettings().devices.handshake,
          currentPICConfig: getSettings().devices.pic,
        });

        console.log(
          "Detectado - PIC:",
          usesPIC,
          "shouldActivatePIC:",
          shouldActivatePIC,
          "Handshake:",
          usesHandshake,
          "Timer:",
          usesTimer,
          "INT:",
          hasINT,
          "PIC Config:",
          getSettings().devices.pic,
        );
        console.log("Habilitando vector de interrupciones:", hasINTOrInterruptDevices);
        console.log(
          "Timer se activará automáticamente:",
          usesTimer,
          "- PIC se activará para soportar Timer:",
          usesTimer || shouldActivatePIC,
        );

        // Reset the simulator - usar settings actualizados después de modificar settingsAtom
        const updatedSettings = getSettings(); // Obtener settings actualizados después de la modificación

        // Determinar qué configuración de datos usar: si el programa fue modificado, siempre usar "clean"
        const dataOnLoadConfig = programModified ? "clean" : currentSettings.dataOnLoad;
        console.log(
          "🔧 Configuración de carga de datos:",
          dataOnLoadConfig,
          "(programa modificado:",
          programModified,
          ")",
        );

        // Marcar el programa como no modificado después de procesarlo
        if (programModified) {
          store.set(programModifiedAtom, false);
        }

        simulator.loadProgram({
          program: result,
          data: dataOnLoadConfig,
          devices: {
            keyboardAndScreen: updatedSettings.devices.keyboardAndScreen ?? false,
            pic: updatedSettings.devices.pic ?? false,
            pio: updatedSettings.devices.pio ?? null,
            handshake: updatedSettings.devices.handshake ?? null,
          },
          hasORG: result.hasORG, // Pass the hasORG flag
          hasORG20hAtStart: result.hasORG20hAtStart, // Pass the hasORG20hAtStart flag
          hasINTOrInterruptDevices, // Pass interrupt vector information
          mayUsePIC: result.mayUsePIC, // Pass the mayUsePIC flag
        });
        console.log("result:", result);

        const programAddresses = result.instructions
          .filter(instruction => instruction.type === "instruction") // Filtrar solo instrucciones
          .flatMap(instruction => {
            // Construir el nombre completo de la instrucción con sus operandos
            const operands = instruction.operands
              .map(operand => {
                if (operand.type === "register") {
                  return operand.value; // Nombre del registro
                } else if (operand.type === "number-expression") {
                  const value = operand.value;
                  if (value.isNumberLiteral()) {
                    return value.value.toString(16) + "h"; // Valor inmediato en hexadecimal
                  } else if (value.isLabel()) {
                    return value.value; // Nombre de la etiqueta
                  }
                } else if (operand.type === "indirect-address") {
                  return "[BL]"; // Fallback for unsupported operand types
                } else if (operand.type === "direct-address") {
                  const address = operand.value;
                  if (address.isNumberLiteral()) {
                    return address.value.toString(16) + "h"; // Valor en hexadecimal
                  }
                }
                return ""; // Otros casos
              })
              .join(", "); // Separar los operandos con comas

            const fullInstruction = `${instruction.instruction} ${operands}`.trim(); // Construir la instrucción completa

            // Crear la entrada para la instrucción principal
            const entries = [
              {
                address: instruction.start.value, // Dirección de la instrucción
                name: fullInstruction, // Instrucción completa con operandos
                length: instruction.length.toString().trim(), // Tamaño de la instrucción en bytes como cadena sin espacios
              },
            ];

            // Si la instrucción tiene un segundo byte (como un valor inmediato o dirección), agregarlo
            if (
              instruction.operands.some(
                operand =>
                  operand.type === "number-expression" || operand.type === "direct-address",
              )
            ) {
              const secondByteAddress = instruction.start.value + 1; // Dirección del segundo byte
              const secondByteName = instruction.operands
                .filter((operand, index) => {
                  // Si la instrucción tiene 3 bytes, solo procesar el primer operando
                  if (instruction.length === 3) {
                    return index === 0 && operand.type === "number-expression";
                  }
                  // Si no, procesar todos los operandos de tipo "number-expression"
                  return operand.type === "number-expression";
                })
                .map(operand => {
                  if (operand.type === "number-expression") {
                    const value = operand.value;
                    if (value.isNumberLiteral()) {
                      return value.value.toString(16) + "h"; // Valor inmediato en hexadecimal
                    } else if (value.isLabel()) {
                      return value.value; // Nombre de la etiqueta
                    }
                  } else if (operand.type === "direct-address") {
                    const address = operand.value;
                    if (address.isNumberLiteral()) {
                      return address.value.toString(16) + "h"; // Valor en hexadecimal
                    }
                  }
                  return "";
                })
                .join(", "); // Construir el nombre del segundo byte

              entries.push({
                address: secondByteAddress,
                name: secondByteName, // Nombre del segundo byte
                length: "", // Tamaño del segundo byte (0 si no es aplicable)
              });
            }

            // Si la instrucción es mem<-imd y tiene tres bytes, agregar el tercer byte
            if (instruction.length === 3) {
              const thirdByteAddress = instruction.start.value + 2; // Dirección del tercer byte
              const thirdByteName = instruction.operands
                .filter(operand => operand.type === "number-expression")
                .map(operand => {
                  if (operand.type === "number-expression") {
                    const value = operand.value;
                    if (value.isNumberLiteral()) {
                      return value.value.toString(16) + "h"; // Valor inmediato en hexadecimal
                    }
                  }
                  return "";
                })
                .join(" "); // Construir el nombre del tercer byte

              entries.push({
                address: thirdByteAddress,
                name: thirdByteName, // Nombre del tercer byte
                length: "", // Tamaño del segundo byte (0 si no es aplicable)
              });
            }

            return entries; // Retornar ambas entradas (instrucción principal y segundo byte, si aplica)
          });

        const dataAddresses = result.data
          .filter(data => data.type === "data-directive") // Filtrar por el tipo correcto
          .flatMap(data => {
            // Obtener la dirección inicial y los valores definidos
            const startAddress = data.start.value;
            const values = data.getValues().map(value => {
              // Verificar si el valor es un objeto con el método toNumber
              if (
                typeof value === "object" &&
                value !== null &&
                "toNumber" in value &&
                typeof value.toNumber === "function"
              ) {
                return value.toNumber(); // Usar el método toNumber si está disponible
              }

              // Si el valor es un número, devolverlo directamente
              if (typeof value === "number") {
                return value;
              }
              return 0;
            });

            // Generar una entrada para cada byte de datos
            return values.map((value: number, index: number) => ({
              address: startAddress + index, // Calcular la dirección de cada byte
              label: index === 0 ? data.label || null : null, // Etiqueta solo para el primer byte
              value, // Valor del byte
            }));
          });

        console.log("Direcciones de las instrucciones:", programAddresses);
        console.log("Direcciones de los datos:", dataAddresses);

        store.set(programAddressesAtom, programAddresses);
        store.set(
          dataAddressesAtom,
          dataAddresses.map(data => ({ ...data, length: "" })),
        );
        //console.log("Direcciones del programa cargadas en memoria:", programAddresses);

        resetState(simulator.getComputerState());

        // Track event
        const event = [
          "Start CPU",
          {
            until,
            devices: getSettings().devices,
            language: getSettings().language,
            animations: getSettings().animations ? "yes" : "no",
          },
        ] as const;
        //umami.track(...event);

        posthog.capture(...event);

        store.set(simulationAtom, { type: "running", until, waitingForInput: false });

        // Inicializar solo el hilo principal del CPU
        startThread(simulator.startCPU());

        // Inicializar dispositivos auxiliares (sin bucles infinitos)
        console.log("🕐 [DEBUG] Iniciando reloj...");
        startClock();
        console.log("🖨️ [DEBUG] Iniciando impresora...");
        startPrinter();
      } else {
        store.set(simulationAtom, { type: "running", until, waitingForInput: false });

        resumeAllAnimations();
      }

      return;
    }

    case "cpu.stop": {
      const shouldReset = args[1];
      if (shouldReset) {
        finishSimulation();
        resetState(simulator.getComputerState(), shouldReset); // Pasar el parámetro clearRegisters

        // Limpiar todas las animaciones de bus activas
        const { anim } = await import("@/computer/shared/animate");
        await Promise.all([
          anim(
            { key: "cpu.internalBus.data.opacity", to: 0 },
            { duration: 0.1, easing: "easeInSine" },
          ),
          anim(
            { key: "cpu.internalBus.address.opacity", to: 0 },
            { duration: 0.1, easing: "easeInSine" },
          ),
        ]);

        // Disparar evento para ocultar el registro ri cuando se presiona reset
        const resetEvent = new CustomEvent("instructionChange", {
          detail: {
            instruction: "",
            modeid: false,
            moderi: false,
          },
        });
        window.dispatchEvent(resetEvent);

        // Resetear los átomos de visibilidad de registros temporales al presionar reiniciar
        store.set(showSPAtom, false);
        store.set(showriAtom, false);
      } else {
        pauseSimulation();
      }
      return;
    }

    case "f10.press": {
      if (!simulator.devices.f10.connected() || status.type !== "running") return invalidAction();

      // Prevent simultaneous presses
      if (eventIsRunning("f10:press")) return;

      startThread(simulator.devices.f10.press()!);
      return;
    }

    case "switch.toggle": {
      /*if (
        (status.type !== "running" && status.type !== "paused") ||
        !simulator.devices.switches.connected()
      ) {
        return invalidAction();
      }*/
      if (!simulator.devices.switches.connected()) {
        return invalidAction();
      }
      // Prevent simultaneous presses
      if (eventIsRunning("switches:toggle")) return;

      const index = args[1];

      if (status.type === "running") {
        // Solo ejecuta el toggle en el simulador, el evento actualizará el átomo
        startThread(simulator.devices.switches.toggle(index)!);
      } else {
        // Si NO está corriendo, actualiza el átomo directamente
        store.set(switchesAtom, switches => switches.withBit(index, !switches.bit(index)));
      }

      return;
    }

    case "keyboard.sendChar": {
      if (status.type !== "running" || !status.waitingForInput) return invalidAction();

      // Save read character
      const result = simulator.devices.keyboard.readChar(Byte.fromChar(args[1]));

      // Si readChar devuelve un generador (PIOKeyboard), ejecutarlo
      if (result && typeof result === "object" && Symbol.iterator in result) {
        startThread(result as EventGenerator);
      }

      store.set(simulationAtom, { ...status, waitingForInput: false });
      return;
    }

    case "screen.clean": {
      if (!simulator.devices.screen.connected()) return invalidAction();

      startThread(simulator.devices.screen.clear()!);
      return;
    }

    case "printer.clean": {
      if (!simulator.devices.printer.connected()) return invalidAction();

      startThread(simulator.devices.printer.clear()!);
      return;
    }

    default: {
      const _exhaustiveCheck: never = action;
      return _exhaustiveCheck;
    }
  }
}

async function startClock(): Promise<void> {
  console.log("🕐 [DEBUG] startClock llamado, verificando conexión...");
  if (!simulator.devices.clock.connected()) {
    console.log("🕐 [DEBUG] Reloj NO conectado, saliendo");
    return;
  }
  console.log("🕐 [DEBUG] Reloj conectado, iniciando bucle de ticks");

  // Ejecutar bucle de ticks del reloj
  while (store.get(simulationAtom).type !== "stopped") {
    const duration = getSettings().clockSpeed;
    console.log("🕐 [DEBUG] Esperando", duration, "ms antes del próximo tick");

    // Esperar la duración del reloj
    await new Promise(resolve => setTimeout(resolve, duration));

    // Verificar si aún está corriendo antes de hacer tick
    if (store.get(simulationAtom).type !== "stopped") {
      console.log("🕐 [DEBUG] Disparando tick del reloj");
      const clockGenerator = simulator.devices.clock.tick()!;
      console.log("🕐 [DEBUG] Generador del reloj creado:", clockGenerator);
      startThread(clockGenerator, true); // allowConcurrent = true para el reloj
    } else {
      console.log("🕐 [DEBUG] Simulación detenida, saliendo del bucle de reloj");
      break;
    }
  }
  console.log("🕐 [DEBUG] Bucle de reloj terminado");
}

async function startPrinter(): Promise<void> {
  if (!simulator.devices.printer.connected()) return;
  console.log("🖨️ [DEBUG] startPrinter: Impresora conectada, iniciando procesamiento de buffer");

  // Procesar buffer de impresora periódicamente sin bucle infinito
  const processPrinterBuffer = async () => {
    const isStopped = store.get(simulationAtom).type === "stopped";

    // Salir solo cuando la simulación está detenida Y el buffer está vacío
    if (isStopped && !simulator.devices.printer.hasPending()) return;

    let charPrinted = false;

    // Solo procesar si hay caracteres pendientes en el buffer
    if (simulator.devices.printer.hasPending()) {
      console.log("🖨️ [DEBUG] Procesando caracteres pendientes en buffer de impresora");

      const duration = getSettings().printerSpeed;

      if (!isStopped && getSettings().animations) {
        // Con animaciones activas: la barra de progreso es el tiempo de impresión
        await anim(
          [
            { key: "printer.printing.opacity", from: 1 },
            { key: "printer.printing.progress", from: 0, to: 1 },
          ],
          { duration, forceMs: true, easing: "easeInOutSine" },
        );
        await anim(
          { key: "printer.printing.opacity", to: 0 },
          { duration: 1, easing: "easeInSine" },
        );
      } else {
        // Sin animaciones o simulación detenida: esperar el tiempo de impresión igual
        await new Promise<void>(resolve => setTimeout(resolve, duration));
      }

      // Procesar un carácter del buffer
      const printGenerator = simulator.devices.printer.print();
      if (printGenerator) {
        let result = printGenerator.next();
        while (!result.done) {
          if (result.value && typeof result.value !== "undefined") {
            await handleEvent(result.value);
          }
          result = printGenerator.next();
        }
      }

      charPrinted = true;
    }

    if (store.get(simulationAtom).type !== "stopped" || simulator.devices.printer.hasPending()) {
      // Si se imprimió un carácter, la animación ya consumió el tiempo de impresión:
      // pasar al siguiente carácter inmediatamente.
      // Si el buffer estaba vacío, esperar printerSpeed ms antes de verificar de nuevo.
      setTimeout(processPrinterBuffer, charPrinted ? 0 : getSettings().printerSpeed);
    }
  };

  // Iniciar el procesamiento
  processPrinterBuffer();
}

export function useSimulation() {
  const status = useAtomValue(simulationAtom);

  const settings = useDevices();
  const devices = useMemo(
    () => ({
      hasIOBus: settings.pic || settings.pio !== null || settings.handshake !== null,

      clock: settings.pic,
      f10: false,
      keyboard: settings.keyboardAndScreen && settings.pio !== "switches-and-leds",
      handshake: settings.handshake,
      leds: settings.pio === "switches-and-leds",
      pic: settings.pic,
      pio: settings.pio,
      printer: settings.pio === "printer" || settings.handshake === "printer",
      screen: settings.keyboardAndScreen,
      switches: settings.pio === "switches-and-leds",
      timer: settings.pic,
    }),
    [settings],
  );

  return { status, dispatch, devices };
}
