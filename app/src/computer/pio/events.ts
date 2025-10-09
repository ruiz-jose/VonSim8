import {
  drawAddressPathToPIO,
  drawDataPathToPIO,
  drawDataPathFromPIO,
  drawPIOControlLine,
  drawWRControlPathToPIO,
  drawRDControlPathToPIO,
} from "@/computer/memory/events";
import {
  activateRegister,
  deactivateRegister,
  hideReadControlText,
  hideWriteControlText,
  populateDataBus,
  showReadControlText,
  showWriteControlText,
} from "@/computer/shared/animate";
import type { SimulatorEvent } from "@/computer/shared/types";
import { store } from "@/lib/jotai";
import { colors } from "@/lib/tailwind";

import { showReadBusAnimationAtom, showWriteBusAnimationAtom } from "../bus/state";
import { CAAtom, CBAtom, PAAtom, PBAtom } from "./state";

export async function handlePIOEvent(event: SimulatorEvent<"pio:">): Promise<void> {
  switch (event.type) {
    case "pio:read":
      return;

    case "pio:read.ok": {
      console.log("🎯 pio:read.ok: Iniciando animaciones de lectura desde PIO");
      
      // Activar la animación del texto 'Read' en el bus de control RD
      store.set(showReadBusAnimationAtom, true);
      showReadControlText();

      // Activar los registros MAR (azul) y MBR (verde) antes de animar los buses
      await Promise.all([
        activateRegister("cpu.MAR", colors.blue[500]),
        activateRegister("cpu.MBR", colors.mantis[400]),
      ]);

      // Primero: Animar los buses de direcciones, control RD y línea de control hacia el PIO
      console.log("🎯 pio:read.ok: Animando buses de direcciones y control RD hacia PIO");
      await Promise.all([
        drawAddressPathToPIO(),
        drawRDControlPathToPIO(),
        drawPIOControlLine(),
      ]);

      // Segundo: Animar el bus de datos desde PIO → MBR
      console.log("🎯 pio:read.ok: Animando bus de datos PIO → MBR");
      await drawDataPathFromPIO();
      
      // Tercero: Poblar el bus de datos con el valor leído
      await populateDataBus(event.value);

      // Ocultar texto "Read" y desactivar la animación
      hideReadControlText();
      store.set(showReadBusAnimationAtom, false);

      // Desactivar los registros MAR y MBR
      await Promise.all([deactivateRegister("cpu.MAR"), deactivateRegister("cpu.MBR")]);
      
      return;
    }

    case "pio:write": {
      // Activar la animación del texto 'Write' en el bus de control WR
      store.set(showWriteBusAnimationAtom, true);
      showWriteControlText();

      // Activar los registros MAR (azul) y MBR (verde) antes de animar los buses
      await Promise.all([
        activateRegister("cpu.MAR", colors.blue[500]),
        activateRegister("cpu.MBR", colors.mantis[400]),
      ]);

      // Animar los buses de direcciones, datos y control WR desde CPU hacia el PIO
      await Promise.all([
        drawAddressPathToPIO(),
        drawDataPathToPIO(),
        drawWRControlPathToPIO(),
        drawPIOControlLine(), // Línea de control desde chip select hasta PIO
      ]);

      // Ocultar texto "Write" y desactivar la animación
      hideWriteControlText();
      store.set(showWriteBusAnimationAtom, false);

      // Desactivar los registros MAR y MBR
      await Promise.all([deactivateRegister("cpu.MAR"), deactivateRegister("cpu.MBR")]);
      return;
    }

    case "pio:register.update": {
      await activateRegister(`pio.${event.register}`);
      switch (event.register) {
        case "PA": {
          store.set(PAAtom, event.value);
          break;
        }

        case "PB": {
          store.set(PBAtom, event.value);
          break;
        }

        case "CA": {
          store.set(CAAtom, event.value);
          break;
        }

        case "CB": {
          store.set(CBAtom, event.value);
          break;
        }

        default: {
          const _exhaustiveCheck: never = event.register;
          return _exhaustiveCheck;
        }
      }
      await deactivateRegister(`pio.${event.register}`);
      return;
    }

    case "pio:write.ok":
      return;

    default: {
      const _exhaustiveCheck: never = event;
      return _exhaustiveCheck;
    }
  }
}
