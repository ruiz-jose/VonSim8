import { describe, expect, it } from "vitest";

import { SimulatorError } from "../src/error";
import { englishHints, spanishHints } from "../src/error/hints";

describe("Spanish simulator error messages", () => {
  it("uses Spanish device names", () => {
    expect(new SimulatorError("device-not-connected", "keyboard").translate("es")).toBe(
      "El teclado no está conectado a la computadora.",
    );
    expect(new SimulatorError("device-not-connected", "pio").translate("es")).toBe(
      "El PIO no está conectado a la computadora.",
    );
  });

  it("explains stack errors in Spanish", () => {
    expect(new SimulatorError("stack-overflow").translate("es")).toBe(
      "La pila se llenó (desborde de pila).",
    );
    expect(new SimulatorError("stack-underflow").translate("es")).toContain("la pila está vacía");
  });

  it("gives a hint when the program runs past its last instruction", () => {
    const error = new SimulatorError("no-instruction", 0x2005);
    expect(error.translate("es")).toContain("no hay ninguna");
    expect(error.hint("es")).toContain("HLT");
  });

  it("returns null for errors without a hint", () => {
    expect(new SimulatorError("no-program").hint("es")).toBeNull();
  });

  it("has hints in both languages", () => {
    expect(Object.keys(englishHints).sort()).toEqual(Object.keys(spanishHints).sort());
  });
});
