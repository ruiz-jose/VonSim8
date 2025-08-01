import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { NotificationProvider } from "@/components/NotificationCenter";
import { UpdateBanner } from "@/components/UpdateBanner";
import { UpdateSettings } from "@/components/UpdateSettings";
import { usePWAUpdate } from "@/hooks/usePWAUpdate";
import { useVersionCheck } from "@/hooks/useVersionCheck";

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
declare global {
  var __COMMIT_HASH__: string;
}
global.__COMMIT_HASH__ = "test-hash-123";

// Componente de prueba que usa los hooks
const TestComponent = () => {
  const pwaUpdate = usePWAUpdate();
  const versionCheck = useVersionCheck();

  return (
    <div>
      <div data-testid="pwa-available">{pwaUpdate.updateInfo.available.toString()}</div>
      <div data-testid="version-has-update">{versionCheck.versionInfo.hasUpdate.toString()}</div>
      <UpdateBanner />
      <UpdateSettings />
    </div>
  );
};

describe("Sistema de Actualizaciones", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Hook usePWAUpdate", () => {
    it("debería inicializar con estado correcto", () => {
      render(
        <NotificationProvider>
          <TestComponent />
        </NotificationProvider>
      );

      expect(screen.getByTestId("pwa-available")).toHaveTextContent("false");
    });

    it("debería exponer funciones globales", () => {
      render(
        <NotificationProvider>
          <TestComponent />
        </NotificationProvider>
      );

      expect(window.updateVonSim8).toBeDefined();
      expect(window.checkVonSim8Updates).toBeDefined();
    });
  });

  describe("Hook useVersionCheck", () => {
    it("debería inicializar con estado correcto", () => {
      render(
        <NotificationProvider>
          <TestComponent />
        </NotificationProvider>
      );

      expect(screen.getByTestId("version-has-update")).toHaveTextContent("false");
    });

    it("debería detectar actualización cuando el hash cambia", () => {
      // Simular hash anterior diferente
      localStorageMock.getItem.mockReturnValue("old-hash-456");

      render(
        <NotificationProvider>
          <TestComponent />
        </NotificationProvider>
      );

      expect(screen.getByTestId("version-has-update")).toHaveTextContent("true");
    });
  });

  describe("UpdateBanner", () => {
    it("no debería mostrarse cuando no hay actualizaciones", () => {
      render(
        <NotificationProvider>
          <UpdateBanner />
        </NotificationProvider>
      );

      expect(screen.queryByText("Nueva versión disponible")).not.toBeInTheDocument();
    });

    it("debería mostrarse cuando hay actualización disponible", () => {
      // Simular actualización disponible
      localStorageMock.getItem.mockReturnValue("old-hash-456");

      render(
        <NotificationProvider>
          <UpdateBanner />
        </NotificationProvider>
      );

      expect(screen.getByText("Nueva versión disponible")).toBeInTheDocument();
    });

    it("debería permitir descartar el banner", async () => {
      localStorageMock.getItem.mockReturnValue("old-hash-456");

      render(
        <NotificationProvider>
          <UpdateBanner />
        </NotificationProvider>
      );

      const dismissButton = screen.getByRole("button", { name: /×/ });
      fireEvent.click(dismissButton);

      await waitFor(() => {
        expect(screen.queryByText("Nueva versión disponible")).not.toBeInTheDocument();
      });
    });
  });

  describe("UpdateSettings", () => {
    it("debería mostrar configuración cuando se abre", () => {
      render(
        <NotificationProvider>
          <UpdateSettings />
        </NotificationProvider>
      );

      const settingsButton = screen.getByTitle("Configuración de actualizaciones");
      fireEvent.click(settingsButton);

      expect(screen.getByText("Configuración de actualizaciones")).toBeInTheDocument();
    });

    it("debería permitir cambiar configuración", () => {
      render(
        <NotificationProvider>
          <UpdateSettings />
        </NotificationProvider>
      );

      const settingsButton = screen.getByTitle("Configuración de actualizaciones");
      fireEvent.click(settingsButton);

      const autoCheckCheckbox = screen.getByLabelText("Verificación automática");
      fireEvent.click(autoCheckCheckbox);

      expect(autoCheckCheckbox).not.toBeChecked();
    });

    it("debería guardar configuración en localStorage", () => {
      render(
        <NotificationProvider>
          <UpdateSettings />
        </NotificationProvider>
      );

      const settingsButton = screen.getByTitle("Configuración de actualizaciones");
      fireEvent.click(settingsButton);

      const autoCheckCheckbox = screen.getByLabelText("Verificación automática");
      fireEvent.click(autoCheckCheckbox);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "vonsim8-update-settings",
        expect.stringContaining('"autoCheck":false')
      );
    });
  });

  describe("Integración completa", () => {
    it("debería manejar actualizaciones de manera coordinada", async () => {
      // Simular actualización disponible
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === "vonsim8-commit-hash") return "old-hash-456";
        return null;
      });

      render(
        <NotificationProvider>
          <TestComponent />
        </NotificationProvider>
      );

      // Verificar que se detecta la actualización
      expect(screen.getByTestId("version-has-update")).toHaveTextContent("true");

      // Verificar que aparece el banner
      expect(screen.getByText("Nueva versión disponible")).toBeInTheDocument();

      // Verificar que se puede acceder a la configuración
      const settingsButton = screen.getByTitle("Configuración de actualizaciones");
      fireEvent.click(settingsButton);

      expect(screen.getByText("Configuración de actualizaciones")).toBeInTheDocument();
    });

    it("debería manejar errores de actualización", () => {
      // Simular error en localStorage
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error("Storage error");
      });

      render(
        <NotificationProvider>
          <TestComponent />
        </NotificationProvider>
      );

      // La aplicación debería seguir funcionando
      expect(screen.getByTestId("version-has-update")).toBeInTheDocument();
    });
  });
}); 