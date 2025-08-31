import "@/styles/fonts.css";
import "@/styles/main.css";

import { PostHogProvider } from "posthog-js/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "@/App";
// Eliminada referencia a NotificationProvider y useNotifications
import { JotaiProvider } from "@/lib/jotai";
import { posthog } from "@/lib/posthog";
import { Toaster } from "@/lib/toast/toaster";

// Initialize CodeMirror as null
(window as any).codemirror = null;

// Eliminado VonSimNotificationBridge

// Eliminada función notifyGlobalError

// Eliminado manejo global de errores con notifyGlobalError

const root = createRoot(document.getElementById("root") as HTMLDivElement);
root.render(
  <StrictMode>
    <PostHogProvider client={posthog}>
      <JotaiProvider>
        <App />
      </JotaiProvider>
      <Toaster />
    </PostHogProvider>
  </StrictMode>,
);
