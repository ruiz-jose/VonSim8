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
        store.set(showriAtom, currentInstructionModeri);
        // Reiniciar el contador de ciclos para la nueva instrucción
        currentInstructionCycleCount = 0;
        store.set(currentInstructionCycleCountAtom, currentInstructionCycleCount);
        console.log(
          "🔄 Nueva instrucción iniciada:",
          currentInstructionName,
          "- Contador reiniciado a 0",
        );
        mbridirmar = false;
        resultmbrimar = false;
        displayMessageresultmbr = "";
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
              executeStageCounter++;
            }
            if (status.until === "cycle-change") {
              pauseSimulation();
            }
            fetchStageCounter++;
            cycleCount++;
            currentInstructionCycleCount++;
            store.set(currentInstructionCycleCountAtom, currentInstructionCycleCount);
          } else if (event.value.type === "cpu:register.update") {
            store.set(messageAtom, "Captación: MBR ← read(Memoria[MAR]); IP ← IP + 1");
            if (status.until === "cycle-change") {
              pauseSimulation();
            }
            executeStageCounter++;
            fetchStageCounter++;
            cycleCount++;
            currentInstructionCycleCount++;
            store.set(currentInstructionCycleCountAtom, currentInstructionCycleCount);
          } else if (event.value.type === "cpu:mbr.get") {
            store.set(messageAtom, "Captación: IR ← MBR");
            if (status.until === "cycle-change") {
              pauseSimulation();
            }
            fetchStageCounter++;
            cycleCount++;
            currentInstructionCycleCount++;
            store.set(currentInstructionCycleCountAtom, currentInstructionCycleCount);
          }
        } else {
          if (event.value.type === "cpu:rd.on" && executeStageCounter > 1) {
            messageReadWrite = "Ejecución: MBR ← read(Memoria[MAR])";
          } else if (event.value.type === "cpu:wr.on") {
            messageReadWrite = "Ejecución: write(Memoria[MAR]) ← MBR";
          } else if (event.value.type === "pio:write.ok") {
            store.set(messageAtom, "Ejecución: write(PIO[MAR]) ← MBR");
            executeStageCounter++;
            cycleCount++;
            currentInstructionCycleCount++;
            store.set(currentInstructionCycleCountAtom, currentInstructionCycleCount);
          }

          if (event.value.type === "cpu:mar.set") {
            const sourceRegister = event.value.register;
            const displayRegister = sourceRegister === "ri" ? "MBR" : sourceRegister;
            let showRI = false;
            let showRI2 = false;

            if (
              currentInstructionModeri &&
              executeStageCounter === 5 &&
              (currentInstructionName === "ADD" || currentInstructionName === "SUB")
            ) {
              showRI = true;
            }
            if (currentInstructionModeri && executeStageCounter === 9 && "INT") {
              showRI = true;
            }

            if (
              currentInstructionModeri &&
              executeStageCounter === 2 &&
              (currentInstructionName === "ADD" || currentInstructionName === "SUB")
            ) {
              showRI2 = true;
            }
            console.log("executeStageCounter:", executeStageCounter);
            console.log("mbridirmar:", mbridirmar);
            console.log("resultmbrimar:", resultmbrimar);
            console.log("displayMessageresultmbr:", displayMessageresultmbr);
            console.log("shouldDisplayMessage:", shouldDisplayMessage);

            if (shouldDisplayMessage || sourceRegister === "SP") {
              if (resultmbrimar) {
                store.set(messageAtom, displayMessageresultmbr);
              } else if (showRI) {
                store.set(messageAtom, `Ejecución: MAR ← ${sourceRegister}`);
              } else if (showRI2) {
                store.set(messageAtom, `Ejecución: ri ← MBR; MAR ← MBR`);
              } else if (
                executeStageCounter === 2 &&
                currentInstructionModeri &&
                currentInstructionName === "MOV"
              ) {
                store.set(messageAtom, `Ejecución: ri ← MBR; MAR ← IP`);
              } else if (
                executeStageCounter === 4 &&
                currentInstructionModeri &&
                currentInstructionName === "MOV"
              ) {
                store.set(messageAtom, `Ejecución: MAR ← ${sourceRegister}`);
              } else if (mbridirmar) {
                store.set(messageAtom, `Ejecución: id ← MBR; MAR ← IP`);
              } else if (
                executeStageCounter === 2 &&
                currentInstructionModeri &&
                currentInstructionName === "INT"
              ) {
                store.set(messageAtom, `Ejecución: ri ← MBR; MAR ← SP`);
              } else {
                store.set(messageAtom, `Ejecución: MAR ← ${displayRegister}`);
              }
            }

            if (status.until === "cycle-change") {
              pauseSimulation();
            }

            executeStageCounter++;
            //if (!(currentInstructionName === "INT" && sourceRegister === "ri")) {
            cycleCount++;
            currentInstructionCycleCount++;
            store.set(currentInstructionCycleCountAtom, currentInstructionCycleCount);
          } else if (event.value.type === "cpu:register.update") {
            const sourceRegister = event.value.register;
            let displayMessage = "";
            shouldDisplayMessage = true;
            let pause = true;

            if (sourceRegister === "SP") {
              if (
                currentInstructionModeri &&
                executeStageCounter === 4 &&
                currentInstructionName === "INT"
              ) {
                pause = false;
                shouldDisplayMessage = false;
              }

              /*  if (currentInstructionName === "CALL" || currentInstructionName === "INT" && jump_yes) {
                displayMessage = "Ejecución: SP = SP - 1";                             
              } */
              if (currentInstructionName === "PUSH") {
                displayMessage = "Ejecución: SP = SP - 1";
              }
              if (currentInstructionName === "RET" || currentInstructionName === "IRET") {
                displayMessage = "Ejecución: SP = SP + 1";
              }
              if (executeStageCounter === 3 && currentInstructionName === "POP") {
                displayMessage = displayMessagepop + "; SP = SP + 1";
              }
            } else if (sourceRegister === "FLAGS") {
              displayMessage = "Ejecución: IF = 0";
              if (
                currentInstructionModeri &&
                executeStageCounter === 5 &&
                currentInstructionName === "INT"
              ) {
                displayMessage = "Ejecución: write(Memoria[MAR]) ← MBR; SP ← SP - 1; IF = 0";
              }
            } else if (sourceRegister === "DL" && currentInstructionName === "INT") {
              displayMessage = "Interrupción: AL ← ASCII";
            } else if (sourceRegister === "right.l" && currentInstructionName === "INT") {
              displayMessage = "Interrupción: SUB AL, 1";
            } else if (sourceRegister === "right" && currentInstructionName === "INT") {
              displayMessage = "Interrupción: ADD BL, 1";
            } else if (sourceRegister === "ri.l" && currentInstructionName === "INT") {
              displayMessage = "Interrupción: MAR ← (video)";
              shouldDisplayMessage = false;
            } else if (
              currentInstructionModeri &&
              executeStageCounter === 3 &&
              currentInstructionName === "MOV"
            ) {
              displayMessage = "Ejecución: MBR ← read(Memoria[MAR]); IP ← IP + 1; MAR ← ri";
              pause = false;
              shouldDisplayMessage = false;
            } else if (executeStageCounter === 4 && currentInstructionName === "CALL") {
              pause = false;
            } else {
              displayMessage =
                sourceRegister === "IP"
                  ? "Ejecución: MBR ← read(Memoria[MAR]); IP ← IP + 1"
                  : `Ejecución: MBR ← ${sourceRegister}`;
            }

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
            console.log("displayMessage:", displayMessage);
            console.log("currentInstructionName:", currentInstructionName);
            console.log("currentInstructionModeri:", currentInstructionModeri);
            console.log("executeStageCounter:", executeStageCounter);
            console.log("pause:", pause);
            executeStageCounter++;
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
              (executeStageCounter === 3 && currentInstructionName === "POP")
            ) {
              mbridirmar = true;
            }

            if (currentInstructionName === "POP" && executeStageCounter === 3) {
              displayMessagepop = `Ejecución: ${sourceRegister} ← MBR`;
            }

            if (!mbridirmar) {
              if (
                String(sourceRegister) !== "ri.l" &&
                String(sourceRegister) !== "right.l" &&
                String(sourceRegister) !== "left.l"
              ) {
                store.set(messageAtom, `Ejecución: ${sourceRegister} ← MBR`);
                cycleCount++;
                currentInstructionCycleCount++;
                store.set(currentInstructionCycleCountAtom, currentInstructionCycleCount);
                if (status.until === "cycle-change") {
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

            let displayMessage = `Ejecución: ${destRegister} ← ${displaySource}`;
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
                displayMessage = "Ejecución: IP ← ri";
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
              displayMessage = "Ejecución: MAR ← BL";
              store.set(messageAtom, displayMessage);
              shouldDisplayMessage = false;
              executeStageCounter++;
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
            );

            // Para instrucciones MOV entre registros, siempre contabilizar el ciclo
            if (currentInstructionName === "MOV") {
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
            let ContinuarSinGuardar = false;
            if (
              (currentInstructionModeri &&
                (executeStageCounter === 4 || executeStageCounter === 8) &&
                currentInstructionName === "INT") ||
              (executeStageCounter === 3 && currentInstructionName === "MOV") ||
              (currentInstructionModeid &&
                executeStageCounter === 4 &&
                (currentInstructionName === "CALL" ||
                  currentInstructionName === "ADD" ||
                  currentInstructionName === "SUB" ||
                  currentInstructionName === "CMP"))
            ) {
              ContinuarSinGuardar = true;
            }
            console.log("executeStageCounter:", executeStageCounter);
            if (!ContinuarSinGuardar) {
              store.set(messageAtom, messageReadWrite);
              cycleCount++;
              currentInstructionCycleCount++;
              store.set(currentInstructionCycleCountAtom, currentInstructionCycleCount);
              if (status.until === "cycle-change") {
                pauseSimulation();
              }
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
              displayMessageresultmbr = `Ejecución: MBR ← ${sourceRegister} ; MAR ← ri`;
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
        if (status.until === "cycle-change" || status.until === "end-of-instruction") {
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
