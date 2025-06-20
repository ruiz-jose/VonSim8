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
    this.#buffer[0xFF] = 1;
    
    // Verificar si el programa contiene alguna instrucción INT
    const hasINTInstruction = options.program.instructions.some(instruction => instruction.instruction === "INT");

    // Load syscalls addresses into memory only if hasINTInstruction is true
    this.#reservedMemory = new Set();
    if (hasINTInstruction) {
      for (const [number, address] of syscalls) {
        const start = number; // Interrupt vector position
        this.#buffer[start] = address.unsigned;
        this.#reservedMemory.add(start);


                // Inject the INT 6 handler routine at address C0h
        if (number === 6) {
          const int6Handler = [
            0xD0, // push AL
            0xd8, 0x30, // in AL, 30h
            0x12, 0x01, // cmp AL, 1
            0xC1, 0xC1, // jz wait_for_key (-6 bytes)
            0xd8, 0x31, // in AL, 31h
            0xD4, // pop AL
            0x41, // mov [BX], AL
            0xE1, // iret
          ];
      
        // Inject the INT 6 handler routine at address C0h
      /*  if (number === 6) {
          const int6Handler = [
            0xD0, // push AL
            0xd8, 0x64, // in AL, 64h
            0x12, 0x01, // cmp AL, 1
            0xC1, 0xC1, // jz wait_for_key (-6 bytes)
            0xd8, 0x60, // in AL, 60h
            0xD4, // pop AL
            0x41, // mov [BX], AL
            0xE1, // iret
          ];*/
          const int6HandlerAddress = address.unsigned;
          for (let i = 0; i < int6Handler.length; i++) {
            this.#buffer[int6HandlerAddress + i] = int6Handler[i];
            this.#reservedMemory.add(int6HandlerAddress + i);
          }
        }  
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
      console.warn(`Advertencia: Sobrescribiendo instrucción en la dirección ${MemoryAddress.format(address)}`);
      // Continuar la ejecución sin detener el programa
    }

    if (this.#reservedMemory.has(address)) {
      yield {
        type: "memory:write.error",
        error: new SimulatorError("address-is-reserved", address),
      };
      return false;
    }

    this.#buffer.set([value.unsigned], address);
    yield { type: "memory:write.ok", address: MemoryAddress.from(address), value };
    return true;
  }

  toJSON() {
    return [...this.#buffer] satisfies JsonValue;
  }
}
