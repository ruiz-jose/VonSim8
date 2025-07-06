import { MemoryAddress } from "@vonsim/common/address";
import type { Position } from "@vonsim/common/position";

import { AssemblerError } from "../../../error";
import type { GlobalStore } from "../../../global-store";
import type { Operand } from "../operands";
import { InstructionStatement } from "../statement";

type JumpInstructionName =
  | "CALL"
  | "JZ"
  | "JNZ"
  | "JS"
  | "JNS"
  | "JC"
  | "JNC"
  | "JO"
  | "JNO"
  | "JMP";

/**
 * JumpInstruction:
 * - {@link https://vonsim.github.io/docs/cpu/instructions/call/ | CALL}
 * - {@link https://vonsim.github.io/docs/cpu/instructions/jz/ | JZ}
 * - {@link https://vonsim.github.io/docs/cpu/instructions/jnz/ | JNZ}
 * - {@link https://vonsim.github.io/docs/cpu/instructions/js/ | JS}
 * - {@link https://vonsim.github.io/docs/cpu/instructions/jns/ | JNS}
 * - {@link https://vonsim.github.io/docs/cpu/instructions/jc/ | JC}
 * - {@link https://vonsim.github.io/docs/cpu/instructions/jnc/ | JNC}
 * - {@link https://vonsim.github.io/docs/cpu/instructions/jo/ | JO}
 * - {@link https://vonsim.github.io/docs/cpu/instructions/jno/ | JNO}
 * - {@link https://vonsim.github.io/docs/cpu/instructions/jmp/ | JMP}
 *
 * These instructions needs one operand: a label to jump to.
 * The label must be an instruction label.
 * It NEEDS to be a label and not a direct address.
 *
 * ---
 * This class is: MUTABLE
 */
export class JumpInstruction extends InstructionStatement {
  #jumpTo: string | null = null;
  #address: MemoryAddress | null = null;

  constructor(
    readonly instruction: JumpInstructionName,
    operands: Operand[],
    label: string | null,
    position: Position,
  ) {
    super(operands, label, position);
  }

  /**
   * Returns the length of the instruction in bytes.
   * @see https://vonsim.github.io/docs/reference/codification/
   */
  readonly length = 2;

  /**
   * Returns the bytes of the instruction.
   * @see https://vonsim.github.io/docs/reference/codification/
   */
  toBytes(): Uint8Array {
    const bytes: number[] = [];

    const opcodes: { [key in JumpInstructionName]: number } = {
      JC: 0b1100_0011,
      JNC: 0b1100_0100,
      JZ: 0b1100_0001,
      JNZ: 0b0010_0010,
      JS: 0b1100_0101,
      JNS: 0b1100_0110,
      JO: 0b1100_0111,
      JNO: 0b1100_1000,
      JMP: 0b1100_0000,
      CALL: 0b1100_1001,
    };

    bytes.push(opcodes[this.instruction]);
    bytes.push(this.address.byte.low.unsigned);
    // bytes.push(this.address.byte.high.unsigned);

    return new Uint8Array(bytes);
  }

  /**
   * Returns jump destination.
   */
  get address(): MemoryAddress {
    if (this.#address === null) throw new Error("Instruction not evaluated");

    return this.#address;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      ...(this.#address
        ? { address: this.#address.toJSON() }
        : this.#jumpTo
          ? { jumpTo: this.#jumpTo }
          : { operands: this.operands.map(o => o.toJSON()) }),
    };
  }

  validate(store: GlobalStore) {
    if (this.#jumpTo) throw new Error("Instruction already validated");

    if (this.operands.length !== 1) {
      throw new AssemblerError("expects-one-operand").at(this);
    }

    const operand = this.operands[0];
    /* if (!operand.isNumberExpression() || !operand.value.isLabel()) {
      throw new AssemblerError("expects-label").at(operand);
    }*/
    // Permitir etiquetas o números literales
    if (
      !operand.isNumberExpression() ||
      (!operand.value.isLabel() && !operand.value.isNumberLiteral())
    ) {
      throw new AssemblerError("expects-label").at(operand);
    }

    if (operand.value.isLabel()) {
      const label = operand.value.value;
      const type = store.getLabelType(label);

      if (!type) {
        throw new AssemblerError("label-not-found", label).at(operand);
      }
      if (type !== "instruction") {
        throw new AssemblerError("label-should-be-an-instruction", label).at(operand);
      }

      this.#jumpTo = label;
    } else if (operand.value.isNumberLiteral()) {
      const addr = operand.value.value;

      if (!MemoryAddress.inRange(addr)) {
        throw new AssemblerError("address-out-of-range", addr).at(operand);
      }

      this.#address = MemoryAddress.from(addr);
    }
  }

  evaluateExpressions(store: GlobalStore) {
    if (this.#address) return; // Si ya fue evaluado, no hacer nada

    if (this.#jumpTo) {
      const addr = store.getLabelValue(this.#jumpTo)!;
      if (!MemoryAddress.inRange(addr)) {
        throw new AssemblerError("address-out-of-range", addr).at(this);
      }

      this.#address = MemoryAddress.from(addr);
    }
  }
}
