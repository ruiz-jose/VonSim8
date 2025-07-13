import "@testing-library/jest-dom";

import { render, screen } from "@testing-library/react";
import { useMedia } from "react-use";
import { describe, expect, it, vi } from "vitest";

import App from "./App";

(globalThis as any).ResizeObserver = class {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  observe() {}
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  unobserve() {}
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  disconnect() {}
};
(globalThis as any).__COMMIT_HASH__ = "test-hash";
vi.mock("virtual:pwa-register/react", () => ({
  useRegisterSW: () => ({}),
}));
vi.mock("react-use", async importOriginal => {
  const actual = await importOriginal();
  return Object.assign({}, actual, {
    useMedia: vi.fn(),
  });
});

describe("App layout", () => {
  it("renders DesktopLayout on large screens", () => {
    const useMediaMock = vi.mocked(useMedia);
    useMediaMock.mockReturnValue(false); // no es móvil
    render(<App />);
    expect(screen.getByTestId("header")).toBeInTheDocument();
    // Puedes agregar más asserts para DesktopLayout
  });

  it("renders MobileLayout on small screens", () => {
    const useMediaMock = vi.mocked(useMedia);
    useMediaMock.mockReturnValue(true); // es móvil
    render(<App />);
    expect(screen.getByTestId("header")).toBeInTheDocument();
    expect(screen.getByTestId("footer")).toBeInTheDocument();
    // Puedes agregar más asserts para MobileLayout
  });
});
