import posthog from "posthog-js";

const client =
  posthog.init("phx_rUWwSSlP25WpD3qDii5hKzRuQl5fnd86Yb0X6Z6QZ65iGai", {
    api_host: "https://eu.posthog.com",
    autocapture: false,
    capture_pageview: true,
    persistence: "memory",
  }) || posthog;

export { client as posthog };
