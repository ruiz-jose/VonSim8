// Mock de los hooks - debe estar antes de las importaciones
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { NotificationProvider } from "@/components/NotificationCenter";
import { UpdateBanner } from "@/components/UpdateBanner";
import { usePWAUpdate } from "@/hooks/usePWAUpdate";
import { useVersionCheck } from "@/hooks/useVersionCheck";

vi.mock("@/hooks/usePWAUpdate", () => ({
  usePWAUpdate: vi.fn(),
}));

vi.mock("@/hooks/useVersionCheck", () => ({
  useVersionCheck: vi.fn(),
}));

// Mock de virtual:pwa-register
vi.mock("virtual:pwa-register", () => ({
  registerSW: vi.fn(() => vi.fn()),
}));

// Mock de localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

// Mock de __COMMIT_HASH__
(globalThis as any).__COMMIT_HASH__ = "test-hash-123";

describe("Sistema de Actualizaciones", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockImplementation(() => {
      // Mock implementation
    });

    // Configurar mocks por defecto
    (usePWAUpdate as any).mockReturnValue({
      updateInfo: { available: false, updating: false, lastUpdate: null },
      updateApp: vi.fn(),
      checkForUpdates: vi.fn(),
    });

    (useVersionCheck as any).mockReturnValue({
      versionInfo: {
        currentHash: "test-hash-123",
        lastKnownHash: null,
        hasUpdate: false,
        lastCheck: null,
      },
      checkForVersionUpdate: vi.fn(),
      updateToNewVersion: vi.fn(),
      dismissUpdate: vi.fn(),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("UpdateBanner", () => {
    it("debería renderizar sin errores cuando no hay actualizaciones", () => {
      render(
        <NotificationProvider>
          <UpdateBanner />
        </NotificationProvider>,
      );

      expect(screen.queryByText("Nueva versión disponible")).not.toBeInTheDocument();
    });

    it("debería mostrar banner cuando hay actualización PWA", () => {
      (usePWAUpdate as any).mockReturnValue({
        updateInfo: { available: true, updating: false, lastUpdate: null },
        updateApp: vi.fn(),
        checkForUpdates: vi.fn(),
      });

      render(
        <NotificationProvider>
          <UpdateBanner />
        </NotificationProvider>,
      );

      expect(screen.getByText("Nueva versión disponible")).toBeInTheDocument();
    });

    it("debería mostrar banner cuando hay actualización de versión", () => {
      (useVersionCheck as any).mockReturnValue({
        versionInfo: {
          currentHash: "test-hash-123",
          lastKnownHash: "old-hash-456",
          hasUpdate: true,
          lastCheck: new Date(),
        },
        checkForVersionUpdate: vi.fn(),
        updateToNewVersion: vi.fn(),
        dismissUpdate: vi.fn(),
      });

      render(
        <NotificationProvider>
          <UpdateBanner />
        </NotificationProvider>,
      );

      expect(screen.getByText("Nueva versión disponible")).toBeInTheDocument();
    });

    it("debería permitir descartar el banner", async () => {
      (usePWAUpdate as any).mockReturnValue({
        updateInfo: { available: true, updating: false, lastUpdate: null },
        updateApp: vi.fn(),
        checkForUpdates: vi.fn(),
      });

      render(
        <NotificationProvider>
          <UpdateBanner />
        </NotificationProvider>,
      );

      expect(screen.getByText("Nueva versión disponible")).toBeInTheDocument();

      // Buscar el botón de cerrar por su aria-label
      const dismissButton = screen.getByRole("button", { name: "Cerrar banner de actualización" });
      fireEvent.click(dismissButton);

      // Esperar a que la animación termine y verificar que el banner se oculte
      await waitFor(
        () => {
          expect(screen.queryByText("Nueva versión disponible")).not.toBeInTheDocument();
        },
        { timeout: 1000 },
      );
    });
  });
});
