import "@/styles/fonts.css";
import "@/styles/main.css";

import { PostHogProvider } from "posthog-js/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "@/App";
import { NotificationProvider } from "@/components/NotificationCenter";
import { JotaiProvider } from "@/lib/jotai";
import { posthog } from "@/lib/posthog";
import { Toaster } from "@/lib/toast/toaster";

// Initialize CodeMirror as null
(window as any).codemirror = null;

const root = createRoot(document.getElementById("root") as HTMLDivElement);
root.render(
  <StrictMode>
    <PostHogProvider client={posthog}>
      <NotificationProvider>
        <JotaiProvider>
          <App />
        </JotaiProvider>
        <Toaster />
      </NotificationProvider>
    </PostHogProvider>
  </StrictMode>,
);
