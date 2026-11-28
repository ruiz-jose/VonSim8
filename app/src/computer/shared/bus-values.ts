/**
 * @fileoverview
 * Valor que viaja por cada bus durante una animación.
 *
 * Cada vez que se genera el recorrido (path SVG) de una transferencia, se
 * anota de qué registro sale el dato (`tagPathSource`). Cuando `anim()`
 * arranca la animación de ese recorrido, se lee el valor actual del
 * registro de origen (`startBusValue`) y se guarda en `busValueAtoms`.
 * El componente `<BusValueTag />` dibuja ese valor y lo mueve junto a la
 * punta de la animación, desde el origen hasta el destino.
 */

import type { Byte } from "@vonsim/common/byte";
import { atom, type PrimitiveAtom } from "jotai";

import { MARAtom, MBRAtom, registerAtoms } from "@/computer/cpu/state";
import { store } from "@/lib/jotai";

export type BusKey =
  | "cpu.internalBus.data"
  | "cpu.internalBus.address"
  | "bus.data"
  | "bus.address";

export type BusValue = {
  /** Recorrido (path SVG) de la animación a la que pertenece este valor */
  path: string;
  /** Texto a mostrar, por ejemplo "0A" */
  text: string;
};

const busValueAtom = () => atom(null as BusValue | null) as PrimitiveAtom<BusValue | null>;

export const busValueAtoms: Record<BusKey, PrimitiveAtom<BusValue | null>> = {
  "cpu.internalBus.data": busValueAtom(),
  "cpu.internalBus.address": busValueAtom(),
  "bus.data": busValueAtom(),
  "bus.address": busValueAtom(),
};

/** De dónde sale el dato: nombre de registro o valor ya conocido. */
type PathSource = string | Byte<8> | Byte<16>;

const pathSources = new Map<string, PathSource>();

/**
 * Anota de dónde sale el dato que viaja por `path`.
 * Devuelve el mismo `path` para poder usarlo en una sola línea.
 */
export function tagPathSource(path: string, source: PathSource | null | undefined): string {
  if (path && source) pathSources.set(path, source);
  return path;
}

/** Formatea un byte como lo muestran los registros, sin la "h": "0A". */
export function formatBusValue(value: Byte<8> | Byte<16>): string {
  return value.low.toString("hex");
}

function readRegister(name: string): Byte<8> | Byte<16> | null {
  const base = name.replace(/\.(l|h)$/, "");
  if (base === "MBR" || base === "mbr") return store.get(MBRAtom);
  if (base === "MAR" || base === "mar") return store.get(MARAtom);
  const atomForRegister =
    registerAtoms[name] ?? registerAtoms[base] ?? registerAtoms[base.toUpperCase()];
  if (!atomForRegister) return null;
  const value = store.get(atomForRegister);
  return value && typeof value.toString === "function" ? (value as Byte<8> | Byte<16>) : null;
}

/** Devuelve el texto del valor que viaja por `path`, o null si no se sabe. */
export function resolvePathValue(path: string): string | null {
  const source = pathSources.get(path);
  if (!source) return null;
  try {
    const value = typeof source === "string" ? readRegister(source) : source;
    return value ? formatBusValue(value) : null;
  } catch {
    return null;
  }
}

const BUS_PATH_KEY = /^((?:cpu\.internalBus|bus)\.(?:data|address))\.path$/;

/**
 * Llamado por `anim()` con cada animación. Si arranca el recorrido de un bus,
 * guarda el valor que va a viajar por él.
 */
export function startBusValue(key: string, from: unknown) {
  const match = BUS_PATH_KEY.exec(key);
  if (!match || typeof from !== "string") return;
  const bus = match[1] as BusKey;
  const text = resolvePathValue(from);
  store.set(busValueAtoms[bus], text ? { path: from, text } : null);
}
