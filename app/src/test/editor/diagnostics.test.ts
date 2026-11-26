import { assemble, type AssembleResultError } from "@vonsim/assembler";
import { describe, expect, it } from "vitest";

import { buildDiagnostics, lineOfOffset, type LintableError } from "../../editor/diagnostics";

function diagnosticsFor(source: string, lang: "es" | "en" = "es") {
  const result = assemble(source);
  if (result.success) return [];
  return buildDiagnostics((result as AssembleResultError).errors as LintableError[], source, lang);
}

describe("lineOfOffset", () => {
  it("returns 1-based line numbers", () => {
    const source = "a\nbb\nccc";
    expect(lineOfOffset(source, 0)).toBe(1);
    expect(lineOfOffset(source, 2)).toBe(2);
    expect(lineOfOffset(source, 5)).toBe(3);
    expect(lineOfOffset(source, 999)).toBe(3);
  });
});

describe("buildDiagnostics", () => {
  it("marks the line of the error and includes a hint", () => {
    const [diagnostic] = diagnosticsFor("ORG 20h\nMOV AL, 300\nHLT\nEND");

    expect(diagnostic.line).toBe(2);
    expect(diagnostic.severity).toBe("error");
    expect(diagnostic.source).toBe("Línea 2");
    expect(diagnostic.message).toContain("El número 300 no entra en 8 bits.");
    expect(diagnostic.message).toContain("💡 Pista:");
    expect(diagnostic.hint).not.toBeNull();
  });

  it("renders the message and the hint as separate elements", () => {
    const [diagnostic] = diagnosticsFor("ORG 20h\nJMP FIN\nHLT\nEND");
    const node = diagnostic.renderMessage!({} as any) as HTMLElement;

    expect(node.querySelector(".cm-vonsim-diagnostic-message")?.textContent).toBe(
      "La etiqueta «FIN» no está definida.",
    );
    expect(node.querySelector(".cm-vonsim-diagnostic-hint")?.textContent).toMatch(/^💡 Pista:/);
  });

  it("omits the hint block when the error has no hint", () => {
    const diagnostics = buildDiagnostics(
      [{ position: { start: 0, end: 3 }, translate: () => "Mensaje", hint: () => null }],
      "abc",
      "es",
    );
    expect(diagnostics[0].message).toBe("Mensaje");
    const node = diagnostics[0].renderMessage!({} as any) as HTMLElement;
    expect(node.querySelector(".cm-vonsim-diagnostic-hint")).toBeNull();
  });

  it("uses English labels when the language is English", () => {
    const [diagnostic] = diagnosticsFor("ORG 20h\nMOV AL, 300\nHLT\nEND", "en");
    expect(diagnostic.source).toBe("Line 2");
    expect(diagnostic.message).toContain("💡 Hint:");
  });

  it("sorts diagnostics by position and clamps ranges to the source", () => {
    const source = "line1\nline2";
    const diagnostics = buildDiagnostics(
      [
        { position: { start: 6, end: 100 }, translate: () => "second" },
        { position: null, translate: () => "first" },
      ],
      source,
      "es",
    );
    expect(diagnostics.map(d => d.message)).toEqual(["first", "second"]);
    expect(diagnostics[1]).toMatchObject({ from: 6, to: source.length, line: 2 });
  });
});
