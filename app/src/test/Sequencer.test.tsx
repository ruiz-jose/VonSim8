import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Sequencer } from "../computer/cpu/Sequencer";

// Mock de las dependencias
vi.mock("@/lib/i18n", () => ({
  useTranslate: () => (key: string) => key,
}));

vi.mock("jotai", () => ({
  useAtomValue: () => ({
    phase: "executing",
    metadata: {
      name: "ADD",
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

vi.mock("@/computer/simulation", () => ({
  simulationAtom: { type: "stopped" },
}));

describe("Sequencer", () => {
  it("no se renderiza cuando isVisible es false", () => {
    render(<Sequencer isVisible={false} onClose={vi.fn()} />);
    expect(screen.queryByText("⚙️ Secuenciador de Microoperaciones")).not.toBeInTheDocument();
  });

  it("se renderiza cuando isVisible es true", () => {
    render(<Sequencer isVisible={true} onClose={vi.fn()} />);
    expect(screen.getByText("⚙️ Secuenciador de Microoperaciones")).toBeInTheDocument();
  });

  it("muestra la fase actual destacada", () => {
    render(<Sequencer isVisible={true} onClose={vi.fn()} />);
    expect(screen.getByText("🎯 Fase Actual: Ejecución")).toBeInTheDocument();
  });

  it("llama a onClose cuando se hace clic en el botón de cerrar", () => {
    const onClose = vi.fn();
    render(<Sequencer isVisible={true} onClose={onClose} />);

    const closeButton = screen.getByText("✕");
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("llama a onClose cuando se hace clic fuera del modal", () => {
    const onClose = vi.fn();
    render(<Sequencer isVisible={true} onClose={onClose} />);

    const overlay = screen.getByTestId("modal-overlay");
    fireEvent.click(overlay);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("no llama a onClose cuando se hace clic dentro del modal", () => {
    const onClose = vi.fn();
    render(<Sequencer isVisible={true} onClose={onClose} />);

    const modal = screen.getByTestId("modal-content");
    fireEvent.click(modal);

    expect(onClose).not.toHaveBeenCalled();
  });

  it("muestra el diagrama de estados", () => {
    render(<Sequencer isVisible={true} onClose={vi.fn()} />);

    expect(screen.getByText("🔄 Diagrama de Estados")).toBeInTheDocument();
    expect(screen.getAllByText("Captación")).toHaveLength(2);
    expect(screen.getAllByText("Decodificación")).toHaveLength(2);
    expect(screen.getAllByText("Ejecución")).toHaveLength(2);
    expect(screen.getAllByText("Escritura")).toHaveLength(2);
  });

  it("muestra la tabla de señales de control", () => {
    render(<Sequencer isVisible={true} onClose={vi.fn()} />);

    expect(screen.getByText("Fase")).toBeInTheDocument();
    expect(screen.getByText("Señales de Control")).toBeInTheDocument();
    expect(screen.getByText("Descripción")).toBeInTheDocument();
  });

  it("muestra las fases en la tabla", () => {
    render(<Sequencer isVisible={true} onClose={vi.fn()} />);

    // Verificar que las fases aparecen en la tabla (usando getAllByText para evitar duplicados)
    const captacionElements = screen.getAllByText("Captación");
    const decodificacionElements = screen.getAllByText("Decodificación");
    const ejecucionElements = screen.getAllByText("Ejecución");
    const escrituraElements = screen.getAllByText("Escritura");

    expect(captacionElements.length).toBeGreaterThan(0);
    expect(decodificacionElements.length).toBeGreaterThan(0);
    expect(ejecucionElements.length).toBeGreaterThan(0);
    expect(escrituraElements.length).toBeGreaterThan(0);
  });

  it("muestra las señales de control", () => {
    render(<Sequencer isVisible={true} onClose={vi.fn()} />);

    expect(screen.getByText("RD=1")).toBeInTheDocument();
    expect(screen.getByText("IO/M=0")).toBeInTheDocument();
    expect(screen.getByText("Bus Address")).toBeInTheDocument();
  });
});
