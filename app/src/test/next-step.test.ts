import { describe, expect, it } from "vitest";

import { executeSteps, normalizeStep, predictNextStep, sameStep } from "@/computer/cpu/next-step";

const noFlags = { CF: false, ZF: false, SF: false, OF: false };
const steps = (name: string, operands: string[], flags = noFlags) =>
  executeSteps({ name, operands }, flags);

// Pasos tomados del panel del simulador (ejecutando paso a paso)
describe("executeSteps coincide con lo que muestra el simulador", () => {
  it.each([
    ["MOV", ["BL", "01h"], ["MAR ← IP", "MBR ← read(Memoria[MAR]) | IP ← IP + 1", "BL ← MBR"]],
    [
      "MOV",
      ["AL", "[44]"],
      [
        "MAR ← IP",
        "MBR ← read(Memoria[MAR]) | IP ← IP + 1",
        "MAR ← MBR",
        "MBR ← read(Memoria[MAR])",
        "AL ← MBR",
      ],
    ],
    [
      "MOV",
      ["[44]", "AL"],
      [
        "MAR ← IP",
        "MBR ← read(Memoria[MAR]) | IP ← IP + 1",
        "MAR ← MBR",
        "MBR ← AL",
        "write(Memoria[MAR]) ← MBR",
      ],
    ],
    ["MOV", ["AL", "[BL]"], ["MAR ← BL", "MBR ← read(Memoria[MAR])", "AL ← MBR"]],
    ["MOV", ["[BL]", "AL"], ["MAR ← BL", "MBR ← AL", "write(Memoria[MAR]) ← MBR"]],
    [
      "MOV",
      ["[BL]", "02h"],
      [
        "MAR ← IP",
        "MBR ← read(Memoria[MAR]) | IP ← IP + 1",
        "MAR ← BL",
        "write(Memoria[MAR]) ← MBR",
      ],
    ],
    [
      "ADD",
      ["AL", "01h"],
      ["MAR ← IP", "MBR ← read(Memoria[MAR]) | IP ← IP + 1", "AL ← AL ADD MBR; update(FLAGS)"],
    ],
    [
      "ADD",
      ["[44]", "AL"],
      [
        "MAR ← IP",
        "MBR ← read(Memoria[MAR]) | IP ← IP + 1",
        "MAR ← MBR",
        "MBR ← read(Memoria[MAR])",
        "MBR ← MBR ADD AL; update(FLAGS)",
        "write(Memoria[MAR]) ← MBR",
      ],
    ],
    ["PUSH", ["AL"], ["MBR ← AL | SP ← SP - 1", "MAR ← SP", "write(Memoria[MAR]) ← MBR"]],
    ["POP", ["CL"], ["MAR ← SP", "MBR ← read(Memoria[MAR])", "CL ← MBR | SP = SP + 1"]],
    [
      "CALL",
      ["41"],
      [
        "MAR ← IP",
        "MBR ← read(Memoria[MAR]) | IP ← IP + 1",
        "ri ← MBR | SP ← SP - 1",
        "MAR ← SP | MBR ← IP",
        "write(Memoria[MAR]) ← MBR | IP ← ri",
      ],
    ],
    ["RET", [], ["MAR ← SP", "MBR ← read(Memoria[MAR])", "IP ← MBR | SP ← SP + 1"]],
    ["JMP", ["3E"], ["MAR ← IP", "MBR ← read(Memoria[MAR]) | IP ← IP + 1", "IP ← MBR"]],
    ["CLI", [], ["update(Flags I=0)"]],
  ] as [string, string[], string[]][])("%s %j", (name, operands, real) => {
    const predicted = steps(name, operands);
    expect(predicted).not.toBeNull();
    expect(predicted!.map(normalizeStep)).toEqual(real.map(normalizeStep));
  });
});

describe("saltos condicionales", () => {
  it("salta solo si se cumple la condición", () => {
    expect(steps("JZ", ["3C"], { ...noFlags, ZF: true })).toHaveLength(3);
    expect(steps("JZ", ["3C"], noFlags)).toHaveLength(2);
    expect(steps("JNZ", ["3A"], noFlags)).toHaveLength(3);
  });
});

describe("predictNextStep", () => {
  it("la búsqueda es igual para todas las instrucciones", () => {
    expect(predictNextStep(0, null, noFlags)).toBe("MAR ← IP");
    expect(predictNextStep(2, null, noFlags)).toBe("IR ← MBR");
  });

  it("después de la búsqueda depende de la instrucción", () => {
    const ins = { name: "MOV", operands: ["AL", "[BL]"] };
    expect(predictNextStep(3, ins, noFlags)).toBe("MAR ← BL");
    expect(predictNextStep(5, ins, noFlags)).toBe("AL ← MBR");
    expect(predictNextStep(6, ins, noFlags)).toBeNull();
  });

  it("no predice instrucciones que no conoce", () => {
    expect(predictNextStep(3, { name: "INT", operands: ["7"] }, noFlags)).toBeNull();
  });
});

describe("sameStep", () => {
  it("ignora el orden de las partes, ';' vs '|' y '=' vs '←'", () => {
    expect(sameStep("CL ← MBR | SP = SP + 1", "SP ← SP + 1 | CL ← MBR")).toBe(true);
    expect(sameStep("AL ← AL ADD MBR; update(FLAGS)", "AL ← AL ADD MBR | update(FLAGS)")).toBe(
      true,
    );
    expect(sameStep("AL ← MBR", "MBR ← AL")).toBe(false);
  });
});
