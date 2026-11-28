import { describe, expect, it } from "vitest";

import { buildOptions, isQuizzable } from "@/computer/cpu/practice-quiz";

const STEPS: [string, string][] = [
  ["MAR ← IP", "Captación"],
  ["MBR ← read(Memoria[MAR]) | IP ← IP + 1", "Captación"],
  ["IR ← MBR", "Captación"],
  ["MAR ← MBR", "Obtención de operandos"],
  ["AL ← MBR", "Escritura"],
  ["write(Memoria[MAR]) ← MBR", "Escritura"],
  ["AL ← AL ADD MBR | update(FLAGS)", "Ejecución"],
  ["write(Memoria[MAR]) ← MBR | IP ← ri", "Ejecución"],
];

describe("buildOptions", () => {
  it.each(STEPS)("da 3 opciones distintas con la correcta: %s", (action, stage) => {
    for (let seed = 0; seed < 20; seed++) {
      const options = buildOptions(action, stage, seed);
      expect(options).toHaveLength(3);
      expect(new Set(options).size).toBe(3);
      expect(options).toContain(action);
    }
  });

  it("es estable para la misma semilla", () => {
    expect(buildOptions("AL ← MBR", "Escritura", 4)).toEqual(
      buildOptions("AL ← MBR", "Escritura", 4),
    );
  });

  it("incluye errores típicos, como invertir la transferencia", () => {
    const seen = new Set<string>();
    for (let seed = 0; seed < 30; seed++)
      buildOptions("AL ← MBR", "Escritura", seed).forEach(o => seen.add(o));
    expect([...seen].some(o => o === "MBR ← AL" || o === "BL ← MBR")).toBe(true);
  });

  it("la respuesta correcta no queda siempre en el mismo lugar", () => {
    const positions = new Set<number>();
    for (let seed = 0; seed < 30; seed++)
      positions.add(buildOptions("IR ← MBR", "Captación", seed).indexOf("IR ← MBR"));
    expect(positions.size).toBeGreaterThan(1);
  });
});

describe("isQuizzable", () => {
  it("no pregunta por pasos sin transferencia", () => {
    expect(isQuizzable("Detenido")).toBe(false);
    expect(isQuizzable("MAR ← IP")).toBe(true);
  });
});
