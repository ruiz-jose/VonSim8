import { render, screen } from "@testing-library/react";
import { createStore } from "jotai";
import { Provider as JotaiProvider } from "jotai/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Eliminada referencia a NotificationProvider

// Mock de las dependencias básicas
vi.mock("@/lib/posthog", () => ({
  posthog: {
    init: vi.fn(),
    capture: vi.fn(),
    identify: vi.fn(),
    track: vi.fn(),
  },
}));

// Mock para usePWAUpdate
vi.mock("@/hooks/usePWAUpdate", () => ({
  usePWAUpdate: () => ({
    updateInfo: { available: false },
    updateApp: vi.fn(),
  }),
}));

vi.mock("@/components/Header", () => ({
  Header: () => (
    <header data-testid="header">
      <div>Header</div>
      <div data-testid="controls">Controls</div>
    </header>
  ),
}));

vi.mock("@/components/Footer", () => ({
  Footer: () => <footer data-testid="footer">Footer</footer>,
}));

// El mock de @/computer ha sido eliminado para evitar conflicto con el mock global
vi.mock("@/editor", () => ({
  Editor: () => <div data-testid="editor">Editor</div>,
}));

vi.mock("@/components/Controls", () => ({
  Controls: () => <div data-testid="controls">Controls</div>,
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

// Wrapper con providers necesarios
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const store = createStore();
  return <JotaiProvider store={store}>{children}</JotaiProvider>;
};

describe("Application Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render complete application workflow", async () => {
    // Importar App dinámicamente para evitar problemas de import
    const { default: App } = await import("../../App");

    render(<App />, { wrapper: TestWrapper });

    // Verificar que todos los componentes principales se renderizan
    expect(screen.getByTestId("header")).toBeInTheDocument();
    expect(screen.getByTestId("footer")).toBeInTheDocument();
    expect(screen.getByTestId("computer-container")).toBeInTheDocument();
    expect(screen.getByTestId("editor")).toBeInTheDocument();
    expect(screen.getByTestId("controls")).toBeInTheDocument();
  });

  it("should maintain proper component hierarchy", async () => {
    const { default: App } = await import("../../App");

    render(<App />, { wrapper: TestWrapper });

    // Verificar jerarquía de componentes
    expect(document.querySelector("header")).toBeInTheDocument();
    expect(document.querySelector("footer")).toBeInTheDocument();
  });

  it("should handle component interactions", async () => {
    const { default: App } = await import("../../App");

    render(<App />, { wrapper: TestWrapper });

    // Verificar que los componentes están presentes para interacción
    expect(screen.getByTestId("computer-container")).toBeInTheDocument();
    expect(screen.getByTestId("editor")).toBeInTheDocument();
    expect(screen.getByTestId("controls")).toBeInTheDocument();
  });
});
