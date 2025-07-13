import "@testing-library/jest-dom";

import { cleanup } from "@testing-library/react";
import React from "react";
import { afterEach, expect, vi } from "vitest";

// Mock ABSOLUTO para @/computer (debe ir antes de cualquier import)
function ComputerContainerMock() {
  return React.createElement(
    "div",
    { "data-testid": "computer-container" },
    "Computer Container Mock",
  );
}
ComputerContainerMock.displayName = "ComputerContainerMock";
ComputerContainerMock.ComputerContainer = ComputerContainerMock;

vi.mock("@/computer", () => {
  return {
    __esModule: true,
    ComputerContainer: ComputerContainerMock,
    default: ComputerContainerMock,
  };
});

// Mock global para @/components/Controls
function ControlsMock() {
  return React.createElement("div", { "data-testid": "controls" }, "Controls Mock");
}
ControlsMock.displayName = "ControlsMock";
vi.mock("@/components/Controls", () => {
  return {
    __esModule: true,
    default: ControlsMock,
    Controls: ControlsMock,
  };
});

// Mock para react-use
vi.mock("react-use", () => ({
  useMedia: vi.fn(() => false), // Simular desktop por defecto
  useKey: vi.fn(), // Mock para useKey
}));

// Mock para @/lib/i18n
vi.mock("@/lib/i18n", () => ({
  useTranslate: () => (key: string) => key,
  translate: (lang: string, key: string) => key,
  getSettings: () => ({ language: "es" }),
  setLanguage() {
    // Método intencionalmente vacío
  },
}));

// Mock para @/lib/settings
vi.mock("@/lib/settings", () => ({
  useSettings: vi.fn(() => [
    {
      showInstructionCycle: true,
      showRegisters: true,
      showMemory: true,
      showIO: true,
      showBus: true,
      showControl: true,
      showALU: true,
      showAddressBus: true,
      showDataBus: true,
      showControlLines: true,
      showDataLines: true,
      showChipSelect: true,
      showClock: true,
      showTimer: true,
      showPIC: true,
      showPIO: true,
      showHandshake: true,
      showF10: true,
      showKeyboard: true,
      showScreen: true,
      showPrinter: true,
      showLeds: true,
      showSwitches: true,
      showConnectScreenAndKeyboard: true,
      devices: { keyboardAndScreen: true },
    },
    vi.fn(),
  ]),
  useLanguage: vi.fn(() => "es"),
  useFilters: vi.fn(() => "none"),
  useEditorFontSize: vi.fn(() => 14),
  getSettings: vi.fn(() => ({ language: "es" })),
  PIO_CONNECTIONS: ["PIO_A0", "PIO_A1", "PIO_B0", "PIO_B1"],
  HANDSHAKE_CONNECTIONS: ["HANDSHAKE_1", "HANDSHAKE_2"],
  F10_CONNECTIONS: ["F10_1", "F10_2"],
}));

// Mock para simulación
vi.mock("@/computer/simulation", () => ({
  useSimulation: vi.fn(() => ({
    status: { type: "stopped" },
    run: vi.fn(),
    stop: vi.fn(),
    step: vi.fn(),
    reset: vi.fn(),
    dispatch: vi.fn(),
    devices: {
      hasIOBus: true,
      clock: true,
      timer: true,
      pic: true,
      pio: true,
      handshake: true,
      f10: true,
      keyboard: true,
      screen: true,
      printer: true,
      leds: true,
      switches: true,
    },
  })),
  dispatch: vi.fn(),
  simulationAtom: { init: "stopped", read: vi.fn(() => "stopped"), write: vi.fn() },
}));

// Mock para Jotai
vi.mock("jotai", () => ({
  atom: vi.fn(initialValue => ({
    init: initialValue,
    read: vi.fn(() => initialValue),
    write: vi.fn(),
  })),
  useAtom: vi.fn(() => [{}, vi.fn()]),
  useAtomValue: vi.fn(() => ({})),
  useSetAtom: vi.fn(() => vi.fn()),
  atomWithStorage: vi.fn((key, initialValue) => ({
    init: initialValue,
    read: vi.fn(() => initialValue),
    write: vi.fn(),
  })),
  createStore: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
    sub: vi.fn(),
    dev_subscribe_store: vi.fn(),
  })),
  Provider: ({ children }: any) => children,
}));

// Mock para Jotai React
vi.mock("jotai/react", async () => {
  return {
    useAtom: vi.fn(() => [{}, vi.fn()]),
    useAtomValue: vi.fn(() => ({})),
    useSetAtom: vi.fn(() => vi.fn()),
    Provider: ({ children }: any) => children,
  };
});

// Mock para átomos específicos que causan problemas
vi.mock("@/computer/cpu/atoms", () => ({
  // Registros
  alAtom: { init: { low: 0, high: 0 }, read: vi.fn(() => ({ low: 0, high: 0 })), write: vi.fn() },
  blAtom: { init: { low: 0, high: 0 }, read: vi.fn(() => ({ low: 0, high: 0 })), write: vi.fn() },
  clAtom: { init: { low: 0, high: 0 }, read: vi.fn(() => ({ low: 0, high: 0 })), write: vi.fn() },
  dlAtom: { init: { low: 0, high: 0 }, read: vi.fn(() => ({ low: 0, high: 0 })), write: vi.fn() },
  ipAtom: { init: { low: 0, high: 0 }, read: vi.fn(() => ({ low: 0, high: 0 })), write: vi.fn() },
  spAtom: {
    init: { low: 0xff, high: 0 },
    read: vi.fn(() => ({ low: 0xff, high: 0 })),
    write: vi.fn(),
  },
  flagsAtom: {
    init: { Z: false, C: false, S: false },
    read: vi.fn(() => ({ Z: false, C: false, S: false })),
    write: vi.fn(),
  },
  // Ciclo de instrucción
  cycleAtom: { init: { metadata: {} }, read: vi.fn(() => ({ metadata: {} })), write: vi.fn() },
  // Memoria
  memoryAtom: {
    init: new Array(65536).fill(0),
    read: vi.fn(() => new Array(65536).fill(0)),
    write: vi.fn(),
  },
  // Editor
  fileHandleAtom: { init: null, read: vi.fn(() => null), write: vi.fn() },
  lastSavedProgramAtom: { init: null, read: vi.fn(() => null), write: vi.fn() },
  dirtyAtom: { init: false, read: vi.fn(() => false), write: vi.fn() },
  lintErrorsAtom: { init: [], read: vi.fn(() => []), write: vi.fn() },
}));

// Mock para toast
vi.mock("@/lib/toast", () => ({
  toast: vi.fn(),
  useToast: vi.fn(() => ({ toast: vi.fn() })),
}));

// Mock para PostHog
vi.mock("@/lib/posthog", () => ({
  posthog: {
    capture: vi.fn(),
    identify: vi.fn(),
    set: vi.fn(),
  },
}));

// Mock para PWA
vi.mock("virtual:pwa-register/react", () => ({
  useRegisterSW: vi.fn(() => ({
    needRefresh: [false, vi.fn()],
    offlineReady: [false, vi.fn()],
    updateServiceWorker: vi.fn(),
  })),
}));

// Mock para ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock para matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock para IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock para getComputedStyle
Object.defineProperty(window, "getComputedStyle", {
  value: vi.fn(() => ({
    getPropertyValue: vi.fn(() => ""),
  })),
});

// Mock para CSS.supports
Object.defineProperty(window, "CSS", {
  value: {
    supports: vi.fn(() => true),
  },
});

// Cleanup después de cada test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Configuración global de expect
expect.extend({
  toHaveBeenCalledWithMatch(received, ...expected) {
    const pass = vi
      .mocked(received)
      .mock.calls.some(call =>
        expected.every(
          (arg, index) =>
            call[index] &&
            typeof call[index] === "object" &&
            Object.keys(arg).every(key => call[index][key] === arg[key]),
        ),
      );
    return {
      pass,
      message: () =>
        `expected ${received.getMockName()} to have been called with arguments matching ${JSON.stringify(expected)}`,
    };
  },
});
