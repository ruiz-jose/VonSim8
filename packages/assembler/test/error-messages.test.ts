import { describe, expect, it } from "vitest";

import { assemble, type AssembleResultError } from "../src";
import { AssemblerError } from "../src/error";
import { englishHints, spanishHints } from "../src/error/hints";
import { tokenName } from "../src/error/messages/spanish";

/** Assembles `source` and returns the first error, translated to Spanish. */
function firstError(source: string) {
  const result = assemble(source);
  if (result.success) throw new Error("Expected the program to fail");
  const [error] = (result as AssembleResultError).errors;
  return { error, es: error.translate("es"), hint: error.hint("es") };
}

describe("Spanish assembler error messages", () => {
  it("explains a double memory access and how to fix it", () => {
    const { error, es, hint } = firstError("A DB 1\nB DB 2\nMOV A, B\nHLT");
    expect(error.code).toBe("double-memory-access");
    expect(es).toBe(
      "Esta instrucción usa la memoria en los dos operandos, y eso no está permitido.",
    );
    expect(hint).toContain("MOV AL, origen");
    expect(error.position).not.toBeNull();
  });

  it("names the undefined label", () => {
    const { error, es, hint } = firstError("ORG 20h\nJMP FIN\nHLT\nEND");
    expect(error.code).toBe("label-not-found");
    expect(es).toBe("La etiqueta «FIN» no está definida.");
    expect(hint).toMatch(/bien escrita/);
  });

  it("explains a size mismatch in plain words", () => {
    const { error, es, hint } = firstError("ORG 20h\nMOV AL, BX\nHLT\nEND");
    expect(error.code).toBe("size-mismatch");
    expect(es).toBe(
      "Los operandos son de distinto tamaño: uno es de 16 bits y el otro de 8 bits. Tienen que ser del mismo tamaño.",
    );
    expect(hint).not.toBeNull();
  });

  it("explains a number that doesn't fit", () => {
    const { error, es, hint } = firstError("ORG 20h\nMOV AL, 300\nHLT\nEND");
    expect(error.code).toBe("value-out-of-range");
    expect(es).toBe("El número 300 no entra en 8 bits.");
    expect(hint).toContain("0 a 255");
  });

  it("suggests a missing colon for unknown words", () => {
    const { error, es } = firstError("ORG 20h\nLAZO\nHLT\nEND");
    expect(error.code).toBe("parser.unexpected-identifier");
    expect(es).toContain("le falta «:»");
  });

  it("points out a missing comma between operands", () => {
    const { error, es, hint } = firstError("ORG 20h\nMOV AL 3\nHLT\nEND");
    expect(error.code).toBe("parser.expected-eos");
    expect(es).toContain("falta una coma");
    expect(hint).not.toBeNull();
  });

  it("points out an unclosed bracket", () => {
    const { error, es } = firstError("ORG 20h\nMOV AL, [BL\nHLT\nEND");
    expect(error.code).toBe("parser.expected-literal-after-literal");
    expect(es).toMatch(/^Falta «\]»/);
  });

  it("uses readable token names instead of internal ones", () => {
    const es = new AssemblerError("parser.expected-type", "COMMA", "EOL").translate("es");
    expect(es).toBe("Se esperaba una coma «,», pero se encontró el fin de la línea.");
  });

  it("explains a missing END position", () => {
    const { error, es, hint } = firstError("ORG 20h\nHLT\nEND\nMOV AL, 1");
    expect(error.code).toBe("end-must-be-the-last-statement");
    expect(es).toContain("END tiene que ser la última línea");
    expect(hint).not.toBeNull();
  });

  it("explains an immediate destination", () => {
    const { error, es } = firstError("ORG 20h\nMOV 5, AL\nHLT\nEND");
    expect(error.code).toBe("destination-cannot-be-immediate");
    expect(es).toBe("El destino no puede ser un número fijo (valor inmediato).");
  });

  it("keeps English messages unchanged", () => {
    expect(new AssemblerError("label-not-found", "FIN").translate("en")).toBe(
      'Label "FIN" has not been defined.',
    );
  });
});

describe("tokenName", () => {
  it("translates single and multiple token types", () => {
    expect(tokenName("EOL")).toBe("el fin de la línea");
    expect(tokenName("COMMA")).toBe("una coma «,»");
    expect(tokenName("NUMBER,IDENTIFIER")).toBe("un número o un nombre");
    expect(tokenName("MOV")).toBe("«MOV»");
  });
});

describe("Hints", () => {
  it("returns null for errors without a hint", () => {
    expect(new AssemblerError("circular-reference").hint("es")).toBeNull();
  });

  it("has a hint in both languages for every common error", () => {
    expect(Object.keys(englishHints).sort()).toEqual(Object.keys(spanishHints).sort());
  });
});
