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
  store.set(cycleCountAtom, cycleCount);
  store.set(instructionCountAtom, instructionCount);
  store.set(messageAtom, ""); // Limpiar el mensaje actual
  // Limpiar el historial de mensajes si clearRegisters es true
  if (clearRegisters) {
    store.set(messageHistoryAtom, []); // Limpia el historial de mensajes
  }
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
  const isDestRegister = /^[ABCD][LH]$/.test(dest) || /^[ABCD]X$/.test(dest);
  const isSrcMemory = src.startsWith('[') && src.endsWith(']');
  
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

  // Casos especiales para instrucciones aritméticas (ADD, SUB, CMP, AND, OR, XOR)
  if (["ADD", "SUB", "CMP", "AND", "OR", "XOR"].includes(name) && sourceRegister === "ri") {
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

  // Casos especiales para instrucciones MOV con direccionamiento directo e inmediato
  if (name === "MOV" && modeId && modeRi) {
    return handleDirectImmediateMOVUpdate();
  }

  // Casos especiales para instrucciones MOV con solo direccionamiento directo
  if (name === "MOV" && modeRi && !modeId) {
    return handleDirectMOVUpdate();
  }

  // Casos especiales para instrucciones CALL
  if (name === "CALL") {
    return handleCALLRegisterUpdate(sourceRegister);
  }

  // Caso especial para IP en instrucciones con direccionamiento directo durante la captación
  if (sourceRegister === "IP" && modeRi && !modeId && executeStage === 3) {
    return {
      message: "Ejecución: MBR ← read(Memoria[MAR]); IP ← IP + 1",
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
  return {
    message: "Ejecución: MBR ← read(Memoria[MAR]); IP ← IP + 1",
    shouldDisplay: true,
    shouldPause: true,
  };
}

// Función específica para actualizaciones de registros en MOV con solo direccionamiento directo
function handleDirectMOVUpdate(): MessageConfig {
  return {
    message: "Ejecución: MBR ← read(Memoria[MAR]); IP ← IP + 1",
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
        await handleEvent(event.value);
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
        if (event.value.type === "cpu:cycle.end" || event.value.type === "cpu:halt") {
          fetchStageCounter = 0;
          executeStageCounter = 0;
          shouldDisplayMessage = true;
          messageReadWrite = "";
          instructionCount++;
          console.log(`Instrucciones: ${instructionCount}`);
          store.set(instructionCountAtom, instructionCount);
          //store.set(messageAtom, "-");
          if (event.value.type === "cpu:halt") {
            cycleCount++;
            store.set(cycleCountAtom, cycleCount);
            store.set(messageAtom, "Ejecución: Detenido");
          } else if (status.until === "cycle-change" || status.until === "end-of-instruction") {
            pauseSimulation();
          }
          continue;
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
            store.set(messageAtom, "Captación: MBR ← read(Memoria[MAR]); IP ← IP + 1");
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
          } else if (event.value.type === "cpu:wr.on") {
            messageReadWrite = "Ejecución: write(Memoria[MAR]) ← MBR";
            
            // Detectar si es una instrucción MOV que escribe en memoria (solo para logging)
            if (currentInstructionName === "MOV" && !isMOVReadOperation(currentInstructionOperands)) {
              console.log("🔍 MOV Debug - Escritura en memoria detectada");
              console.log("🔍 MOV Debug - Operandos:", currentInstructionOperands);
              console.log("🔍 MOV Debug - Es lectura:", isMOVReadOperation(currentInstructionOperands));
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

            // Detectar si es MOV con direccionamiento indirecto para evitar contabilizar el ciclo adicional
            const isIndirectMOV =
              currentInstructionName === "MOV" &&
              sourceRegister === "ri" &&
              executeStageCounter === 3 &&
              !currentInstructionModeid &&
              !currentInstructionModeri; // No es directo ni inmediato, por lo tanto es indirecto

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
              if (sourceRegister === "IP" && currentInstructionName === "MOV" && executeStageCounter === 4) {
                console.log("🔍 Debug MOV IP - Verificando condiciones:");
                console.log("   sourceRegister === 'IP':", sourceRegister === "IP");
                console.log("   currentInstructionName === 'MOV':", currentInstructionName === "MOV");
                console.log("   currentInstructionModeri:", currentInstructionModeri);
                console.log("   !currentInstructionModeid:", !currentInstructionModeid);
                console.log("   executeStageCounter === 4:", executeStageCounter === 4);
                console.log("   currentInstructionOperands:", currentInstructionOperands);
                console.log("   currentInstructionOperands.length === 2:", currentInstructionOperands.length === 2);
                if (currentInstructionOperands.length >= 2) {
                  console.log("   Segundo operando:", currentInstructionOperands[1]);
                  console.log("   !startsWith('['):", !currentInstructionOperands[1].startsWith('['));
                  console.log("   !endsWith(']'):", !currentInstructionOperands[1].endsWith(']'));
                  console.log("   /^\\d+$/.test():", /^\d+$/.test(currentInstructionOperands[1]));
                  console.log("   /^\\d+h$/i.test():", /^\d+h$/i.test(currentInstructionOperands[1]));
                  console.log("   Es valor inmediato (decimal o hex):", 
                    /^\d+$/.test(currentInstructionOperands[1]) || /^\d+h$/i.test(currentInstructionOperands[1]));
                }
              }

              // Manejar casos especiales que requieren lógica adicional
              if (resultmbrimar) {
                store.set(messageAtom, displayMessageresultmbr);
              } else if (mbridirmar) {
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
                  // Caso especial para MOV [BL], n - mostrar el mensaje usando el registro almacenado
                  store.set(messageAtom, `Ejecución: MAR ← ${blBxRegisterName}`);
                  mbridirmar = false;
                  blBxToRiProcessed = false; // También resetear esta bandera
                  blBxRegisterName = ""; // Limpiar el nombre almacenado
                } else {
                  store.set(messageAtom, `Ejecución: id ← MBR; MAR ← IP`);
                }
              } else if (
                sourceRegister === "IP" &&
                currentInstructionName === "MOV" &&
                currentInstructionModeri &&
                !currentInstructionModeid &&
                executeStageCounter === 4 &&
                currentInstructionOperands.length === 2 &&
                !currentInstructionOperands[1].startsWith('[') &&
                !currentInstructionOperands[1].endsWith(']') &&
                (/^\d+$/.test(currentInstructionOperands[1]) || /^\d+h$/i.test(currentInstructionOperands[1]))
              ) {
                // Caso especial para MOV con direccionamiento directo + valor inmediato (MOV X, 5): 
                // mostrar el mensaje especial cuando IP va al MAR
                console.log("🎯 CONDICIÓN ESPECIAL DETECTADA - MOV con direccionamiento directo + valor inmediato");
                console.log("🔍 Operandos:", currentInstructionOperands);
                console.log("🔍 Segundo operando:", currentInstructionOperands[1]);
                console.log("🔍 Es número:", /^\d+$/.test(currentInstructionOperands[1]));
                store.set(messageAtom, "Ejecución: MAR ← IP ; ri ← MBR");
              } else if (
                sourceRegister === "ri" &&
                currentInstructionName === "MOV" &&
                executeStageCounter === 4
              ) {
                // Caso especial para MOV con direccionamiento directo: copiar directamente del MBR al MAR
                store.set(messageAtom, "Ejecución: MAR ← MBR");
              } else if (
                shouldDisplayMessage ||
                sourceRegister === "SP" ||
                (currentInstructionModeid && sourceRegister === "IP") ||
                messageConfig.shouldDisplay
              ) {
                // No mostrar mensaje para MOV con direccionamiento indirecto cuando se copia ri al MAR
                if (!isIndirectMOV) {
                  store.set(messageAtom, messageConfig.message);
                }
              }
            }

            // Para MOV con direccionamiento indirecto, no contabilizar el ciclo pero permitir la pausa
            // Para el caso de BL/BX a ri, SÍ contabilizar el ciclo aquí (no se contabilizó en register.copy)
            const skipCycleCount = isIndirectMOV && !blBxToRiProcessed;
               
            if (!skipCycleCount) {
              cycleCount++;
              currentInstructionCycleCount++;
              store.set(currentInstructionCycleCountAtom, currentInstructionCycleCount);
            }

            // Siempre permitir la pausa, independientemente de si se contabiliza el ciclo
            if (status.until === "cycle-change") {
              pauseSimulation();
            }

            executeStageCounter++;
            console.log("🔍 cpu:mar.set - executeStageCounter después del incremento:", executeStageCounter);
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
                displayMessage = "Ejecución: MBR ← read(Memoria[MAR]); IP ← IP + 1";
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
                `Ejecución: ${destinoALU} ${currentInstructionName} ${fuenteALU} ; write(FLAGS)`,
              );
              cycleCount++;
              currentInstructionCycleCount++;
              store.set(currentInstructionCycleCountAtom, currentInstructionCycleCount);
              if (status.until === "cycle-change") {
                pauseSimulation();
              }
            }
          } else if (event.value.type === "cpu:mbr.get") {
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
              // También manejar el caso cuando los flags no están establecidos correctamente
              // pero es una instrucción aritmética en executeStageCounter === 3
              (executeStageCounter === 3 &&
                (currentInstructionName === "ADD" ||
                  currentInstructionName === "SUB" ||
                  currentInstructionName === "CMP")) ||
              (executeStageCounter === 3 && currentInstructionName === "POP") ||
              (currentInstructionModeri &&
                currentInstructionModeid &&
                executeStageCounter === 4 &&
                currentInstructionName === "MOV")
            ) {
              mbridirmar = true;
            }

            if (currentInstructionName === "POP" && executeStageCounter === 3) {
              displayMessagepop = `Ejecución: ${sourceRegister} ← MBR`;
            }

            if (!mbridirmar) {
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
              MBRALU =
                `${sourceRegister} ${currentInstructionName} ${fuenteALU}` + "; write(FLAGS)";
            }
            if (currentInstructionName === "CMP" && String(destRegister) === "right") {
              fuenteALU = sourceRegister;
            }
            if (currentInstructionName === "CMP" && String(destRegister) === "left") {
              destinoALU = sourceRegister;
            }

            let displayMessage = `Ejecución: ${destRegister === "ri" ? "MAR" : destRegister} ← ${displaySource}`;
            const displayMessageFLAGS = "; write(FLAGS)"; // Agregar el mensaje de FLAGS aquí

            if (
              currentInstructionName === "ADD" ||
              currentInstructionName === "SUB" ||
              currentInstructionName === "CMP"
            ) {
              displayMessage += displayMessageFLAGS; // Agregar salto de línea
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

            // Para instrucciones MOV entre registros, siempre contabilizar el ciclo
            // Para BL/BX a ri, NO contabilizar el ciclo aquí (se contabilizará en cpu:mar.set)
            if (currentInstructionName === "MOV") {
              const isBLorBXToRi = (sourceRegister === "BL" || sourceRegister === "BX") && destRegister === "ri";
              
              if (!isBLorBXToRi) {
                store.set(messageAtom, displayMessage);
                cycleCount++;
                currentInstructionCycleCount++;
                store.set(currentInstructionCycleCountAtom, currentInstructionCycleCount);
                console.log(
                  "✅ Ciclo contabilizado para MOV register.copy - cycleCount:",
                  cycleCount,
                  "currentInstructionCycleCount:",
                  currentInstructionCycleCount,
                );
              } else {
                console.log(
                  "⏭️ Ciclo NO contabilizado para MOV register.copy (BL/BX→ri) - se contabilizará en cpu:mar.set"
                );
              }
            } else if (
              (destRegister !== "result" &&
                destRegister !== "left" &&
                destRegister !== "right" &&
                sourceRegister !== "result" &&
                sourceRegister !== "left" &&
                sourceRegister !== "right") ||
              (sourceRegister === "result" && destRegister !== "MBR")
            ) {
              store.set(messageAtom, displayMessage);
              cycleCount++;
              currentInstructionCycleCount++;
              store.set(currentInstructionCycleCountAtom, currentInstructionCycleCount);
              console.log(
                "✅ Ciclo contabilizado para register.copy - cycleCount:",
                cycleCount,
                "currentInstructionCycleCount:",
                currentInstructionCycleCount,
              );
            } else {
              console.log("❌ Ciclo NO contabilizado para register.copy - condición no cumplida");
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

            if (currentInstructionName === "RET") {
              messageReadWrite = "Ejecución: MBR ← read(Memoria[MAR])";
            }
            if (currentInstructionName === "IN") {
              messageReadWrite = "Ejecución: MBR ← read(PIO[MAR])";
            }
            // Para MOV, determinar si es lectura o escritura basado en los operandos
            if (currentInstructionName === "MOV" && executeStageCounter === 5) {
              console.log("🔍 MOV Debug - Operandos:", currentInstructionOperands);
              console.log("🔍 MOV Debug - Es lectura:", isMOVReadOperation(currentInstructionOperands));
              
              // Usar la función auxiliar para determinar si es lectura o escritura
              if (isMOVReadOperation(currentInstructionOperands)) {
                // Es lectura de memoria (reg<-mem)
                messageReadWrite = "Ejecución: MBR ← read(Memoria[MAR])";
              } else {
                // Es escritura a memoria (mem<-reg o mem<-imd)
                messageReadWrite = "Ejecución: write(Memoria[MAR]) ← MBR";
              }
            }
            let ContinuarSinGuardar = false;
            // Identificar si este bus:reset es el último paso antes del cycle.end
            let isLastStepBeforeCycleEnd = false;
            
            // Para MOV, ADD, SUB con escritura en memoria:
            // - Direccionamiento directo: bus:reset en executeStageCounter === 6 es el último paso
            // - Direccionamiento indirecto: bus:reset en executeStageCounter === 5 es el último paso
            if ((currentInstructionName === "MOV" || 
                 currentInstructionName === "ADD" || 
                 currentInstructionName === "SUB") && 
                messageReadWrite === "Ejecución: write(Memoria[MAR]) ← MBR") {
              
              // Direccionamiento directo (modeRi = true): último paso en executeStageCounter === 6
              if (currentInstructionModeri && executeStageCounter === 6) {
                isLastStepBeforeCycleEnd = true;
              }
              // Direccionamiento indirecto (modeRi = false, modeId = false): último paso en executeStageCounter === 5
              else if (!currentInstructionModeri && !currentInstructionModeid && executeStageCounter === 5) {
                isLastStepBeforeCycleEnd = true;
              }
            }
            
            if (
              (currentInstructionModeri &&
                (executeStageCounter === 4 || executeStageCounter === 8) &&
                currentInstructionName === "INT") ||
              // Para MOV con direccionamiento directo durante la captación del operando en executeStageCounter === 3,
              // no mostrar el mensaje de bus:reset porque cpu:register.update manejará el mensaje correcto
              (executeStageCounter === 3 && currentInstructionName === "MOV" && currentInstructionModeri) ||
              // Para MOV con direccionamiento directo en executeStageCounter === 3 (captación de dirección),
              // no contabilizar el ciclo porque cpu:register.update ya lo maneja
              (executeStageCounter === 3 && currentInstructionName === "MOV" && !currentInstructionModeri && !currentInstructionModeid &&
               currentInstructionOperands.length >= 2 &&
               // Excluir cuando se está captando la dirección (cualquier operando con dirección directa)
               (// Direccionamiento directo simple: MOV X, AL o MOV AL, X (sin corchetes, con direcciones/registros)
                (!currentInstructionOperands[0].startsWith('[') && !currentInstructionOperands[0].endsWith(']') &&
                 !currentInstructionOperands[1].startsWith('[') && !currentInstructionOperands[1].endsWith(']') &&
                 (/^\d+$/.test(currentInstructionOperands[1]) || /^\d+[hH]$/i.test(currentInstructionOperands[1]) ||
                  /^[0-9A-Fa-f]+[hH]?$/.test(currentInstructionOperands[1]) ||
                  /^\d+$/.test(currentInstructionOperands[0]) || /^\d+[hH]$/i.test(currentInstructionOperands[0]) ||
                  /^[0-9A-Fa-f]+[hH]?$/.test(currentInstructionOperands[0]))) ||
                // Direccionamiento directo con corchetes: MOV [09], CL o MOV AL, [0F] (captación de dirección)
                ((currentInstructionOperands[0].startsWith('[') && currentInstructionOperands[0].endsWith(']') &&
                  /^\[[0-9A-Fa-f]+[hH]?\]$/.test(currentInstructionOperands[0])) ||
                 (currentInstructionOperands[1].startsWith('[') && currentInstructionOperands[1].endsWith(']') &&
                  /^\[[0-9A-Fa-f]+[hH]?\]$/.test(currentInstructionOperands[1]))))) ||
              // Para MOV con direccionamiento indirecto + inmediato (MOV [BL], 4) en executeStageCounter === 3,
              // no contabilizar el ciclo porque cpu:register.update ya maneja la captación del valor inmediato
              (executeStageCounter === 3 && currentInstructionName === "MOV" && !currentInstructionModeri && !currentInstructionModeid &&
               currentInstructionOperands.length >= 2 &&
               // Detectar MOV [registro], valor_inmediato
               ((currentInstructionOperands[0].startsWith('[') && currentInstructionOperands[0].endsWith(']') &&
                 /^\[[A-Za-z]+[LH]?\]$/i.test(currentInstructionOperands[0]) && // [BL], [BH], [CL], etc.
                 (/^\d+$/.test(currentInstructionOperands[1]) || /^\d+[hH]$/i.test(currentInstructionOperands[1]))) || // valor inmediato
                // También detectar MOV valor_inmediato, [registro]
                (currentInstructionOperands[1].startsWith('[') && currentInstructionOperands[1].endsWith(']') &&
                 /^\[[A-Za-z]+[LH]?\]$/i.test(currentInstructionOperands[1]) && // [BL], [BH], [CL], etc.
                 (/^\d+$/.test(currentInstructionOperands[0]) || /^\d+[hH]$/i.test(currentInstructionOperands[0]))))) ||
              // Para MOV con direccionamiento directo en executeStageCounter === 5,
              // no mostrar el mensaje de bus:reset porque cpu:register.update manejará el mensaje correcto
              // (se está leyendo el tercer byte - valor inmediato)
              (executeStageCounter === 5 && currentInstructionName === "MOV" && currentInstructionModeri) ||
              (currentInstructionModeid &&
                executeStageCounter === 4 &&
                (currentInstructionName === "CALL" ||
                  currentInstructionName === "ADD" ||
                  currentInstructionName === "SUB" ||
                  currentInstructionName === "CMP")) ||
              // Para instrucciones aritméticas con direccionamiento directo en executeStageCounter === 3,
              // no mostrar el mensaje de bus:reset porque cpu:register.update manejará el mensaje correcto
              (executeStageCounter === 3 &&
                (currentInstructionName === "ADD" ||
                  currentInstructionName === "SUB" ||
                  currentInstructionName === "CMP" ||
                  currentInstructionName === "AND" ||
                  currentInstructionName === "OR" ||
                  currentInstructionName === "XOR"))
            ) {
              ContinuarSinGuardar = true;
              console.log("🔄 ContinuarSinGuardar establecido a true - condición cumplida");
            } else {
              console.log("🔄 ContinuarSinGuardar mantenido como false - ninguna condición cumplida");
              
              // Debug específico para MOV en step 3
              if (executeStageCounter === 3 && currentInstructionName === "MOV" && !currentInstructionModeri && !currentInstructionModeid) {
                console.log("🔍 Debug MOV step 3:");
                console.log("   Operandos length >= 2:", currentInstructionOperands.length >= 2);
                console.log("   Operando[0] no tiene []:", !currentInstructionOperands[0].startsWith('[') && !currentInstructionOperands[0].endsWith(']'));
                console.log("   Operando[1] no tiene []:", !currentInstructionOperands[1].startsWith('[') && !currentInstructionOperands[1].endsWith(']'));
                console.log("   Test operando[0] es dirección:", /^\d+$/.test(currentInstructionOperands[0]) || /^\d+[hH]$/i.test(currentInstructionOperands[0]) || /^[0-9A-Fa-f]+[hH]?$/.test(currentInstructionOperands[0]));
                console.log("   Test operando[1] es inmediato:", /^\d+$/.test(currentInstructionOperands[1]) || /^\d+[hH]$/i.test(currentInstructionOperands[1]) || /^[0-9A-Fa-f]+[hH]?$/.test(currentInstructionOperands[1]));
              }
            }
            console.log("ContinuarSinGuarda:", ContinuarSinGuardar);
            console.log("executeStageCounter:", executeStageCounter);
            console.log("isLastStepBeforeCycleEnd:", isLastStepBeforeCycleEnd);
            console.log("🔍 bus:reset Debug - messageReadWrite:", messageReadWrite);
            console.log("🔍 bus:reset Debug - currentInstructionModeri:", currentInstructionModeri);
            console.log("🔍 bus:reset Debug - currentInstructionModeid:", currentInstructionModeid);
            console.log("🔍 bus:reset Debug - currentInstructionOperands:", currentInstructionOperands);
            console.log("🔍 bus:reset Debug - Operando[0]:", currentInstructionOperands[0]);
            console.log("🔍 bus:reset Debug - Operando[1]:", currentInstructionOperands[1]);
            console.log("🔍 bus:reset Debug - Condición MOV directo step 3:", 
              executeStageCounter === 3 && currentInstructionName === "MOV" && !currentInstructionModeri && !currentInstructionModeid);
            console.log("🔍 bus:reset Debug - Es lectura de memoria:", messageReadWrite === "Ejecución: MBR ← read(Memoria[MAR])");
            console.log("🔍 bus:reset Debug - MOV indirecto debe mostrar:", 
              currentInstructionName === "MOV" && !currentInstructionModeri && !currentInstructionModeid && 
              executeStageCounter === 5 && messageReadWrite === "Ejecución: MBR ← read(Memoria[MAR])");
            
            if (!ContinuarSinGuardar) {
              store.set(messageAtom, messageReadWrite);
              cycleCount++;
              currentInstructionCycleCount++;
              store.set(currentInstructionCycleCountAtom, currentInstructionCycleCount);
              
              // No pausar si es una instrucción MOV que escribe en memoria (último paso)
              // La pausa debe ocurrir en cpu:cycle.end
              const isMOVWriteToMemory = currentInstructionName === "MOV" && 
                                        messageReadWrite === "Ejecución: write(Memoria[MAR]) ← MBR";
              
              if (status.until === "cycle-change" && !isMOVWriteToMemory) {
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
            } else {
              store.set(messageAtom, `Ejecución: MBR ← ${sourceRegister}`);
              if (status.until === "cycle-change") {
                pauseSimulation();
              }
              executeStageCounter++;
              cycleCount++;
              currentInstructionCycleCount++;
              store.set(currentInstructionCycleCountAtom, currentInstructionCycleCount);
            }
          }
        }
      } else {
        store.set(messageAtom, ""); // Set messageAtom to blank if not executing by cycle
      }
      console.log(`Ciclos ejecutados: ${cycleCount}`);
      store.set(cycleCountAtom, cycleCount);

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
        if (status.until === "end-of-instruction") {
          pauseSimulation();
        }
        // Para cycle-change, no pausar automáticamente para permitir que la instrucción se complete
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
