import { IOAddress, MemoryAddress } from "@vonsim/common/address";

import type { Messages } from "..";

const maxAddress = MemoryAddress.from(MemoryAddress.MAX_ADDRESS).toString();
const maxIOAddress = IOAddress.from(IOAddress.MAX_ADDRESS).toString();

/**
 * Nombres legibles para los tipos de token del lexer, así los mensajes no
 * muestran nombres internos como `IDENTIFIER` o `EOL` a los alumnos.
 */
const TOKEN_NAMES: Record<string, string> = {
  LEFT_PAREN: "un paréntesis «(»",
  RIGHT_PAREN: "un paréntesis «)»",
  LEFT_BRACKET: "un corchete «[»",
  RIGHT_BRACKET: "un corchete «]»",
  COMMA: "una coma «,»",
  QUESTION_MARK: "un signo «?»",
  PLUS: "un signo «+»",
  MINUS: "un signo «-»",
  ASTERISK: "un signo «*»",
  IDENTIFIER: "un nombre",
  LABEL: "una etiqueta",
  CHARACTER: "un carácter",
  STRING: "un texto entre comillas",
  NUMBER: "un número",
  EOL: "el fin de la línea",
  EOF: "el fin del programa",
};

/** Convierte un tipo de token (o varios separados por coma) en texto legible. */
export function tokenName(type: string): string {
  const names = type.split(",").map(t => TOKEN_NAMES[t] ?? `«${t}»`);
  if (names.length === 1) return names[0];
  return `${names.slice(0, -1).join(", ")} o ${names.at(-1)}`;
}

export const spanish: Messages = {
  // prettier-ignore
  "address-has-code": address => `La dirección ${MemoryAddress.format(address)} ya contiene instrucciones del programa, así que no se puede usar para guardar datos.`,
  // prettier-ignore
  "address-out-of-range": address => `La dirección ${MemoryAddress.format(address)} no existe: la memoria llega hasta ${maxAddress}.`,
  "cannot-accept-strings": directive => `${directive} no acepta textos entre comillas.`,
  "cannot-be-indirect": "Este operando no puede usar direccionamiento indirecto ([BL]).",
  "cannot-be-unassinged": directive =>
    `${directive} necesita un valor; no se puede dejar sin asignar con «?».`,
  "cannot-be-word": "Este operando no puede ser de 16 bits.",
  "circular-reference": "Hay una referencia circular: una constante se define usándose a sí misma.",
  "constant-must-have-a-label": "A la constante EQU le falta un nombre (etiqueta) antes.",
  "constant-must-have-one-value": "Una constante EQU debe tener exactamente un valor.",
  "destination-cannot-be-immediate": "El destino no puede ser un número fijo (valor inmediato).",
  "double-memory-access":
    "Esta instrucción usa la memoria en los dos operandos, y eso no está permitido.",
  "duplicated-label": label => `La etiqueta «${label}» está definida más de una vez.`,
  "empty-program":
    "El programa está vacío o no tiene instrucciones para ejecutar.\n\nUn programa válido necesita al menos una instrucción. Por ejemplo:\n\n    mov al, 3\n    hlt\n\nMirá los ejemplos del menú «Abrir» para más ayuda.",
  "end-must-be-the-last-statement":
    "Hay código después de END. END tiene que ser la última línea del programa.",
  "equ-not-found": label => `No se encontró la constante EQU «${label}».`,
  "expects-ax": "Este operando tiene que ser el registro AL.",
  "expects-dx": "Acá el único registro permitido es DL.",
  "expects-immediate": "Este operando tiene que ser un número fijo (valor inmediato).",
  "expects-label": "Este operando tiene que ser una etiqueta.",
  "expects-no-operands": "Esta instrucción no lleva operandos.",
  "expects-one-operand": "Esta instrucción lleva exactamente un operando.",
  "expects-two-operands": "Esta instrucción lleva dos operandos separados por coma.",
  "expects-word-register": "Esta instrucción necesita un registro de 8 bits como operando.",
  "parser.data-block-no-parameters":
    "La directiva .DATA no lleva nada más en la línea (solo se permite un comentario).",
  "parser.code-block-no-parameters":
    "La directiva .CODE no lleva nada más en la línea (solo se permite un comentario).",
  // prettier-ignore
  "instruction-out-of-range": address => `Esta instrucción quedaría en la dirección ${MemoryAddress.format(address)}, que está fuera de la memoria (llega hasta ${maxAddress}).`,
  "invalid-interrupt": interrupt => `${interrupt} no es un número de interrupción válido.`,
  // prettier-ignore
  "io-address-out-of-range": address => `La dirección de E/S ${address} no existe: las direcciones de E/S llegan hasta ${maxIOAddress}.`,
  "label-not-found": label => `La etiqueta «${label}» no está definida.`,
  // prettier-ignore
  "label-should-be-a-number": label => `«${label}» es una variable, no un número. Si querés su dirección, escribí OFFSET ${label}.`,
  // prettier-ignore
  "label-should-be-an-instruction": label => `«${label}» tiene que ser la etiqueta de una instrucción para poder saltar o llamar a ella.`,
  // prettier-ignore
  "missing-org": "Falta un ORG antes de esta instrucción, así que no se sabe en qué dirección de memoria ubicarla.",
  "must-have-one-or-more-values": directive => `${directive} necesita al menos un valor.`,
  // prettier-ignore
  "occupied-address": address => `Esta instrucción quedaría en la dirección ${MemoryAddress.format(address)}, que ya está ocupada por otra parte del programa.`,
  "offset-only-with-data-directive":
    "OFFSET solo se puede usar con variables (definidas con DB o DW).",
  // prettier-ignore
  "reserved-address": address => `Esta instrucción quedaría en la dirección ${MemoryAddress.format(address)}, que está reservada por el sistema.`,
  // prettier-ignore
  "size-mismatch": (src, out) => `Los operandos son de distinto tamaño: uno es de ${src} bits y el otro de ${out} bits. Tienen que ser del mismo tamaño.`,
  "unexpected-error": err => `Error inesperado: ${String(err)}`,
  // prettier-ignore
  "unknown-size": "No se sabe si este acceso a memoria es de 8 o de 16 bits. Indicalo con BYTE PTR o WORD PTR antes de la dirección.",
  // prettier-ignore
  "value-out-of-range": (value, size) => `El número ${value} no entra en ${size} bits.`,

  lexer: {
    "character-too-long": "Entre comillas simples va un solo carácter.",
    "empty-character": "Las comillas simples están vacías: falta el carácter.",
    "invalid-binary": "Número binario inválido: solo puede tener ceros y unos.",
    "invalid-decimal": "Número decimal inválido: solo puede tener dígitos del 0 al 9.",
    "only-ascii":
      "Solo se permiten caracteres ASCII (sin tildes, ñ ni símbolos especiales) en caracteres y textos.",
    "unexpected-character": char => `El carácter «${char}» no se reconoce.`,
    "unterminated-character": "Falta cerrar la comilla simple del carácter.",
    "unterminated-string": "Falta cerrar las comillas del texto.",
  },

  parser: {
    // prettier-ignore
    "ambiguous-unary": "La expresión es ambigua. Usá paréntesis para dejar claro el orden.",
    "expected-address-after-org":
      "Después de ORG tiene que ir una dirección, por ejemplo: ORG 20h.",
    "expected-argument": "Falta un operando.",
    "expected-eos": "Sobra algo al final de esta línea (o falta una coma entre los operandos).",
    "expected-instruction": got =>
      `Se esperaba una instrucción, pero se encontró ${tokenName(got.type)}.`,
    "expected-label-after-offset": "Después de OFFSET tiene que ir el nombre de una variable.",
    // prettier-ignore
    "expected-instruction-after-label": got => `Después de la etiqueta se esperaba una instrucción, pero se encontró ${tokenName(got.type)}.`,
    // prettier-ignore
    "expected-literal-after-expression": expected => `Falta «${expected}» después de la expresión.`,
    // prettier-ignore
    "expected-literal-after-literal": (expected, after) => `Falta «${expected}» después de «${after}».`,
    "expected-type": (expected, got) =>
      `Se esperaba ${tokenName(expected)}, pero se encontró ${tokenName(got)}.`,
    // prettier-ignore
    "indirect-addressing-must-be-bx": "Para el direccionamiento indirecto solo se puede usar el registro BL, por ejemplo: [BL].",
    "unclosed-parenthesis": "Falta cerrar un paréntesis.",
    // prettier-ignore
    "unexpected-identifier": "No se reconoce esta palabra. Si es una etiqueta, le falta «:» al final; si es una instrucción, revisá cómo está escrita.",
    "parser.data-block-no-parameters":
      "La directiva .DATA no lleva nada más en la línea (solo se permite un comentario).",
  },
};
