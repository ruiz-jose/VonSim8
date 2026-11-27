import { describe, expect, it } from "vitest";

import { describeLiveEvent, explainStep, resolveStage } from "@/computer/cpu/cycle-explanations";

describe("resolveStage", () => {
  it("usa la fase real de la CPU para los pasos marcados como Ejecución", () => {
    expect(resolveStage("Ejecución", "fetching-operands")).toBe("Obtención de operandos");
    expect(resolveStage("Ejecución", "fetching-operands-completed")).toBe("Obtención de operandos");
    expect(resolveStage("Ejecución", "writeback")).toBe("Escritura");
    expect(resolveStage("Ejecución", "executing")).toBe("Ejecución");
  });

  it("no cambia Captación ni Interrupción", () => {
    expect(resolveStage("Captación", "executing")).toBe("Captación");
    expect(resolveStage("Interrupción", "writeback")).toBe("Interrupción");
  });
});

describe("explainStep", () => {
  it("explica la captación", () => {
    expect(explainStep("MAR ← IP", { stage: "Captación" })).toMatch(/próxima instrucción/);
    expect(explainStep("IR ← MBR", { stage: "Captación" })).toMatch(/decodificador/);
  });

  it("explica un paso compuesto uniendo las frases", () => {
    const text = explainStep("MBR ← read(Memoria[MAR]) | IP ← IP + 1", { stage: "Captación" });
    expect(text).toMatch(/llega a MBR/);
    expect(text).toMatch(/IP avanza/);
  });

  it("nombra la variable cuando MAR apunta a una", () => {
    const text = explainStep("MBR ← read(Memoria[MAR])", {
      stage: "Obtención de operandos",
      marLabel: "x",
    });
    expect(text).toMatch(/la variable x/);
  });

  it("explica operaciones de la ALU", () => {
    expect(explainStep("AL ADD MBR ; update(FLAGS)", { stage: "Ejecución" })).toMatch(
      /ALU hace ADD entre AL y MBR.*flags/,
    );
    expect(explainStep("AL ← AL ADD MBR; update(FLAGS)", { stage: "Ejecución" })).toMatch(
      /ALU hace ADD entre AL y MBR, y el resultado queda en AL\. Los flags/,
    );
    expect(explainStep("AL CMP BL", { stage: "Ejecución" })).toMatch(/compara/);
  });

  it("explica copias entre registros", () => {
    expect(explainStep("AL ← MBR", { stage: "Ejecución" })).toMatch(/se copia a AL/);
    expect(explainStep("MBR ← AL", { stage: "Escritura" })).toMatch(/AL se copia a MBR/);
  });

  it("devuelve null si no reconoce la notación", () => {
    expect(explainStep("algo raro", { stage: "Ejecución" })).toBeNull();
  });
});

describe("describeLiveEvent", () => {
  it("describe los eventos animados de la CPU", () => {
    expect(describeLiveEvent({ type: "cpu:mar.set", register: "IP" })).toBe("Copiando IP a MAR");
    expect(describeLiveEvent({ type: "cpu:mbr.get", register: "IR" })).toBe("Copiando MBR a IR");
    expect(describeLiveEvent({ type: "cpu:register.copy", src: "ri.l", dest: "IP.l" })).toBe(
      "Copiando ri a IP",
    );
  });

  it("ignora eventos sin animación propia", () => {
    expect(describeLiveEvent({ type: "cpu:cycle.end" })).toBeNull();
  });
});
