import { MemoryAddress } from "@vonsim/common/address";

import { MBRAtom } from "@/computer/cpu/state";
import { anim, activateRegister, deactivateRegister, updateRegisterWithGlow } from "@/computer/shared/animate";
import type { SimulatorEvent } from "@/computer/shared/types";
import { finishSimulation } from "@/computer/simulation";
import { store } from "@/lib/jotai";
import { colors } from "@/lib/tailwind";
import { toast } from "@/lib/toast";

import { memoryAtom, operatingAddressAtom } from "./state";

export async function handleMemoryEvent(event: SimulatorEvent<"memory:">): Promise<void> {
  switch (event.type) {
    case "memory:read":
      return;

    case "memory:read.ok": {
      store.set(operatingAddressAtom, MemoryAddress.from(event.address));
      
      // Animar la celda de memoria como punto de origen
      await anim(
        { key: "memory.operating-cell.color", to: colors.mantis[400] },
        { duration: 1, easing: "easeOutQuart" },
      );
      
      // Animar el bus de datos desde la memoria hacia el CPU
      await anim(
        { key: "bus.data.stroke", to: colors.mantis[400] },
        { duration: 5, easing: "easeOutSine" },
      );
      
      // Actualizar el valor primero
      store.set(MBRAtom, event.value);
      
      // DESPUÉS usar la nueva animación para el MBR (después del bus)
      await updateRegisterWithGlow("cpu.MBR");
      
      // Resetear animaciones
      await Promise.all([
        anim(
          { key: "memory.operating-cell.color", to: colors.white },
          { duration: 1, easing: "easeOutQuart" },
        ),
        anim(
          { key: "bus.data.stroke", to: colors.stone[700] },
          { duration: 2, easing: "easeInQuart" },
        ),
      ]);
      return;
    }

    case "memory:write":
      return;

    case "memory:write.ok": {
      store.set(operatingAddressAtom, MemoryAddress.from(event.address));
      
      // Para escritura, usar el color específico del MBR
      await activateRegister("cpu.MBR");
      
      // Animar el bus de datos desde el CPU hacia la memoria
      await anim(
        { key: "bus.data.stroke", to: colors.mantis[400] },
        { duration: 5, easing: "easeOutSine" },
      );
      
      // Animar la celda de memoria de destino
      await anim(
        { key: "memory.operating-cell.color", to: colors.mantis[400] },
        { duration: 1, easing: "easeOutQuart" },
      );
      
      store.set(memoryAtom, arr => [
        ...arr.slice(0, event.address.value),
        event.value,
        ...arr.slice(event.address.value + 1),
      ]);
      
      // Resetear animaciones
      await Promise.all([
        deactivateRegister("cpu.MBR"),
        anim(
          { key: "memory.operating-cell.color", to: colors.white },
          { duration: 1, easing: "easeOutQuart" },
        ),
        anim(
          { key: "bus.data.stroke", to: colors.stone[700] },
          { duration: 2, easing: "easeInQuart" },
        ),
      ]);
      return;
    }

    case "memory:read.error":
    case "memory:write.error": {
      finishSimulation(event.error);
      return;
    }
    case "memory:write.warning": {
      // Mostrar un mensaje de advertencia con toast
      toast({
        title: "Advertencia de Memoria",
        description: `${event.warning}`,
        variant: "info", // Usar el estilo de advertencia
      });
      return;
    }

    default: {
      const _exhaustiveCheck: never = event;
      return _exhaustiveCheck;
    }
  }
}
