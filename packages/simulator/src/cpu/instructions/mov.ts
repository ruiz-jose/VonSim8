//import { Byte } from "@vonsim/common/byte";

import { ByteRegister } from "../../../../assembler/src/types";
import type { Computer } from "../../computer";
import type { EventGenerator } from "../../events";
import { Instruction } from "../instruction";
import { splitRegister } from "../utils";

/**
 * {@link https://vonsim.github.io/docs/cpu/instructions/mov/ | OV} instruction.
 *
 * @see {@link Instruction}
 *
 * ---
 * This class is: IMMUTABLE
 */
export class MOVInstruction extends Instruction<"MOV"> {
  get operation() {
    return this.statement.operation;
  }

  #formatOperands(): string[] {
    const { mode, out, src } = this.operation;

    switch (mode) {
      case "reg<-reg":
        return [out, src];

      case "reg<-mem": {
        const addr = src.mode === "direct" ? src.address.toString() : "BL";
        return [out, `[${addr}]`];
      }

      case "reg<-imd":
        return [out, `${src.toString("hex")}h`];

      case "mem<-reg": {
        const addr = out.mode === "direct" ? out.address.toString() : "BL";
        return [`[${addr}]`, src];
      }

      case "mem<-imd": {
        const addr = out.mode === "direct" ? out.address.toString() : "BL";
        return [`[${addr}]`, `${src.toString("hex")}h`];
      }

      default: {
        const _exhaustiveCheck: never = mode;
        return _exhaustiveCheck;
      }
    }
  }

  *execute(computer: Computer): EventGenerator<boolean> {
    const { mode, size, out, src } = this.operation;

    yield {
      type: "cpu:cycle.start",
      instruction: {
        name: this.name,
        position: this.position,
        operands: this.#formatOperands(),
        willUse: {
          //ri: mode === "mem<-imd",
          id: false,
          ri: this.operation.mode === "mem<-imd" && this.operation.out.mode === "direct", // Solo marcar `id` como true si es "mem<-imd" y "direct"
          //id: mode === "reg<-mem" || mode === "reg<-imd" || mode === "mem<-imd",
        },
      },
    };

    // All intructions are, at least, 2 bytes long.
    //yield* super.consumeInstruction(computer, "IR");
    //yield { type: "cpu:decode" };
    yield* super.consumeInstruction(computer, "IR");
    yield { type: "cpu:decode" };
    yield { type: "cpu:cycle.update", phase: "decoded", next: "fetch-operands" };

    if (
      this.operation.mode === "reg<-mem" ||
      this.operation.mode === "mem<-reg" ||
      this.operation.mode === "mem<-imd"
    ) {
      const mode =
        this.operation.mode === "reg<-mem" ? this.operation.src.mode : this.operation.out.mode;
      if (mode === "direct") {
        // Fetch memory address
        //if (this.operation.mode === "mem<-imd") yield* super.consumeInstruction(computer, "ri.l");
        //else yield* super.consumeInstruction(computer, "ri.l");
        yield* super.consumeInstruction(computer, "ri.l");
        // yield* super.consumeInstruction(computer, "ri.h");
      } else {
        if (this.operation.mode === "mem<-reg" || this.operation.mode === "reg<-mem") {
          // Move BL to ri para direccionamiento indirecto
          yield* computer.cpu.copyByteRegister("BL", "ri.l");
        }
      }
    }
    if (this.operation.mode === "reg<-imd") {
      // Emitir el evento de cambio de fase antes de copiar el valor inmediato
      yield { type: "cpu:cycle.update", phase: "writeback" };
      // Fetch immediate value and store it in id
      if (size === 8 && typeof out === "string") {
        yield* super.consumeInstruction(computer, out as ByteRegister); // Copiar directamente al registro `out`
      }
      //yield* super.consumeInstruction(computer, "id.l");
      if (this.operation.size === 16) yield* super.consumeInstruction(computer, "id.h");
    }

    if (this.operation.mode === "mem<-imd") {
      // Fetch immediate value and store it in id
      yield* super.consumeInstruction(computer, "ri.l", true); // Pasar true para saltar getMBR
      if (this.operation.size === 16) yield* super.consumeInstruction(computer, "id.h");
    }

    switch (mode) {
      case "reg<-reg": {
        // Emitir el evento de cambio de fase antes de la transferencia
        yield { type: "cpu:cycle.update", phase: "writeback" };
        // Simular transferencia por el bus de datos interno usando el MBR
        if (size === 8) {
          yield { type: "cpu:register.buscopy", src, dest: out, size: 8 };
        } else {
          const [srcLow, srcHigh] = splitRegister(src);
          const [outLow, outHigh] = splitRegister(out);
          yield { type: "cpu:register.buscopy", src: srcLow, dest: outLow, size: 8 };
          if (srcHigh && outHigh) {
            yield { type: "cpu:register.buscopy", src: srcHigh, dest: outHigh, size: 8 };
          }
        }
        return true;
      }
      case "reg<-mem": {
        yield* computer.cpu.setMAR("ri");
        if (!(yield* computer.cpu.useBus("mem-read"))) return false;
        // Emitir el evento de cambio de fase antes de copiar al registro destino
        yield { type: "cpu:cycle.update", phase: "writeback" };
        if (size === 8) {
          yield* computer.cpu.getMBR(out); // Copiar directamente al registro `out`
        }
        return true;
      }
      /*
      case "reg<-mem": {
        // Fetch low byte
        yield* computer.cpu.setMAR("ri");
        if (!(yield* computer.cpu.useBus("mem-read"))) return false; // Error reading from memory
        yield* computer.cpu.getMBR("id.l");
        if (size === 16) {
          // Write to register
          yield* computer.cpu.copyWordRegister("id", out);
        } else {
          yield* computer.cpu.copyByteRegister("id.l", out);
        }
          // Update high byte of ri with zero
        yield* computer.cpu.updateByteRegister("ri.h",Byte.zero(8));
        return true;
      }*/

      case "reg<-imd": {
        // Write to register
        //yield* computer.cpu.setMBR("id.l");
        if (size === 16) yield* computer.cpu.setMBR("id.h");
        if (size === 8) {
          //yield* computer.cpu.getMBR(out); // Copiar directamente al registro `out`
        }
        return true;
      }

      case "mem<-reg": {
        //const [low, high] = splitRegister(src);
        const [low] = splitRegister(src);
        // Write low byte
        yield* computer.cpu.setMAR("ri");
        // Emitir el evento de cambio de fase antes de copiar el registro al MBR
        yield { type: "cpu:cycle.update", phase: "writeback" };
        yield* computer.cpu.setMBR(low);
        if (!(yield* computer.cpu.useBus("mem-write"))) return false; // Error writing to memory
        /*  if (high) {
          // Write high byte
          yield* computer.cpu.updateWordRegister("ri", ri => ri.add(1));
          yield* computer.cpu.setMAR("ri");
          yield* computer.cpu.setMBR("id.h");
          if (!(yield* computer.cpu.useBus("mem-write"))) return false; // Error writing to memory
        }*/
        return true;
      }

      case "mem<-imd": {
        // Write low byte
        // Verificar si el direccionamiento es directo
        if (out.mode === "direct") {
          // Copiar de ID a RI si no es indirecto
          //yield* computer.cpu.copyByteRegister("id.l", "ri.l");
        } else {
          // Copiar de BL a RI si es indirecto
          yield* computer.cpu.copyByteRegister("BL", "ri.l");
        }
        yield* computer.cpu.setMAR("ri");
        // Emitir el evento de cambio de fase antes de copiar el valor al MBR
        yield { type: "cpu:cycle.update", phase: "writeback" };
        //yield* computer.cpu.setMBR("id.l");
        if (!(yield* computer.cpu.useBus("mem-write"))) return false; // Error writing to memory
        if (size === 16) {
          // Write high byte
          yield* computer.cpu.updateWordRegister("ri", ri => ri.add(1));
          yield* computer.cpu.setMAR("ri");
          yield* computer.cpu.setMBR("id.h");
          if (!(yield* computer.cpu.useBus("mem-write"))) return false; // Error writing to memory
        }
        return true;
      }

      default: {
        const _exhaustiveCheck: never = mode;
        return _exhaustiveCheck;
      }
    }
  }
}
