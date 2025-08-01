import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotificationProvider } from "../components/NotificationCenter";
import { Provider as JotaiProvider } from "jotai/react";
import { createStore } from "jotai";

// El mock de @/computer ha sido eliminado para evitar conflicto con el mock global

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
  return (
    <JotaiProvider store={store}>
      <NotificationProvider>
        {children}
      </NotificationProvider>
    </JotaiProvider>
  );
};

describe("App Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render without crashing", async () => {
    // Importar App dinámicamente para evitar problemas de import
    const { default: App } = await import("../App");

    render(<App />, { wrapper: TestWrapper });

    // Verificar que los componentes principales se renderizan
    expect(screen.getByTestId("header")).toBeInTheDocument();
    expect(screen.getByTestId("footer")).toBeInTheDocument();
  });

  it("should render computer component", async () => {
    const { default: App } = await import("../App");

    render(<App />, { wrapper: TestWrapper });

    expect(screen.getByTestId("computer-container")).toBeInTheDocument();
  });

  it("should render editor component", async () => {
    const { default: App } = await import("../App");

    render(<App />, { wrapper: TestWrapper });

    expect(screen.getByTestId("editor")).toBeInTheDocument();
  });

  it("should render controls component", async () => {
    const { default: App } = await import("../App");

    render(<App />, { wrapper: TestWrapper });

    expect(screen.getByTestId("controls")).toBeInTheDocument();
  });

  it("should have proper accessibility structure", async () => {
    const { default: App } = await import("../App");

    render(<App />, { wrapper: TestWrapper });

    // Verificar estructura básica
    expect(document.querySelector("header")).toBeInTheDocument();
    expect(document.querySelector("footer")).toBeInTheDocument();
  });
});
