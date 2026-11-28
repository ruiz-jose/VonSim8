import { describe, expect, it } from "vitest";

import { groupByInstruction, summarizeInstruction } from "@/computer/cpu/instruction-summary";
import type { CycleMessage } from "@/computer/cpu/state";

const fetch = (instruction: string): CycleMessage[] => [
  { cycle: 1, stage: "Captación", action: "MAR ← IP", instruction },
  {
    cycle: 2,
    stage: "Captación",
    action: "MBR ← read(Memoria[MAR]) | IP ← IP + 1",
    instruction,
  },
  { cycle: 3, stage: "Captación", action: "IR ← MBR", instruction },
];

describe("summarizeInstruction", () => {
  it("separa los ciclos de búsqueda y de ejecución, y cuenta las lecturas", () => {
    const steps: CycleMessage[] = [
      ...fetch("MOV AL, [05]"),
      { cycle: 4, stage: "Obtención de operandos", action: "MAR ← IP" },
      {
        cycle: 5,
        stage: "Obtención de operandos",
        action: "MBR ← read(Memoria[MAR]) | IP ← IP + 1",
      },
      { cycle: 6, stage: "Obtención de operandos", action: "MAR ← MBR" },
      { cycle: 7, stage: "Obtención de operandos", action: "MBR ← read(Memoria[MAR])" },
      { cycle: 8, stage: "Escritura", action: "AL ← MBR" },
    ];
    const s = summarizeInstruction(steps);
    expect(s.instruction).toBe("MOV AL, [05]");
    expect(s.cycles).toBe(8);
    expect(s.fetchCycles).toBe(3);
    expect(s.executeCycles).toBe(5);
    expect(s.memoryReads).toBe(3);
    expect(s.fetchMemoryReads).toBe(1);
    expect(s.changedRegisters).toEqual(["AL"]);
    expect(s.jumped).toBe(false);
  });

  it("nombra la variable donde se escribió y los registros que cambió la ALU", () => {
    const s = summarizeInstruction([
      ...fetch("ADD y, AL"),
      { cycle: 4, stage: "Ejecución", action: "AL ← AL ADD MBR | update(FLAGS)" },
      {
        cycle: 5,
        stage: "Escritura",
        action: "write(Memoria[MAR]) ← MBR",
        marAddress: 6,
        marLabel: "y",
      },
    ]);
    expect(s.memoryWrites).toBe(1);
    expect(s.writtenTo).toEqual(["y"]);
    expect(s.changedRegisters).toEqual(["AL", "Flags"]);
  });

  it("usa la dirección en hexadecimal si no hay variable", () => {
    const s = summarizeInstruction([
      { cycle: 1, stage: "Ejecución", action: "write(Memoria[MAR]) ← MBR", marAddress: 254 },
    ]);
    expect(s.writtenTo).toEqual(["FEh"]);
  });

  it("CMP solo cambia los flags", () => {
    const s = summarizeInstruction([
      ...fetch("CMP AL, BL"),
      { cycle: 4, stage: "Ejecución", action: "AL CMP BL" },
    ]);
    expect(s.changedRegisters).toEqual(["Flags"]);
  });

  it("detecta saltos y cambios en la pila", () => {
    const s = summarizeInstruction([
      ...fetch("CALL 09"),
      { cycle: 6, stage: "Ejecución", action: "ri ← MBR | SP ← SP - 1" },
      { cycle: 8, stage: "Ejecución", action: "write(Memoria[MAR]) ← MBR | IP ← ri" },
    ]);
    expect(s.changedRegisters).toEqual(["SP"]);
    expect(s.jumped).toBe(true);
    // No se cuentan registros internos como ri
    expect(s.changedRegisters).not.toContain("ri");
  });

  it("cuenta aparte los ciclos de interrupción", () => {
    const s = summarizeInstruction([
      ...fetch("INT 7"),
      { cycle: 4, stage: "Interrupción", action: "SP ← SP - 1" },
    ]);
    expect(s.interruptCycles).toBe(1);
    expect(s.executeCycles).toBe(0);
  });
});

describe("groupByInstruction", () => {
  it("empieza un grupo nuevo cuando el contador de ciclos vuelve a 1", () => {
    const groups = groupByInstruction([...fetch("MOV AL, 5"), ...fetch("HLT")]);
    expect(groups).toHaveLength(2);
    expect(groups[1][0].instruction).toBe("HLT");
  });
});
