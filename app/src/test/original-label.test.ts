import { describe, expect, it } from "vitest";

import { originalLabel } from "@/computer/memory/original-label";

const at = (code: string, directive: string) => {
  const start = code.indexOf(directive);
  return { start, end: start + directive.length };
};

describe("originalLabel", () => {
  it("devuelve la etiqueta como la escribió el alumno", () => {
    const code = "; ejemplo\n  x  db 3\n  Total: db 2\n";
    expect(originalLabel(code, { label: "X", position: at(code, "db 3") })).toBe("x");
    expect(originalLabel(code, { label: "TOTAL", position: at(code, "db 2") })).toBe("Total");
  });

  it("usa la etiqueta del ensamblador si no la encuentra en el código", () => {
    const code = "  db 3\n";
    expect(originalLabel(code, { label: "X", position: at(code, "db 3") })).toBe("X");
  });

  it("devuelve null si el dato no tiene etiqueta", () => {
    const code = "  db 3\n";
    expect(originalLabel(code, { label: null, position: at(code, "db 3") })).toBeNull();
  });
});
