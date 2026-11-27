import { IOAddress, MemoryAddress } from "@vonsim/common/address";

import type { Messages } from "..";

const maxAddress = MemoryAddress.from(MemoryAddress.MAX_ADDRESS).toString();

/** Nombres en español de los dispositivos, para no mostrar nombres internos. */
const DEVICE_NAMES: Record<string, string> = {
  keyboard: "El teclado",
  screen: "La pantalla",
  pic: "El PIC",
  pio: "El PIO",
  handshake: "El Handshake",
  timer: "El Timer",
  printer: "La impresora",
};

export function deviceName(device: string): string {
  return DEVICE_NAMES[device] ?? `El dispositivo «${device}»`;
}

export const spanish: Messages = {
  // prettier-ignore
  "address-has-instruction": address => `El programa intentó escribir en la dirección ${MemoryAddress.format(address)}, pero ahí hay una instrucción del programa.`,
  // prettier-ignore
  "address-is-reserved": address => `El programa intentó escribir en la dirección ${MemoryAddress.format(address)}, que está reservada por el sistema.`,
  // prettier-ignore
  "address-out-of-range": address => `La dirección ${MemoryAddress.format(address)} no existe: la memoria llega hasta ${maxAddress}.`,
  "device-not-connected": (device: string) =>
    `${deviceName(device)} no está conectado a la computadora.`,
  // prettier-ignore
  "io-memory-not-connected": (address)=> `No hay ningún dispositivo conectado en la dirección de E/S ${IOAddress.format(address)}.`,
  // prettier-ignore
  "io-printer-conflict": () => "La impresora tiene que estar conectada al PIO o al Handshake, pero no a los dos a la vez.",
  "no-instruction": address =>
    `La CPU fue a buscar una instrucción a la dirección ${MemoryAddress.format(address)}, pero ahí no hay ninguna.`,
  "no-program": "No hay ningún programa cargado. Ensamblá el programa antes de ejecutarlo.",
  "stack-overflow": "La pila se llenó (desborde de pila).",
  "stack-underflow": "Se intentó sacar un dato de la pila, pero la pila está vacía.",
  "unexpected-error": err => `Error inesperado: ${String(err)}`,
};
