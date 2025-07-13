import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock de las dependencias básicas
// El mock de @/lib/i18n ha sido eliminado para evitar conflicto con el mock global

vi.mock("@/lib/settings", () => ({
  getSettings: vi.fn(() => ({ language: "es" })),
  useDevices: vi.fn(() => ({})),
}));

// Mock de Jotai para evitar problemas
vi.mock("jotai", () => ({
  atom: vi.fn(),
  useAtom: vi.fn(() => [null, vi.fn()]),
  useAtomValue: vi.fn(() => null),
  atomWithStorage: vi.fn(),
  createStore: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
    sub: vi.fn(),
  })),
  Provider: ({ children }: any) => children,
}));

vi.mock("jotai/react", () => ({
  useAtom: vi.fn(() => [null, vi.fn()]),
  useAtomValue: vi.fn(() => null),
  Provider: ({ children }: any) => children,
}));

describe("Header Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render without crashing", async () => {
    // Importar Header dinámicamente para evitar problemas de import
    const { Header } = await import("../../components/Header");

    render(<Header />);

    // Verificar que el componente se renderiza
    expect(document.querySelector("header")).toBeInTheDocument();
  });

  it("should render header content", async () => {
    const { Header } = await import("../../components/Header");

    render(<Header />);

    // Verificar que el header está presente
    expect(document.querySelector("header")).toBeInTheDocument();
  });

  it("should have proper semantic structure", async () => {
    const { Header } = await import("../../components/Header");

    render(<Header />);

    // Verificar estructura semántica
    expect(document.querySelector("header")).toBeInTheDocument();
  });
});
