import type { SimulatorEvent } from "@/computer/shared/types";
import { simulationAtom } from "@/computer/simulation";
import { store } from "@/lib/jotai";

export async function handleKeyboardEvent(event: SimulatorEvent<"keyboard:">): Promise<void> {
  switch (event.type) {
    case "keyboard:listen-key": {
      // El modal KeyboardInputModal se encarga de mostrar el mensaje centrado
      // No es necesario mostrar un toast adicional

      // Set state.waitingForInput = true
      store.set(simulationAtom, prev => {
        if (prev.type !== "running" || prev.waitingForInput) return prev;
        return { ...prev, waitingForInput: true };
      });

      // Wait until state.waitingForInput = false
      await new Promise<void>(resolve => {
        store.sub(simulationAtom, () => {
          const status = store.get(simulationAtom);
          if (status.type !== "running" || !status.waitingForInput) {
            resolve();
          }
        });
      });
      return;
    }

    case "keyboard:read":
      return;

    default: {
      const _exhaustiveCheck: never = event;
      return _exhaustiveCheck;
    }
  }
}
