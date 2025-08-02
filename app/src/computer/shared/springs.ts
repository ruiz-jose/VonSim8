/**
 * @fileoverview
 * Internally, all animations are handled by react-spring. This file
 * keeps track of all the `SpringValue`s used across the computer.
 * These can be accessed using the `getSpring` function.
 *
 * @see {@link https://react-spring.dev/docs/advanced/spring-value}
 */

import { SpringValue } from "@react-spring/web";
import getFromPath, { Path, PathValue } from "@vonsim/common/paths";
import type { Opaque, UnknownRecord } from "type-fest";

import { colors } from "@/lib/tailwind";

// Common sets of springs

// Register component.
export type RegisterSprings = Opaque<
  { backgroundColor: SpringValue<string>; opacity: SpringValue<number> },
  "RegisterSprings"
>;
export type RegisterKey = SpringPathWhere<RegisterSprings>;

const Register = (initialColor = colors.stone[800]) =>
  ({
    backgroundColor: new SpringValue(initialColor),
    opacity: new SpringValue(1),
  }) as RegisterSprings;

// Used for "lines/cables" that "fill" along a path
export type SimplePathSprings = Opaque<
  { strokeDashoffset: SpringValue<number>; opacity: SpringValue<number> },
  "SimplePathSprings"
>;
export type SimplePathKey = SpringPathWhere<SimplePathSprings>;

// Used for data bus animations (same as CPU internal bus)
export type DataBusSprings = Opaque<
  {
    strokeDashoffset: SpringValue<number>;
    opacity: SpringValue<number>;
    path: SpringValue<string>;
  },
  "DataBusSprings"
>;
export type DataBusKey = SpringPathWhere<DataBusSprings>;

const SimplePath = () =>
  ({ strokeDashoffset: new SpringValue(1), opacity: new SpringValue(1) }) as SimplePathSprings;

const DataBusPath = () =>
  ({
    strokeDashoffset: new SpringValue(1),
    opacity: new SpringValue(1),
    path: new SpringValue(""),
  }) as DataBusSprings;

/**
 * Spring values
 * @see {@link https://react-spring.dev/docs/advanced/spring-value}
 */
const springs = {
  bus: {
    address: DataBusPath(),
    data: DataBusPath(),
    rd: DataBusPath(),
    wr: DataBusPath(),

    iom: SimplePath(),
    mem: { stroke: new SpringValue(colors.red[500]) },

    handshake: SimplePath(),
    pic: SimplePath(),
    pio: SimplePath(),
    timer: SimplePath(),

    intr: SimplePath(),
    inta: SimplePath(),
    int0: SimplePath(),
    int1: SimplePath(),
    int2: SimplePath(),

    // pio-switches-and-leds
    "switches->pio": SimplePath(),
    "pio->leds": SimplePath(),

    printer: {
      data: SimplePath(),
      strobe: SimplePath(),
      busy: SimplePath(),
    },
  },
  clock: { angle: new SpringValue(0) },
  controlMemory: {
    overlay: { opacity: new SpringValue(0) },
    container: {
      opacity: new SpringValue(0),
      scale: new SpringValue(0.8),
    },
    currentInstruction: { glow: new SpringValue(0) },
    microop: {
      0: { opacity: new SpringValue(0), translateX: new SpringValue(-20) },
      1: { opacity: new SpringValue(0), translateX: new SpringValue(-20) },
      2: { opacity: new SpringValue(0), translateX: new SpringValue(-20) },
      3: { opacity: new SpringValue(0), translateX: new SpringValue(-20) },
      4: { opacity: new SpringValue(0), translateX: new SpringValue(-20) },
    },
  },
  sequencer: {
    overlay: { opacity: new SpringValue(0) },
    container: {
      opacity: new SpringValue(0),
      scale: new SpringValue(0.8),
    },
  },
  cpu: {
    internalBus: {
      address: {
        strokeDashoffset: new SpringValue(1),
        opacity: new SpringValue(1),
        path: new SpringValue(""),
      },
      data: {
        strokeDashoffset: new SpringValue(1),
        opacity: new SpringValue(1),
        path: new SpringValue(""),
      },
    },
    alu: {
      operands: SimplePath(),
      results: SimplePath(),
      cog: { rot: new SpringValue(0) },
      operation: { backgroundColor: new SpringValue(colors.stone[800]) },
      resultText: { opacity: new SpringValue(0) },
      leftText: { opacity: new SpringValue(0) },
      rightText: { opacity: new SpringValue(0) },
    },
    decoder: {
      path: SimplePath(),
      progress: { progress: new SpringValue(0), opacity: new SpringValue(1) },
    },
    AX: Register(),
    BX: Register(),
    CX: Register(),
    DX: Register(),
    AL: Register(),
    BL: Register(),
    CL: Register(),
    DL: Register(),
    SP: Register(),
    "SP.l": Register(),
    "SP.h": Register(),
    IP: Register(),
    "IP.l": Register(),
    "IP.h": Register(),
    IR: Register(),
    ri: {
      ...Register(),
      opacity: new SpringValue(0),
    },
    "ri.l": Register(),
    "ri.h": Register(),
    id: {
      ...Register(),
      opacity: new SpringValue(0),
    },
    "id.l": Register(),
    "id.h": Register(),
    left: Register(),
    "left.l": Register(),
    "left.h": Register(),
    right: Register(),
    "right.l": Register(),
    "right.h": Register(),
    result: Register(),
    "result.l": Register(),
    "result.h": Register(),
    FLAGS: Register(),
    "FLAGS.l": Register(),
    "FLAGS.h": Register(),
    MAR: Register(),
    MBR: Register(),
  },
  handshake: {
    DATA: Register(),
    STATE: Register(),
  },
  memory: { "operating-cell": { color: new SpringValue(colors.white) } },
  pic: {
    IMR: Register(),
    IRR: Register(),
    ISR: Register(),
    INT0: Register(),
    INT1: Register(),
    INT2: Register(),
    INT3: Register(),
    INT4: Register(),
    INT5: Register(),
    INT6: Register(),
    INT7: Register(),
  },
  pio: {
    PA: Register(),
    PB: Register(),
    CA: Register(),
    CB: Register(),
  },
  printer: {
    printing: { progress: new SpringValue(0), opacity: new SpringValue(1) },
  },
  timer: {
    CONT: Register(),
    COMP: Register(),
  },
} as const;

type Springs = typeof springs;

export type SpringPath = Path<Springs, SpringValue<any>>;
export type SpringPathValue<P extends SpringPath> = PathValue<Springs, P, SpringValue<any>>;

export type SpringPathWhere<T> = {
  [K in SpringPath]: SpringPathValue<K> extends T ? K : never;
}[SpringPath];

/**
 * Retrieve a spring by its path
 *
 * @example
 * getSpring("bus.address.stroke") // SpringValue<string>
 * getSpring("bus.address") // { stroke: SpringValue<string> }
 */
export function getSpring<const Key extends SpringPath>(key: Key) {
  try {
    return getFromPath<Springs, Key, SpringValue<any>>(springs, key);
  } catch (error) {
    // Fallback para paths que no están en el tipo pero existen en runtime
    const keys = (key as string).split(".");
    let result: any = springs;
    for (const k of keys) {
      if (k in result) result = result[k];
      else {
        console.warn(`Path not found: ${key}`);
        // Retornar un spring por defecto para evitar errores
        // Crear un SpringValue dummy que tenga todos los métodos necesarios
        const dummySpring = new SpringValue(colors.stone[800]);
        return {
          backgroundColor: dummySpring,
          opacity: new SpringValue(1),
          stop() {
            // Método intencionalmente vacío
          },
          pause() {
            // Método intencionalmente vacío
          },
          resume() {
            // Método intencionalmente vacío
          },
          start: () => Promise.resolve(),
          set() {
            // Método intencionalmente vacío
          },
          get: () => colors.stone[800],
          isPaused: false,
        };
      }
    }
    return result;
  }
}

// This final section programatically saves the intial
// values (once on load) of the springs and exposes a
// function `resetAllSprings` which reverts all of them
// to their initial state.

function recursiveDefaultValues(obj: UnknownRecord) {
  const ret: UnknownRecord = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const element = obj[key];
      if (element instanceof SpringValue) ret[key] = element.get();
      else ret[key] = recursiveDefaultValues(element as any);
    }
  }
  return ret;
}

const defaultValues = recursiveDefaultValues(springs);

function recursiveReset(springs: UnknownRecord, defaults: UnknownRecord) {
  for (const key in springs) {
    if (Object.prototype.hasOwnProperty.call(springs, key)) {
      const element = springs[key];
      if (element instanceof SpringValue) element.set(defaults[key]);
      else recursiveReset(springs[key] as any, defaults[key] as any);
    }
  }
}

export const resetAllSprings = () => recursiveReset(springs, defaultValues);

export { animated } from "@react-spring/web";
