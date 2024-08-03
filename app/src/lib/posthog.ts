import posthog from "posthog-js";

const client =
  posthog.init("phc_Iq0zy6d8IRJY2ts0uHNWlSbectCsUgQK77MLj3ypSdM", {
    api_host: "https://us.posthog.com",
    autocapture: false,
    capture_pageview: true,
    persistence: "memory",
  }) || posthog;

export { client as posthog };
