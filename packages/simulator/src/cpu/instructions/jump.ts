import type { Computer } from "../../computer";
import type { EventGenerator } from "../../events";
import { Instruction } from "../instruction";

/**
 * Jump instructions:
 * - {@link https://vonsim.github.io/docs/cpu/instructions/jc/ | JC}
 * - {@link https://vonsim.github.io/docs/cpu/instructions/jnc/ | JNC}
 * - {@link https://vonsim.github.io/docs/cpu/instructions/jz/ | JZ}
 * - {@link https://vonsim.github.io/docs/cpu/instructions/jnz/ | JNZ}
 * - {@link https://vonsim.github.io/docs/cpu/instructions/js/ | JS}
 * - {@link https://vonsim.github.io/docs/cpu/instructions/jns/ | JNS}
 * - {@link https://vonsim.github.io/docs/cpu/instructions/jo/ | JO}
 * - {@link https://vonsim.github.io/docs/cpu/instructions/jno/ | JNO}
 * - {@link https://vonsim.github.io/docs/cpu/instructions/jmp/ | JMP}
 * - {@link https://vonsim.github.io/docs/cpu/instructions/call/ | CALL}
 *
 * @see {@link Instruction}
 *
 * ---
 * This class is: IMMUTABLE
 */
export class JumpInstruction extends Instruction<
  "JC" | "JNC" | "JZ" | "JNZ" | "JS" | "JNS" | "JO" | "JNO" | "JMP" | "CALL"
> {
  get jumpTo() {
    return this.statement.address;
  }

  *execute(computer: Computer): EventGenerator<boolean> {
    yield {
      type: "cpu:cycle.start",
      instruction: {
        name: this.name,
        position: this.position,
        operands: [this.jumpTo.toString(false)],
        // willUse: { id: this.name === "CALL", ri: true },
        willUse: { id: false, ri: this.name === "CALL" },
      },
    };

    // Read opcode.
    yield* super.consumeInstruction(computer, "IR");
    yield { type: "cpu:decode" };
    yield { type: "cpu:cycle.update", phase: "decoded", next: "fetch-operands" };

    // Consume jump address
    yield* super.consumeInstruction(computer, "ri.l");
    // yield* super.consumeInstruction(computer, "ri.h");

    yield { type: "cpu:cycle.update", phase: "execute" };

    let jump: boolean;
    switch (this.name) {
      case "JC":
        jump = computer.cpu.getFlag("CF");
        break;
      case "JNC":
        jump = !computer.cpu.getFlag("CF");
        break;
      case "JZ":
        jump = computer.cpu.getFlag("ZF");
        break;
      case "JNZ":
        jump = !computer.cpu.getFlag("ZF");
        break;
      case "JS":
        jump = computer.cpu.getFlag("SF");
        break;
      case "JNS":
        jump = !computer.cpu.getFlag("SF");
        break;
      case "JO":
        jump = computer.cpu.getFlag("OF");
        break;
      case "JNO":
        jump = !computer.cpu.getFlag("OF");
        break;
      case "CALL":
      case "JMP":
        jump = true;
        break;
      default: {
        const _exhaustiveCheck: never = this.name;
        return _exhaustiveCheck;
      }
    }

    if (jump) {
      if (this.name === "CALL") {
        // yield* computer.cpu.copyByteRegister("IP.l", "id.l");
        // yield* computer.cpu.copyByteRegister("ri.l", "IP.l");
        if (!(yield* computer.cpu.pushToStack("IP.l"))) return false; // Stack overflow
        yield* computer.cpu.copyByteRegister("ri.l", "IP.l");
      } else {
        //yield* computer.cpu.copyWordRegister("ri", "IP");
        // Mostrar el valor de MBR antes de asignarlo a IP.l
        //console.log("Valor de MBR antes de asignarlo a IP.l:", computer.cpu.getRegister("MBR"));
        yield* computer.cpu.copyByteRegister("ri.l", "IP.l");
      }
    }

    return true;
  }
}
