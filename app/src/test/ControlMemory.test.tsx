import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ControlMemory } from "../computer/cpu/ControlMemory";

// Mock de las dependencias
vi.mock("@/lib/i18n", () => ({
  useTranslate: () => (key: string) => key,
}));

vi.mock("jotai", () => ({
  useAtomValue: () => ({
    phase: "executing",
    metadata: {
      name: "ADD",
      operands: ["AL", "BL"],
    },
  }),
  createStore: () => ({
    get: vi.fn(() => ({ type: "stopped" })),
    set: vi.fn(),
    sub: vi.fn(),
  }),
  atom: vi.fn(value => value),
}));

vi.mock("@/computer/simulation", () => ({
  simulationAtom: { type: "stopped" },
}));

describe("ControlMemory", () => {
  it("no se renderiza cuando isVisible es false", () => {
    render(<ControlMemory isVisible={false} onClose={vi.fn()} />);
    expect(screen.queryByText("🧠 Memoria de Control (Microprograma)")).not.toBeInTheDocument();
  });

  it("se renderiza cuando isVisible es true", () => {
    render(<ControlMemory isVisible={true} onClose={vi.fn()} />);
    expect(screen.getByText("🧠 Memoria de Control (Microprograma)")).toBeInTheDocument();
  });

  it("muestra la instrucción actual destacada", () => {
    render(<ControlMemory isVisible={true} onClose={vi.fn()} />);
    expect(screen.getByText("🎯 Instrucción Actual: ADD")).toBeInTheDocument();
  });

  it("llama a onClose cuando se hace clic en el botón de cerrar", () => {
    const onClose = vi.fn();
    render(<ControlMemory isVisible={true} onClose={onClose} />);

    const closeButton = screen.getByText("✕");
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("llama a onClose cuando se hace clic fuera del modal", () => {
    const onClose = vi.fn();
    render(<ControlMemory isVisible={true} onClose={onClose} />);

    const overlay = screen.getByTestId("modal-overlay");
    fireEvent.click(overlay);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("no llama a onClose cuando se hace clic dentro del modal", () => {
    const onClose = vi.fn();
    render(<ControlMemory isVisible={true} onClose={onClose} />);

    const modal = screen.getByTestId("modal-content");
    fireEvent.click(modal);

    expect(onClose).not.toHaveBeenCalled();
  });

  it("muestra la tabla de memoria de control", () => {
    render(<ControlMemory isVisible={true} onClose={vi.fn()} />);

    expect(screen.getByText("Dirección")).toBeInTheDocument();
    expect(screen.getByText("Instrucción")).toBeInTheDocument();
    expect(screen.getByText("Descripción")).toBeInTheDocument();
    expect(screen.getByText("Microoperaciones")).toBeInTheDocument();
  });

  it("muestra las instrucciones en la tabla", () => {
    render(<ControlMemory isVisible={true} onClose={vi.fn()} />);

    expect(screen.getByText("MOV")).toBeInTheDocument();
    expect(screen.getByText("ADD")).toBeInTheDocument();
    expect(screen.getByText("SUB")).toBeInTheDocument();
    expect(screen.getByText("JMP")).toBeInTheDocument();
  });
});
