import { syscalls, unassigned } from "@vonsim/assembler";
import { MemoryAddress, MemoryAddressLike } from "@vonsim/common/address";
import { Byte } from "@vonsim/common/byte";
import type { JsonValue } from "type-fest";

import { Component, ComponentInit } from "./component";
import { SimulatorError } from "./error";
import type { EventGenerator } from "./events";

export type MemoryOperation =
  | { type: "memory:read"; address: MemoryAddressLike }
  | { type: "memory:read.ok"; address: MemoryAddress; value: Byte<8> }
  | { type: "memory:read.error"; error: SimulatorError<"address-out-of-range"> }
  | { type: "memory:write"; address: MemoryAddressLike; value: Byte<8> }
  | { type: "memory:write.ok"; address: MemoryAddress; value: Byte<8> }
  | {
      type: "memory:write.error";
      error:
        | SimulatorError<"address-has-instruction">
        | SimulatorError<"address-is-reserved">
        | SimulatorError<"address-out-of-range">;
    }
  | { type: "memory:write.warning"; warning: string };

/**
 * Memory.
 * @see {@link https://vonsim.github.io/en/computer/memory}
 *
 * It has the memory itself ({@link Memory.#buffer}) and a set of reserved memory addresses.
 * These reserved addresses are the ones that are used by the instructions, and they are
 * stored to prevent the user from writing to them.
 *
 * ---
 * This class is: MUTABLE
 */
export class Memory extends Component {
  static readonly SIZE = MemoryAddress.MAX_ADDRESS + 1;

  #buffer: Uint8Array;
  #codeMemory: Set<number>;
  #reservedMemory: Set<number>;

  constructor(options: ComponentInit) {
    super(options);
    if (options.data === "unchanged") {
      this.#buffer = options.previous.memory.#buffer;
    } else if (options.data === "randomize") {
      this.#buffer = new Uint8Array(Memory.SIZE).map(() => Byte.random(8).unsigned);
    } else {
      this.#buffer = new Uint8Array(Memory.SIZE).fill(0);
    }

    // Inicializar la posición FFh (255) en 1 (dato cargado por el sistema operativo)
    this.#buffer[0xff] = 1;

    // Verificar si el programa contiene alguna instrucción INT
    const hasINTInstruction = options.program.instructions.some(
      instruction => instruction.instruction === "INT",
    );

    // Load syscalls addresses into memory only if hasINTInstruction is true
    this.#reservedMemory = new Set();
    if (hasINTInstruction) {
      for (const [number, address] of syscalls) {
        const start = number; // Interrupt vector position
        this.#buffer[start] = address.unsigned;
        this.#reservedMemory.add(start);

        // Las instrucciones de las rutinas de interrupción (como INT 6)
        // se inyectan automáticamente en la CPU, no es necesario
        // inyectarlas aquí como bytecodes
      }
    }

    // Load data directives into memory
    for (const directive of options.program.data) {
      let offset = directive.start.value;
      for (const value of directive.getValues()) {
        if (value !== unassigned) this.#buffer.set(value.toUint8Array(), offset);
        offset += directive.size / 8;
      }
    }

    // Load instructions into memory
    this.#codeMemory = new Set();

    // Si el programa contiene instrucciones INT, cargar las rutinas del sistema
    if (hasINTInstruction) {
      // Cargar la rutina INT 6 en memoria (lectura de teclado)
      const int6Bytecodes = [
        0xd0, // C0h: push AL
        0xd8,
        0x32, // C1h: in AL, 32h (wait_for_key) - leer estado (CA)
        0xa2,
        0x01, // C3h: cmp AL, 1 - comparar con 1 (sin tecla)
        0xc2,
        0xc1, // C5h: jnz wait_for_key
        0xd8,
        0x30, // C7h: in AL, 30h - leer carácter (PA)
        0x24, // CAh: mov [BL], AL
        0xd4, // C9h: pop AL
        0xe1, // CBh: iret
      ];

      const int6Address = 0xc0;
      for (let i = 0; i < int6Bytecodes.length; i++) {
        this.#buffer[int6Address + i] = int6Bytecodes[i];
        this.#codeMemory.add(int6Address + i);
      }

      // Cargar la rutina INT 7 en memoria (escritura en pantalla)
      // NOTA: Los bytecodes se generan automáticamente desde cpu/index.ts
      // La rutina se ejecuta desde las instrucciones ensambladas, no desde estos bytecodes
      const int7Bytecodes = [
        0xd3, // D0h: push DL
        0xd2, // D1h: push CL
        0x1e,
        0xe7, // D2h: mov DL, 0E7h
        0xa2,
        0x00, // D4h: cmp AL, 0 (int7_loop)
        0xc1,
        0xe8, // D6h: jz int7_end
        0x19, // D8h: mov CL, [BL]
        0xd1, // D9h: push BL
        0x07, // DAh: mov BL, DL
        0x26, // DBh: mov [BL], CL
        0xda, // DCh: out 33h, CL
        0x33,
        0xd5, // DEh: pop BL
        0x45, // DFh: inc BL
        0x47, // E0h: inc DL
        0x46, // E1h: dec AL
        0xc0,
        0xd4, // E2h: jmp int7_loop
        0xd6, // E4h: pop CL
        0xd7, // E5h: pop DL
        0xe1, // E6h: iret
      ];

      const int7Address = 0xd0;
      for (let i = 0; i < int7Bytecodes.length; i++) {
        this.#buffer[int7Address + i] = int7Bytecodes[i];
        this.#codeMemory.add(int7Address + i);
      }
    }

    // Cargar las instrucciones del programa del usuario
    for (const instruction of options.program.instructions) {
      this.#buffer.set(instruction.toBytes(), instruction.start.value);
      for (let i = 0; i < instruction.length; i++) {
        this.#codeMemory.add(instruction.start.value + i);
      }
    }
  }

  /**
   * Reads a byte from memory at the specified address.
   * @param address The address to read the byte from.
   * @returns The byte at the specified address (always 8-bit) or null if there was an error.
   *
   * ---
   * Called by the CPU.
   */
  *read(address: MemoryAddressLike): EventGenerator<Byte<8> | null> {
    address = Number(address);
    yield { type: "memory:read", address };

    if (!MemoryAddress.inRange(address)) {
      yield {
        type: "memory:read.error",
        error: new SimulatorError("address-out-of-range", address),
      };
      return null;
    }

    const value = Byte.fromUnsigned(this.#buffer.at(address)!, 8);
    yield { type: "memory:read.ok", address: MemoryAddress.from(address), value };
    return value;
  }

  /**
   * Writes a byte to memory at the specified address.
   * @param address The address to write the byte to.
   * @param value The byte to write.
   * @returns Whether the operation succedeed or not (boolean).
   *
   * ---
   * Called by the CPU.
   */
  *write(address: MemoryAddressLike, value: Byte<8>): EventGenerator<boolean> {
    address = Number(address);
    yield { type: "memory:write", address, value };

    if (!MemoryAddress.inRange(address)) {
      yield {
        type: "memory:write.error",
        error: new SimulatorError("address-out-of-range", address),
      };
      return false;
    }

    /* if (this.#codeMemory.has(address)) {
      yield {
        type: "memory:write.error",
        error: new SimulatorError("address-has-instruction", address),
      };
      return false;
    }*/

    if (this.#codeMemory.has(address)) {
      // Emitir un evento de advertencia en lugar de un error
      yield {
        type: "memory:write.warning",
        warning: `Sobrescribiendo instrucción en la dirección ${MemoryAddress.format(address)}`,
      };
      console.warn(
        `Advertencia: Sobrescribiendo instrucción en la dirección ${MemoryAddress.format(address)}`,
      );
      // Continuar la ejecución sin detener el programa
    }

    /*if (this.#reservedMemory.has(address)) {
      yield {
        type: "memory:write.error",
        error: new SimulatorError("address-is-reserved", address),
      };
      return false;
    }*/

    this.#buffer.set([value.unsigned], address);
    yield { type: "memory:write.ok", address: MemoryAddress.from(address), value };
    return true;
  }

  toJSON() {
    return [...this.#buffer] satisfies JsonValue;
  }
}
