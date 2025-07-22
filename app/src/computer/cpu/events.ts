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
import { finishSimulation, pauseSimulation } from "@/computer/simulation";
import { highlightCurrentInstruction } from "@/editor/methods";
import { store } from "@/lib/jotai";
import { colors } from "@/lib/tailwind";

import { DataRegister, generateDataPath } from "./DataBus";
import { aluOperationAtom, cycleAtom, MARAtom, MBRAtom, registerAtoms } from "./state";

const BUS_ANIMATION_DURATION = 5;

const drawDataPath = (from: DataRegister, to: DataRegister, instruction: string, mode: string) => {
  try {
    const path = generateDataPath(from, to, instruction, mode);
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
    console.warn("Error en drawDataPath:", error);
    return Promise.resolve();
  }
};

const resetDataPath = () =>
  anim({ key: "cpu.internalBus.data.opacity", to: 0 }, { duration: 1, easing: "easeInSine" });

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
  // Trigger de animaciones paralelas (modo principiante)
  if (window.VONSIM_PARALLEL_ANIMATIONS && event.type === "cpu:mar.set") {
    window.dispatchEvent(new CustomEvent("vonsim:parallel-memory-read-visual"));
  }
  switch (event.type) {
    case "cpu:alu.execute": {
      const pathsDrawConfig = { duration: 3, easing: "easeInOutSine" } as const;

      await anim(
        [
          { key: "cpu.alu.operands.opacity", from: 1 },
          { key: "cpu.alu.operands.strokeDashoffset", from: 1, to: 0 },
        ],
        pathsDrawConfig,
      );
      store.set(aluOperationAtom, event.operation);
      await Promise.all([
        anim(
          { key: "cpu.alu.operation.backgroundColor", to: colors.mantis[400] },
          { duration: 1, easing: "easeOutQuart" },
        ),
        anim({ key: "cpu.alu.cog.rot", to: 6 }, { duration: 10, easing: "easeInOutCubic" }),
      ]);
      await Promise.all([
        anim(
          { key: "cpu.alu.operation.backgroundColor", to: colors.stone[800] },
          { duration: 1, easing: "easeOutQuart" },
        ),
        anim(
          [
            { key: "cpu.alu.results.opacity", from: 1 },
            { key: "cpu.alu.results.strokeDashoffset", from: 1, to: 0 },
          ],
          pathsDrawConfig,
        ),
      ]);
      await Promise.all([activateRegister("cpu.result"), activateRegister("cpu.FLAGS")]);
      store.set(registerAtoms.FLAGS, event.flags);
      store.set(registerAtoms.result, event.result);
      await Promise.all([deactivateRegister("cpu.result"), deactivateRegister("cpu.FLAGS")]);
      await anim(
        [
          { key: "cpu.alu.operands.opacity", to: 0 },
          { key: "cpu.alu.results.opacity", to: 0 },
        ],
        { duration: 1, easing: "easeInSine" },
      );
      return;
    }

    case "cpu:cycle.end":
      return;

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
      showpath1 = event.instruction.willUse.ri && instructionName === "MOV" ? true : false;
      showpath2 =
        event.instruction.willUse.ri &&
        (instructionName === "ADD" || instructionName === "SUB" || instructionName === "INT")
          ? true
          : false;
      countersetMAR = 0;

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
      store.set(cycleAtom, prev => {
        if (!("metadata" in prev)) return prev;
        return {
          ...prev,
          phase:
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
                      : prev.phase,
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
      store.set(cycleAtom, { phase: "stopped" });
      finishSimulation();
      return;
    }

    case "cpu:int.3": {
      pauseSimulation();
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

      // Note: bus.address and bus.data now use path-based animations
      // so we don't animate stroke directly anymore

      // Animate control line using the correct path-based animation
      await turnLineOn(`bus.${line}` as SimplePathKey, 10);

      return;
    }

    case "cpu:iom.on": {
      await turnLineOn("bus.iom", 15);
      return;
    }

    case "cpu:mar.set": {
      // Detectar si el registro origen es MBR o ri (para animación especial)
      const regLower = event.register.toLowerCase();
      const isFromMBR = regLower === "mbr" || regLower === "ri";
      const path = isFromMBR
        ? "M 629 250 H 550 V 349 H 659" // path especial, siempre desde el MBR
        : generateAddressPath(event.register as MARRegister); // path normal
      console.log(
        "[cpu:mar.set] event.register:",
        event.register,
        "| Animación especial:",
        isFromMBR,
      );

      // Si el origen es MBR o ri, solo animar el bus de dirección (azul)

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
      await activateRegister("cpu.MAR", colors.blue[500]);
      store.set(MARAtom, store.get(registerAtoms[event.register]));

      await Promise.all([
        deactivateRegister("cpu.MAR"),
        anim(
          { key: "cpu.internalBus.address.opacity", to: 0 },
          { duration: 1, easing: "easeInSine" },
        ),
      ]);
      return;
    }

    case "cpu:mbr.get": {
      // Normalizar el nombre del registro para evitar problemas con subniveles
      const normalizedRegister = event.register.replace(/\.(l|h)$/, "");

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
        const ipValue = store.get(registerAtoms.IP);
        const mbrValue = store.get(MBRAtom);
        if (ipValue === mbrValue) {
          skipMBRtoMAR = true;
        }
      }
      if (normalizedRegister === "IR") {
        await drawDataPath("MBR", "IR", instructionName, mode);
      } else if ((normalizedRegister === "MAR" || normalizedRegister.startsWith("MAR.")) && !skipMBRtoMAR) {
        console.log("Animando bus de datos: MBR → MAR", { instructionName, mode });
        await drawDataPath("MBR", "MAR", instructionName, mode);
      } else if (["AL", "BL", "CL", "DL"].includes(normalizedRegister) && !isALUOp) {
        await drawDataPath("MBR", normalizedRegister as DataRegister, instructionName, mode);
      }

      // Segundo: Actualizar el valor del registro después de que termine la animación del bus
      store.set(registerAtoms[event.register], store.get(MBRAtom));

      // Tercero: Solo DESPUÉS de que termine la animación del bus, hacer la animación de actualización
      if (normalizedRegister === "IR") {
        await updateRegisterWithGlow(`cpu.${normalizedRegister}` as RegisterKey);
      } else if (normalizedRegister === "IP") {
        // No hacer animación individual, la animación conjunta se hará en cpu:register.update
      } else {
        await activateRegister(`cpu.${normalizedRegister}` as RegisterKey);
        await deactivateRegister(`cpu.${normalizedRegister}` as RegisterKey);
      }

      // Cuarto: Resetear la animación del bus
      await resetDataPath();
      return;
    }

    case "cpu:mbr.set": {
      // Normalizar el nombre del registro para evitar problemas con subniveles
      const normalizedRegister = event.register.replace(/\.(l|h)$/, "");

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
      await activateRegister(`cpu.${event.dest}` as RegisterKey);
      store.set(registerAtoms[event.dest], store.get(registerAtoms[event.src]));
      await deactivateRegister(`cpu.${event.dest}` as RegisterKey);
      return;
    }

    case "cpu:register.update": {
      const [reg] = parseRegister(event.register);
      // Si se actualiza MBR o IP, animar ambos juntos
      if (reg === "IP" || event.register === "MBR") {
        await animateMBRAndIP();
      } else {
        await updateRegisterWithGlow(reg === "ri" ? "cpu.ri" : (`cpu.${reg}` as RegisterKey));
      }
      store.set(registerAtoms[event.register], event.value);
      return;
    }

    case "cpu:register.buscopy": {
      // Normalizar a DataRegister (sin sufijos .l/.h)
      const normalize = (reg: string) => reg.replace(/\.(l|h)$/, "");
      const src = normalize(event.src);
      const dest = normalize(event.dest);
      // Evitar animación duplicada si es ri -> MAR (ya se anima en cpu:mar.set)
      if (!(src === "ri" && dest.toLowerCase() === "mar")) {
        await drawDataPath(src as DataRegister, dest as DataRegister, instructionName, mode);
      }
      // Copiar el valor en el frontend (para mantener sincronía visual)
      store.set(registerAtoms[event.dest], store.get(registerAtoms[event.src]));
      await activateRegister(`cpu.${event.dest}` as RegisterKey);
      await deactivateRegister(`cpu.${event.dest}` as RegisterKey);
      await resetDataPath();
      return;
    }

    default: {
      const _exhaustiveCheck: never = event;
      return _exhaustiveCheck;
    }
  }
}
