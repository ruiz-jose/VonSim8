import { SyscallNumber, syscalls } from "@vonsim/assembler";
import { Byte } from "@vonsim/common/byte";

import type { Computer } from "../computer";
import { SimulatorError } from "../error";
import type { EventGenerator } from "../events";

/**
 * @see {@link https://vonsim.github.io/docs/cpu/#llamadas-al-sistema}.
 * @param address Address
 * @returns if address points to a syscall,  returns the syscall number. null otherwise.
 */
export function getSyscallNumber(address: Byte<16>): SyscallNumber | null {
  for (const [n, addr] of syscalls) {
    if (addr.unsigned === address.unsigned) return n;
  }
  return null;
}

/**
 * Executes the desired syscall.
 * @see {@link https://vonsim.github.io/docs/cpu/#llamadas-al-sistema}.
 * @param address Syscall address ({@link syscallsAddresses})
 * @returns Whether the operation was successful.
 *
 * ---
 * Called by the CPU ({@link CPU.run}).
 */
export function* handleSyscall(
  computer: Computer,
  syscall: SyscallNumber,
): EventGenerator<boolean> {
  switch (syscall) {
    case 0: {
      // INT 0 - Halt
      yield { type: "cpu:int.0" };
      return false; // Halt
    }

    case 6: {
      // INT 6 - Read character from the keyboard and store it in [BX]
      // La rutina INT 6 está inyectada en memoria (C0h)
      // El PIOKeyboard maneja la lectura del teclado a través de los puertos 30h y 31h.
      yield { type: "cpu:int.6" };

      if (!("keyboard" in computer.io)) {
        yield { type: "cpu:error", error: new SimulatorError("device-not-connected", "keyboard") };
        return false;
      }

      // La rutina de interrupción debe ejecutarse desde C0h
      // No restauramos el estado aquí, será restaurado por IRET
      return true;
    }

    case 7: {
      // INT 7 - Write string to the screen, starting from [BX] and of length AL
      yield { type: "cpu:int.7" };

      if (!("screen" in computer.io)) {
        yield { type: "cpu:error", error: new SimulatorError("device-not-connected", "screen") };
        return false;
      }

      // Guardar DL en el stack
      if (!(yield* computer.cpu.pushToStack("DL"))) return false; // Stack overflow

      let video = 0xe7; // Dirección base de video
      
      while (!computer.cpu.getRegister("AL").isZero()) {
        // Leer carácter desde [BX]
        yield* computer.cpu.copyByteRegister("BL", "ri.l");
        yield* computer.cpu.setMAR("ri");
        if (!(yield* computer.cpu.useBus("mem-read"))) return false;
        yield* computer.cpu.getMBR("DL");

        // Escribir en memoria de video en la dirección 'video'
        yield* computer.cpu.updateByteRegister("ri.l", Byte.fromUnsigned(video, 8));
        yield* computer.cpu.setMAR("ri");
        yield* computer.cpu.setMBR("DL");
        if (!(yield* computer.cpu.useBus("mem-write"))) return false;

        // Enviar carácter a la pantalla
        const char = computer.cpu.getRegister("DL");
        yield* computer.io.screen.sendChar(char);

        video++;

        // INC BL
        yield* computer.cpu.copyByteRegister("BL", "left.l");
        yield* computer.cpu.updateWordRegister("right", Byte.fromUnsigned(1, 16));
        const BX = computer.cpu.getRegister("BX").add(1);
        yield* computer.cpu.aluExecute("ADD", BX, {
          CF: false,
          OF: BX.signed < 0,
          SF: BX.signed < 0,
          ZF: false,
        });
        yield* computer.cpu.copyByteRegister("result.l", "BL");

        // DEC AL
        yield* computer.cpu.copyByteRegister("AL", "left.l");
        yield* computer.cpu.updateByteRegister("right.l", Byte.fromUnsigned(1, 8));
        const AL = computer.cpu.getRegister("AL").add(-1);
        yield* computer.cpu.aluExecute("SUB", AL, {
          CF: false,
          OF: AL.signed === Byte.maxSignedValue(8),
          SF: AL.signed < 0,
          ZF: AL.isZero(),
        });
        yield* computer.cpu.copyByteRegister("result.l", "AL");
      }

      // Restaurar DL del stack
      if (!(yield* computer.cpu.popFromStack("DL"))) return false; // Stack underflow

      return false; // No ejecutar rutina en ensamblador
    }

    // It's not a special interrupt, so we
    // start the normal interrupt routine
    default:
      throw new Error("Invalid interrupt number");
  }

  // Retrieve machine state
  if (!(yield* computer.cpu.popFromStack("IP.l"))) return false; // Stack underflow
  //yield* computer.cpu.copyWordRegister("id", "IP");
  if (!(yield* computer.cpu.popFromStack("FLAGS.l"))) return false; // Stack underflow
  //yield* computer.cpu.copyWordRegister("id", "FLAGS");
  return true;
}
