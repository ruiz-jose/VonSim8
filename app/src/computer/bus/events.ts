import { anim, turnLineOff, turnLineOn } from "@/computer/shared/animate";
import type { SimulatorEvent } from "@/computer/shared/types";
import { finishSimulation, notifyWarning } from "@/computer/simulation";
import { store } from "@/lib/jotai";
import { getSettings, settingsAtom } from "@/lib/settings";
import { colors } from "@/lib/tailwind";

export async function handleBusEvent(event: SimulatorEvent<"bus:">): Promise<void> {
  switch (event.type) {
    case "bus:io.selected": {
      await Promise.all([
        anim(
          { key: "bus.mem.stroke", to: colors.stone[700] },
          { duration: 1, easing: "easeInSine" },
        ),
        turnLineOn(`bus.${event.chip}`, 15),
      ]);
      return;
    }

    case "bus:io.error": {
      // Verificar si el error es por falta de PIO en direcciones del PIO
      const error = event.error;
      if (error.code === "io-memory-not-connected") {
        let address: number | undefined;

        // Intentar extraer la dirección del contexto del error
        try {
          // @ts-expect-error - accediendo a propiedad privada
          const context = error.context;
          if (context && context[0]) {
            const addressValue = context[0];
            if (typeof addressValue === "number") {
              address = addressValue;
            } else if (addressValue && typeof addressValue.valueOf === "function") {
              address = Number(addressValue.valueOf());
            }
          }
        } catch (e) {
          // Fallback: intentar extraer desde el mensaje de error
          const errorMessage = error.message;
          const addressMatch = errorMessage.match(/0x([0-9A-Fa-f]+)/);
          if (addressMatch) {
            address = parseInt(addressMatch[1], 16);
          }
        }

        // Verificar si es una dirección del PIO (30h-33h)
        if (typeof address === "number" && address >= 0x30 && address <= 0x33) {
          const currentSettings = getSettings();

          // Si el PIO no está activo, activarlo automáticamente
          if (!currentSettings.devices.pio) {
            console.log(
              `🔧 Detectada operación I/O en dirección PIO ${address.toString(16).toUpperCase()}h. Activando PIO automáticamente.`,
            );

            // Notificar al usuario
            const registerNames = {
              0x30: "PA",
              0x31: "PB",
              0x32: "CA",
              0x33: "CB",
            };
            const registerName = registerNames[address as keyof typeof registerNames] || "Unknown";

            notifyWarning(
              "PIO activado automáticamente",
              `Se detectó una operación I/O en la dirección ${address.toString(16).toUpperCase()}h (${registerName}). El PIO se ha activado automáticamente.`,
            );

            // Actualizar la configuración para activar el PIO
            store.set(settingsAtom, (prev: any) => ({
              ...prev,
              devices: {
                ...prev.devices,
                pio: "switches-and-leds",
                "switches-and-leds": true,
              },
            }));

            // Enviar un evento personalizado para recargar el programa
            const reloadEvent = new CustomEvent("pioActivated", {
              detail: {
                address,
                registerName,
                shouldReload: true,
              },
            });
            window.dispatchEvent(reloadEvent);

            // No continuar con el error, ya que vamos a recargar
            return;
          }
        }

        // Verificar si es una dirección del Handshake (40h-41h)
        if (typeof address === "number" && address >= 0x40 && address <= 0x41) {
          const currentSettings = getSettings();

          // Si el Handshake no está activo, activarlo automáticamente con impresora
          if (!currentSettings.devices.handshake) {
            console.log(
              `🔧 Detectada operación I/O en dirección Handshake ${address.toString(16).toUpperCase()}h. Activando impresora con Handshake automáticamente.`,
            );

            // Notificar al usuario
            const registerNames = {
              0x40: "HS_DATA",
              0x41: "HS_STATUS",
            };
            const registerName = registerNames[address as keyof typeof registerNames] || "Unknown";

            notifyWarning(
              "Impresora (Handshake) activada automáticamente",
              `Se detectó una operación I/O en la dirección ${address.toString(16).toUpperCase()}h (${registerName}). La impresora con Handshake se ha activado automáticamente.`,
            );

            // Actualizar la configuración para activar el Handshake con impresora
            store.set(settingsAtom, (prev: any) => ({
              ...prev,
              devices: {
                ...prev.devices,
                handshake: "printer",
              },
            }));

            // Enviar un evento personalizado para recargar el programa
            const reloadEvent = new CustomEvent("handshakeActivated", {
              detail: {
                address,
                registerName,
                shouldReload: true,
              },
            });
            window.dispatchEvent(reloadEvent);

            // No continuar con el error, ya que vamos a recargar
            return;
          }
        }

        // Verificar si es una dirección del PIC (20h-2Bh)
        if (typeof address === "number" && address >= 0x20 && address <= 0x2b) {
          const currentSettings = getSettings();

          // Si el PIC no está activo, activarlo automáticamente
          if (!currentSettings.devices.pic) {
            console.log(
              `🔧 Detectada operación I/O en dirección PIC ${address.toString(16).toUpperCase()}h. Activando PIC automáticamente.`,
            );

            // Notificar al usuario
            const registerNames: Record<number, string> = {
              0x20: "EOI",
              0x21: "IMR",
              0x22: "IRR",
              0x23: "ISR", 
              0x24: "INT0",
              0x25: "INT1",
              0x26: "INT2",
              0x27: "INT3",
              0x28: "INT4",
              0x29: "INT5",
              0x2a: "INT6",
              0x2b: "INT7",
            };
            const registerName = registerNames[address] || `PIC_REG_${address.toString(16).toUpperCase()}h`;

            notifyWarning(
              "PIC activado automáticamente",
              `Se detectó una operación I/O en la dirección ${address.toString(16).toUpperCase()}h (${registerName}). El PIC se ha activado automáticamente.`,
            );

            // Actualizar la configuración para activar el PIC
            store.set(settingsAtom, (prev: any) => ({
              ...prev,
              devices: {
                ...prev.devices,
                pic: true,
              },
            }));

            // Enviar un evento personalizado para recargar el programa
            const reloadEvent = new CustomEvent("picActivated", {
              detail: {
                address,
                registerName,
                shouldReload: true,
              },
            });
            window.dispatchEvent(reloadEvent);

            // No continuar con el error, ya que vamos a recargar
            return;
          }
        }
      }

      // Si no es un error de dispositivo I/O o ya está activo, continuar con el error normal
      finishSimulation(event.error);
      return;
    }

    case "bus:reset": {
      await Promise.all([
        anim(
          [
            { key: "bus.address.strokeDashoffset", to: 1 },
            { key: "bus.data.strokeDashoffset", to: 1 },
            { key: "bus.rd.strokeDashoffset", to: 1 },
            { key: "bus.wr.strokeDashoffset", to: 1 },
          ],
          { duration: 1, easing: "easeInSine" },
        ),
        anim(
          { key: "bus.mem.stroke", to: colors.red[500] },
          { duration: 1, easing: "easeOutSine" },
        ),
        turnLineOff("bus.iom"),
        turnLineOff("bus.handshake"),
        turnLineOff("bus.pio"),
        turnLineOff("bus.pic"),
        turnLineOff("bus.timer"),
      ]);
      return;
    }

    default: {
      const _exhaustiveCheck: never = event;
      return _exhaustiveCheck;
    }
  }
}
