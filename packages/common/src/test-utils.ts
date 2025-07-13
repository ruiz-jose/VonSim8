/**
 * Utilidades comunes para testing
 */

/**
 * Helper para crear programas de assembly simples para testing
 */
export function createTestProgram(instructions: string[]): string {
  return [...instructions, "END"].join("\n");
}

/**
 * Datos de test reutilizables
 */
export const testPrograms = {
  simple: createTestProgram(["MOV AX, 10h"]),
  arithmetic: createTestProgram(["MOV AX, 10h", "MOV BX, 20h", "ADD AX, BX"]),
  loop: createTestProgram(["MOV CX, 5", "loop_start:", "DEC CX", "JNZ loop_start"]),
  fibonacci: createTestProgram([
    "MOV AX, 0",
    "MOV BX, 1",
    "MOV CX, 10",
    "fib_loop:",
    "CMP CX, 0",
    "JZ done",
    "MOV DX, AX",
    "ADD AX, BX",
    "MOV BX, DX",
    "DEC CX",
    "JMP fib_loop",
    "done:",
  ]),
};

/**
 * Configuración estándar de dispositivos para testing
 */
export const testDevicesConfig = {
  keyboardAndScreen: false,
  pic: false,
  pio: null,
  handshake: null,
} as const;
