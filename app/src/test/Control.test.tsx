import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Control } from "../computer/cpu/Control";

// Mock de las dependencias
vi.mock("@/lib/i18n", () => ({
  useTranslate: () => (key: string) => key,
}));

vi.mock("jotai", () => ({
  useAtomValue: () => ({
    phase: "fetching",
    metadata: {
      name: "MOV",
      operands: ["AL", "5"],
    },
  }),
  createStore: () => ({
    get: vi.fn(() => ({ type: "stopped" })),
    set: vi.fn(),
    sub: vi.fn(),
  }),
  atom: vi.fn(value => value),
}));

// Mock del sistema de springs
vi.mock("@/computer/shared/springs", () => ({
  getSpring: (key: string) => ({
    to: (callback: (value: number) => any) => {
      // Simular diferentes valores de progreso para testing
      if (key === "cpu.decoder.progress.progress") {
        return callback(0.5); // Simular progreso al 50%
      }
      if (key === "cpu.decoder.progress.opacity") {
        return 1;
      }
      return callback(0);
    },
  }),
}));

describe("Control Component - Viñeta 1 Pulse Effect", () => {
  it("renderiza el componente Control correctamente", () => {
    render(<Control />);
    expect(screen.getByText("computer.cpu.control-unit")).toBeInTheDocument();
    expect(screen.getByText("computer.cpu.decoder")).toBeInTheDocument();
  });

  it("muestra el botón de memoria de control", () => {
    render(<Control />);
    const button = screen.getByLabelText("Mostrar memoria de control");
    expect(button).toBeInTheDocument();
  });

  it("el componente se renderiza sin errores", () => {
    render(<Control />);
    // Verificar que el componente se renderiza correctamente
    expect(screen.getByText("computer.cpu.control-unit")).toBeInTheDocument();
    expect(screen.getByText("computer.cpu.decoder")).toBeInTheDocument();
    expect(screen.getByText("Instrucción")).toBeInTheDocument();
  });
});
