// Setup básico para tests
// Mock para PostHog si es necesario
Object.defineProperty(window, "posthog", {
  value: {
    init() {
      /* noop */
    },
    capture() {
      /* noop */
    },
    identify() {
      /* noop */
    },
  },
  writable: true,
});
