import type { Language } from "@vonsim/common/i18n";

import type { SimulatorErrorCode } from ".";

/**
 * Short correction hints for the most common simulator errors, meant for
 * beginners. Not every error needs one.
 */
export type Hints = Partial<Record<SimulatorErrorCode, string>>;

export const spanishHints: Hints = {
  "address-has-instruction":
    "Guardá los datos en otra zona de memoria (por ejemplo, después de ORG 80h) para que no se pisen con el código.",
  "device-not-connected": "Conectalo desde la configuración de dispositivos y volvé a ejecutar.",
  "io-memory-not-connected": "Revisá la dirección de IN/OUT y que el dispositivo esté conectado.",
  "io-printer-conflict": "Elegí una sola conexión para la impresora en la configuración.",
  "no-instruction":
    "Seguramente falta HLT al final del programa, o un salto (JMP, CALL) va a una dirección sin código.",
  "stack-overflow":
    "Revisá que cada PUSH tenga su POP y que las subrutinas no se llamen a sí mismas sin fin.",
  "stack-underflow": "Revisá que no haya más POP que PUSH, ni un RET sin su CALL.",
};

export const englishHints: Hints = {
  "address-has-instruction":
    "Store data in another memory area (e.g. after ORG 80h) so it doesn't overwrite the code.",
  "device-not-connected": "Connect it in the device settings and run again.",
  "io-memory-not-connected": "Check the IN/OUT address and that the device is connected.",
  "io-printer-conflict": "Choose a single connection for the printer in the settings.",
  "no-instruction":
    "Probably HLT is missing at the end of the program, or a jump (JMP, CALL) goes to an address without code.",
  "stack-overflow":
    "Check that every PUSH has its POP and that subroutines don't call themselves endlessly.",
  "stack-underflow": "Check there aren't more POPs than PUSHes, or a RET without its CALL.",
};

const HINTS: Record<Language, Hints> = { en: englishHints, es: spanishHints };

export function getHint(lang: Language, code: SimulatorErrorCode): string | null {
  return HINTS[lang][code] ?? null;
}
