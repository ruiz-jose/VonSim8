import posthog from "posthog-js";

const client =
  posthog.init("phx_JyxTGO7dec0jsLzTWsDJef4cFqfOb7DcNwqsb80yDApDSrK", {
    api_host: "https://eu.posthog.com",
    autocapture: false,
    capture_pageview: true,
    persistence: "memory",
  }) || posthog;

export { client as posthog };
