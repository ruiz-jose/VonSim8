import "@testing-library/jest-dom";

import { act, fireEvent, render, screen } from "@testing-library/react";
import { assemble } from "@vonsim/assembler";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  FIRST_STEPS_PROGRAM,
  firstStepsOpenAtom,
  FirstStepsTour,
} from "@/components/FirstStepsTour";
import { JotaiProvider, store } from "@/lib/jotai";

// setupTests.ts mockea jotai globalmente; esta prueba necesita el estado real
vi.unmock("jotai");
vi.unmock("jotai/react");

const dispatch = vi.fn();

vi.mock("@/computer/simulation", () => ({
  useSimulation: () => ({ status: { type: "stopped" }, dispatch }),
}));

// Editor mínimo que imita la API de CodeMirror usada por la guía
function mockEditor(initial = "") {
  let doc = initial;
  (window as any).codemirror = {
    state: {
      doc: {
        toString: () => doc,
        get length() {
          return doc.length;
        },
      },
    },
    dispatch: ({ changes }: { changes: { insert: string } }) => {
      doc = changes.insert;
    },
  };
  return () => doc;
}

const renderTour = () =>
  render(
    <JotaiProvider>
      <FirstStepsTour />
    </JotaiProvider>,
  );

describe("FirstStepsTour", () => {
  beforeEach(() => {
    dispatch.mockClear();
    localStorage.clear();
    act(() => store.set(firstStepsOpenAtom, false));
  });

  it("el programa de ejemplo ensambla sin errores", () => {
    const result = assemble(FIRST_STEPS_PROGRAM);
    expect(result.success).toBe(true);
  });

  it("no se muestra hasta que se abre", () => {
    renderTour();
    expect(screen.queryByTestId("first-steps-tour")).not.toBeInTheDocument();
    act(() => store.set(firstStepsOpenAtom, true));
    expect(screen.getByText("Primeros pasos con VonSim8")).toBeInTheDocument();
  });

  it("carga el programa de ejemplo y ejecuta una instrucción", () => {
    const getDoc = mockEditor("; mi código");
    act(() => store.set(firstStepsOpenAtom, true));
    renderTour();

    fireEvent.click(screen.getByTestId("first-steps-next"));
    expect(screen.getByText("1. El editor")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("first-steps-action"));
    expect(getDoc()).toBe(FIRST_STEPS_PROGRAM);

    fireEvent.click(screen.getByTestId("first-steps-next"));
    expect(screen.getByText("2. Ensamblar y ejecutar")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("first-steps-action"));
    expect(dispatch).toHaveBeenCalledWith("cpu.run", "end-of-instruction");
  });

  it("se cierra con Esc y con el botón de cerrar, y se puede volver a abrir", () => {
    act(() => store.set(firstStepsOpenAtom, true));
    renderTour();

    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByTestId("first-steps-tour")).not.toBeInTheDocument();
    expect(store.get(firstStepsOpenAtom)).toBe(false);

    act(() => store.set(firstStepsOpenAtom, true));
    expect(screen.getByText("Primeros pasos con VonSim8")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("first-steps-close"));
    expect(screen.queryByTestId("first-steps-tour")).not.toBeInTheDocument();
  });

  it("vuelve a empezar desde el primer paso al reabrirse", () => {
    mockEditor();
    act(() => store.set(firstStepsOpenAtom, true));
    renderTour();

    fireEvent.click(screen.getByTestId("first-steps-next"));
    fireEvent.click(screen.getByTestId("first-steps-next"));
    expect(screen.getByText("Paso 3 de 8")).toBeInTheDocument();

    act(() => store.set(firstStepsOpenAtom, false));
    act(() => store.set(firstStepsOpenAtom, true));
    expect(screen.getByText("Paso 1 de 8")).toBeInTheDocument();
  });
});
