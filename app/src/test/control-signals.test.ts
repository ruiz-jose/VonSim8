import { describe, expect, it } from "vitest";

import { controlSignals } from "@/computer/cpu/control-signals";
import { microRoutine } from "@/computer/cpu/micro-routine";

const labels = (step: string) => controlSignals(step).map(s => s.label);
const noFlags = { CF: false, ZF: false, SF: false, OF: false };

describe("controlSignals", () => {
  it("transferencia entre registros: salida del origen y carga del destino", () => {
    expect(labels("MAR ← IP")).toEqual(["salida IP", "carga MAR"]);
    expect(labels("IR ← MBR")).toEqual(["salida MBR", "carga IR"]);
  });

  it("lectura de memoria con incremento de IP", () => {
    expect(labels("MBR ← read(Memoria[MAR]) | IP ← IP + 1")).toEqual(["RD", "carga MBR", "IP + 1"]);
  });

  it("escritura en memoria", () => {
    expect(labels("write(Memoria[MAR]) ← MBR")).toEqual(["salida MBR", "WR"]);
  });

  it("operaciones de la ALU", () => {
    expect(labels("AL ← AL ADD MBR | update(FLAGS)")).toEqual([
      "salida AL",
      "salida MBR",
      "ALU: ADD",
      "carga AL",
      "carga FLAGS",
    ]);
    expect(labels("AL CMP BL | update(FLAGS)")).toEqual([
      "salida AL",
      "salida BL",
      "ALU: CMP",
      "carga FLAGS",
    ]);
    expect(labels("CL ← CL + 1 | update(FLAGS)")).toEqual([
      "salida CL",
      "ALU: INC",
      "carga CL",
      "carga FLAGS",
    ]);
    expect(labels("DL ← NOT DL | update(FLAGS)")).toEqual([
      "salida DL",
      "ALU: NOT",
      "carga DL",
      "carga FLAGS",
    ]);
  });

  it("SP y flags", () => {
    expect(labels("ri ← MBR | SP ← SP - 1")).toEqual(["salida MBR", "carga ri", "SP − 1"]);
    expect(labels("update(Flags I=1)")).toEqual(["FLAGS: I ← 1"]);
  });

  it("sin paso no hay señales", () => {
    expect(controlSignals(null)).toEqual([]);
    expect(controlSignals("algo desconocido")).toEqual([]);
  });
});

describe("microRoutine", () => {
  it("captación seguida de la rutina de ejecución", () => {
    const rows = microRoutine({ name: "MOV", operands: ["AL", "5"] }, noFlags);
    expect(rows.map(r => r.stage)).toEqual([
      "fetch",
      "fetch",
      "fetch",
      "execute",
      "execute",
      "execute",
    ]);
    expect(rows[5].step).toBe("AL ← MBR");
  });

  it("rutina sin documentar: pasos ya hechos y lugar para el paso en curso", () => {
    const fetch = microRoutine(null, noFlags).map(r => r.step as string);
    const rows = microRoutine(
      { name: "OUT", operands: ["20h", "AL"] },
      noFlags,
      [...fetch, "X ← Y"],
      4,
    );
    expect(rows.slice(3).map(r => r.step)).toEqual(["X ← Y", null]);
  });
});
