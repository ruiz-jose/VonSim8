/**
 * @fileoverview
 * This file exposes methods/state that the UI uses to interact with the simulator.
 */
import { assemble } from "@vonsim/assembler";
import { Byte } from "@vonsim/common/byte";
import { ComputerState, EventGenerator, Simulator, SimulatorError } from "@vonsim/simulator";
import { atom, useAtomValue } from "jotai";
import { useMemo } from "react";

import { highlightLine, setReadOnly } from "@/editor/methods";
import { programModifiedAtom } from "@/editor/state"; // Importar programModifiedAtom
import { translate } from "@/lib/i18n";
import { store } from "@/lib/jotai";
import { posthog } from "@/lib/posthog";
import { getSettings, settingsAtom, useDevices  } from "@/lib/settings";
import { toast } from "@/lib/toast";

import { connectScreenAndKeyboardAtom, cycleAtom, cycleCountAtom, instructionCountAtom, messageAtom, messageHistoryAtom, resetCPUState, showSPAtom } from "./cpu/state";
import { eventIsRunning, handleEvent } from "./handle-event";
import { resetHandshakeState } from "./handshake/state";
import { resetLedsState } from "./leds/state";
import { resetMemoryState } from "./memory/state";
import { resetPICState } from "./pic/state";
import { resetPIOState } from "./pio/state";
import { resetPrinterState } from "./printer/state";
import { resetScreenState } from "./screen/state";
import { anim, pauseAllAnimations, resumeAllAnimations, stopAllAnimations } from "./shared/animate";
import { resetSwitchesState } from "./switches/state";
import { resetTimerState } from "./timer/state";


// Define el átomo para hasINTInstruction
export const hasINTInstructionAtom = atom(false);

const simulator = new Simulator();

type RunUntil = "cycle-change" | "end-of-instruction" | "infinity";
type SimulationStatus =
  | { type: "running"; until: RunUntil; waitingForInput: boolean }
  | { type: "paused" }
  | { type: "stopped"; error?: SimulatorError<any> };

export const simulationAtom = atom<SimulationStatus>({ type: "stopped" });

function notifyError(error: SimulatorError<any>) {
  const message = error.translate(getSettings().language);
  toast({ title: message, variant: "error" });
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
  toast({ title: translate(getSettings().language, "messages.assemble-error"), variant: "error" });
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
//let currentInstructionMode = false;
let cycleCount = 0;
let instructionCount = 0;
let fuenteALU = "";


/**
 * Starts an execution thread for the given generator. This is, run all the
 * events until the generator is done or the simulation is stopped.
 */
async function startThread(generator: EventGenerator): Promise<void> { 
  try {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const status = store.get(simulationAtom);
      const settings = getSettings();
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
      await handleEvent(event.value);
      if (event.value.type === "cpu:cycle.start") {
        currentInstructionName = event.value.instruction.name;
        //currentInstructionMode = event.value.instruction.willUse.id? true : false;
      }

      if (status.until === "cycle-change" || status.until === "end-of-instruction" || status.until === "infinity") {
        if (event.value.type === "cpu:cycle.end" || event.value.type === "cpu:halt") {
          fetchStageCounter = 0;
          executeStageCounter = 0;
          messageReadWrite = "";  
          instructionCount++;
          console.log(`Instrucciones: ${instructionCount}`);
          store.set(instructionCountAtom, instructionCount );    
          //store.set(messageAtom, "-"); 
          if ( event.value.type === "cpu:halt") {
            cycleCount++;
            store.set(cycleCountAtom, cycleCount );
            store.set(messageAtom, "Ejecución: Detenido");
          }else if (status.until === "cycle-change" || status.until === "end-of-instruction") {
            pauseSimulation();
          }
          continue;
        }  else if (event.value.type === "cpu:int.6") {            
          //store.set(messageAtom, "PILA ← DL; DL ← ASCII; (BL) ← DL; IRET");
          store.set(messageAtom, "Rutina leer caracter del teclado");
          if (status.until === "cycle-change") {
            pauseSimulation();
          }
        }  else if (event.value.type === "cpu:int.7") {            
          //store.set(messageAtom, "PILA ← DL; Bucle: DL ← (BL); video ← DL; SUB AL, 1; JNZ Bucle; (BL) ← DL; IRET");
          store.set(messageAtom, "Rutina mostrar por pantalla");
          if (status.until === "cycle-change") {
            pauseSimulation();
          }       
        }     
        if (fetchStageCounter < 3 ) {
          if (event.value.type === "cpu:mar.set") {
            
            const sourceRegister = event.value.register;
            if (sourceRegister === "SP") {
              fetchStageCounter = 3;
              executeStageCounter = 3;
              store.set(messageAtom, "Ejecución: MAR ← SP");
            } else {
              store.set(messageAtom, "Captación: MAR ← IP");
            }
            if (status.until === "cycle-change") {
              pauseSimulation();
            }
            fetchStageCounter++;           
            cycleCount++; 
            
          } else if (event.value.type === "cpu:register.update") {
            store.set(messageAtom, "Captación: MBR ← read(Memoria[MAR]); IP ← IP + 1");
            if (status.until === "cycle-change") {
              pauseSimulation();
            }
            fetchStageCounter++;
            cycleCount++;
          } else if (event.value.type === "cpu:mbr.get") {
            store.set(messageAtom, "Captación: IR ← MBR");
            if (status.until === "cycle-change") {
              pauseSimulation();
            }          
            fetchStageCounter++;
            cycleCount++;
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
           } 

          if (event.value.type === "cpu:mar.set") {
            const sourceRegister = event.value.register;
            const displayRegister = sourceRegister === "ri" ? "MBR" : sourceRegister;
            
            if (shouldDisplayMessage) {
              store.set(messageAtom, `Ejecución: MAR ← ${displayRegister}`);
            }
            if (status.until === "cycle-change") {
              pauseSimulation();
            }
            executeStageCounter++;
            if (!(currentInstructionName === "INT" && sourceRegister === "ri")) {
              cycleCount++; 
            }

          } else if (event.value.type === "cpu:register.update") {
            const sourceRegister = event.value.register;
            let displayMessage = "";
            shouldDisplayMessage = true;

            if (sourceRegister === "SP") {
              /*  if (currentInstructionName === "CALL" || currentInstructionName === "INT" && jump_yes) {
                displayMessage = "Ejecución: SP = SP - 1";                             
              } */
              if (currentInstructionName === "RET"  || currentInstructionName === "IRET"  || currentInstructionName === "POP") {
                displayMessage = "Ejecución: SP = SP + 1";                 
              }
            } else if (sourceRegister === "FLAGS") {
              displayMessage = "Ejecución: IF = 0"; 
            } else if (sourceRegister === "DL" && currentInstructionName === "INT") {
              displayMessage = "Interrupción: AL ← ASCII";    
            } else if (sourceRegister === "right.l" && currentInstructionName === "INT") {
              displayMessage = "Interrupción: SUB AL, 1";     
            } else if (sourceRegister === "right" && currentInstructionName === "INT") {
              displayMessage = "Interrupción: ADD BL, 1";  
            } else if (sourceRegister === "ri.l" && currentInstructionName === "INT") {
              displayMessage = "Interrupción: MAR ← (video)"; 
              shouldDisplayMessage = false;     
            } else {
              displayMessage = sourceRegister === "IP" ? "Ejecución: MBR ← read(Memoria[MAR]); IP ← IP + 1" : `Ejecución: MBR ← ${sourceRegister}`;
            }

            if (displayMessage !== "Interrupción: MAR ← (video)"){
              if (status.until === "cycle-change") {
                if (currentInstructionName !== "CALL" 
                   && currentInstructionName !== "PUSH" 
                   && currentInstructionName !== "DEC" 
                   && currentInstructionName !== "INC"
                   && currentInstructionName !== "NOT"
                   && currentInstructionName !== "NEG") {
                  pauseSimulation();                          
                } 
              }           
            }
            executeStageCounter++;
            if ( currentInstructionName !== "CALL" 
              && currentInstructionName !== "PUSH"
              && currentInstructionName !== "DEC"
              && currentInstructionName !== "INC"
              && currentInstructionName !== "NOT"
              && currentInstructionName !== "NEG"
              && !(currentInstructionName === "INT" && sourceRegister === "SP")) {
              store.set(messageAtom, displayMessage);
              cycleCount++; 
            }

          } else if (event.value.type === "cpu:mbr.get") {
            const sourceRegister = event.value.register === "id.l" ? "id" : 
            event.value.register === "IP.l" ? "IP" : 
            event.value.register === "FLAGS.l" ? "FLAGS" : 
            event.value.register;
            if (String(sourceRegister) !== 'ri.l') {
              store.set(messageAtom, `Ejecución: ${sourceRegister} ← MBR`);
              cycleCount++;
              if (String(sourceRegister) === 'id' || (String(sourceRegister) === "DL" && currentInstructionName === "INT")) {
                if (status.until === "cycle-change") {
                  pauseSimulation();
                }               
              } 
            }           
          } else if (event.value.type === "cpu:register.copy") {
            const sourceRegister = event.value.src.replace(/\.l$/, '');
            const destRegister = event.value.dest.replace(/\.l$/, '');
            let displaySource = "";

            if ( currentInstructionName === "DEC"  
              || currentInstructionName === "INC"
              || currentInstructionName === "NOT"
              || currentInstructionName === "NEG"){
              displaySource = sourceRegister === "result" ? `${currentInstructionName} ${fuenteALU}` : sourceRegister;
        
            }else{
              displaySource = sourceRegister === "result" ? `${destRegister} ${currentInstructionName} ${fuenteALU}` : sourceRegister;
        
            }

            let displayMessage = `Ejecución: ${destRegister} ← ${displaySource}`;

            const displayMessageFLAGS = "; write(FLAGS)"; // Agregar el mensaje de FLAGS aquí
            displayMessage += displayMessageFLAGS; // Agregar salto de línea
            if (sourceRegister === "ri" && destRegister === "IP") {
              displayMessage = "Ejecución: IP ← MBR";
              store.set(messageAtom, displayMessage);
              if (status.until === "cycle-change") {
                pauseSimulation();
              }
            } else if (destRegister === "left" && currentInstructionName === "INT") {
              displayMessage = "ADD BL, 1"; 
            } else if (sourceRegister === "result"   && currentInstructionName === "INT") {
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
            }else if (sourceRegister === "id" && destRegister === "IP") {
              displayMessage = "Ejecución: IP ← MBR";
              store.set(messageAtom, displayMessage);
              if (status.until === "cycle-change") {
                pauseSimulation();
              }
            } else if ((sourceRegister === "BL" && destRegister === "ri") ||(sourceRegister === "BX" && destRegister === "ri")) {
              displayMessage = "Ejecución: MAR ← BL";
              store.set(messageAtom, displayMessage);
              shouldDisplayMessage = false;
              executeStageCounter++;             
            } else {
              fuenteALU = sourceRegister;
              //store.set(messageAtom, displayMessage);
             // pauseSimulation();
            }   
            if (
              (destRegister !== "result" && destRegister !== "left" && destRegister !== "right" &&
               sourceRegister !== "result" && sourceRegister !== "left" && sourceRegister !== "right") ||
              (sourceRegister === "result" && destRegister !== "MBR")
            ) {

              store.set(messageAtom, displayMessage);
              cycleCount++;
            }
          } else if (
            event.value.type === "bus:reset" &&
            executeStageCounter > 1 &&
            ( currentInstructionName === "MOV" ||
               currentInstructionName === "ADD" ||
               currentInstructionName === "SUB" ||
               currentInstructionName === "CMP" ||
               currentInstructionName === "CALL"||
               currentInstructionName === "INT"||
               currentInstructionName === "PUSH"||
               currentInstructionName === "IN" ||
               currentInstructionName === "RET" )
          ) {
            /*(currentInstructionMode &&
              (currentInstructionName === "MOV" ||
               currentInstructionName === "ADD" ||
               currentInstructionName === "SUB" ||
               currentInstructionName === "CMP" ||
               currentInstructionName === "CALL"))*/

            const displayMessageFLAGS = "; SP = SP - 1";  
            //if ((currentInstructionName === "CALL"|| currentInstructionName === "INT" || currentInstructionName === "PUSH") && jump_yes) {
            if ((currentInstructionName === "CALL"|| currentInstructionName === "INT" || currentInstructionName === "PUSH")) {
              messageReadWrite += displayMessageFLAGS;
            }
            if (currentInstructionName === "RET") {
              messageReadWrite = "Ejecución: MBR ← read(Memoria[MAR])";
            }
            if (currentInstructionName === "IN") {
              messageReadWrite = "Ejecución: MBR ← read(PIO[MAR])";
            }
            store.set(messageAtom, messageReadWrite);

            cycleCount++; 
            if (currentInstructionName === "RET" 
              || currentInstructionName === "IN" 
              || (currentInstructionName === "INT" &&  messageReadWrite ==="Ejecución: MBR ← read(Memoria[MAR]); SP = SP - 1")) {
                if (status.until === "cycle-change") {
                  pauseSimulation();
                }
            }
          } else if (event.value.type === "cpu:mbr.set") {
            const sourceRegister = event.value.register === "id.l" ? "id" : 
            event.value.register === "FLAGS.l" ? "FLAGS" : 
            event.value.register === "IP.l" ? "IP" : 
            event.value.register;
            store.set(messageAtom,  `Ejecución: MBR ← ${sourceRegister}`);
            if (status.until === "cycle-change") {
              pauseSimulation();
            }
            executeStageCounter++;
            cycleCount++;
          }  
        }
      } else {
        store.set(messageAtom, ""); // Set messageAtom to blank if not executing by cycle
      }
      console.log(`Ciclos ejecutados: ${cycleCount}`);
      store.set(cycleCountAtom, cycleCount );

        const eventInstruction = new CustomEvent("instructionChange", {
          detail: { instruction: currentInstructionName },
        });
        window.dispatchEvent(eventInstruction);

      if (event.value.type === "cpu:cycle.update" || event.value.type === "cpu:cycle.interrupt") {
        if (status.until === "cycle-change") {
         // pauseSimulation();
        } else if (!settings.animations) {
          // If animations are disabled, wait for some time to not overwhelm the CPU
          await new Promise(resolve => setTimeout(resolve, settings.executionUnit));
        }
      } else if (event.value.type === "cpu:cycle.end") {
        if (status.until === "cycle-change" || status.until === "end-of-instruction") {
          pauseSimulation();
        } else if (!settings.animations) {
          // If animations are disabled, wait for some time to not overwhelm the CPU
          await new Promise(resolve => setTimeout(resolve, settings.executionUnit));
        }
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
         ["CALL", "RET", "INT", "IRET", "POP", "PUSH"].includes(instruction)
       );
     
        // Actualizar el estado showSP en consecuencia
        store.set(showSPAtom, hasSPInstruction);

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

        store.set(settingsAtom, (prev: any) => ({
          ...prev,
          devices: { ...prev.devices, keyboardAndScreen: connectScreenAndKeyboard },
        }));
       
        // Actualizar el átomo con el valor de connectScreenAndKeyboard
        store.set(connectScreenAndKeyboardAtom, connectScreenAndKeyboard);
        
        // Reset the simulator
        simulator.loadProgram({
          program: result,
          data: getSettings().dataOnLoad,
          devices: getSettings().devices, 
          hasORG: result.hasORG, // Pass the hasORG flag 
        });

 
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
      if (status.type !== "running" || !simulator.devices.switches.connected()) {
        return invalidAction();
      }

      // Prevent simultaneous presses
      if (eventIsRunning("switches:toggle")) return;

      const index = args[1];
      startThread(simulator.devices.switches.toggle(index)!);
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
    startThread(simulator.devices.printer.print()!);
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
