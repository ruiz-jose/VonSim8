import type { MARRegister } from "@vonsim/simulator/cpu";
import { parseRegister } from "@vonsim/simulator/cpu/utils";

import { generateAddressPath } from "@/computer/cpu/AddressBus";
import {
  activateRegister,
  anim,
  deactivateRegister,
  turnLineOff,
  turnLineOn,
  updateRegisterWithGlow, // Nueva función
} from "@/computer/shared/animate";
import type { RegisterKey, SimplePathKey } from "@/computer/shared/springs";
import type { SimulatorEvent } from "@/computer/shared/types";
import { finishSimulation } from "@/computer/simulation";
import { highlightCurrentInstruction } from "@/editor/methods";
import { store } from "@/lib/jotai";
import { colors } from "@/lib/tailwind";

import { DataRegister, generateDataPath, generateSimultaneousLeftRightPath } from "./DataBus";
import { aluOperationAtom, cycleAtom, MARAtom, MBRAtom, registerAtoms } from "./state";

console.log("🔧 generateDataPath importado:", typeof generateDataPath);

const BUS_ANIMATION_DURATION = 5;

// Variables para rastrear transferencias simultáneas a left y right
let pendingLeftTransfer: { from: DataRegister; instruction: string; mode: string } | null = null;
let pendingRightTransfer: { from: DataRegister; instruction: string; mode: string } | null = null;
// Variables para control de animaciones (comentadas para evitar errores de linting)
// let _waitingForALUCogAnimation = false;
// let _aluCogAnimationComplete = false;
let currentPhase = "fetching";
// let _waitingForFetchingOperands = false;
// let _waitingForExecuting = false;

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

    return anim(
      [
        { key: "cpu.internalBus.data.path", from: path },
        { key: "cpu.internalBus.data.opacity", from: 1 },
        { key: "cpu.internalBus.data.strokeDashoffset", from: 1, to: 0 },
      ],
      { duration: BUS_ANIMATION_DURATION, easing: "easeInOutSine" },
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

    return anim(
      [
        { key: "cpu.internalBus.data.path", from: path },
        { key: "cpu.internalBus.data.opacity", from: 1 },
        { key: "cpu.internalBus.data.strokeDashoffset", from: 1, to: 0 },
      ],
      { duration: BUS_ANIMATION_DURATION, easing: "easeInOutSine" },
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
// Variables para coordinar animaciones simultáneas en modo mem<-imd
let pendingMBRtoRI: { instruction: string; mode: string } | null = null;
let pendingIPtoMAR: { instruction: string; mode: string } | null = null;
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

// Función para manejar animaciones simultáneas en modo mem<-imd
async function handleSimultaneousMemImdAnimations() {
  if (pendingMBRtoRI && pendingIPtoMAR) {
    console.log("🎯 Ejecutando animaciones simultáneas para modo mem<-imd");

    // Ejecutar ambas animaciones simultáneamente
    await Promise.all([
      drawDataPath("MBR", "ri", pendingMBRtoRI.instruction, pendingMBRtoRI.mode),
      anim(
        [
          {
            key: "cpu.internalBus.address.path",
            from: generateAddressPath("IP"),
          },
          { key: "cpu.internalBus.address.opacity", from: 1 },
          { key: "cpu.internalBus.address.strokeDashoffset", from: 1, to: 0 },
        ],
        { duration: 5, easing: "easeInOutSine" },
      ),
    ]);

    // Actualizar registros
    store.set(registerAtoms.ri, store.get(MBRAtom));
    store.set(MARAtom, store.get(registerAtoms.IP));

    // Activar registros
    await Promise.all([activateRegister("cpu.ri"), activateRegister("cpu.MAR")]);

    // Desactivar registros
    await Promise.all([deactivateRegister("cpu.ri"), deactivateRegister("cpu.MAR")]);

    // Resetear animaciones
    await Promise.all([
      resetDataPath(),
      anim(
        { key: "cpu.internalBus.address.opacity", to: 0 },
        { duration: 1, easing: "easeInSine" },
      ),
    ]);

    // Limpiar variables pendientes
    pendingMBRtoRI = null;
    pendingIPtoMAR = null;
  }
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
      const pathsDrawConfig = { duration: 3, easing: "easeInOutSine" } as const;

      // Esperar a que estemos en la fase "executing" o proceder si ya estamos en ella
      if (currentPhase !== "executing") {
        console.log("⏳ Esperando fase executing para animación de la ALU...");
        // _waitingForExecuting = true;
        await new Promise<void>(resolve => {
          let timeoutCount = 0;
          const maxTimeouts = 200; // 10 segundos máximo (200 * 50ms)

          const checkPhase = () => {
            console.log("🔍 Verificando fase actual:", currentPhase);
            timeoutCount++;

            if (currentPhase === "executing") {
              // _waitingForExecuting = false;
              resolve();
            } else if (timeoutCount >= maxTimeouts) {
              console.warn("⚠️ Timeout esperando fase executing, procediendo de todas formas");
              // _waitingForExecuting = false;
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

      await anim(
        [
          { key: "cpu.alu.operands.opacity", from: 1 },
          { key: "cpu.alu.operands.strokeDashoffset", from: 1, to: 0 },
        ],
        pathsDrawConfig,
      );
      store.set(aluOperationAtom, event.operation);
      console.log("⚙️ Iniciando animación del engranaje de la ALU...");
      await Promise.all([
        anim(
          { key: "cpu.alu.operation.backgroundColor", to: colors.mantis[400] },
          { duration: 1, easing: "easeOutQuart" },
        ),
        anim({ key: "cpu.alu.cog.rot", to: 6 }, { duration: 10, easing: "easeInOutCubic" }),
      ]);
      console.log("✅ Animación del engranaje completada");

      await anim(
        { key: "cpu.alu.operation.backgroundColor", to: colors.stone[800] },
        { duration: 1, easing: "easeOutQuart" },
      );

      // Animación del bus de resultado (color amarillo)
      console.log("🟡 Iniciando animación del bus de resultado...");
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

      // Ocultar el bus de resultado
      await anim({ key: "cpu.alu.results.opacity", to: 0 }, { duration: 1, easing: "easeInSine" });

      await anim({ key: "cpu.alu.operands.opacity", to: 0 }, { duration: 1, easing: "easeInSine" });
      return;
    }

    case "cpu:cycle.end": {
      // Limpiar transferencias pendientes al final del ciclo
      pendingLeftTransfer = null;
      pendingRightTransfer = null;
      // _waitingForALUCogAnimation = false;
      // _aluCogAnimationComplete = false;
      currentPhase = "fetching";
      // _waitingForFetchingOperands = false;
      // _waitingForExecuting = false;
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
        { duration: 0.5, easing: "easeInOutQuad" },
      );
      return;
    }

    case "cpu:cycle.start": {
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
      // _waitingForALUCogAnimation = false;
      // _aluCogAnimationComplete = false;
      currentPhase = "fetching";
      // _waitingForFetchingOperands = false;
      // _waitingForExecuting = false;

      highlightCurrentInstruction(event.instruction.position.start);
      store.set(cycleAtom, { phase: "fetching", metadata: event.instruction });
      await anim(
        [
          // { key: "cpu.id.opacity", to: event.instruction.willUse.id ? 1 : 0.4 },
          // { key: "cpu.ri.opacity", to: event.instruction.willUse.ri ? 1 : 0.4 },
          { key: "cpu.id.opacity", to: event.instruction.willUse.id ? 1 : 0 },
          { key: "cpu.ri.opacity", to: event.instruction.willUse.ri ? 1 : 0 },
        ],
        { duration: 0.5, easing: "easeInOutQuad" },
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
      currentPhase = newPhase;
      console.log("🔄 Fase del ciclo actualizada:", currentPhase);

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
      await anim(
        [
          { key: "cpu.decoder.path.opacity", from: 1 },
          { key: "cpu.decoder.path.strokeDashoffset", from: 1, to: 0 },
        ],
        { duration: 3, easing: "easeInOutSine" },
      );
      await anim(
        [
          { key: "cpu.decoder.progress.opacity", from: 1 },
          { key: "cpu.decoder.progress.progress", from: 0, to: 1 },
        ],
        { duration: 3, easing: "easeInOutSine" },
      );
      await anim(
        [
          { key: "cpu.decoder.path.opacity", to: 0 },
          { key: "cpu.decoder.progress.opacity", to: 0 },
        ],
        { duration: 1, easing: "easeInSine" },
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
      // Para HLT, mostrar "Detener CPU" antes de detener completamente
      if (event.type === "cpu:halt") {
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
      // Detectar si el registro origen es MBR (para animación especial)
      const regNorm = normalize(event.register); // NO toLowerCase
      const isFromMBR = regNorm === "MBR";
      const path = isFromMBR
        ? "M 629 250 H 550 V 349 H 659" // path especial, siempre desde el MBR
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
      );

      // Animación azul (bus de direcciones) - solo si no es IP en modo mem<-imd
      if (!(regNorm === "IP" && mode === "mem<-imd")) {
        await anim(
          [
            {
              key: "cpu.internalBus.address.path",
              from: path,
            },
            { key: "cpu.internalBus.address.opacity", from: 1 },
            { key: "cpu.internalBus.address.strokeDashoffset", from: 1, to: 0 },
          ],
          { duration: 5, easing: "easeInOutSine" },
        );
        await activateRegister(`cpu.MAR`, colors.blue[500]);
        store.set(MARAtom, store.get(registerAtoms[regNorm]));
      }

      // --- Lógica para animar desde el origen real si MAR se actualiza desde ri ---
      if (regNorm === "ri") {
        console.log("[cpu:mar.set] ri detectado, mode:", mode, "instructionName:", instructionName);
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
        pendingIPtoMAR = { instruction: instructionName, mode };
        console.log("📝 Marcando animación IP → MAR como pendiente para modo mem<-imd");

        // Ejecutar animaciones simultáneas si ambas están pendientes
        await handleSimultaneousMemImdAnimations();
      } else if (!isFromMBR) {
        await drawDataPath(regNorm as DataRegister, "MAR", instructionName, mode);
        // Resetear la animación del bus después de completarse
        await resetDataPath();
      }

      // Solo desactivar si no es IP en modo mem<-imd (se hará en la animación simultánea)
      if (!(regNorm === "IP" && mode === "mem<-imd")) {
        await Promise.all([
          deactivateRegister("cpu.MAR"),
          anim(
            { key: "cpu.internalBus.address.opacity", to: 0 },
            { duration: 1, easing: "easeInSine" },
          ),
        ]);
      }
      return;
    }

    case "cpu:mbr.get": {
      // Normalizar el nombre del registro para evitar problemas con subniveles
      const normalizedRegister = normalize(event.register);

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
        console.log("Animando bus de datos: MBR → MAR", { instructionName, mode });
        await drawDataPath("MBR", "MAR", instructionName, mode);
      } else if (["AL", "BL", "CL", "DL", "ri"].includes(normalizedRegister)) {
        // Para instrucciones ADD, SUB, CMP con memoria, mostrar animación MBR → ri
        const aluOpsWithMemory = ["ADD", "SUB", "CMP"];
        const isALUOpWithMemory = aluOpsWithMemory.some(op => instructionName.startsWith(op));

        if (normalizedRegister === "ri" && mode === "mem<-imd") {
          // Marcar animación MBR → ri como pendiente para ejecución simultánea
          pendingMBRtoRI = { instruction: instructionName, mode };
          console.log("📝 Marcando animación MBR → ri como pendiente para modo mem<-imd");
        } else if (!isALUOp || isALUOpWithMemory) {
          await drawDataPath("MBR", normalizedRegister as DataRegister, instructionName, mode);
        }
      }

      // Segundo: Actualizar el valor del registro después de que termine la animación del bus
      // Solo actualizar si no es ri en modo mem<-imd (se actualizará en la animación simultánea)
      if (!(normalizedRegister === "ri" && mode === "mem<-imd")) {
        store.set(registerAtoms[event.register], store.get(MBRAtom));
      }

      // Tercero: Solo DESPUÉS de que termine la animación del bus, hacer la animación de actualización
      if (normalizedRegister === "IR") {
        await updateRegisterWithGlow(`cpu.${normalizedRegister}` as RegisterKey);
      } else if (normalizedRegister === "IP") {
        // No hacer animación individual, la animación conjunta se hará en cpu:register.update
      } else if (!(normalizedRegister === "ri" && mode === "mem<-imd")) {
        // No hacer animación individual para ri en modo mem<-imd (se hará en la animación simultánea)
        await activateRegister(`cpu.${normalizedRegister}` as RegisterKey);
        await deactivateRegister(`cpu.${normalizedRegister}` as RegisterKey);
      }

      // Cuarto: Resetear la animación del bus (solo si no es ri en modo mem<-imd)
      if (!(normalizedRegister === "ri" && mode === "mem<-imd")) {
        await resetDataPath();
      }
      return;
    }

    case "cpu:mbr.set": {
      // Normalizar el nombre del registro para evitar problemas con subniveles
      const normalizedRegister = normalize(event.register);

      // Si el registro destino es IP, animar ambos juntos
      if (normalizedRegister === "IP") {
        await animateMBRAndIP();
      }
      // Si no es IP, mostrar animación del bus desde el registro origen hacia MBR
      else {
        // Normalizar el nombre del registro origen para evitar error de tipo
        const normalizedSrc = event.register.replace(/\.(l|h)$/, "") as DataRegister;
        await drawDataPath(normalizedSrc, "MBR", instructionName, mode);
        store.set(MBRAtom, store.get(registerAtoms[event.register]));
        await resetDataPath();
      }
      return;
    }

    case "cpu:register.copy": {
      const src = normalize(event.src);
      const dest = normalize(event.dest);

      // Detectar transferencias a left o right para animación simultánea
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

      // Para transferencias normales (no a left/right)
      if (!(src === "ri" && dest === "IP")) {
        await drawDataPath(src as DataRegister, dest as DataRegister, instructionName, mode);
      }
      await activateRegister(`cpu.${dest}` as RegisterKey);
      store.set(registerAtoms[dest], store.get(registerAtoms[src]));
      await deactivateRegister(`cpu.${dest}` as RegisterKey);
      await resetDataPath();
      return;
    }

    case "cpu:register.update": {
      const [reg] = parseRegister(event.register);
      const regNorm = normalize(reg);
      // Si se actualiza MBR o IP, animar ambos juntos
      if (regNorm === "IP" || regNorm === "MBR") {
        await animateMBRAndIP();
      } else {
        await updateRegisterWithGlow(
          regNorm === "ri" ? "cpu.ri" : (`cpu.${regNorm}` as RegisterKey),
        );
      }
      store.set(registerAtoms[regNorm], event.value);
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
