import "@/styles/fonts.css";
import "@/styles/main.css";

import { PostHogProvider } from "posthog-js/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "@/App";
import { NotificationProvider, useNotifications } from "@/components/NotificationCenter";
import { JotaiProvider } from "@/lib/jotai";
import { posthog } from "@/lib/posthog";
import { Toaster } from "@/lib/toast/toaster";

// Initialize CodeMirror as null
(window as any).codemirror = null;

function VonSimNotificationBridge() {
  // Exponer el método addNotification globalmente
  const { addNotification } = useNotifications();
  // @ts-ignore
  window.VonSimAddNotification = addNotification;
  return null;
}

// Captura global de errores para notificar en la campanita
function notifyGlobalError(message: string, details?: string) {
  const notification = {
    type: "error",
    title: "Error inesperado",
    message: details ? `${message}\n${details}` : message,
  };
  // Reintentos para asegurar que VonSimAddNotification esté disponible
  function tryNotify(retries = 10) {
    if ((window as any).VonSimAddNotification) {
      (window as any).VonSimAddNotification(notification);
    } else if (retries > 0) {
      setTimeout(() => tryNotify(retries - 1), 100);
    }
  }
  tryNotify();
}

window.onerror = function (msg, url, line, col, error) {
  notifyGlobalError(
    typeof msg === "string" ? msg : "Error de JavaScript",
    error && error.stack ? error.stack : undefined,
  );
  return false; // Permitir que el error siga su curso normal
};

window.onunhandledrejection = function (event) {
  const reason = event.reason instanceof Error ? event.reason.stack || event.reason.message : String(event.reason);
  notifyGlobalError("Promesa no manejada", reason);
  return false;
};

const root = createRoot(document.getElementById("root") as HTMLDivElement);
root.render(
  <StrictMode>
    <PostHogProvider client={posthog}>
      <NotificationProvider>
        <VonSimNotificationBridge />
        <JotaiProvider>
          <App />
        </JotaiProvider>
        <Toaster />
      </NotificationProvider>
    </PostHogProvider>
  </StrictMode>,
);
