import { vi } from "vitest";

vi.mock("virtual:pwa-register/react", () => ({
  useRegisterSW: () => ({})
}));
