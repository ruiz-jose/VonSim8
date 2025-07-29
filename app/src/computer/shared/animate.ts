import { easings, SpringValue } from "@react-spring/web";
import type { Byte } from "@vonsim/common/byte";

import { MBRAtom } from "@/computer/cpu/state";
import { simulationAtom } from "@/computer/simulation";
import { store } from "@/lib/jotai";
import { getSettings } from "@/lib/settings";
import { colors } from "@/lib/tailwind";

import {
  getSpring,
  RegisterKey,
  resetAllSprings,
  SimplePathKey,
  SpringPath,
  SpringPathValue,
} from "./springs";

type SpringAnimation = {
  [K in SpringPath]: SpringPathValue<K> extends SpringValue<infer S>
    ? { key: K; from?: S; to?: S }
    : never;
}[SpringPath];

/**
 * Save all the running animations in a set to be able to cancel them.
 */
const runningAnimations = new Set<SpringAnimation["key"]>();

/**
 * The only way animate a spring.
 * This utility also handles cases of forced stop of the simulaiton.
 * NEVER START AN ANIMATION DIRECTLY, ALWAYS USE `anim`.
 *
 * @see {@link https://react-spring.dev/docs/advanced/spring-value}
 *
 * @param animations One or more animations to execute with the same configuration.
 * @param animations.key The key of the spring to animate (see {@link getSpring}).
 * @param animations.from The initial value of the spring. (optional)
 * @param animations.to The final value of the spring.
 * @param config Configuration of the animation. Can be a preset (string) or a custom configuration (object).
 * @param config.duration The duration of the animation in execution units (should be integer).
 * @param config.forceMs Whether the duration is in milliseconds (true) or relative to the `executionUnit` (false, default).
 * @param config.easing The easing function to use (see {@link easings}).
 * @returns A promise that resolves when the animation is finished.
 */
export async function anim(
  animations: SpringAnimation | SpringAnimation[],
  config: {
    duration: number;
    forceMs?: boolean;
    easing: Exclude<keyof typeof easings, "steps">;
  },
): Promise<unknown> {
  const status = store.get(simulationAtom);

  // Don't run if simulation is stopped
  if (status.type === "stopped") return null;

  // Wait if animations are paused
  if (status.type === "paused") {
    await new Promise<void>(resolve => {
      const unsubscribe = store.sub(simulationAtom, () => {
        const status = store.get(simulationAtom);
        if (status.type !== "paused") {
          unsubscribe();
          resolve();
        }
      });
    });
    // recall anim with the same arguments.
    // If the simulation is stopped, the first condition will be true and the function will return.
    // If the simulation is running, the second condition will be true and the function will continue.
    return await anim(animations, config);
  }

  const settings = getSettings();

  // Don't run animations if disabled AND not forced
  if (!settings.animations && !config.forceMs) return null;

  const springConfig = {
    duration: config.forceMs
      ? config.duration
      : settings.animations
        ? config.duration * settings.executionUnit
        : 1, // Use minimal duration when animations are disabled
    easing: easings[config.easing],
  };

  if (!Array.isArray(animations)) animations = [animations];

  return await Promise.all(
    animations.map(async ({ key, from, to }) => {
      if (to === undefined && from === undefined) return null;

      try {
        const spring = getSpring(key);

        if (to === undefined) {
          return spring.set(from);
        } else {
          runningAnimations.add(key);
          const result = await getSpring(key).start({ from, to, config: springConfig });
          runningAnimations.delete(key);
          return result;
        }
      } catch (error) {
        console.warn(`Error animando la clave ${key}:`, error);
        return null;
      }
    }),
  );
}

/**
 * Pause all running animations.
 */
export const pauseAllAnimations = () =>
  runningAnimations.forEach(key => {
    try {
      const spring = getSpring(key);
      if (spring && typeof spring.pause === "function") {
        spring.pause();
      }
    } catch (error) {
      console.warn(`Error pausing animation for key ${key}:`, error);
    }
  });

/**
 * Resume all running animations.
 */
export const resumeAllAnimations = () =>
  runningAnimations.forEach(key => {
    try {
      const spring = getSpring(key);
      if (spring && typeof spring.resume === "function") {
        spring.resume();
      }
    } catch (error) {
      console.warn(`Error resuming animation for key ${key}:`, error);
    }
  });

/**
 * Stop all running animations.
 */
export function stopAllAnimations() {
  // Stop running animations. After stopped, `getSpring(key).start()`
  // from `anim()` will resolve and the key will be removed from the set.
  runningAnimations.forEach(key => {
    try {
      const spring = getSpring(key);
      // Verificar que el spring sea válido y tenga el método stop
      if (spring && typeof spring.stop === "function") {
        spring.stop(true);
        if (spring.isPaused && typeof spring.resume === "function") {
          spring.resume();
        }
      }
    } catch (error) {
      console.warn(`Error stopping animation for key ${key}:`, error);
    }
  });
  // Subtle delay to enusre all springs are being reset correctly
  setTimeout(() => resetAllSprings(), 10);
}

// Definir colores específicos para cada tipo de registro usando solo colores disponibles
const registerColors = {
  // Registros de datos - usar variaciones de blue
  AX: colors.blue[500],
  BX: "#4F46E5", // índigo 600
  CX: "#3B82F6", // blue 500
  DX: "#1E40AF", // blue 700

  // Registros de dirección - usar variaciones de red/mantis
  IP: colors.red[500],
  SP: "#DC2626", // red 600
  MAR: colors.blue[500], // cambiar a azul para consistencia

  // Registros especiales - usar el mismo color que MAR (azul)
  MBR: colors.blue[500], // mismo que MAR (azul)
  IR: colors.blue[500], // mismo que MAR (azul)
  FLAGS: "#F59E0B", // amber 500
  result: "#10B981", // emerald 500

  // Registros de instrucción - usar colores específicos
  id: "#F97316", // orange 500
  ri: "#06B6D4", // cyan 500 - coincide con el color del registro ri

  // Registros ALU - usar tonos verdes
  left: "#22C55E", // green 500
  right: "#16A34A", // green 600
};

// Función para obtener el color del registro
function getRegisterColor(registerKey: string): string {
  // Extraer el nombre del registro de la clave (ej: "cpu.AX" -> "AX")
  const registerName = registerKey.replace("cpu.", "").split(".")[0];
  return registerColors[registerName as keyof typeof registerColors] || colors.stone[600];
}

// Utilities

export async function activateRegister(key: RegisterKey, color?: string) {
  try {
    // Evitar la animación individual de MBR si el flag global está activo
    if (key === "cpu.MBR" && window.__nextTransferMBRtoIP) {
      return;
    }
    // Evitar animación para cpu.right.l y cpu.left.l
    if (key === "cpu.right.l" || key === "cpu.left.l") {
      return;
    }
    // Usar el color específico del registro si no se proporciona uno
    const registerColor = color || getRegisterColor(key);

    // Animación de pulso suave en lugar de cambio brusco
    await anim({ key: `${key}.backgroundColor`, to: registerColor } as SpringAnimation, {
      duration: 2,
      easing: "easeOutCubic",
    });

    // Opcional: agregar un segundo pulso más sutil
    await anim({ key: `${key}.backgroundColor`, to: colors.stone[750] } as SpringAnimation, {
      duration: 3,
      easing: "easeInCubic",
    });

    return;
  } catch (error) {
    console.warn(`No se pudo animar el registro ${key}:`, error);
    return null;
  }
}

export async function deactivateRegister(key: RegisterKey) {
  try {
    // Evitar animación para cpu.right.l y cpu.left.l
    if (key === "cpu.right.l" || key === "cpu.left.l") {
      return;
    }
    // Transición suave de vuelta al estado normal
    return await anim({ key: `${key}.backgroundColor`, to: colors.stone[800] } as SpringAnimation, {
      duration: 2,
      easing: "easeInOutQuart",
    });
  } catch (error) {
    console.warn(`No se pudo desactivar el registro ${key}:`, error);
    return null;
  }
}

// Nueva función para animación de actualización con efecto de brillo
export async function updateRegisterWithGlow(key: RegisterKey) {
  try {
    // Evitar la animación individual de MBR si el flag global está activo
    if (key === "cpu.MBR" && window.__nextTransferMBRtoIP) {
      return;
    }
    const settings = getSettings();
    const registerColor = getRegisterColor(key);

    // Efecto de activación y brillo que se desvanece gradualmente
    await anim({ key: `${key}.backgroundColor`, to: registerColor } as SpringAnimation, {
      duration: 2, // Duración para que sea visible
      easing: "easeOutQuart",
    });

    // Pausa para que el usuario vea el cambio - reducir tiempo si animaciones están desactivadas
    const pauseTime = settings.animations ? 1000 : 1;
    await new Promise(resolve => setTimeout(resolve, pauseTime));

    // Volver al estado normal
    await anim({ key: `${key}.backgroundColor`, to: colors.stone[800] } as SpringAnimation, {
      duration: 2,
      easing: "easeInQuart",
    });

    return;
  } catch (error) {
    console.warn(`No se pudo actualizar el registro ${key}:`, error);
    return null;
  }
}

export async function populateDataBus(data: Byte<8>) {
  // Si tienes un spring para el color del bus de datos, usa la clave correcta, por ejemplo:
  // await anim(
  //   { key: "bus.data.color", to: colors.mantis[400] } as SpringAnimation,
  //   { duration: 5, easing: "easeOutSine" },
  // );
  // Si no existe, simplemente omite la animación de color.
  await activateRegister("cpu.MBR");
  store.set(MBRAtom, data);
  await deactivateRegister("cpu.MBR");
}

// --- CONTROL BUS TEXT VISIBILITY MANAGEMENT ---
// Oculta los textos "Read" y "Write" del bus de control al iniciar la app
export function hideControlBusTextsOnInit() {
  // Siempre ocultar ambos textos al inicio, forzando opacidad 0 de forma asíncrona para evitar que react-spring la sobrescriba
  setTimeout(() => {
    try {
      getSpring("bus.rd.opacity").set(0);
    } catch (e) {
      /* noop */
    }
    try {
      getSpring("bus.wr.opacity").set(0);
    } catch (e) {
      /* noop */
    }
  }, 0);
}

// Llama esto cuando se quiera mostrar el texto "Read" (por ejemplo, al animar el bus de control RD)
export function showReadControlText() {
  try {
    getSpring("bus.rd.opacity").start({ to: 1 });
  } catch (e) {
    /* noop */
  }
}

// Llama esto cuando se quiera ocultar el texto "Read" (al terminar la animación)
export function hideReadControlText() {
  try {
    getSpring("bus.rd.opacity").start({ to: 0 });
  } catch (e) {
    /* noop */
  }
}

// Llama esto cuando se quiera mostrar el texto "Write" (por ejemplo, al animar el bus de control WR)
export function showWriteControlText() {
  try {
    getSpring("bus.wr.opacity").start({ to: 1 });
  } catch (e) {
    /* noop */
  }
}

// Llama esto cuando se quiera ocultar el texto "Write" (al terminar la animación)
export function hideWriteControlText() {
  try {
    getSpring("bus.wr.opacity").start({ to: 0 });
  } catch (e) {
    /* noop */
  }
}

export async function turnLineOn(line: SimplePathKey, duration: number) {
  return await anim(
    [
      { key: `${line}.strokeDashoffset`, from: 1, to: 0 } as SpringAnimation,
      { key: `${line}.opacity`, from: 1 } as SpringAnimation,
    ],
    { duration, easing: "easeInOutSine" },
  );
}

export async function turnLineOff(line: SimplePathKey) {
  return await anim({ key: `${line}.opacity`, to: 0 } as SpringAnimation, {
    duration: 1,
    easing: "easeInSine",
  });
}

// (No-op blocks eliminados; si tienes bloques vacíos en funciones reales, usa simplemente: // noop)

// Declarar la propiedad global para TypeScript
// (esto puede estar ya en otro archivo, pero lo repetimos aquí por seguridad)
declare global {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface Window {
    __nextTransferMBRtoIP?: boolean;
  }
}
