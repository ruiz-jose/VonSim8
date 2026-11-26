import type { Language } from "@vonsim/common/i18n";

import type { AssemblerErrorCode } from ".";

/**
 * Short correction hints for the most common assembler errors.
 *
 * They are shown below the error message in the editor, to help beginners
 * figure out how to fix the problem. Not every error needs a hint: only the
 * ones students run into most often.
 */
export type Hints = Partial<Record<AssemblerErrorCode, string>>;

export const spanishHints: Hints = {
  "double-memory-access":
    "Pasá el valor por un registro: primero MOV AL, origen y después MOV destino, AL.",
  "duplicated-label": "Cada etiqueta tiene que tener un nombre único. Renombrá una de las dos.",
  "end-must-be-the-last-statement": "Mové END al final o borrá las líneas que quedaron debajo.",
  "destination-cannot-be-immediate":
    "El primer operando es el destino y tiene que ser un registro o una dirección de memoria, por ejemplo: MOV AL, 5.",
  "expects-one-operand": "Ejemplo: INC AL.",
  "expects-two-operands": "Ejemplo: MOV AL, 5 (destino, origen).",
  "expects-no-operands":
    "Borrá lo que está después del nombre de la instrucción, por ejemplo: HLT.",
  "label-not-found":
    "Revisá que esté bien escrita y que esté definida: con «:» si es una instrucción (LAZO: ...) o con DB/DW si es una variable.",
  "label-should-be-a-number": "Ejemplo: MOV BL, OFFSET TABLA.",
  "missing-org": "Agregá una línea como ORG 20h antes de la primera instrucción.",
  "size-mismatch":
    "Usá registros del mismo tamaño (AL, BL, CL, DL son de 8 bits) o variables definidas con DB.",
  "unknown-size": "Ejemplo: MOV BYTE PTR [BL], 5.",
  "value-out-of-range":
    "Con 8 bits entran números de 0 a 255 (o de -128 a 127 con signo); con 16 bits, de 0 a 65535.",
  "lexer.unterminated-string": 'Agregá la comilla de cierre, por ejemplo: "Hola".',
  "lexer.unterminated-character": "Agregá la comilla de cierre, por ejemplo: 'A'.",
  "lexer.invalid-decimal":
    "Los números hexadecimales terminan en h, por ejemplo: 0Fh; los binarios en b: 1010b.",
  "parser.expected-eos":
    "Revisá si sobra una coma, un operando o falta «;» antes de un comentario.",
  "parser.expected-type":
    "Revisá la línea: puede faltar una coma entre operandos o sobrar algún símbolo.",
  "parser.indirect-addressing-must-be-bx": "Cargá la dirección en BL y usá [BL].",
  "parser.unexpected-identifier":
    "Las instrucciones válidas son, por ejemplo, MOV, ADD, CMP, JMP. Las etiquetas terminan en «:».",
  "parser.expected-address-after-org": "Ejemplo: ORG 20h.",
};

export const englishHints: Hints = {
  "double-memory-access":
    "Use a register in between: first MOV AL, source and then MOV destination, AL.",
  "duplicated-label": "Every label must have a unique name. Rename one of them.",
  "end-must-be-the-last-statement": "Move END to the end or delete the lines below it.",
  "destination-cannot-be-immediate":
    "The first operand is the destination and must be a register or a memory address, e.g. MOV AL, 5.",
  "expects-one-operand": "Example: INC AL.",
  "expects-two-operands": "Example: MOV AL, 5 (destination, source).",
  "expects-no-operands": "Remove what comes after the instruction name, e.g. HLT.",
  "label-not-found":
    "Check the spelling and that it is defined: with ':' for an instruction (LOOP: ...) or with DB/DW for a variable.",
  "label-should-be-a-number": "Example: MOV BL, OFFSET TABLE.",
  "missing-org": "Add a line like ORG 20h before the first instruction.",
  "size-mismatch":
    "Use registers of the same size (AL, BL, CL, DL are 8 bits) or variables defined with DB.",
  "unknown-size": "Example: MOV BYTE PTR [BL], 5.",
  "value-out-of-range": "8 bits hold 0 to 255 (or -128 to 127 signed); 16 bits hold 0 to 65535.",
  "lexer.unterminated-string": 'Add the closing quote, e.g. "Hello".',
  "lexer.unterminated-character": "Add the closing quote, e.g. 'A'.",
  "lexer.invalid-decimal":
    "Hexadecimal numbers end with h, e.g. 0Fh; binary numbers with b: 1010b.",
  "parser.expected-eos": "Check for an extra comma or operand, or a missing ';' before a comment.",
  "parser.expected-type":
    "Check the line: a comma between operands may be missing, or there's an extra symbol.",
  "parser.indirect-addressing-must-be-bx": "Load the address into BL and use [BL].",
  "parser.unexpected-identifier":
    "Valid instructions are, for example, MOV, ADD, CMP, JMP. Labels end with ':'.",
  "parser.expected-address-after-org": "Example: ORG 20h.",
};

const HINTS: Record<Language, Hints> = { en: englishHints, es: spanishHints };

export function getHint(lang: Language, code: AssemblerErrorCode): string | null {
  return HINTS[lang][code] ?? null;
}
