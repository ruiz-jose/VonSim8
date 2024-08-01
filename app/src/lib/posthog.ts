import posthog from "posthog-js";

const client =
  posthog.init("phx_niTQON6BF2DGZnYpZyiyRfYsjUWUMHI1SJUIwSO040WKhJ7", {
    api_host: "https://eu.posthog.com",
    autocapture: false,
    capture_pageview: true,
    persistence: "memory",
  }) || posthog;

export { client as posthog };
