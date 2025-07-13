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
import { highlightCurrentInstruction,highlightLine } from "@/editor/methods";
import { store } from "@/lib/jotai";
import { colors } from "@/lib/tailwind";

import { DataRegister, generateDataPath } from "./DataBus";
import { aluOperationAtom, cycleAtom, MARAtom, MBRAtom, registerAtoms } from "./state";

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
      { duration: 5, easing: "easeInOutSine" },
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
let showpath1 = false;
let showpath2 = false;
let countersetMAR = 0;
export async function handleCPUEvent(event: SimulatorEvent<"cpu:">): Promise<void> {
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
      countersetMAR++;
      console.log("countersetMAR", countersetMAR); // Debugging line
      if (countersetMAR === 4 && showpath2) {
        showpath1 = true;
        showpath2 = false;
      }

      await anim(
        [
          {
            key: "cpu.internalBus.address.path",
            from: generateAddressPath(event.register, showpath1, showpath2),
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
      const normalizedRegister = event.register.replace(/\.(l|h)$/, '');
      
      // NO activar el registro de destino antes del bus - esto evita el coloreo prematuro
      // await activateRegister(`cpu.${normalizedRegister}` as RegisterKey);
      
      // Primero: Solo dibujar la animación del bus de datos (sin colorear el registro destino)
      await drawDataPath("MBR", normalizedRegister as DataRegister, instructionName, mode);
      
      // Segundo: Actualizar el valor del registro después de que termine la animación del bus
      store.set(registerAtoms[event.register], store.get(MBRAtom));
      
      // Tercero: Solo DESPUÉS de que termine la animación del bus, hacer la animación de actualización
      if (normalizedRegister === "IR") {
        await updateRegisterWithGlow(`cpu.${normalizedRegister}` as RegisterKey);
      } else {
        // Para otros registros, usar la secuencia normal
        await activateRegister(`cpu.${normalizedRegister}` as RegisterKey);
        await deactivateRegister(`cpu.${normalizedRegister}` as RegisterKey);
      }
      
      // Cuarto: Resetear la animación del bus
      await resetDataPath();
      return;
    }

    case "cpu:mbr.set": {
      // Normalizar el nombre del registro para evitar problemas con subniveles
      const normalizedRegister = event.register.replace(/\.(l|h)$/, '');
      
      await activateRegister("cpu.MBR" as RegisterKey);
      await drawDataPath(normalizedRegister as DataRegister, "MBR", instructionName, mode);
      await activateRegister("cpu.MBR");
      store.set(MBRAtom, store.get(registerAtoms[event.register]));
      await Promise.all([deactivateRegister("cpu.MBR"), resetDataPath()]);
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
      
      // Usar la nueva función de animación con brillo
      const animationKey: RegisterKey = reg === "ri" ? "cpu.ri" : `cpu.${reg}` as RegisterKey;
      
      // Special handling for IP register - trigger +1 animation synchronized with register update
      if (reg === "IP") {
        // Execute both animations in parallel
        await Promise.all([
          updateRegisterWithGlow(animationKey),
          // Trigger the custom event for IP update animation at the same time
          new Promise<void>((resolve) => {
            window.dispatchEvent(new CustomEvent('ip-register-update'));
            resolve();
          })
        ]);
      } else {
        await updateRegisterWithGlow(animationKey);
      }
      
      store.set(registerAtoms[event.register], event.value);
      return;
    }

    default: {
      const _exhaustiveCheck: never = event;
      return _exhaustiveCheck;
    }
  }
}
