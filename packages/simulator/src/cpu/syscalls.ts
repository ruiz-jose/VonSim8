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
      // IMPORTANTE: Esta función se ejecuta cuando IP apunta a una dirección de syscall (0xD0)
      // pero no debería ejecutarse si la instrucción INT 7 se llamó normalmente,
      // ya que en ese caso la rutina en ensamblador se ejecuta automáticamente.
      // Este caso solo maneja la situación donde no hay instrucciones en la dirección del syscall.
      yield { type: "cpu:int.7" };

      if (!("screen" in computer.io)) {
        yield { type: "cpu:error", error: new SimulatorError("device-not-connected", "screen") };
        return false;
      }

      // La rutina de interrupción debe ejecutarse desde D0h
      // Como las instrucciones ya están inyectadas en el CPU,
      // simplemente continuamos y dejaremos que se ejecuten normalmente
      return true;
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
