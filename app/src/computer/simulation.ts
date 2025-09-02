/**
 * @fileoverview
 * This file exposes methods/state that the UI uses to interact with the simulator.
 */
import { assemble } from "@vonsim/assembler";
import { Byte } from "@vonsim/common/byte";
import { ComputerState, EventGenerator, Simulator, SimulatorError } from "@vonsim/simulator";
import { atom, useAtomValue } from "jotai";
import { useMemo } from "react";

import { hasINTInstructionAtom } from "@/computer/cpu/state";
import { dataAddressesAtom, programAddressesAtom } from "@/computer/memory/state";
import { highlightCurrentInstruction, highlightLine, setReadOnly } from "@/editor/methods";
import { programModifiedAtom } from "@/editor/state"; // Importar programModifiedAtom
import { translate } from "@/lib/i18n";
import { store } from "@/lib/jotai";
import { posthog } from "@/lib/posthog";
import { getSettings, settingsAtom, useDevices } from "@/lib/settings";
import { toast } from "@/lib/toast";

import { generateDataPath } from "./cpu/DataBus";
import {   connectScreenAndKeyboardAtom,
  currentInstructionCycleCountAtom,
  cycleAtom,
  cycleCountAtom,
  instructionCountAtom,
  messageAtom,
  messageHistoryAtom,
  resetCPUState,
  showriAtom,
  showSPAtom,
totalCycleCountAtom ,
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

type RunUntil = "cycle-change" | "end-of-instruction" | "infinity";
type SimulationStatus =
  | { type: "running"; until: RunUntil; waitingForInput: boolean }
  | { type: "paused" }
  | { type: "stopped"; error?: SimulatorError<any> };

export const simulationAtom = atom<SimulationStatus>({ type: "stopped" });

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

export function notifyWarning(title: string, message: string) {
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
  }
  // Resetear el total de ciclos acumulados al reiniciar el programa
  store.set(totalCycleCountAtom, 0);
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
  if (executeStage === 2 && _modeRi) {
    return {
      message: "Ejecución: ri ← MBR; MAR ← SP",
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
    return handleSPRegisterUpdate(name, executeStage, modeRi);
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
function handleSPRegisterUpdate(
  instructionName: string,
  executeStage: number,
  modeRi: boolean,
): MessageConfig {
  if (modeRi && executeStage === 4 && instructionName === "INT") {
    return {
      message: "",
      shouldDisplay: false,
      shouldPause: false,
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
    case "IRET":
      return {
        message: "Ejecución: SP = SP + 1",
        shouldDisplay: true,
        shouldPause: true,
      };
    case "POP":
      if (executeStage === 3) {
        return {
          message: `${displayMessagepop}; SP = SP + 1`,
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
  if (modeRi && executeStage === 5 && instructionName === "INT") {
    return {
      message: "Ejecución: write(Memoria[MAR]) ← MBR; SP ← SP - 1; IF = 0",
      shouldDisplay: true,
      shouldPause: true,
    };
  }

  return {
    message: "Ejecución: IF = 0",
    shouldDisplay: true,
    shouldPause: true,
  };
}

// Función específica para actualizaciones de registros en instrucciones INT
function handleINTRegisterUpdate(sourceRegister: string): MessageConfig {
  switch (sourceRegister) {
    case "DL":
      return {
        message: "Interrupción: AL ← ASCII",
        shouldDisplay: true,
        shouldPause: true,
      };
    case "right.l":
      return {
        message: "Interrupción: SUB AL, 1",
        shouldDisplay: true,
        shouldPause: true,
      };
    case "right":
      return {
        message: "Interrupción: ADD BL, 1",
        shouldDisplay: true,
        shouldPause: true,
      };
    case "ri.l":
      return {
        message: "Interrupción: MAR ← (video)",
        shouldDisplay: false,
        shouldPause: true,
      };
  }

  return {
    message: `Ejecución: MBR ← ${sourceRegister}`,
    shouldDisplay: true,
    shouldPause: true,
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
function handleCALLRegisterUpdate(_sourceRegister: string): MessageConfig {
  return {
    message: `Ejecución: MBR ← ${_sourceRegister}`,
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

/**
 * Starts an execution thread for the given generator. This is, run all the
 * events until the generator is done or the simulation is stopped.
 */
async function startThread(generator: EventGenerator): Promise<void> {
  try {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const status = store.get(simulationAtom);
      const programModified = store.get(programModifiedAtom); // Obtener el estado de programModifiedAtom

      // Verificar si el programa ha sido modificado
      if (programModified) {
        console.log("El programa ha sido modificado. Deteniendo y recargando...");
        store.set(programModifiedAtom, false); // Marcar como no modificado
        // Reinicializar contadores al modificar el programa
        fetchStageCounter = 0;
        executeStageCounter = 0;
        finishSimulation(); // Detener la simulación actual
        break; // Salir del bucle
      }
      if (status.type === "stopped") {
        fetchStageCounter = 0;
        executeStageCounter = 0;
        messageReadWrite = "";
        //store.set(messageAtom, "Ejecución: Detenido");
        break; // stop the thread
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
      const event = generator.next();
      if (event.done) break;
      if (event.value && typeof event.value !== "undefined") {
        // Actualizar el contexto de la instrucción en events.ts
        const { updateInstructionContext, getCurrentExecuteStageCounter } = await import(
          "@/computer/cpu/events"
        );
        updateInstructionContext(executeStageCounter, currentInstructionName || "");

        await handleEvent(event.value);

        // Después del evento, sincronizar el contador con el valor actualizado en events.ts
        executeStageCounter = getCurrentExecuteStageCounter();
      } else {
        continue;
      }
      if (event.value.type === "cpu:cycle.start") {
        currentInstructionName = event.value.instruction.name;
        currentInstructionModeid = event.value.instruction.willUse.id ? true : false;
        currentInstructionModeri = event.value.instruction.willUse.ri ? true : false;
        currentInstructionOperands = event.value.instruction.operands;
        store.set(showriAtom, currentInstructionModeri);
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
          instructionCount++;
          store.set(instructionCountAtom, instructionCount);

          // Para HLT, incrementar a executeStageCounter = 4 antes de mostrar el mensaje
          // ya que los pasos 1-3 fueron para captación y el paso 4 es la ejecución de HLT
          //executeStageCounter = 4;
          console.log("🔄 fetchStageCounter", fetchStageCounter);
          cycleCount++;

          store.set(cycleCountAtom, cycleCount);

          // Actualizar el total de ciclos acumulados
          const prevTotal = store.get(totalCycleCountAtom);
          store.set(totalCycleCountAtom, prevTotal + cycleCount);
          store.set(messageAtom, "Ejecución: Detenido");

          currentInstructionCycleCount++;
          store.set(currentInstructionCycleCountAtom, currentInstructionCycleCount);
          console.log(
            "🛑 HLT ejecutado - executeStageCounter establecido a 4, cycleCount:",
            cycleCount,
          );
        } else if (event.value.type === "cpu:int.6") {
          //store.set(messageAtom, "PILA ← DL; DL ← ASCII; (BL) ← DL; IRET");
          store.set(messageAtom, "Interrupción: Rutina leer caracter del teclado");
          //  if (status.until === "cycle-change") {
          //  pauseSimulation();
          // }
        } else if (event.value.type === "cpu:int.7") {
          //store.set(messageAtom, "PILA ← DL; Bucle: DL ← (BL); video ← DL; SUB AL, 1; JNZ Bucle; (BL) ← DL; IRET");
          store.set(messageAtom, "Interrupción: Rutina mostrar por pantalla");
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
              store.set(messageAtom, "Ejecución: MAR ← SP");
            } else {
              store.set(messageAtom, "Captación: MAR ← IP");
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
            console.log(
              "🔍 Debug: Captación register.update - fetchStageCounter:",
              fetchStageCounter,
              "executeStageCounter:",
              executeStageCounter,
            );
            store.set(messageAtom, "Captación: MBR ← read(Memoria[MAR]) | IP ← IP + 1");
            cycleCount++;
            currentInstructionCycleCount++;
            store.set(currentInstructionCycleCountAtom, currentInstructionCycleCount);
            if (status.until === "cycle-change") {
              pauseSimulation();
            }
            executeStageCounter++;
            fetchStageCounter++;
          } else if (event.value.type === "cpu:mbr.get") {
            store.set(messageAtom, "Captación: IR ← MBR");
            cycleCount++;
            currentInstructionCycleCount++;
            store.set(currentInstructionCycleCountAtom, currentInstructionCycleCount);
            if (status.until === "cycle-change") {
              pauseSimulation();
            }
            fetchStageCounter++;
          }
        } else {
          if (event.value.type === "cpu:rd.on" && executeStageCounter > 1) {
            messageReadWrite = "Ejecución: MBR ← read(Memoria[MAR])";
            lastMemoryOperationWasWrite = false; // Es una operación de lectura
          } else if (event.value.type === "cpu:wr.on") {
            messageReadWrite = "Ejecución: write(Memoria[MAR]) ← MBR";
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
            store.set(messageAtom, "Ejecución: write(PIO[MAR]) ← MBR");
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
            if (status.until === "cycle-change") {
              pauseSimulation();
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
              (currentInstructionName === "ADD" ||
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
                  currentInstructionModeid));

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
              // Priorizar el mensaje especial para MOV x, 5 (directo-inmediato) en ciclo 5
              if (
                sourceRegister === "IP" &&
                currentInstructionModeri &&
                cycleCount === 5 &&
                currentInstructionOperands.length === 2
              ) {
                // Mostrar el mensaje especial de simultaneidad solo en el ciclo 6 para MOV x, 5 (directo-inmediato)
                store.set(messageAtom, "Ejecución: MAR ← IP | ri ← MBR");
                simultaneousCycleCounted = false;
              } else if (resultmbrimar) {
                store.set(messageAtom, displayMessageresultmbr);
              } else if (mbridirmar && !isRiToMARSkipCycle) {
                // Para MOV con direccionamiento directo e inmediato, mostrar el mensaje correcto
                if (
                  currentInstructionName === "MOV" &&
                  currentInstructionModeri &&
                  currentInstructionModeid
                ) {
                  store.set(messageAtom, "Ejecución: MAR ← IP; MBR→MBR");
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
                  store.set(messageAtom, `Ejecución: MAR ← ${blBxRegisterName}`);
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
                  store.set(messageAtom, `Ejecución: MAR ← ${blBxRegisterName}`);
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
                      store.set(messageAtom, "Ejecución: MAR ← MBR");
                    }
                    return; // Evita que se muestre cualquier animación de id
                  }
                  if (idToMbrCombinedMessage) {
                    store.set(messageAtom, "Ejecución: MAR ← ri | id ← MBR");
                    idToMbrCombinedMessage = false; // Reset the flag after use
                  } else {
                    // Animación combinada especial: BL → MAR (direcciones) + MBR → id (datos)
                    cycleCount++;
                    currentInstructionCycleCount++;
                    store.set(messageAtom, `Ejecución: MAR ← BL | id ← MBR`);
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
                store.set(messageAtom, "Ejecución: MAR ← MBR");
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

                store.set(messageAtom, "Ejecución: MAR ← BL | id ← MBR");
                console.log("🎯 Paso 6 de ADD [BL], 6 - Mensaje simultáneo: MAR ← BL | id ← MBR");
              } else if (isRiToMARSkipCycle && sourceRegister === "ri") {
                // Caso especial: ri → MAR se debe omitir completamente (no mostrar mensaje ni contabilizar)
                console.log(
                  "⏭️ ri → MAR omitido completamente - no mostrar mensaje ni contabilizar ciclo",
                );
              } else if (
                shouldDisplayMessage ||
                sourceRegister === "SP" ||
                (currentInstructionModeid && sourceRegister === "IP") ||
                messageConfig.shouldDisplay
              ) {
                // No mostrar mensaje para MOV/ADD/SUB con direccionamiento indirecto cuando se copia ri al MAR
                // Tampoco mostrar mensaje cuando ri → MAR en instrucciones aritméticas en etapas avanzadas
                if (!isIndirectInstruction && !isRiToMARSkipCycle) {
                  store.set(messageAtom, messageConfig.message);
                } else if (isRiToMARSkipCycle) {
                  console.log(
                    "⏭️ Mensaje NO mostrado para ri → MAR en etapa avanzada (dirección ya en MAR)",
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

            const skipCycleCount =
              isIndirectInstruction ||
              isRiToMARSkipCycle ||
              simultaneousCycleCounted ||
              isArithmeticRegToDirectStep5;

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
                "(dirección ya almacenada en MAR)",
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
              // Solo omitir la pausa para ri → MAR que se omiten completamente
              // Para instrucciones indirectas con BL/BX → MAR, SÍ pausar porque es un evento visible
              else if (!isRiToMARSkipCycle && !(isIndirectInstruction && !blBxToRiProcessed)) {
                pauseSimulation();
              }
            }

            // Solo incrementar executeStageCounter si no es un caso de ri → MAR que se omite
            if (!isRiToMARSkipCycle) {
              executeStageCounter++;
              console.log(
                "🔍 cpu:mar.set - executeStageCounter después del incremento:",
                executeStageCounter,
              );
            } else {
              console.log("⏭️ executeStageCounter NO incrementado para ri → MAR en etapa avanzada");
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
              const pause = messageConfig.shouldPause;

              // Manejar casos especiales adicionales que requieren lógica específica
              if (
                currentInstructionModeri &&
                executeStageCounter === 8 &&
                currentInstructionName === "INT"
              ) {
                displayMessage = "Ejecución: write(Memoria[MAR]) ← MBR; SP ← SP - 1";
              }
              if (executeStageCounter === 2 && currentInstructionName === "CALL") {
                displayMessage = "Ejecución: ri ← MBR; SP ← SP - 1";
              }
              if (executeStageCounter === 4 && currentInstructionName === "CALL") {
                displayMessage = "Ejecución: write(Memoria[MAR]) ← MBR; SP ← SP - 1";
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
              if (
                currentInstructionName !== "DEC" &&
                currentInstructionName !== "INC" &&
                currentInstructionName !== "NOT" &&
                currentInstructionName !== "NEG" &&
                !(currentInstructionName === "INT" && executeStageCounter === 5)
              ) {
                store.set(messageAtom, displayMessage);
                cycleCount++;
                currentInstructionCycleCount++;
                store.set(currentInstructionCycleCountAtom, currentInstructionCycleCount);
              }

              executeStageCounter++;
              if (displayMessage !== "Interrupción: MAR ← (video)") {
                if (status.until === "cycle-change") {
                  if (
                    currentInstructionName !== "DEC" &&
                    currentInstructionName !== "INC" &&
                    currentInstructionName !== "NOT" &&
                    currentInstructionName !== "NEG"
                  ) {
                    if (pause) {
                      pauseSimulation();
                    }
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
                  currentInstructionName === "XOR"))
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

            if (isALUIndirectImmediateMBRtoID) {
              console.log(
                "🎯 Caso especial detectado: MBR → ID sin contabilizar ciclo ni mostrar mensaje",
              );
              console.log("   Instrucción:", currentInstructionName);
              console.log("   executeStageCounter:", executeStageCounter);
              console.log("   originalRegister:", originalRegister);
            }

            if (!mbridirmar && !isALUIndirectImmediateMBRtoID) {
              if (
                String(sourceRegister) !== "MBR" &&
                String(sourceRegister) !== "right.l" &&
                String(sourceRegister) !== "left.l"
              ) {
                store.set(messageAtom, `Ejecución: ${sourceRegister} ← MBR`);
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
              store.set(messageAtom, displayMessage);
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
                displayMessage = "Ejecución: IP ← MBR";
              }
              store.set(messageAtom, displayMessage);
              if (status.until === "cycle-change") {
                pauseSimulation();
              }
            } else if (destRegister === "left" && currentInstructionName === "INT") {
              displayMessage = "ADD BL, 1";
            } else if (sourceRegister === "result" && currentInstructionName === "INT") {
              if (status.until === "cycle-change") {
                pauseSimulation();
              }
            } else if (sourceRegister === "IP" && destRegister === "id") {
              displayMessage = "Ejecución: id ← IP";
              store.set(messageAtom, displayMessage);
              if (status.until === "cycle-change") {
                pauseSimulation();
              }
            } else if (sourceRegister === "id" && destRegister === "ri") {
              displayMessage = "Ejecución: MAR ← id";
              shouldDisplayMessage = false; // No mostrar el mensaje en el próximo ciclo
              store.set(messageAtom, displayMessage);
            } else if (sourceRegister === "MBR" && destRegister === "ri") {
              displayMessage = "Ejecución: MAR ← MBR";
              store.set(messageAtom, displayMessage);
              // pauseSimulation();
            } else if (sourceRegister === "id" && destRegister === "IP") {
              displayMessage = "Ejecución: IP ← MBR";
              store.set(messageAtom, displayMessage);
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
              // NO guardar el mensaje aquí: store.set(messageAtom, displayMessage);
              shouldDisplayMessage = false;
              // Marcar que ya se procesó esta transferencia para mostrar el mensaje correcto en cpu:mar.set
              mbridirmar = true;
              blBxToRiProcessed = true; // Marcar que se procesó BL/BX→ri
              // NO incrementar executeStageCounter aquí - se maneja en cpu:mar.set
            } else {
              if (String(sourceRegister) === "right.l") {
                fuenteALU = sourceRegister;
              }

              //store.set(messageAtom, displayMessage);
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
                store.set(messageAtom, displayMessage);
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
              ((destRegister !== "result" && sourceRegister !== "result") ||
                // También contabilizar cuando se transfiere resultado a un registro (no a MBR)
                (sourceRegister === "result" && destRegister !== "MBR")) &&
              // Excluir específicamente BL/BX → ri
              !((sourceRegister === "BL" || sourceRegister === "BX") && destRegister === "ri") &&
              // Excluir específicamente transferencias a left/right de ALU
              !(destRegister === "left" || destRegister === "right")
            ) {
              // Para transferencias a left/right de ALU, NO mostrar mensaje ni contabilizar ciclo
              if (destRegister === "left" || destRegister === "right") {
                // No hacer nada - estas transferencias no se muestran ni contabilizan
              } else {
                store.set(messageAtom, displayMessage);
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
              currentInstructionName === "RET")
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
            if (currentInstructionName === "IN") {
              messageReadWrite = "Ejecución: MBR ← read(PIO[MAR])";
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
                currentInstructionName === "INT") ||
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
                (currentInstructionName === "CALL" ||
                  currentInstructionName === "ADD" ||
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
                messageReadWrite === "Ejecución: MBR ← read(Memoria[MAR])") // Solo para lectura de memoria
            ) {
              ContinuarSinGuardar = true;
              console.log("🔄 ContinuarSinGuardar establecido a true - condición cumplida");
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

            if (!ContinuarSinGuardar) {
              store.set(messageAtom, messageReadWrite);
              cycleCount++;
              currentInstructionCycleCount++;
              store.set(currentInstructionCycleCountAtom, currentInstructionCycleCount);

              // Pausar si se está ejecutando por ciclos
              if (status.until === "cycle-change") {
                pauseSimulation();
              }
            } else if (isLastStepBeforeCycleEnd) {
              // Para el último paso antes de cycle.end: mostrar mensaje y contabilizar ciclo, pero NO pausar
              store.set(messageAtom, messageReadWrite);
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

            if (
              currentInstructionModeri &&
              executeStageCounter === 5 &&
              (currentInstructionName === "ADD" || currentInstructionName === "SUB")
            ) {
              resultmbrimar = true;
              displayMessageresultmbr = `Ejecución: MBR ← ${sourceRegister} ; MAR ← MBR`;
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
              store.set(messageAtom, `Ejecución: id ← MBR`);
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
              store.set(messageAtom, `Ejecución: MBR ← ${formattedMessage}`);
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
              store.set(messageAtom, `Ejecución: MBR ← ${sourceRegister}`);
              cycleCount++;
              currentInstructionCycleCount++;
              store.set(currentInstructionCycleCountAtom, currentInstructionCycleCount);
              executeStageCounter++;
              // Pausar aquí si se ejecuta por ciclos
              if (status.until === "cycle-change") {
                pauseSimulation();
              }
            } else if (event.value.register === "result.l") {
              // Caso especial para cuando se copia el resultado de la ALU al MBR
              const displayMessage = `Ejecución: MBR ← ${sourceRegister.replace("; write(FLAGS)", " ; update(FLAGS)")}`;
              store.set(messageAtom, displayMessage);
              cycleCount++;
              currentInstructionCycleCount++;
              store.set(currentInstructionCycleCountAtom, currentInstructionCycleCount);

              // Pausar si estamos ejecutando por ciclos
              if (status.until === "cycle-change") {
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
        store.set(hasINTInstructionAtom, hasINT);

        // Verificar si el programa contiene INT 6 o INT 7
        const connectScreenAndKeyboard = result.instructions.some(instruction => {
          if (instruction.instruction === "INT") {
            return instruction.operands.some((operand: any) => {
              if (operand.type === "number-expression" && typeof operand.value.value === "number") {
                return operand.value.value === 6 || operand.value.value === 7;
              }
              return false;
            });
          }
          return false;
        });

        // Verificar si el programa usa switches (ejemplo: IN AL, 30h o OUT 32h, AL)
        const usesSwitches = result.instructions.some(instruction => {
          if (instruction.instruction === "IN" || instruction.instruction === "OUT") {
            return instruction.operands.some((operand: any) => {
              if (operand.type === "number-expression" && typeof operand.value.value === "number") {
                // 0x30 = 48 decimal (PA), 0x32 = 50 decimal (CA)
                return operand.value.value === 0x30 || operand.value.value === 0x32;
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
                  return operand.value.value >= 0x20 && operand.value.value <= 0x2b;
                }
                // Verificar expresiones que se resuelven a direcciones PIC
                try {
                  if (operand.value && typeof operand.value.resolve === "function") {
                    const resolvedValue = operand.value.resolve();
                    if (typeof resolvedValue === "number") {
                      return resolvedValue >= 0x20 && resolvedValue <= 0x2b;
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
        store.set(settingsAtom, (prev: any) => ({
          ...prev,
          devices: {
            ...prev.devices,
            keyboardAndScreen: connectScreenAndKeyboard,
            pio: usesSwitches ? "switches-and-leds" : usesHandshake ? "printer" : prev.devices.pio,
            handshake: usesHandshake ? "printer" : prev.devices.handshake,
            pic: usesPIC || prev.devices.pic,
            "switches-and-leds": usesSwitches,
          },
        }));

        // Actualizar el átomo con el valor de connectScreenAndKeyboard
        store.set(connectScreenAndKeyboardAtom, connectScreenAndKeyboard);

        // Determinar si se necesita mostrar el vector de interrupciones
        // Se muestra si hay INT, o si se usan dispositivos que pueden generar interrupciones
        const hasINTOrInterruptDevices =
          hasINT || usesPIC || usesHandshake || usesTimer || connectScreenAndKeyboard;
        store.set(hasINTInstructionAtom, hasINTOrInterruptDevices);

        console.log(
          "Detectado - PIC:",
          usesPIC,
          "Handshake:",
          usesHandshake,
          "Timer:",
          usesTimer,
          "INT:",
          hasINT,
        );
        console.log("Habilitando vector de interrupciones:", hasINTOrInterruptDevices);

        // Reset the simulator
        simulator.loadProgram({
          program: result,
          data: currentSettings.dataOnLoad,
          devices: {
            keyboardAndScreen: getSettings().devices.keyboardAndScreen ?? false,
            pic: getSettings().devices.pic ?? false,
            pio: getSettings().devices.pio ?? null,
            handshake: getSettings().devices.handshake ?? null,
          },
          hasORG: result.hasORG, // Pass the hasORG flag
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

        startThread(simulator.startCPU());
        startClock();
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
      simulator.devices.keyboard.readChar(Byte.fromChar(args[1]));

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
  if (!simulator.devices.clock.connected()) return;

  while (store.get(simulationAtom).type !== "stopped") {
    const duration = getSettings().clockSpeed;
    await anim(
      { key: "clock.angle", from: 0, to: 360 },
      { duration, forceMs: true, easing: "linear" },
    );
    startThread(simulator.devices.clock.tick()!);
  }
}

async function startPrinter(): Promise<void> {
  if (!simulator.devices.printer.connected()) return;

  while (store.get(simulationAtom).type !== "stopped") {
    const duration = getSettings().printerSpeed;
    await anim(
      [
        { key: "printer.printing.opacity", from: 1 },
        { key: "printer.printing.progress", from: 0, to: 1 },
      ],
      { duration, forceMs: true, easing: "easeInOutSine" },
    );
    await anim({ key: "printer.printing.opacity", to: 0 }, { duration: 1, easing: "easeInSine" });
    await startThread(simulator.devices.printer.print()!);
  }

  // Sigue imprimiendo mientras la simulación esté corriendo o el buffer no esté vacío
  if (store.get(simulationAtom).type === "stopped" && simulator.devices.printer.hasPending()) {
    while (store.get(simulationAtom).type !== "stopped" || simulator.devices.printer.hasPending()) {
      const duration = getSettings().printerSpeed;
      await anim(
        [
          { key: "printer.printing.opacity", from: 1 },
          { key: "printer.printing.progress", from: 0, to: 1 },
        ],
        { duration, forceMs: true, easing: "easeInOutSine" },
      );
      await anim({ key: "printer.printing.opacity", to: 0 }, { duration: 1, easing: "easeInSine" });
      // Procesar el generador manualmente si la simulación está detenida
      const gen = simulator.devices.printer.print()!;
      let result = gen.next();
      while (!result.done) {
        if (result.value && typeof result.value !== "undefined") {
          await handleEvent(result.value);
        }
        result = gen.next();
      }
    }
  }
}

export function useSimulation() {
  const status = useAtomValue(simulationAtom);

  const settings = useDevices();
  const devices = useMemo(
    () => ({
      hasIOBus: settings.pic || settings.pio !== null || settings.handshake !== null,

      clock: settings.pic,
      f10: settings.pic,
      keyboard: settings.keyboardAndScreen,
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
