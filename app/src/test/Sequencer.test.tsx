import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
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
    
    const overlay = screen.getByRole("presentation");
    fireEvent.click(overlay);
    
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("no llama a onClose cuando se hace clic dentro del modal", () => {
    const onClose = vi.fn();
    render(<Sequencer isVisible={true} onClose={onClose} />);
    
    const modal = screen.getByRole("dialog");
    fireEvent.click(modal);
    
    expect(onClose).not.toHaveBeenCalled();
  });

  it("muestra el diagrama de estados", () => {
    render(<Sequencer isVisible={true} onClose={vi.fn()} />);
    
    expect(screen.getByText("🔄 Diagrama de Estados")).toBeInTheDocument();
    expect(screen.getByText("Captación")).toBeInTheDocument();
    expect(screen.getByText("Decodificación")).toBeInTheDocument();
    expect(screen.getByText("Ejecución")).toBeInTheDocument();
    expect(screen.getByText("Escritura")).toBeInTheDocument();
  });

  it("muestra la tabla de señales de control", () => {
    render(<Sequencer isVisible={true} onClose={vi.fn()} />);
    
    expect(screen.getByText("Fase")).toBeInTheDocument();
    expect(screen.getByText("Señales de Control")).toBeInTheDocument();
    expect(screen.getByText("Descripción")).toBeInTheDocument();
  });

  it("muestra las fases en la tabla", () => {
    render(<Sequencer isVisible={true} onClose={vi.fn()} />);
    
    expect(screen.getByText("Captación")).toBeInTheDocument();
    expect(screen.getByText("Decodificación")).toBeInTheDocument();
    expect(screen.getByText("Ejecución")).toBeInTheDocument();
    expect(screen.getByText("Escritura")).toBeInTheDocument();
  });

  it("muestra las señales de control", () => {
    render(<Sequencer isVisible={true} onClose={vi.fn()} />);
    
    expect(screen.getByText("RD=1")).toBeInTheDocument();
    expect(screen.getByText("IO/M=0")).toBeInTheDocument();
    expect(screen.getByText("Bus Address")).toBeInTheDocument();
  });
}); 