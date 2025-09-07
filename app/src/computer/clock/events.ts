import { anim } from "@/computer/shared/animate";
import { getSpring } from "@/computer/shared/springs";
import type { SimulatorEvent } from "@/computer/shared/types";
import { getSettings } from "@/lib/settings";

export async function handleClockEvent(event: SimulatorEvent<"clock:">): Promise<void> {
  console.log("🕐 [DEBUG] handleClockEvent llamado con evento:", event);

  switch (event.type) {
    case "clock:tick": {
      console.log("🕐 [DEBUG] Evento clock:tick recibido - iniciando animación");

      // Verificar si el spring existe antes de animarlo
      try {
        // Intentar obtener el spring para verificar si existe
        const clockSpring = getSpring("clock.angle");
        console.log("🕐 [DEBUG] Spring clock.angle obtenido:", clockSpring);

        // Animar el ángulo del reloj para que gire
        const settings = getSettings();
        const duration = settings.clockSpeed;

        console.log("🕐 [DEBUG] Configuración del reloj:", {
          duration,
          clockSpeed: settings.clockSpeed,
          animations: settings.animations,
        });

        console.log("🕐 [DEBUG] Iniciando animación del spring clock.angle");

        await anim(
          { key: "clock.angle", from: 0, to: 360 },
          { duration, forceMs: true, easing: "linear" },
        );

        console.log("🕐 [DEBUG] Animación del reloj completada exitosamente");
      } catch (error) {
        console.error("🕐 [ERROR] Error en la animación del reloj:", error);
      }

      return;
    }

    default: {
      const _exhaustiveCheck: never = event.type;
      return _exhaustiveCheck;
    }
  }
}
