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
      }

      // Si no es un error de PIO o el PIO ya está activo, continuar con el error normal
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
