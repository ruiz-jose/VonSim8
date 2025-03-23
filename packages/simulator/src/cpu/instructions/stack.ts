import type { Computer } from "../../computer";
import type { EventGenerator } from "../../events";
import { Instruction } from "../instruction";

/**
 * Stack instructions:
 * - {@link https://vonsim.github.io/docs/cpu/instructions/push/ | PUSH}
 * - {@link https://vonsim.github.io/docs/cpu/instructions/pop/ | POP}
 * - {@link https://vonsim.github.io/docs/cpu/instructions/pushf/ | PUSHF}
 * - {@link https://vonsim.github.io/docs/cpu/instructions/popf/ | POPF}
 *
 * @see {@link Instruction}
 *
 * ---
 * This class is: IMMUTABLE
 */
export class StackInstruction extends Instruction<"PUSH" | "POP" | "PUSHF" | "POPF"> {
  *execute(computer: Computer): EventGenerator<boolean> {
    const register =
      this.statement.instruction === "PUSH" || this.statement.instruction === "POP"
        ? this.statement.register
        : "FLAGS";

    yield {
      type: "cpu:cycle.start",
      instruction: {
        name: this.name,
        position: this.position,
        operands: register !== "FLAGS" ? [register] : [],
        //willUse: { id: true },
        willUse: { id: false },
      },
    };

    // All these intructions are one byte long.
    yield* super.consumeInstruction(computer, "IR");
    yield { type: "cpu:decode" };
    yield { type: "cpu:cycle.update", phase: "decoded", next: "execute" };

    if (this.name === "PUSH" || this.name === "PUSHF") {
     // yield* computer.cpu.copyWordRegister(register, "id");
      const lowByteRegister = register === "FLAGS" ? "FLAGS.l" : `${register[0]}L` as "AL" | "BL" | "CL" | "DL";
      return yield* computer.cpu.pushToStack(lowByteRegister); // Will return false if stack overflow
    } else {
      const lowByteRegister = register === "FLAGS" ? "FLAGS.l" : `${register[0]}L` as "AL" | "BL" | "CL" | "DL";
        if (!(yield* computer.cpu.popFromStack(lowByteRegister))) return false; // Stack underflow
      //yield* computer.cpu.copyWordRegister("id", register);
      return true;
    }
  }
}
