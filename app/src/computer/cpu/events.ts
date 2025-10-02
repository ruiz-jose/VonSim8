import type { MARRegister } from "@vonsim/simulator/cpu";
import { parseRegister } from "@vonsim/simulator/cpu/utils";

import { generateAddressPath } from "@/computer/cpu/AddressBus";
import {
  activateRegister,
  anim,
  deactivateRegister,
  hideALULeftText,
  hideALUResultText,
  hideALURightText,
  showALULeftText,
  showALUResultText,
  showALURightText,
  turnLineOff,
  turnLineOn,
  updateRegisterWithGlow, // Nueva función
} from "@/computer/shared/animate";
import type { RegisterKey, SimplePathKey } from "@/computer/shared/springs";
import { getSpring } from "@/computer/shared/springs";
import type { SimulatorEvent } from "@/computer/shared/types";
import {
  finishSimulation,
  isHaltExecutionAtom,
  pauseSimulation,
  simulationAtom,
} from "@/computer/simulation";
import { highlightCurrentInstruction } from "@/editor/methods";
import { store } from "@/lib/jotai";
import { getSettings } from "@/lib/settings";
import { colors } from "@/lib/tailwind";

import {
  DataRegister,
  generateDataPath,
  generateMBRtoMARPath,
  generateSimultaneousLeftRightPath,
} from "./DataBus";
import { aluOperationAtom, cycleAtom, MARAtom, MBRAtom, registerAtoms } from "./state";

console.log("🔧 generateDataPath importado:", typeof generateDataPath);

// Variables para rastrear transferencias simultáneas a left y right
let pendingLeftTransfer: { from: DataRegister; instruction: string; mode: string } | null = null;
let pendingRightTransfer: { from: DataRegister; instruction: string; mode: string } | null = null;
// Variables para control de animaciones (comentadas para evitar errores de linting)
// let _waitingForALUCogAnimation = false;
// let _aluCogAnimationComplete = false;

// Variables para rastrear el contexto actual de la instrucción
let currentExecuteStageCounter = 0;
let currentInstructionName = "";

// Exportar función para obtener el contador actual
export function getCurrentExecuteStageCounter(): number {
  return currentExecuteStageCounter;
}

// Función para actualizar el contexto de la instrucción desde simulation.ts
export function updateInstructionContext(executeStageCounter: number, instructionName: string) {
  currentExecuteStageCounter = executeStageCounter;
  currentInstructionName = instructionName;
  console.log(
    `🎯 updateInstructionContext: executeStageCounter=${executeStageCounter}, instructionName=${instructionName}`,
  );
}

// Tipo para las fases del ciclo de instrucción
type CyclePhase =
  | "fetching"
  | "fetching-operands"
  | "fetching-operands-completed"
  | "executing"
  | "writeback"
  | "halting"
  | "stopped";

let currentPhase: CyclePhase = "fetching";
// let _waitingForFetchingOperands = false;
// let _waitingForExecuting = false;

// Función para animar la memoria de control y el secuenciador por cada paso
// Función para animar solo el secuenciador por cada paso (sin memoria de control)
const animateSequencerOnly = async (stepProgress = 0.1) => {
  console.log(
    "📊 Animando solo secuenciador - progreso del paso:",
    stepProgress,
    "fase actual:",
    currentPhase,
  );

  // Ajustar el progreso según la fase actual
  let actualProgress = stepProgress;

  if (currentPhase === "fetching") {
    // Durante la captación de instrucciones, incrementos más grandes
    actualProgress = 0.15;
    console.log("📥 Fase de captación - incremento grande:", actualProgress);
  } else if (currentPhase === "fetching-operands") {
    // Durante la captación de operandos, incrementos medianos
    actualProgress = 0.12;
    console.log("📥 Fase de captación de operandos - incremento mediano:", actualProgress);
  } else {
    // Durante ejecución y writeback, incrementos menores
    actualProgress = Math.min(stepProgress, 0.08);
    console.log("⚙️ Fase de ejecución/writeback - incremento menor:", actualProgress);
  }

  // Solo incrementar el progreso del secuenciador (sin animar memoria de control)
  const currentProgress = getSpring("sequencer.progress.progress").get();
  const newProgress = Math.min(currentProgress + actualProgress, 1.0);

  console.log(
    `📊 Progreso: ${(currentProgress * 100).toFixed(1)}% → ${(newProgress * 100).toFixed(1)}%`,
  );

  await anim(
    { key: "sequencer.progress.progress", to: newProgress },
    { duration: 150, easing: "easeInOutSine", forceMs: true },
  );
};

// Función para animar la memoria de control Y el secuenciador (solo para decodificación)
const animateControlUnits = async (stepProgress = 0.1) => {
  console.log(
    "🧠 Animando memoria de control + secuenciador - progreso del paso:",
    stepProgress,
    "fase actual:",
    currentPhase,
  );

  // Ajustar el progreso según la fase actual
  let actualProgress = stepProgress;

  if (currentPhase === "fetching") {
    // Durante la captación de instrucciones, incrementos más grandes (30-40% del total)
    actualProgress = 0.15; // Incrementos más grandes para la captación
    console.log("📥 Fase de captación - incremento grande:", actualProgress);
  } else if (currentPhase === "fetching-operands") {
    // Durante la captación de operandos, incrementos medianos (30-40% del total)
    actualProgress = 0.12;
    console.log("📥 Fase de captación de operandos - incremento mediano:", actualProgress);
  } else {
    // Durante ejecución y writeback, incrementos menores
    actualProgress = Math.min(stepProgress, 0.08);
    console.log("⚙️ Fase de ejecución/writeback - incremento menor:", actualProgress);
  }

  // Animar la memoria de control (lectura de microinstrucciones) - RI → Unidad de Control
  const controlMemoryDuration = 200;
  await anim(
    [
      { key: "cpu.decoder.path.opacity", from: 1 },
      { key: "cpu.decoder.path.strokeDashoffset", from: 1, to: 0 },
    ],
    { duration: controlMemoryDuration, easing: "easeInOutSine", forceMs: true },
  );

  // Incrementar el progreso del secuenciador según la fase
  const currentProgress = getSpring("sequencer.progress.progress").get();
  const newProgress = Math.min(currentProgress + actualProgress, 1.0);

  console.log(
    `📊 Progreso: ${(currentProgress * 100).toFixed(1)}% → ${(newProgress * 100).toFixed(1)}%`,
  );

  await anim(
    { key: "sequencer.progress.progress", to: newProgress },
    { duration: 150, easing: "easeInOutSine", forceMs: true },
  );

  // Fade out de la memoria de control
  await anim(
    { key: "cpu.decoder.path.opacity", to: 0 },
    { duration: 100, easing: "easeInSine", forceMs: true },
  );

  console.log(`✅ Unidades de control animadas - nuevo progreso: ${newProgress}`);
};

const drawDataPath = (from: DataRegister, to: DataRegister, instruction: string, mode: string) => {
  console.log("🎨 drawDataPath llamado con:", { from, to, instruction, mode });
  try {
    console.log("🔧 Antes de llamar generateDataPath");
    console.log("🔧 generateDataPath es:", typeof generateDataPath);
    const path = generateDataPath(from, to, instruction, mode);
    console.log("🔧 Después de llamar generateDataPath");
    console.log("🎯 Ruta generada en drawDataPath:", path);
    if (!path) {
      console.log("❌ No hay ruta, retornando Promise.resolve()");
      return Promise.resolve(); // Si no hay ruta, no animar
    }

    // Usar la configuración de velocidad de animación
    const settings = getSettings();

    const duration = settings.animations ? settings.executionUnit : 1;
    console.log("🔧 settings.animations:", settings.animations);
    console.log("🔧 settings.executionUnit:", settings.executionUnit);
    console.log("🔧 Duración de la animación:", duration);

    return anim(
      [
        { key: "cpu.internalBus.data.path", from: path },
        { key: "cpu.internalBus.data.opacity", from: 1 },
        { key: "cpu.internalBus.data.strokeDashoffset", from: 1, to: 0 },
      ],
      { duration, easing: "easeInOutSine", forceMs: true },
    );
  } catch (error) {
    console.error("❌ Error en drawDataPath:", error);
    console.error("❌ Stack trace:", error instanceof Error ? error.stack : "No stack trace");
    return Promise.resolve();
  }
};

// Nueva función para animar transferencias simultáneas a left y right
const drawSimultaneousLeftRightPath = (from: DataRegister, instruction: string, mode: string) => {
  try {
    const path = generateSimultaneousLeftRightPath(from, instruction, mode);
    if (!path) return Promise.resolve(); // Si no hay ruta, no animar

    // Usar la configuración de velocidad de animación
    const settings = getSettings();
    const duration = settings.animations ? settings.executionUnit : 1;

    return anim(
      [
        { key: "cpu.internalBus.data.path", from: path },
        { key: "cpu.internalBus.data.opacity", from: 1 },
        { key: "cpu.internalBus.data.strokeDashoffset", from: 1, to: 0 },
      ],
      { duration, easing: "easeInOutSine", forceMs: true },
    );
  } catch (error) {
    console.warn("Error en drawSimultaneousLeftRightPath:", error);
    return Promise.resolve();
  }
};

const resetDataPath = () =>
  anim({ key: "cpu.internalBus.data.opacity", to: 0 }, { duration: 1, easing: "easeInSine" });

// Función para manejar la animación simultánea de manera asíncrona
const handleSimultaneousAnimation = async (
  src: DataRegister,
  instructionName: string,
  mode: string,
) => {
  console.log("🎯 Animación simultánea detectada: left y right desde", src);

  // Esperar a que estemos en la fase "fetching-operands"
  if (currentPhase !== "fetching-operands") {
    console.log("⏳ Esperando fase fetching-operands para animación simultánea...");
    // _waitingForFetchingOperands = true;
    await new Promise<void>(resolve => {
      const checkPhase = () => {
        if (currentPhase === "fetching-operands") {
          // _waitingForFetchingOperands = false;
          resolve();
        } else {
          setTimeout(checkPhase, 50); // Verificar cada 50ms
        }
      };
      checkPhase();
    });
    console.log("✅ Fase fetching-operands alcanzada, procediendo con animación simultánea");
  }

  await drawSimultaneousLeftRightPath(src as DataRegister, instructionName, mode);

  // Activar ambos registros simultáneamente
  await Promise.all([
    activateRegister("cpu.left" as RegisterKey),
    activateRegister("cpu.right" as RegisterKey),
  ]);

  // Actualizar ambos registros
  store.set(registerAtoms.left, store.get(registerAtoms[src]));
  store.set(registerAtoms.right, store.get(registerAtoms[src]));

  // Desactivar ambos registros simultáneamente
  await Promise.all([
    deactivateRegister("cpu.left" as RegisterKey),
    deactivateRegister("cpu.right" as RegisterKey),
  ]);

  // Limpiar las transferencias pendientes
  pendingLeftTransfer = null;
  pendingRightTransfer = null;

  // Resetear la animación del bus para que termine la animación simultánea
  await resetDataPath();
};

let instructionName = "";
let mode = "";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let showpath1 = false;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let showpath2 = false;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let countersetMAR = 0;

// Declarar la propiedad global para TypeScript
// (esto puede estar ya en otro archivo, pero lo repetimos aquí por seguridad)
declare global {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface Window {
    VONSIM_PARALLEL_ANIMATIONS?: boolean;
  }
}

// Variable global temporal para guardar el último origen de ri
let lastSourceForRI: string | null = null;

// Variables para coordinar animaciones simultáneas para MBR→ID/ri e IP→MAR
let pendingMBRtoID: { instruction: string; mode: string; destination: string } | null = null;
let pendingMBRtoRI: { instruction: string; mode: string; destination: string } | null = null;
let pendingIPtoMARFromRegCopy: { instruction: string; mode: string } | null = null;

// Variables para coordinar animaciones simultáneas ri→MAR + MBR→id (paso 8 de ADD/SUB/CMP)
let pendingRiToMAR: { instruction: string; mode: string } | null = null;
let pendingMBRtoIDStep8: { instruction: string; mode: string } | null = null;
// Función para normalizar nombres de registros (quita .l y .h)
const normalize = (reg: string) => reg.replace(/\.(l|h)$/, "");

// Añadir función auxiliar para animar MBR e IP juntos
async function animateMBRAndIP() {
  await Promise.all([
    updateRegisterWithGlow("cpu.MBR"),
    updateRegisterWithGlow("cpu.IP"),
    new Promise<void>(resolve => {
      window.dispatchEvent(new CustomEvent("ip-register-update"));
      resolve();
    }),
  ]);
}

export async function handleCPUEvent(event: SimulatorEvent<"cpu:">): Promise<void> {
  // Log para todos los eventos CPU
  console.log("🔍 CPU Event:", event.type, event);

  // Trigger de animaciones paralelas (modo principiante)
  if (window.VONSIM_PARALLEL_ANIMATIONS && event.type === "cpu:mar.set") {
    window.dispatchEvent(new CustomEvent("vonsim:parallel-memory-read-visual"));
  }
  switch (event.type) {
    case "cpu:alu.execute": {
      console.log("🚀 Evento cpu:alu.execute recibido, fase actual:", currentPhase);

      // Animar solo el secuenciador para la ejecución de la ALU
      await animateSequencerOnly(0.12);

      // Usar la configuración de velocidad de animación
      const settings = getSettings();
      const MAX_EXECUTION_UNIT_MS = 250;
      const duration = settings.animations
        ? Math.min(settings.executionUnit, MAX_EXECUTION_UNIT_MS)
        : 1;
      const pathsDrawConfig = {
        duration,
        easing: "easeInOutSine",
        forceMs: true,
      } as const;

      // Solo esperar la fase "executing" para operaciones de instrucciones principales
      // No esperar para operaciones internas del sistema (como ADD durante INT)
      const isInternalOperation = currentInstructionName === "INT" && currentPhase === "fetching";

      // Esperar a que estemos en la fase "executing" solo si las animaciones están habilitadas
      // y no es una operación interna del sistema
      if (settings.animations && !isInternalOperation) {
        if (currentPhase !== "executing") {
          console.log("⏳ Esperando fase executing para animación de la ALU...");
          await new Promise<void>(resolve => {
            let timeoutCount = 0;
            const maxTimeouts = 40; // 2 segundos máximo (40 * 50ms) - reducido de 10s
            let lastLogCount = 0;

            const checkPhase = () => {
              timeoutCount++;

              // Solo loggear cada 10 intentos para reducir spam de logs
              if (timeoutCount % 10 === 0 || timeoutCount !== lastLogCount + 1) {
                console.log(
                  `🔍 Verificando fase actual: ${currentPhase} (intento ${timeoutCount}/${maxTimeouts})`,
                );
                lastLogCount = timeoutCount;
              }

              if (currentPhase === "executing") {
                console.log("✅ Fase executing alcanzada");
                resolve();
              } else if (timeoutCount >= maxTimeouts) {
                console.warn(
                  "⚠️ Timeout esperando fase executing después de 2s, procediendo de todas formas",
                );
                console.warn(`🔍 Fase final: ${currentPhase}, se esperaba: executing`);
                resolve();
              } else {
                setTimeout(checkPhase, 50); // Verificar cada 50ms
              }
            };
            checkPhase();
          });
          console.log("✅ Fase executing alcanzada, procediendo con animación de la ALU");
        } else {
          console.log("✅ Ya estamos en fase executing, procediendo directamente");
        }
      } else if (isInternalOperation) {
        console.log("🔧 Operación interna detectada durante INT, saltando espera de fase");
      }

      // Mostrar los textos del left y right y animar los operandos simultáneamente
      await Promise.all([
        (async () => {
          showALULeftText();
          showALURightText();
          await anim(
            [
              { key: "cpu.alu.operands.opacity", from: 1 },
              { key: "cpu.alu.operands.strokeDashoffset", from: 1, to: 0 },
            ],
            pathsDrawConfig,
          );
          hideALULeftText();
          hideALURightText();
        })(),
      ]);
      store.set(aluOperationAtom, event.operation);

      // Cambiar color del fondo de la operación sin animación del engranaje
      await anim(
        { key: "cpu.alu.operation.backgroundColor", to: colors.mantis[400] },
        { duration: 1, easing: "easeOutQuart" },
      );

      await anim(
        { key: "cpu.alu.operation.backgroundColor", to: colors.stone[800] },
        { duration: 1, easing: "easeOutQuart" },
      );

      // Animación del bus de resultado (color violeta) - SIN texto todavía
      console.log("� Iniciando animación del bus de resultado...");

      // Animar el bus de resultado sin mostrar el texto aún
      await anim(
        [
          { key: "cpu.alu.results.opacity", from: 1 },
          { key: "cpu.alu.results.strokeDashoffset", from: 1, to: 0 },
        ],
        pathsDrawConfig,
      );

      await Promise.all([activateRegister("cpu.result"), activateRegister("cpu.FLAGS")]);
      store.set(registerAtoms.FLAGS, event.flags);
      store.set(registerAtoms.result, event.result);
      await Promise.all([deactivateRegister("cpu.result"), deactivateRegister("cpu.FLAGS")]);

      // AHORA mostrar el texto del resultado después de actualizar FLAGS
      console.log("💜 Mostrando texto del resultado después de actualizar FLAGS...");
      if (settings.animations) {
        showALUResultText();

        // Pequeña pausa para que se vea el texto
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      // Ocultar el texto y el bus simultáneamente
      await Promise.all([
        anim({ key: "cpu.alu.results.opacity", to: 0 }, { duration: 1, easing: "easeInSine" }),
        (async () => {
          hideALUResultText();
        })(),
      ]);

      await anim({ key: "cpu.alu.operands.opacity", to: 0 }, { duration: 1, easing: "easeInSine" });
      return;
    }

    case "cpu:cycle.end": {
      // Limpiar transferencias pendientes al final del ciclo
      pendingLeftTransfer = null;
      pendingRightTransfer = null;
      pendingMBRtoID = null;
      pendingMBRtoRI = null;
      pendingIPtoMARFromRegCopy = null;
      pendingRiToMAR = null;
      pendingMBRtoIDStep8 = null;
      // _waitingForALUCogAnimation = false;
      // _aluCogAnimationComplete = false;
      currentPhase = "fetching";
      // Lógica especial para CALL: establecer mensaje final y registrar ciclo 8
      const { store } = await import("@/lib/jotai");
      const { messageAtom, totalCycleCountAtom, currentInstructionCycleCountAtom, cycleCountAtom } =
        await import("./state");
      if (currentInstructionName === "CALL") {
        const displayMessage = "Ejecución: write(Memoria[MAR]) ← MBR | IP ← ri";
        store.set(messageAtom, displayMessage);

        // Registrar el ciclo 8 de CALL
        const currentCycleCount = store.get(cycleCountAtom);
        const currentInstructionCycles = store.get(currentInstructionCycleCountAtom);

        store.set(cycleCountAtom, currentCycleCount + 1);
        store.set(currentInstructionCycleCountAtom, currentInstructionCycles + 1);

        console.log("✅ CALL cpu:cycle.end - Mensaje final establecido:", displayMessage);
        console.log("✅ CALL cpu:cycle.end - Ciclo 8 registrado:", {
          cycleCount: currentCycleCount + 1,
          currentInstructionCycleCount: currentInstructionCycles + 1,
        });
      }

      // Sumar los ciclos de la instrucción actual al acumulador total
      const ciclosInstruccion = store.get(currentInstructionCycleCountAtom);
      store.set(totalCycleCountAtom, prev => prev + ciclosInstruccion);

      // Verificar si estamos en modo paso a paso por instrucción
      const simulationStatus = store.get(simulationAtom);
      const isStepByStepMode =
        simulationStatus.type === "running" && simulationStatus.until === "cycle-change";

      if (isStepByStepMode) {
        // En modo paso a paso: completar la barra al 100% y mantenerla
        console.log("🎯 Modo paso a paso: completando barra de progreso al 100%");
        await anim(
          { key: "sequencer.progress.progress", to: 1 },
          { duration: 300, easing: "easeInOutSine", forceMs: true },
        );
        console.log(
          "✅ Instrucción completada - barra al 100% (se reiniciará al comenzar la siguiente)",
        );
      } else {
        // En modo continuo: reiniciar inmediatamente para la siguiente instrucción
        console.log("🔄 Modo continuo: reiniciando barra de progreso a cero");
        void anim(
          { key: "sequencer.progress.progress", to: 0 },
          { duration: 200, easing: "easeInOutSine", forceMs: true },
        );
      }

      return;
    }

    case "cpu:cycle.interrupt": {
      store.set(cycleAtom, prev => {
        if (!("metadata" in prev)) return prev;
        return { ...prev, phase: "interrupt" };
      });
      // Interrupts handler uses id and ri
      await anim(
        [
          //{ key: "cpu.id.opacity", to: 1 },
          //{ key: "cpu.ri.opacity", to: 1 },
          { key: "cpu.id.opacity", to: 0 },
          { key: "cpu.ri.opacity", to: 0 },
        ],
        { duration: 150, easing: "easeInOutQuad", forceMs: true },
      );
      return;
    }

    case "cpu:cycle.start": {
      // Animar solo el secuenciador al iniciar ciclo
      void animateSequencerOnly(0.05);

      instructionName = event.instruction.name; // Obtén el nombre de la instrucción en curso
      mode = event.instruction.willUse.ri ? "mem<-imd" : ""; // Verifica si willUse.ri es true y establece el modo
      console.log(
        "[cpu:cycle.start] instructionName:",
        instructionName,
        "willUse.ri:",
        event.instruction.willUse.ri,
        "mode:",
        mode,
        "position:",
        event.instruction.position,
      );
      showpath1 = event.instruction.willUse.ri && instructionName === "MOV" ? true : false;
      showpath2 =
        event.instruction.willUse.ri &&
        (instructionName === "ADD" || instructionName === "SUB" || instructionName === "INT")
          ? true
          : false;
      countersetMAR = 0;

      // Limpiar transferencias pendientes al inicio de un nuevo ciclo
      pendingLeftTransfer = null;
      pendingRightTransfer = null;
      pendingMBRtoID = null;
      pendingMBRtoRI = null;
      pendingIPtoMARFromRegCopy = null;
      pendingRiToMAR = null;
      pendingMBRtoIDStep8 = null;
      // _waitingForALUCogAnimation = false;
      // _aluCogAnimationComplete = false;
      currentPhase = "fetching";
      // _waitingForFetchingOperands = false;
      // _waitingForExecuting = false;

      highlightCurrentInstruction(event.instruction.position.start);
      store.set(cycleAtom, { phase: "fetching", metadata: event.instruction });

      // Verificar si estamos en modo paso a paso para reiniciar la barra
      const simulationStatus = store.get(simulationAtom);
      const isStepByStepMode =
        simulationStatus.type === "running" && simulationStatus.until === "cycle-change";

      if (isStepByStepMode) {
        // En modo paso a paso: la barra estaba al 100%, reiniciarla a cero para la nueva instrucción
        console.log(
          "Modo paso a paso: reiniciando barra de progreso a cero para nueva instrucción",
        );
        await anim(
          { key: "sequencer.progress.progress", to: 0 },
          { duration: 250, easing: "easeInOutSine", forceMs: true },
        );
      }

      // Siempre reiniciar la barra de progreso del decodificador al iniciar una nueva instrucción
      // (especialmente importante para modo continuo)
      console.log("🔄 Asegurando que la barra de progreso del decodificador esté en cero");
      await anim(
        { key: "sequencer.progress.progress", to: 0 },
        { duration: 200, easing: "easeInOutSine", forceMs: true },
      );

      // La barra ahora comenzará a incrementarse durante la fase de captación
      console.log(
        "� Iniciando nueva instrucción - la barra comenzará a incrementarse durante la captación",
      );

      await anim(
        [
          // { key: "cpu.id.opacity", to: event.instruction.willUse.id ? 1 : 0.4 },
          // { key: "cpu.ri.opacity", to: event.instruction.willUse.ri ? 1 : 0.4 },
          { key: "cpu.id.opacity", to: event.instruction.willUse.id ? 1 : 0 },
          { key: "cpu.ri.opacity", to: event.instruction.willUse.ri ? 1 : 0 },
        ],
        { duration: 150, easing: "easeInOutQuad", forceMs: true },
      );
      return;
    }

    case "cpu:cycle.update": {
      // Determinar la nueva fase
      const newPhase =
        event.phase === "execute"
          ? "executing"
          : event.phase === "writeback"
            ? "writeback"
            : event.next === "fetch-operands"
              ? "fetching-operands"
              : event.next === "execute"
                ? "executing"
                : event.next === "writeback"
                  ? "writeback"
                  : event.next === "halting"
                    ? "halting"
                    : "fetching";

      // Actualizar la variable global de fase
      currentPhase = newPhase as CyclePhase;
      console.log("🔄 Fase del ciclo actualizada:", currentPhase);

      // Actualizar el progreso del secuenciador basado en la fase
      let sequencerProgress = 0;
      switch (newPhase) {
        case "fetching":
          sequencerProgress = 0;
          break;
        case "fetching-operands":
          sequencerProgress = 0.25;
          break;
        case "executing":
          sequencerProgress = 0.5;
          break;
        case "writeback":
          sequencerProgress = 0.75;
          break;
        case "halting":
          sequencerProgress = 1;
          break;
        default:
          sequencerProgress = newPhase === "stopped" ? 0 : 0;
      }

      // Animar el progreso del secuenciador
      void anim(
        { key: "sequencer.progress.progress", to: sequencerProgress },
        { duration: 300, easing: "easeInOutSine", forceMs: true },
      );

      store.set(cycleAtom, prev => {
        if (!("metadata" in prev)) return prev;
        return {
          ...prev,
          phase: newPhase,
        };
      });
      return;
    }

    case "cpu:decode": {
      // Animar unidades de control durante decodificación (incluye RI → Unidad de Control)
      void animateControlUnits(0.1);

      // Solo animar el progreso del decodificador (sin el path que ya maneja animateControlUnits)
      const durationMs = 150;
      void anim(
        [
          { key: "cpu.decoder.progress.opacity", from: 1 },
          { key: "cpu.decoder.progress.progress", from: 0, to: 1 },
        ],
        { duration: durationMs, easing: "easeInOutSine", forceMs: true },
      );
      void anim(
        { key: "cpu.decoder.progress.opacity", to: 0 },
        { duration: 80, easing: "easeInSine", forceMs: true },
      );
      return;
    }

    case "cpu:error": {
      store.set(cycleAtom, { phase: "stopped", error: event.error });
      finishSimulation(event.error);
      return;
    }

    case "cpu:halt":
    case "cpu:int.0": {
      // Para HLT, establecer la bandera ANTES de detener la simulación para preservar el historial
      if (event.type === "cpu:halt") {
        // Establecer la bandera de HLT inmediatamente para preservar el historial
        store.set(isHaltExecutionAtom, true);
        console.log("🛑 events.ts: isHaltExecutionAtom set to true before finishSimulation");

        const currentCycle = store.get(cycleAtom);
        if ("metadata" in currentCycle) {
          store.set(cycleAtom, { phase: "halting", metadata: currentCycle.metadata });
          // Pausa de 1 segundo para mostrar el estado
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      store.set(cycleAtom, { phase: "stopped" });
      finishSimulation();
      return;
    }

    case "cpu:int.6": {
      store.set(cycleAtom, { phase: "int6" });
      return;
    }

    case "cpu:int.7": {
      store.set(cycleAtom, { phase: "int7" });
      return;
    }

    case "cpu:inta.off": {
      await turnLineOff("bus.inta");
      return;
    }

    case "cpu:inta.on": {
      await turnLineOn("bus.inta", 10);
      return;
    }

    case "cpu:rd.on":
    case "cpu:wr.on": {
      // Animar solo el secuenciador durante operaciones de lectura/escritura
      void animateSequencerOnly(0.05);

      const line = event.type.slice(4, 6) as "rd" | "wr";

      // Animar simultáneamente el bus de control 'write' y el bus de direcciones
      window.dispatchEvent(new CustomEvent("vonsim:parallel-memory-write-visual"));
      await turnLineOn(`bus.${line}` as SimplePathKey, 10);
      return;
    }

    case "cpu:iom.on": {
      await turnLineOn("bus.iom", 15);
      return;
    }

    case "cpu:mar.set": {
      // Animar solo el secuenciador en cada paso
      void animateSequencerOnly(0.05);

      // Detectar si el registro origen es MBR (para animación especial)
      const regNorm = normalize(event.register); // NO toLowerCase
      const isFromMBR = regNorm === "MBR";

      // Detectar transferencias IP→MAR para animación simultánea con MBR→ID
      if (regNorm === "IP") {
        console.log(`🔄 Detectando transferencia IP→MAR para animación simultánea`);
        pendingIPtoMARFromRegCopy = { instruction: instructionName, mode };
        console.log(
          `📝 Guardando pendingIPtoMARFromRegCopy desde cpu:mar.set: ${instructionName}, ${mode}`,
        );

        // Verificar si ya tenemos pendiente una transferencia MBR→ID o MBR→RI de la misma instrucción
        if (
          (pendingMBRtoID && pendingMBRtoID.instruction === instructionName) ||
          (pendingMBRtoRI && pendingMBRtoRI.instruction === instructionName)
        ) {
          if (pendingMBRtoID && pendingMBRtoID.instruction === instructionName) {
            console.log(
              "🎯 Ejecutando animaciones simultáneas para MBR→ID + IP→MAR desde cpu:mar.set",
            );

            // Ejecutar ambas animaciones simultáneamente
            await Promise.all([
              drawDataPath("MBR", "id", pendingMBRtoID.instruction, pendingMBRtoID.mode),
              (async () => {
                const settings = getSettings();
                const MAX_EXECUTION_UNIT_MS = 250;
                const duration = settings.animations
                  ? Math.min(settings.executionUnit, MAX_EXECUTION_UNIT_MS)
                  : 1;
                return anim(
                  [
                    { key: "cpu.internalBus.address.path", from: generateAddressPath("IP") },
                    { key: "cpu.internalBus.address.opacity", from: 1 },
                    { key: "cpu.internalBus.address.strokeDashoffset", from: 1, to: 0 },
                  ],
                  { duration, easing: "easeInOutSine", forceMs: true },
                );
              })(),
            ]);

            // Actualizar registros
            store.set(registerAtoms.id, store.get(MBRAtom));
            store.set(MARAtom, store.get(registerAtoms.IP));

            // Activar registros
            await Promise.all([activateRegister("cpu.id"), activateRegister("cpu.MAR")]);

            // Desactivar registros
            await Promise.all([deactivateRegister("cpu.id"), deactivateRegister("cpu.MAR")]);

            // Resetear animaciones
            await Promise.all([
              resetDataPath(),
              anim(
                { key: "cpu.internalBus.address.opacity", to: 0 },
                { duration: 1, easing: "easeInSine" },
              ),
            ]);

            // Limpiar variables pendientes
            pendingMBRtoID = null;
            pendingIPtoMARFromRegCopy = null;
          } else if (pendingMBRtoRI && pendingMBRtoRI.instruction === instructionName) {
            // Animación simultánea de buses para instrucciones con direccionamiento directo e inmediato
            console.log(
              "🎯 Ejecutando animación simultánea de buses para MBR→RI + IP→MAR (directo-inmediato)",
            );

            // Ejecutar ambas animaciones de buses simultáneamente
            await Promise.all([
              // Animación del bus de direcciones IP→MAR
              (async () => {
                const settings = getSettings();
                const MAX_EXECUTION_UNIT_MS = 250;
                const duration = settings.animations
                  ? Math.min(settings.executionUnit, MAX_EXECUTION_UNIT_MS)
                  : 1;
                return anim(
                  [
                    { key: "cpu.internalBus.address.path", from: generateAddressPath("IP") },
                    { key: "cpu.internalBus.address.opacity", from: 1 },
                    { key: "cpu.internalBus.address.strokeDashoffset", from: 1, to: 0 },
                  ],
                  { duration, easing: "easeInOutSine", forceMs: true },
                );
              })(),
              // Animación del bus de datos MBR→RI
              drawDataPath("MBR", "ri", instructionName, pendingMBRtoRI.mode),
            ]);

            // Actualizar registros: copiar MBR a ri y IP a MAR
            store.set(registerAtoms.ri, store.get(MBRAtom));
            store.set(MARAtom, store.get(registerAtoms.IP));

            // Activar registros para mostrar la actualización
            await Promise.all([activateRegister("cpu.ri"), activateRegister("cpu.MAR")]);

            // Desactivar registros
            await Promise.all([deactivateRegister("cpu.ri"), deactivateRegister("cpu.MAR")]);

            // Resetear ambas animaciones al final
            await Promise.all([
              resetDataPath(),
              anim(
                { key: "cpu.internalBus.address.opacity", to: 0 },
                { duration: 1, easing: "easeInSine" },
              ),
            ]);

            // Limpiar variables pendientes
            pendingMBRtoRI = null;
            pendingIPtoMARFromRegCopy = null;
            return;
          }

          return;
        } else {
          // No hay transferencia simultánea pendiente, ejecutar animación IP→MAR normal
          console.log("🎯 Ejecutando animación IP→MAR normal (sin transferencia simultánea)");

          // Ejecutar animación del bus de direcciones IP→MAR
          {
            const settings = getSettings();
            const MAX_EXECUTION_UNIT_MS = 250;
            const duration = settings.animations
              ? Math.min(settings.executionUnit, MAX_EXECUTION_UNIT_MS)
              : 1;
            await anim(
              [
                { key: "cpu.internalBus.address.path", from: generateAddressPath("IP") },
                { key: "cpu.internalBus.address.opacity", from: 1 },
                { key: "cpu.internalBus.address.strokeDashoffset", from: 1, to: 0 },
              ],
              { duration, easing: "easeInOutSine", forceMs: true },
            );
          }

          // Activar registro MAR
          await activateRegister(`cpu.MAR`, colors.blue[500]);

          // Actualizar el registro
          store.set(MARAtom, store.get(registerAtoms.IP));

          // Desactivar registro y resetear bus
          await Promise.all([
            deactivateRegister("cpu.MAR"),
            anim(
              { key: "cpu.internalBus.address.opacity", to: 0 },
              { duration: 1, easing: "easeInSine" },
            ),
          ]);

          // Limpiar variable pendiente
          pendingIPtoMARFromRegCopy = null;

          return;
        }
      }

      // Detectar si ri → MAR debería ser parte de animación simultánea con MBR → id (paso 8 de ADD/SUB/CMP)
      const isRiToMARSimultaneous =
        regNorm === "ri" &&
        (currentInstructionName === "ADD" ||
          currentInstructionName === "SUB" ||
          currentInstructionName === "CMP") &&
        currentExecuteStageCounter >= 5; // Paso 6 o superior (incluye paso 8)

      // Detectar si es un caso donde ri → MAR no debe mostrar animación
      // porque la dirección ya está almacenada en MAR, PERO no aplicar cuando es parte de animación simultánea
      const isRiToMARSkipAnimation =
        regNorm === "ri" &&
        (currentInstructionName === "ADD" ||
          currentInstructionName === "SUB" ||
          currentInstructionName === "CMP" ||
          currentInstructionName === "AND" ||
          currentInstructionName === "OR" ||
          currentInstructionName === "XOR") &&
        !isRiToMARSimultaneous && // NO skip si es parte de animación simultánea
        (currentExecuteStageCounter >= 5 || // En etapas avanzadas, ri → MAR es solo preparación
          // También skip para direccionamiento indirecto en etapa 4 (cuando no hay modos directos/inmediatos)
          (currentExecuteStageCounter === 4 && instructionName === currentInstructionName));

      console.log(`🔍 isRiToMARSimultaneous Debug:`, {
        regNorm,
        currentInstructionName,
        currentExecuteStageCounter,
        isRiToMARSimultaneous,
        isRiToMARSkipAnimation,
        mode,
        instructionName,
      });

      if (isRiToMARSimultaneous && !isRiToMARSkipAnimation) {
        console.log(
          `🔄 Detectando transferencia ri→MAR para animación simultánea (paso 8) - ${currentInstructionName}`,
        );
        pendingRiToMAR = { instruction: instructionName, mode };

        // Verificar si ya tenemos pendiente una transferencia MBR→id para animación simultánea
        if (pendingMBRtoIDStep8 && pendingMBRtoIDStep8.instruction === instructionName) {
          console.log("🎯 Ejecutando animaciones simultáneas para ri→MAR + MBR→id (paso 8)");

          // Ejecutar ambas animaciones simultáneamente
          await Promise.all([
            // Animación del bus de direcciones ri→MAR
            anim(
              [
                {
                  key: "cpu.internalBus.address.path",
                  from: generateAddressPath("ri", true, false), // Pasar showpath1=true para ri
                },
                { key: "cpu.internalBus.address.opacity", from: 1 },
                { key: "cpu.internalBus.address.strokeDashoffset", from: 1, to: 0 },
              ],
              { duration: 300, easing: "easeInOutSine", forceMs: true },
            ),
            // Animación del bus de datos MBR→id
            drawDataPath("MBR", "id", instructionName, mode),
          ]);

          // Actualizar registros: ri a MAR y MBR a id
          store.set(MARAtom, store.get(registerAtoms.ri));
          store.set(registerAtoms.id, store.get(MBRAtom));

          // Activar registros para mostrar la actualización
          await Promise.all([activateRegister("cpu.MAR"), activateRegister("cpu.id")]);

          // Desactivar registros
          await Promise.all([deactivateRegister("cpu.MAR"), deactivateRegister("cpu.id")]);

          // Resetear ambas animaciones al final
          await Promise.all([
            anim(
              { key: "cpu.internalBus.address.opacity", to: 0 },
              { duration: 1, easing: "easeInSine" },
            ),
            resetDataPath(),
          ]);

          // Limpiar variables pendientes
          pendingRiToMAR = null;
          pendingMBRtoIDStep8 = null;
          return;
        } else {
          // Solo actualizar el registro MAR pero no hacer animación aún
          store.set(MARAtom, store.get(registerAtoms.ri));
          return;
        }
      }

      // Detectar caso especial: ADD/SUB/etc [BL], n - paso 6 (executeStageCounter === 4)
      // Animaciones simultáneas: BL → MAR + MBR → ID
      const isALUIndirectImmediateStep6 =
        regNorm === "ri" &&
        (currentInstructionName === "ADD" ||
          currentInstructionName === "SUB" ||
          currentInstructionName === "CMP" ||
          currentInstructionName === "AND" ||
          currentInstructionName === "OR" ||
          currentInstructionName === "XOR") &&
        currentExecuteStageCounter === 4; // Paso 6 según el log

      if (
        isALUIndirectImmediateStep6 &&
        mode === "mem<-imd" // Solo para modo inmediato
      ) {
        console.log(`🎯 Caso especial detectado: ${currentInstructionName} [BL], n - paso 6`);
        console.log("🎬 Ejecutando animaciones simultáneas: BL → MAR + MBR → ID");

        // Usar la configuración de velocidad de animación
        const settings = getSettings();
        const MAX_EXECUTION_UNIT_MS = 250;
        const duration = settings.animations
          ? Math.min(settings.executionUnit, MAX_EXECUTION_UNIT_MS)
          : 1;

        console.log("🚌 Iniciando animación del bus de direcciones BL → MAR");
        console.log("📊 Iniciando animación del bus de datos MBR → ID");

        // Ejecutar ambas animaciones simultáneamente
        await Promise.all([
          // Animación del bus de direcciones BL → MAR (mostrar que ri contiene el valor de BL)
          (async () => {
            console.log("🚌 Generando path para BL → MAR usando ri");
            const addressPath = generateAddressPath("ri"); // ri contiene el valor de BL
            console.log("🚌 Path generado para BL → MAR:", addressPath);

            return anim(
              [
                {
                  key: "cpu.internalBus.address.path",
                  from: addressPath,
                },
                { key: "cpu.internalBus.address.opacity", from: 1 },
                { key: "cpu.internalBus.address.strokeDashoffset", from: 1, to: 0 },
              ],
              { duration, easing: "easeInOutSine" },
            );
          })(),
          // Animación del bus de datos MBR → ID
          (async () => {
            console.log("📊 Ejecutando animación MBR → ID");
            return drawDataPath("MBR", "id", instructionName, mode);
          })(),
        ]);

        console.log("✅ Ambas animaciones completadas, actualizando registros");

        // Actualizar registros: ri (que contiene BL) a MAR y MBR a ID
        store.set(MARAtom, store.get(registerAtoms.ri));
        store.set(registerAtoms.id, store.get(MBRAtom));

        // Activar registros para mostrar la actualización
        await Promise.all([activateRegister("cpu.MAR"), activateRegister("cpu.id")]);

        // Desactivar registros
        await Promise.all([deactivateRegister("cpu.MAR"), deactivateRegister("cpu.id")]);

        // Resetear ambas animaciones al final
        console.log("🧹 Reseteando animaciones de bus");
        await Promise.all([
          anim(
            { key: "cpu.internalBus.address.opacity", to: 0 },
            { duration: 1, easing: "easeInSine" },
          ),
          resetDataPath(),
        ]);

        console.log("✅ Animaciones simultáneas completadas para paso 6");
        return;
      }

      const path = isFromMBR
        ? generateMBRtoMARPath() // path especial, siempre desde el MBR
        : generateAddressPath(regNorm as MARRegister); // path normal
      console.log(
        "[cpu:mar.set] event.register:",
        event.register,
        "| Animación especial:",
        isFromMBR,
        "| regNorm:",
        regNorm,
        "| mode:",
        mode,
        "| instructionName:",
        instructionName,
        "| isRiToMARSkipAnimation:",
        isRiToMARSkipAnimation,
      );

      // Animación azul (bus de direcciones) - solo si no es IP en modo mem<-imd Y no es ri → MAR skip Y no es ri → MAR simultáneo
      // IMPORTANTE: isRiToMARSkipAnimation solo debe aplicarse cuando regNorm === "ri"
      const isDirectAddressingForRi =
        regNorm === "ri" &&
        (instructionName === "MOV" ||
          instructionName === "ADD" ||
          instructionName === "SUB" ||
          instructionName === "CMP") &&
        mode !== "mem<-imd";

      if (
        !(regNorm === "IP" && mode === "mem<-imd") &&
        !(regNorm === "ri" && isRiToMARSkipAnimation) &&
        !(regNorm === "ri" && isRiToMARSimultaneous) &&
        !isDirectAddressingForRi // No mostrar bus en mar.set para direccionamiento directo
      ) {
        await anim(
          [
            {
              key: "cpu.internalBus.address.path",
              from: path,
            },
            { key: "cpu.internalBus.address.opacity", from: 1 },
            { key: "cpu.internalBus.address.strokeDashoffset", from: 1, to: 0 },
          ],
          { duration: 300, easing: "easeInOutSine", forceMs: true },
        );
        await activateRegister(`cpu.MAR`, colors.blue[500]);
        store.set(MARAtom, store.get(registerAtoms[regNorm]));
      } else if (regNorm === "ri" && (isRiToMARSkipAnimation || isRiToMARSimultaneous)) {
        if (isRiToMARSkipAnimation) {
          console.log("⏭️ Animación de bus y registro MAR omitida para ri → MAR en etapa avanzada");
        } else {
          console.log("⏭️ Animación de bus y registro MAR diferida para ri → MAR simultáneo");
        }
        // Actualizar el valor del MAR y mostrar destello aunque se omita la animación de bus
        if (!isRiToMARSimultaneous) {
          store.set(MARAtom, store.get(registerAtoms[regNorm]));
          await activateRegister("cpu.MAR", colors.blue[500]);
          await deactivateRegister("cpu.MAR");
        }
      }

      // --- Lógica para animar desde el origen real si MAR se actualiza desde ri ---
      if (regNorm === "ri" && !isRiToMARSkipAnimation) {
        console.log("[cpu:mar.set] ri detectado, mode:", mode, "instructionName:", instructionName);
        // Para direccionamiento directo (MOV/ADD/SUB/CMP), NO mostrar bus aquí (se mostró en mbr.get)
        if (
          (instructionName === "MOV" ||
            instructionName === "ADD" ||
            instructionName === "SUB" ||
            instructionName === "CMP") &&
          mode !== "mem<-imd"
        ) {
          // Solo actualizar MAR sin animación de bus
          store.set(MARAtom, store.get(registerAtoms.ri));
          // Destello/actualización de MAR después de haberse mostrado el bus en mbr.get
          await activateRegister("cpu.MAR", colors.blue[500]);
          await deactivateRegister("cpu.MAR");
          lastSourceForRI = null;
          return;
        }
        // Para instrucciones con modo mem<-imd, mostrar animación especial ri -> MAR
        if (mode === "mem<-imd") {
          console.log("✅ Animando bus especial: ri → MAR (modo mem<-imd)", {
            instructionName,
            mode,
          });
          console.log("🔧 Llamando drawDataPath con:", {
            from: "ri",
            to: "MAR",
            instructionName,
            mode,
          });
          const path = await drawDataPath("ri" as DataRegister, "MAR", instructionName, mode);
          console.log("🎯 Ruta generada para ri → MAR:", path);
          // Resetear la animación del bus después de completarse
          await resetDataPath();
        } else {
          console.log("❌ No es modo mem<-imd, usando lógica alternativa");
          // Si hay un origen previo, úsalo; si no, fuerza BL→MAR
          const source = lastSourceForRI || "BL";
          await drawDataPath(normalize(source) as DataRegister, "MAR", instructionName, mode);
          // Resetear la animación del bus después de completarse
          await resetDataPath();
        }
        lastSourceForRI = null;
      } else if (regNorm === "IP" && mode === "mem<-imd") {
        // Marcar animación IP → MAR como pendiente para ejecución simultánea
        pendingIPtoMARFromRegCopy = { instruction: instructionName, mode };
        console.log("📝 Marcando animación IP → MAR como pendiente desde cpu:mar.set");

        // Las animaciones simultáneas se ejecutarán en cpu:register.copy cuando se detecten ambas transferencias
      } else if (!isFromMBR) {
        await drawDataPath(regNorm as DataRegister, "MAR", instructionName, mode);
        // Resetear la animación del bus después de completarse
        await resetDataPath();
      }

      // Solo desactivar si no es IP en modo mem<-imd (se hará en la animación simultánea)
      // Y solo si no es ri → MAR skip (no hay animación que desactivar)
      // Y solo si no es ri → MAR simultáneo (se hará en la animación simultánea)
      // IMPORTANTE: isRiToMARSkipAnimation solo debe aplicarse cuando regNorm === "ri"
      if (
        !(regNorm === "IP" && mode === "mem<-imd") &&
        !(regNorm === "ri" && isRiToMARSkipAnimation) &&
        !(regNorm === "ri" && isRiToMARSimultaneous)
      ) {
        await Promise.all([
          deactivateRegister("cpu.MAR"),
          anim(
            { key: "cpu.internalBus.address.opacity", to: 0 },
            { duration: 1, easing: "easeInSine" },
          ),
        ]);
      } else if (regNorm === "ri" && (isRiToMARSkipAnimation || isRiToMARSimultaneous)) {
        if (isRiToMARSkipAnimation) {
          console.log("⏭️ Desactivación de registro MAR omitida para ri → MAR en etapa avanzada");
        } else {
          console.log("⏭️ Desactivación de registro MAR diferida para ri → MAR simultáneo");
        }
      }
      return;
    }

    case "cpu:mbr.get": {
      // Animar las unidades de control durante la lectura de MBR (obtención de operandos)
      if (currentPhase === "fetching-operands") {
        await animateSequencerOnly(0.07);
      } else {
        await animateSequencerOnly(0.05);
      }

      // Normalizar el nombre del registro para evitar problemas con subniveles
      const normalizedRegister = normalize(event.register);

      console.log("🎯 cpu:mbr.get - evento recibido:", {
        register: event.register,
        normalizedRegister,
        instructionName,
        mode,
      });

      // Agregar debug específico para CALL e INT
      if (
        (instructionName === "CALL" || instructionName === "INT") &&
        normalizedRegister === "ri"
      ) {
        const mbrValue = store.get(MBRAtom);
        const riValue = store.get(registerAtoms["ri.l"]);
        console.log(`🔍 ${instructionName} Debug - MBR → ri:`);
        console.log("  📍 Registro:", normalizedRegister, "| Modo:", mode);
        console.log(
          "  📊 MBR Value:",
          mbrValue.unsigned,
          `(0x${mbrValue.unsigned.toString(16).padStart(2, "0").toUpperCase()})`,
        );
        console.log(
          "  📋 Ri Value (antes):",
          (riValue as any).unsigned,
          `(0x${(riValue as any).unsigned.toString(16).padStart(2, "0").toUpperCase()})`,
        );
        console.log("  🎬 willSkipAnimation:", mode !== "mem<-imd");
        console.log("  ✏️ willUpdateRegister:", normalizedRegister === "ri" && mode === "mem<-imd");
        console.log("  🎯 willDoActivation:", normalizedRegister === "ri" && mode === "mem<-imd");
      }

      // Si la transferencia es a IP, marcar el flag global para evitar la animación individual de MBR en memoria
      if (normalizedRegister === "IP") {
        window.__nextTransferMBRtoIP = true;
      }

      // Solo animar el bus de datos desde MBR a IR, MAR o registros de propósito general (AL, BL, CL, DL) si NO es una operación de la ALU
      const aluOps = ["ADD", "SUB", "AND", "OR", "XOR", "CMP"];
      const isALUOp = aluOps.some(op => instructionName.startsWith(op));
      // Detectar si el siguiente cpu:mar.set será desde IP (para evitar animación verde MBR→MAR)
      let skipMBRtoMAR = false;
      if (normalizedRegister === "MAR" || normalizedRegister.startsWith("MAR.")) {
        // Si el valor que se va a copiar a MAR es igual al valor de IP, omitimos la animación
        // PERO para instrucciones ADD, SUB, CMP que usan memoria, SÍ debemos mostrar la animación
        const aluOpsWithMemory = ["ADD", "SUB", "CMP"];
        const isALUOpWithMemory = aluOpsWithMemory.some(op => instructionName.startsWith(op));

        if (!isALUOpWithMemory) {
          const ipValue = store.get(registerAtoms.IP);
          const mbrValue = store.get(MBRAtom);
          if (ipValue === mbrValue) {
            skipMBRtoMAR = true;
          }
        }
      }
      if (normalizedRegister === "IR") {
        await drawDataPath("MBR", "IR", instructionName, mode);
      } else if (
        (normalizedRegister === "MAR" || normalizedRegister.startsWith("MAR.")) &&
        !skipMBRtoMAR
      ) {
        console.log("Animando bus de direcciones (azul): MBR → MAR en mbr.get", {
          instructionName,
          mode,
        });
        // Mostrar SIEMPRE el bus de direcciones (azul) para MBR → MAR aquí
        const settings = getSettings();
        const duration = settings.animations ? settings.executionUnit : 1;
        await anim(
          [
            { key: "cpu.internalBus.address.path", from: generateMBRtoMARPath() },
            { key: "cpu.internalBus.address.opacity", from: 1 },
            { key: "cpu.internalBus.address.strokeDashoffset", from: 1, to: 0 },
          ],
          { duration, easing: "easeInOutSine", forceMs: true },
        );
      } else if (["AL", "BL", "CL", "DL", "ri", "id"].includes(normalizedRegister)) {
        // Para instrucciones ADD, SUB, CMP con memoria, mostrar animación MBR → ri o MBR → id
        const aluOpsWithMemory = ["ADD", "SUB", "CMP"];
        const isALUOpWithMemory = aluOpsWithMemory.some(op => instructionName.startsWith(op));

        if (normalizedRegister === "ri" && mode === "mem<-imd") {
          // Tratamiento especial para CALL e INT: ejecutar animación inmediatamente en paso 6
          if (instructionName.startsWith("CALL") || instructionName.startsWith("INT")) {
            console.log(
              `🎯 ${instructionName} detectado: ejecutando animación MBR → ri inmediatamente en paso 6`,
            );
            await drawDataPath("MBR", "ri", instructionName, mode);
          } else if (
            instructionName.startsWith("MOV") ||
            instructionName.startsWith("ADD") ||
            instructionName.startsWith("SUB") ||
            instructionName.startsWith("CMP") ||
            instructionName.startsWith("AND") ||
            instructionName.startsWith("OR") ||
            instructionName.startsWith("XOR")
          ) {
            // Para otras instrucciones con direccionamiento directo + inmediato, usar pendingMBRtoRI
            pendingMBRtoRI = { instruction: instructionName, mode, destination: "ri" };
            console.log("📝 Marcando animación MBR → ri como pendiente para animación simultánea");
          } else {
            // Para otras instrucciones, usar el sistema existente
            pendingMBRtoID = { instruction: instructionName, mode, destination: "ri" };
            console.log(
              "📝 Marcando animación MBR → ri como pendiente para animación simultánea (sistema existente)",
            );
          }
        } else if (normalizedRegister === "id") {
          // Detectar si es transferencia MBR→id para animación simultánea del paso 8 (ri→MAR + MBR→id)
          const isStep8Simultaneous =
            (currentInstructionName === "ADD" ||
              currentInstructionName === "SUB" ||
              currentInstructionName === "CMP") &&
            currentExecuteStageCounter >= 5; // Paso 6 o superior (incluye paso 8)

          console.log(`🔍 isStep8Simultaneous Debug:`, {
            normalizedRegister,
            currentInstructionName,
            currentExecuteStageCounter,
            isStep8Simultaneous,
            mode,
            instructionName,
          });

          if (isStep8Simultaneous) {
            console.log(
              `🔄 Detectando transferencia MBR→id para animación simultánea (paso 8) - ${currentInstructionName}`,
            );
            pendingMBRtoIDStep8 = { instruction: instructionName, mode };

            // Verificar si ya tenemos pendiente una transferencia ri→MAR para animación simultánea
            if (pendingRiToMAR && pendingRiToMAR.instruction === instructionName) {
              console.log("🎯 Ejecutando animaciones simultáneas para ri→MAR + MBR→id (paso 8)");

              // Ejecutar ambas animaciones simultáneamente
              await Promise.all([
                // Animación del bus de direcciones ri→MAR
                anim(
                  [
                    {
                      key: "cpu.internalBus.address.path",
                      from: generateAddressPath("ri", true, false), // Pasar showpath1=true para ri
                    },
                    { key: "cpu.internalBus.address.opacity", from: 1 },
                    { key: "cpu.internalBus.address.strokeDashoffset", from: 1, to: 0 },
                  ],
                  { duration: 300, easing: "easeInOutSine", forceMs: true },
                ),
                // Animación del bus de datos MBR→id
                drawDataPath("MBR", "id", instructionName, mode),
              ]);

              // Actualizar registros: ri a MAR y MBR a id
              store.set(MARAtom, store.get(registerAtoms.ri));
              store.set(registerAtoms.id, store.get(MBRAtom));

              // Activar registros para mostrar la actualización
              await Promise.all([activateRegister("cpu.MAR"), activateRegister("cpu.id")]);

              // Desactivar registros
              await Promise.all([deactivateRegister("cpu.MAR"), deactivateRegister("cpu.id")]);

              // Resetear ambas animaciones al final
              await Promise.all([
                anim(
                  { key: "cpu.internalBus.address.opacity", to: 0 },
                  { duration: 1, easing: "easeInSine" },
                ),
                resetDataPath(),
              ]);

              // Limpiar variables pendientes
              pendingRiToMAR = null;
              pendingMBRtoIDStep8 = null;
              return;
            } else {
              // Solo actualizar el registro id pero no hacer animación aún
              store.set(registerAtoms.id, store.get(MBRAtom));
              return;
            }
          } else {
            // Lógica normal para otras transferencias MBR→ID (no paso 8)
            // Detectar transferencias MBR→ID para animación simultánea con IP→MAR
            console.log(`🔄 Detectando transferencia MBR→ID para animación simultánea`);
            pendingMBRtoID = { instruction: instructionName, mode, destination: "id" };
            console.log(
              `📝 Guardando pendingMBRtoID desde cpu:mbr.get: ${instructionName}, ${mode}`,
            );

            // Verificar si ya tenemos pendiente una transferencia IP→MAR de la misma instrucción
            if (
              pendingIPtoMARFromRegCopy &&
              pendingIPtoMARFromRegCopy.instruction === instructionName
            ) {
              console.log(
                "🎯 Ejecutando animaciones simultáneas para MBR→ID + IP→MAR desde cpu:mbr.get",
              );

              // Ejecutar ambas animaciones simultáneamente
              await Promise.all([
                drawDataPath("MBR", "id", pendingMBRtoID.instruction, pendingMBRtoID.mode),
                (async () => {
                  const settings = getSettings();
                  const MAX_EXECUTION_UNIT_MS = 250;
                  const duration = settings.animations
                    ? Math.min(settings.executionUnit, MAX_EXECUTION_UNIT_MS)
                    : 1;
                  return anim(
                    [
                      { key: "cpu.internalBus.address.path", from: generateAddressPath("IP") },
                      { key: "cpu.internalBus.address.opacity", from: 1 },
                      { key: "cpu.internalBus.address.strokeDashoffset", from: 1, to: 0 },
                    ],
                    { duration, easing: "easeInOutSine", forceMs: true },
                  );
                })(),
              ]);

              // Actualizar registros
              store.set(registerAtoms.id, store.get(MBRAtom));
              store.set(MARAtom, store.get(registerAtoms.IP));

              // Activar registros
              await Promise.all([activateRegister("cpu.id"), activateRegister("cpu.MAR")]);

              // Desactivar registros
              await Promise.all([deactivateRegister("cpu.id"), deactivateRegister("cpu.MAR")]);

              // Resetear animaciones
              await Promise.all([
                resetDataPath(),
                anim(
                  { key: "cpu.internalBus.address.opacity", to: 0 },
                  { duration: 1, easing: "easeInSine" },
                ),
              ]);

              // Limpiar variables pendientes
              pendingMBRtoID = null;
              pendingIPtoMARFromRegCopy = null;

              return;
            } else {
              // Solo actualizar el registro pero no hacer animación aún
              store.set(registerAtoms.id, store.get(MBRAtom));
              return;
            }
          }
        } else if (!isALUOp || isALUOpWithMemory) {
          // Para direccionamiento directo (MOV/ADD/SUB/CMP): mostrar bus de direcciones MBR→MAR aquí
          if (
            normalizedRegister === "ri" &&
            mode !== "mem<-imd" &&
            (instructionName === "MOV" ||
              instructionName === "ADD" ||
              instructionName === "SUB" ||
              instructionName === "CMP")
          ) {
            console.log("📘 Animación de direcciones (mbr.get directo): MBR → MAR (bus azul)");
            await anim(
              [
                { key: "cpu.internalBus.address.path", from: generateMBRtoMARPath() },
                { key: "cpu.internalBus.address.opacity", from: 1 },
                { key: "cpu.internalBus.address.strokeDashoffset", from: 1, to: 0 },
              ],
              { duration: 300, easing: "easeInOutSine", forceMs: true },
            );
            // Ocultar el bus de direcciones tras la animación
            await anim(
              { key: "cpu.internalBus.address.opacity", to: 0 },
              { duration: 100, easing: "easeInSine", forceMs: true },
            );
            // No dibujar bus de datos MBR→ri aquí
            console.log(
              "⏭️ Omitiendo animación de datos MBR → ri en direccionamiento directo (mbr.get)",
            );
          } else {
            // Omitir animación MBR → ri en direccionamiento directo (no inmediato)
            if (normalizedRegister === "ri" && mode !== "mem<-imd") {
              console.log("⏭️ Omitiendo animación MBR → ri para direccionamiento directo");
            } else {
              await drawDataPath("MBR", normalizedRegister as DataRegister, instructionName, mode);
            }
          }
        }
      }

      // Segundo: Actualizar el valor del registro después de que termine la animación del bus
      // Solo actualizar si no es ri en modo mem<-imd (se actualizará en la animación simultánea)
      // EXCEPCIÓN: Para CALL e INT, siempre actualizar ri inmediatamente
      if (
        !(normalizedRegister === "ri" && mode === "mem<-imd") ||
        instructionName === "CALL" ||
        instructionName === "INT"
      ) {
        store.set(registerAtoms[event.register], store.get(MBRAtom));

        // Debug específico para CALL e INT
        if (
          (instructionName === "CALL" || instructionName === "INT") &&
          normalizedRegister === "ri"
        ) {
          const updatedValue = store.get(registerAtoms[event.register]);
          console.log(
            `🔥 ${instructionName} - Registro ri actualizado:`,
            (updatedValue as any).unsigned,
            `(0x${(updatedValue as any).unsigned.toString(16).padStart(2, "0").toUpperCase()})`,
          );
        }
      }

      // Tercero: Solo DESPUÉS de que termine la animación del bus, hacer la animación de actualización
      if (normalizedRegister === "IR") {
        await updateRegisterWithGlow(`cpu.${normalizedRegister}` as RegisterKey);
      } else if (normalizedRegister === "IP") {
        // Para RET e INT: mostrar animación MBR → IP y activación del registro
        if (instructionName === "RET" || instructionName === "INT") {
          console.log(`🎯 ${instructionName} detectado: mostrando animación MBR → IP`);
          try {
            await drawDataPath("MBR", "IP", instructionName, mode);
            // Activar y desactivar el registro IP después de la animación
            await activateRegister("cpu.IP");
            await deactivateRegister("cpu.IP");
          } catch (error) {
            console.error(`❌ Error en animación MBR → IP para ${instructionName}:`, error);
            // Continuar aunque falle la animación
          }
        } else {
          // No hacer animación individual para otros casos, la animación conjunta se hará en cpu:register.update
        }
      } else if (
        !(normalizedRegister === "ri" && mode === "mem<-imd") ||
        instructionName === "CALL" ||
        instructionName === "INT"
      ) {
        // No hacer animación individual para ri en modo mem<-imd (se hará en la animación simultánea)
        // EXCEPCIÓN: Para CALL e INT, siempre hacer la activación inmediatamente
        await activateRegister(`cpu.${normalizedRegister}` as RegisterKey);
        await deactivateRegister(`cpu.${normalizedRegister}` as RegisterKey);
      }

      // Cuarto: Resetear la animación del bus (solo si no es ri en modo mem<-imd)
      // EXCEPCIÓN: Para CALL, INT y RET, siempre resetear el data path
      if (
        !(normalizedRegister === "ri" && mode === "mem<-imd") ||
        instructionName === "CALL" ||
        instructionName === "INT" ||
        instructionName === "RET"
      ) {
        await resetDataPath();
      }

      // Quinto: Marcar el fin de la fase "fetch-operands" cuando se escribe en el registro destino
      // Solo si estamos actualmente en la fase "fetching-operands" y no es una transferencia a IR (que es parte de la captación)
      // Para instrucciones que obtienen operandos de memoria, la fase debe terminar cuando el valor real se copia al registro destino
      if (currentPhase === "fetching-operands" && normalizedRegister !== "IR") {
        // Verificar si es una instrucción que obtiene operandos de memoria
        const isMemoryOperandInstruction =
          instructionName &&
          (instructionName === "MOV" ||
            instructionName === "ADD" ||
            instructionName === "SUB" ||
            instructionName === "CMP" ||
            instructionName === "AND" ||
            instructionName === "OR" ||
            instructionName === "XOR");

        // Para instrucciones con operandos de memoria, terminar la fase cuando se lee el valor de memoria y se copia al MBR
        // Para otras instrucciones, terminar cuando se escribe en el registro destino
        const shouldCompletePhase =
          (isMemoryOperandInstruction && normalizedRegister === "MBR") ||
          (!isMemoryOperandInstruction && normalizedRegister !== "MBR");

        if (shouldCompletePhase) {
          // Actualizar la fase para indicar que "fetch-operands" ha terminado
          currentPhase = "fetching-operands-completed";
          console.log("✅ Fase 'fetch-operands' completada al escribir en", normalizedRegister);

          // Actualizar el estado del ciclo para reflejar que la fase de obtención de operandos ha terminado
          store.set(cycleAtom, prev => {
            if (!("metadata" in prev)) return prev;
            return {
              ...prev,
              phase: "fetching-operands-completed",
            };
          });
        }
      }
      return;
    }

    case "cpu:mbr.set": {
      // Animar solo el secuenciador en cada paso
      void animateSequencerOnly(0.05);

      // Avanzar el progreso del secuenciador durante la escritura a MBR (writeback)
      if (currentPhase === "writeback") {
        void anim(
          { key: "sequencer.progress.progress", to: 0.9 },
          { duration: 200, easing: "easeInOutSine", forceMs: true },
        );
      }

      // Normalizar el nombre del registro para evitar problemas con subniveles
      const normalizedRegister = normalize(event.register);

      // Contabilizar el paso 7 para instrucciones MOV cuando se está copiando un registro al MBR para escritura en memoria
      // Para MOV [memoria], registro - el paso 7 es cuando el registro origen va al MBR
      const isRegisterToMemoryMOV =
        instructionName === "MOV" &&
        ["AL", "BL", "CL", "DL", "AH", "BH", "CH", "DH"].includes(normalizedRegister) &&
        currentExecuteStageCounter === 5; // Paso 6 + 1 = Paso 7

      if (isRegisterToMemoryMOV) {
        console.log(
          `🎯 cpu:mbr.set: Registrando paso 7 para ${instructionName} [memoria], ${normalizedRegister}`,
        );
        console.log(
          `📊 Estado antes: executeStageCounter=${currentExecuteStageCounter}, register=${event.register}`,
        );

        // Incrementar el contador de etapas para registrar el paso 7
        currentExecuteStageCounter++;
        console.log(
          `📊 Execute Stage Counter incrementado a: ${currentExecuteStageCounter} (Paso 7)`,
        );

        // Si se está ejecutando por ciclo, pausar la simulación después de este paso
        const simulationStatus = store.get(simulationAtom);
        console.log(`🔍 Estado de simulación:`, simulationStatus);
        if (simulationStatus.type === "running" && simulationStatus.until === "cycle-change") {
          console.log(
            "⏸️ Pausando simulación después del paso 7 (cpu:mbr.set) - ejecución por ciclo",
          );
          setTimeout(() => {
            pauseSimulation();
          }, 100); // Pequeño delay para asegurar que la animación se complete
        }
      } else {
        console.log(
          `ℹ️ No se activó contabilización paso 7: instructionName=${instructionName}, register=${normalizedRegister}, executeStageCounter=${currentExecuteStageCounter}`,
        );
      }

      // Tratamiento especial para CALL e INT: ejecutar animación IP → MBR en paso 7/9
      if ((instructionName === "CALL" || instructionName === "INT") && normalizedRegister === "IP") {
        console.log(`🎯 ${instructionName} detectado: ejecutando animación IP → MBR inmediatamente`);
        await drawDataPath("IP", "MBR", instructionName, mode);
        store.set(MBRAtom, store.get(registerAtoms[event.register]));
        await resetDataPath();
      }
      // Si el registro destino es IP (pero no CALL), animar ambos juntos
      else if (normalizedRegister === "IP") {
        await animateMBRAndIP();
      }
      // Si no es IP, mostrar animación del bus desde el registro origen hacia MBR
      else {
        // Normalizar el nombre del registro origen para evitar error de tipo
        const normalizedSrc = event.register.replace(/\.(l|h)$/, "") as DataRegister;

        // Debug adicional para verificar la animación
        console.log(`🔍 Animación MBR.set: ${normalizedSrc} → MBR para ${instructionName}`);
        console.log(`🔍 Event.register original: ${event.register}`);
        console.log(`🔍 Normalized source: ${normalizedSrc}`);

        await drawDataPath(normalizedSrc, "MBR", instructionName, mode);
        store.set(MBRAtom, store.get(registerAtoms[event.register]));
        await resetDataPath();
      }
      return;
    }

    case "cpu:register.copy": {
      const src = normalize(event.src);
      const dest = normalize(event.dest);

      console.log(
        `🔄 cpu:register.copy: ${event.src} → ${event.dest} (normalizado: ${src} → ${dest})`,
      );

      // Animar solo el secuenciador por cada operación de copia importante
      if ((dest === "left" || dest === "right") && currentPhase === "executing") {
        // Operandos ALU - animar secuenciador con progreso medio
        await animateSequencerOnly(0.1);
      } else if (dest === "result" && currentPhase === "writeback") {
        // Resultado - animar secuenciador con progreso alto
        await animateSequencerOnly(0.15);
      } else if ((src === "MBR" || src === "ri") && currentPhase === "fetching-operands") {
        // Obtención de operandos - animar secuenciador con progreso bajo-medio
        await animateSequencerOnly(0.08);
      } else {
        // Otras operaciones importantes - animar con progreso pequeño
        await animateSequencerOnly(0.05);
      }

      // Detectar preparación de operandos ALU para ADD [BL], 2 (mem<-imd indirecto)
      const isALUIndirectImmediateADD = instructionName === "ADD" && mode === "mem<-imd";

      if ((dest === "left" || dest === "right") && isALUIndirectImmediateADD) {
        console.log(
          `🎯 Detectando preparación de operando ALU: ${src} → ${dest} para ${instructionName}`,
        );

        // Para ADD [BL], 2: ri → right (valor inmediato) e id → left (valor de memoria)
        if (src === "ri" && dest === "right") {
          // Mostrar animación de RI → right (representando el valor inmediato hacia la ALU)
          console.log(`📋 Animación ALU: Valor inmediato (ri) → operando derecho ALU`);
          await Promise.all([
            drawDataPath("ri", "right", instructionName, mode),
            // Mostrar animación de ri → MAR para indicar la preparación de dirección
            anim(
              [
                {
                  key: "cpu.internalBus.address.path",
                  from: generateAddressPath("ri"),
                },
                { key: "cpu.internalBus.address.opacity", from: 1 },
                { key: "cpu.internalBus.address.strokeDashoffset", from: 1, to: 0 },
              ],
              { duration: 300, easing: "easeInOutSine", forceMs: true },
            ),
          ]);

          // Actualizar registros
          store.set(registerAtoms.right, store.get(registerAtoms[src]));

          // Activar y desactivar registros
          await Promise.all([activateRegister("cpu.right"), activateRegister("cpu.MAR")]);
          await Promise.all([deactivateRegister("cpu.right"), deactivateRegister("cpu.MAR")]);

          // Resetear animaciones
          await Promise.all([
            resetDataPath(),
            anim(
              { key: "cpu.internalBus.address.opacity", to: 0 },
              { duration: 1, easing: "easeInSine" },
            ),
          ]);
          return;
        } else if (src === "id" && dest === "left") {
          // Mostrar animación de ID → left (valor de memoria hacia la ALU)
          console.log(`📋 Animación ALU: Valor de memoria (id) → operando izquierdo ALU`);
          await Promise.all([
            drawDataPath("id", "left", instructionName, mode),
            // Mostrar animación de MBR → id para indicar que el valor viene de memoria
            drawDataPath("MBR", "id", instructionName, mode),
          ]);

          // Actualizar registros
          store.set(registerAtoms.left, store.get(registerAtoms[src]));

          // Activar y desactivar registros
          await Promise.all([activateRegister("cpu.left"), activateRegister("cpu.id")]);
          await Promise.all([deactivateRegister("cpu.left"), deactivateRegister("cpu.id")]);

          // Resetear animaciones
          await resetDataPath();
          return;
        }
      }

      // Detectar transferencias a left o right para animación simultánea (comportamiento original)
      if (dest === "left" || dest === "right") {
        const transferInfo = { from: src as DataRegister, instruction: instructionName, mode };

        if (dest === "left") {
          pendingLeftTransfer = transferInfo;
        } else if (dest === "right") {
          pendingRightTransfer = transferInfo;
        }

        // Si tenemos ambas transferencias pendientes y son del mismo origen, hacer animación simultánea
        if (
          pendingLeftTransfer &&
          pendingRightTransfer &&
          pendingLeftTransfer.from === pendingRightTransfer.from &&
          pendingLeftTransfer.instruction === pendingRightTransfer.instruction
        ) {
          // Usar la nueva función de animación simultánea que espera la animación del engranaje
          await handleSimultaneousAnimation(src as DataRegister, instructionName, mode);

          // Hacer return aquí para evitar que se ejecute la animación individual
          return;
        }

        // Si solo tenemos una transferencia, esperar a la otra sin hacer animación individual
        // Solo actualizar el registro correspondiente
        if (dest === "left") {
          store.set(registerAtoms.left, store.get(registerAtoms[src]));
        } else {
          store.set(registerAtoms.right, store.get(registerAtoms[src]));
        }

        // Hacer return aquí para evitar que se ejecute la animación individual
        // La animación se hará cuando se complete la transferencia simultánea
        return;
      }

      // Detectar transferencias MBR→ID/ri e IP→MAR para animación simultánea
      if ((src === "MBR" && (dest === "id" || dest === "ri")) || (src === "IP" && dest === "MAR")) {
        console.log(`🔄 Detectando transferencia para animación simultánea: ${src} → ${dest}`);

        if (src === "MBR" && (dest === "id" || dest === "ri")) {
          pendingMBRtoID = { instruction: instructionName, mode, destination: dest };
          console.log(`📝 Guardando pendingMBRtoID: ${instructionName}, ${mode}, destino: ${dest}`);
        } else if (src === "IP" && dest === "MAR") {
          pendingIPtoMARFromRegCopy = { instruction: instructionName, mode };
          console.log(`📝 Guardando pendingIPtoMARFromRegCopy: ${instructionName}, ${mode}`);
        }

        // Si tenemos ambas transferencias pendientes de la misma instrucción, hacer animación simultánea
        if (
          pendingMBRtoID &&
          pendingIPtoMARFromRegCopy &&
          pendingMBRtoID.instruction === pendingIPtoMARFromRegCopy.instruction
        ) {
          const destination = pendingMBRtoID.destination;
          console.log(`🎯 Ejecutando animaciones simultáneas para MBR→${destination} + IP→MAR`);

          // Ejecutar ambas animaciones simultáneamente junto con la animación del engranaje
          await Promise.all([
            drawDataPath(
              "MBR",
              destination as DataRegister,
              pendingMBRtoID.instruction,
              pendingMBRtoID.mode,
            ),
            (async () => {
              const settings = getSettings();
              const MAX_EXECUTION_UNIT_MS = 250;
              const duration = settings.animations
                ? Math.min(settings.executionUnit, MAX_EXECUTION_UNIT_MS)
                : 1;
              return anim(
                [
                  { key: "cpu.internalBus.address.path", from: generateAddressPath("IP") },
                  { key: "cpu.internalBus.address.opacity", from: 1 },
                  { key: "cpu.internalBus.address.strokeDashoffset", from: 1, to: 0 },
                ],
                { duration, easing: "easeInOutSine", forceMs: true },
              );
            })(),
            // Agregar animación del engranaje para mostrar la transferencia simultánea
            anim({ key: "cpu.alu.cog.rot", to: 6 }, { duration: 3, easing: "easeInOutCubic" }),
          ]);

          // Actualizar registros según el destino
          if (destination === "id") {
            store.set(registerAtoms.id, store.get(registerAtoms.MBR));
          } else if (destination === "ri") {
            store.set(registerAtoms.ri, store.get(registerAtoms.MBR));
          }
          store.set(MARAtom, store.get(registerAtoms.IP));

          // Activar registros
          const registerToActivate = destination === "id" ? "cpu.id" : "cpu.ri";
          await Promise.all([activateRegister(registerToActivate), activateRegister("cpu.MAR")]);

          // Desactivar registros
          await Promise.all([
            deactivateRegister(registerToActivate),
            deactivateRegister("cpu.MAR"),
          ]);

          // Resetear animaciones
          await Promise.all([
            resetDataPath(),
            anim(
              { key: "cpu.internalBus.address.opacity", to: 0 },
              { duration: 1, easing: "easeInSine" },
            ),
            // Resetear la animación del engranaje
            anim({ key: "cpu.alu.cog.rot", to: 0 }, { duration: 1, easing: "easeInOutSine" }),
          ]);

          // Limpiar variables pendientes
          pendingMBRtoID = null;
          pendingIPtoMARFromRegCopy = null;

          return;
        }

        // Si solo tenemos una transferencia, actualizar el registro pero no hacer animación aún
        if (src === "MBR" && dest === "id") {
          store.set(registerAtoms.id, store.get(registerAtoms.MBR));
        } else if (src === "MBR" && dest === "ri") {
          store.set(registerAtoms.ri, store.get(registerAtoms.MBR));
        } else if (src === "IP" && dest === "MAR") {
          store.set(MARAtom, store.get(registerAtoms.IP));
        }

        // No hacer animación individual, esperar a que se complete la otra transferencia
        return;
      }

      // Para transferencias normales (no a left/right)
      if (!(src === "ri" && dest === "IP")) {
        console.log(`🎯 Ejecutando drawDataPath para transferencia normal: ${src} → ${dest}`);
        await drawDataPath(src as DataRegister, dest as DataRegister, instructionName, mode);
      } else {
        // Manejar transferencias ri → IP de manera específica por instrucción
        if (instructionName === "CALL") {
          console.log(`🎯 Animando ri → IP para instrucción CALL`);
          // Para CALL, mostrar la animación correcta ri → IP
          await drawDataPath("ri" as DataRegister, "IP" as DataRegister, instructionName, mode);
        } else {
          // Lista de instrucciones de salto que usan MBR → IP (excluyendo CALL)
          const jumpInstructions = ["JMP", "JZ", "JNZ", "JC", "JNC", "JS", "JNS", "JO", "JNO"];

          if (jumpInstructions.includes(instructionName)) {
            console.log(`🎯 Animando MBR → IP para instrucción de salto: ${instructionName}`);
            // Para otras instrucciones de salto, mostrar la animación MBR → IP
            await drawDataPath("MBR" as DataRegister, "IP" as DataRegister, instructionName, mode);
          } else {
            console.log(`⚠️  Saltando animación para transferencia ri → IP`);
          }
        }
      }
      await activateRegister(`cpu.${dest}` as RegisterKey);
      store.set(registerAtoms[dest], store.get(registerAtoms[src]));
      await deactivateRegister(`cpu.${dest}` as RegisterKey);
      await resetDataPath();
      return;
    }

    case "cpu:register.update": {
      // Animar solo el secuenciador en cada paso
      void animateSequencerOnly(0.05);

      const [reg] = parseRegister(event.register);
      const regNorm = normalize(reg);

      // Si se actualiza MBR o IP, animar ambos juntos
      if (regNorm === "IP" || regNorm === "MBR") {
        await animateMBRAndIP();
      } else if (regNorm === "SP") {
        // Manejar animación del SP
        await updateRegisterWithGlow("cpu.SP" as RegisterKey);

        // Determinar si es +1 o -1 basado en la instrucción
        let animationType: "+1" | "-1" = "+1";

        switch (currentInstructionName) {
          case "PUSH":
          case "CALL":
          case "INT":
            animationType = "-1"; // PUSH, CALL e INT decrementan SP
            break;
          case "RET":
          case "IRET":
          case "POP":
            animationType = "+1"; // RET, IRET y POP incrementan SP
            break;
          default:
            // Para otros casos, intentar determinar por el contexto
            animationType = "+1";
            break;
        }

        // Emitir evento personalizado para la animación del texto
        window.dispatchEvent(
          new CustomEvent("sp-register-update", {
            detail: { type: animationType },
          }),
        );
      } else {
        await updateRegisterWithGlow(
          regNorm === "ri" ? "cpu.ri" : (`cpu.${regNorm}` as RegisterKey),
        );
      }
      store.set(registerAtoms[event.register], event.value);
      return;
    }

    case "cpu:register.buscopy": {
      const src = normalize(event.src);
      const dest = normalize(event.dest);
      // Guardar el último origen de ri
      if (dest === "ri") {
        lastSourceForRI = src;
      }
      // Evitar animación duplicada si es ri -> MAR (ya se anima en cpu:mar.set)
      if (!(src === "ri" && dest.toLowerCase() === "mar")) {
        if (!(src === "ri" && dest === "IP")) {
          await drawDataPath(src as DataRegister, dest as DataRegister, instructionName, mode);
          // Espera un poco después de cualquier animación de bus para que se vea claramente
          await new Promise(resolve => setTimeout(resolve, 150)); // 150 ms de retardo
        }
      }
      // Copiar el valor en el frontend (para mantener sincronía visual)
      store.set(registerAtoms[dest], store.get(registerAtoms[src]));
      await activateRegister(`cpu.${dest}` as RegisterKey);
      await deactivateRegister(`cpu.${dest}` as RegisterKey);
      // SOLO resetea la animación si el destino NO es ri
      if (dest !== "ri") {
        await resetDataPath();
      }
      return;
    }

    default: {
      const _exhaustiveCheck: never = event;
      return _exhaustiveCheck;
    }
  }
}
