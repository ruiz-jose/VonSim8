import "@testing-library/jest-dom";

import { render, screen } from "@testing-library/react";
import { createStore } from "jotai";
import { Provider as JotaiProvider } from "jotai/react";
import { useMedia } from "react-use";
import { describe, expect, it, vi } from "vitest";

import App from "./App";
// Eliminada referencia a NotificationProvider

(globalThis as any).ResizeObserver = class {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  observe() {}
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  unobserve() {}
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  disconnect() {}
};
(globalThis as any).__COMMIT_HASH__ = "test-hash";

// Mock para usePWAUpdate
vi.mock("@/hooks/usePWAUpdate", () => ({
  usePWAUpdate: () => ({
    updateInfo: { available: false },
    updateApp: vi.fn(),
  }),
}));

vi.mock("virtual:pwa-register/react", () => ({
  useRegisterSW: () => ({}),
}));
vi.mock("react-use", async importOriginal => {
  const actual = await importOriginal();
  return Object.assign({}, actual, {
    useMedia: vi.fn(),
  });
});

// Wrapper con providers necesarios
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const store = createStore();
  return <JotaiProvider store={store}>{children}</JotaiProvider>;
};

describe("App layout", () => {
  it("renders DesktopLayout on large screens", () => {
    const useMediaMock = vi.mocked(useMedia);
    useMediaMock.mockReturnValue(false); // no es móvil
    render(<App />, { wrapper: TestWrapper });
    expect(screen.getByTestId("header")).toBeInTheDocument();
    // Puedes agregar más asserts para DesktopLayout
  });

  it("renders MobileLayout on small screens", () => {
    const useMediaMock = vi.mocked(useMedia);
    useMediaMock.mockReturnValue(true); // es móvil
    render(<App />, { wrapper: TestWrapper });
    expect(screen.getByTestId("header")).toBeInTheDocument();
    expect(screen.getByTestId("footer")).toBeInTheDocument();
    // Puedes agregar más asserts para MobileLayout
  });
});
