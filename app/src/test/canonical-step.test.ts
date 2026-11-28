import { describe, expect, it } from "vitest";

import { canonicalStep, flagsFromByte } from "@/computer/cpu/canonical-step";
import { executeSteps } from "@/computer/cpu/next-step";

const noFlags = { CF: false, ZF: false, SF: false, OF: false };

describe("canonicalStep", () => {
  it("los tres primeros pasos son la búsqueda, para cualquier instrucción", () => {
    expect(canonicalStep(0, undefined, noFlags)).toBe("MAR ← IP");
    expect(canonicalStep(2, { name: "HLT", operands: [] }, noFlags)).toBe("IR ← MBR");
  });

  it("después sigue el ciclo de ejecución documentado", () => {
    const ins = { name: "MOV", operands: ["AL", "[BL]"] };
    expect(canonicalStep(3, ins, noFlags)).toBe("MAR ← BL");
    expect(canonicalStep(5, ins, noFlags)).toBe("AL ← MBR");
    // Un paso de más no tiene texto documentado
    expect(canonicalStep(6, ins, noFlags)).toBeNull();
  });

  it("devuelve null si la instrucción no tiene ciclo documentado", () => {
    expect(canonicalStep(3, { name: "INT", operands: ["7"] }, noFlags)).toBeNull();
  });
});

describe("flagsFromByte", () => {
  it("lee ZF, CF, OF y SF de los bits 0 a 3", () => {
    const byte = { bit: (i: number) => i === 0 || i === 3 };
    expect(flagsFromByte(byte)).toEqual({ ZF: true, CF: false, OF: false, SF: true });
  });

  it("sin valor, todos los flags en 0", () => {
    expect(flagsFromByte(undefined)).toEqual(noFlags);
  });
});

describe("INC, DEC, NOT y NEG", () => {
  it("con registro, un solo paso de ejecución", () => {
    expect(executeSteps({ name: "INC", operands: ["AL"] }, noFlags)).toEqual([
      "AL ← AL + 1 | update(FLAGS)",
    ]);
    expect(executeSteps({ name: "NEG", operands: ["bl"] }, noFlags)).toEqual([
      "BL ← NEG BL | update(FLAGS)",
    ]);
  });

  it("con memoria, lee, opera y vuelve a escribir", () => {
    expect(executeSteps({ name: "DEC", operands: ["[44]"] }, noFlags)).toEqual([
      "MAR ← IP",
      "MBR ← read(Memoria[MAR]) | IP ← IP + 1",
      "MAR ← MBR",
      "MBR ← read(Memoria[MAR])",
      "MBR ← MBR - 1 | update(FLAGS)",
      "write(Memoria[MAR]) ← MBR",
    ]);
  });
});
