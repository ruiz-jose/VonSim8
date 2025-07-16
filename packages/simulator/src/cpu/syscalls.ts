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
      yield { type: "cpu:int.6" };

      if (!("keyboard" in computer.io)) {
        yield { type: "cpu:error", error: new SimulatorError("device-not-connected", "keyboard") };
        return false;
      }

      /*org 20h
      int 6
      hlt         ; Detiene la ejecución


      org 0C0h
      push AL
      wait_for_key:
      in AL, 64h
      cmp AL, 1
      jz wait_for_key 
      in AL, 60h
      pop AL
      mov [BL], AL
      iret*/

      //org 0C0h
      //push AL
      yield* computer.cpu.setMAR("IP");
      if (!(yield* computer.cpu.useBus("mem-read"))) return false; // Error reading memory
      // Incrementar el registro IP manualmente si es necesario
      yield* computer.cpu.updateWordRegister("IP", IP => IP.add(1));
      yield* computer.cpu.getMBR("IR");
      if (!(yield* computer.cpu.pushToStack("AL"))) return false; // Stack overflow

      // in AL, 64h
      /*yield* computer.cpu.setMAR("IP");
      if (!(yield* computer.cpu.useBus("mem-read"))) return false; // Error reading memory
      // Incrementar el registro IP manualmente si es necesario
      yield* computer.cpu.updateWordRegister("IP", IP => IP.add(1));
      yield* computer.cpu.setMAR("IP");
      if (!(yield* computer.cpu.useBus("mem-read"))) return false; // Error reading memory
      yield* computer.cpu.setMAR("ri");*/

      const keyboard = computer.io.keyboard;
      if (!keyboard) {
        yield { type: "cpu:error", error: new SimulatorError("device-not-connected", "keyboard") };
        return false;
      }
      const char = yield* keyboard.readChar();

      //yield* computer.cpu.updateByteRegister("id.l",char);
      yield* computer.cpu.updateByteRegister("AL", char);

      //yield* computer.cpu.copyWordRegister("BX", "ri");
      yield* computer.cpu.copyByteRegister("BL", "ri.l");

      yield* computer.cpu.setMAR("ri");
      yield* computer.cpu.setMBR("AL");
      if (!(yield* computer.cpu.useBus("mem-write"))) return false; // Error writing to memory
      if (!(yield* computer.cpu.popFromStack("AL"))) return false; // Stack underflow
      // Doesn't return -- retrieves machine state
      break;
    }

    case 7: {
      // INT 7 - Write string to the screen, starting from [BX] and of length AL
      yield { type: "cpu:int.7" };

      if (!("screen" in computer.io)) {
        yield { type: "cpu:error", error: new SimulatorError("device-not-connected", "screen") };
        return false;
      }

      // Push AX and BX to stack
      //yield* computer.cpu.copyWordRegister("AX", "id");
      //if (!(yield* computer.cpu.pushToStack("AL"))) return false; // Stack overflow
      //yield* computer.cpu.copyWordRegister("BX", "id");
      //if (!(yield* computer.cpu.pushToStack("BL"))) return false; // Stack overflow
      if (!(yield* computer.cpu.pushToStack("DL"))) return false; // Stack overflow

      // CMP AL, 0 -- Check if length is 0
      /*  yield* computer.cpu.copyByteRegister("AL", "left.l");
      yield* computer.cpu.updateByteRegister("right.l", Byte.fromUnsigned(1, 8));
      const AL = computer.cpu.getRegister("AL");
      yield* computer.cpu.aluExecute("CMP", AL, {
        CF: false,
        OF: false,
        SF: AL.signed < 0,
        ZF: AL.isZero(),
      });*/
      let video = 0xd8;
      while (!computer.cpu.getRegister("AL").isZero()) {
        // Read character from [BX]
        yield* computer.cpu.copyWordRegister("BX", "ri");
        yield* computer.cpu.setMAR("ri");
        if (!(yield* computer.cpu.useBus("mem-read"))) return false; // Error reading from memory
        //yield* computer.cpu.getMBR("id.l");
        yield* computer.cpu.getMBR("DL");

        yield* computer.cpu.updateByteRegister("ri.l", Byte.fromUnsigned(video, 8));
        yield* computer.cpu.setMAR("ri");
        yield* computer.cpu.setMBR("DL");
        if (!(yield* computer.cpu.useBus("mem-write"))) return false; // Error writing to memory

        // Send character to the screen
        const char = computer.cpu.getRegister("DL");
        if (computer.io.screen) {
          yield* computer.io.screen.sendChar(char);
        } else {
          yield { type: "cpu:error", error: new SimulatorError("device-not-connected", "screen") };
          return false;
        }
        video++;

        // INC BX
        yield* computer.cpu.copyWordRegister("BX", "left");
        yield* computer.cpu.updateWordRegister("right", Byte.fromUnsigned(1, 16));
        const BX = computer.cpu.getRegister("BX").add(1); // Should always succeed, otherwise the memory would've thrown an error
        yield* computer.cpu.aluExecute("ADD", BX, {
          CF: false, // Never, since max value to add is 0x7FFF + 1 = 0x8000 (max memory address)
          OF: BX.signed < 0, // Only happens when 0x7FFF + 1 (max memory address)
          SF: BX.signed < 0,
          ZF: false, // Never, since max value to add is 0x7FFF + 1 = 0x8000 (max memory address)
        });
        yield* computer.cpu.copyWordRegister("result", "BX");
        // DEC AL
        yield* computer.cpu.copyByteRegister("AL", "left.l");
        yield* computer.cpu.updateByteRegister("right.l", Byte.fromUnsigned(1, 8));
        const AL = computer.cpu.getRegister("AL").add(-1); // Should always succeed, because AL != 0
        yield* computer.cpu.aluExecute("SUB", AL, {
          CF: false, // Never, will stop before doing 0 - 1
          OF: AL.signed === Byte.maxSignedValue(8), // True when 0x80 - 1
          SF: AL.signed < 0,
          ZF: AL.isZero(),
        });
        yield* computer.cpu.copyByteRegister("result.l", "AL");
      }

      // Pop BX and AX from stack
      //if (!(yield* computer.cpu.popFromStack("id.l"))) return false; // Stack underflow
      //yield* computer.cpu.copyWordRegister("id", "BX");
      //if (!(yield* computer.cpu.popFromStack("id.l"))) return false; // Stack underflow
      //yield* computer.cpu.copyWordRegister("id", "AX");
      if (!(yield* computer.cpu.popFromStack("DL"))) return false; // Stack underflow

      // Doesn't return -- retrieves machine state
      break;
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
