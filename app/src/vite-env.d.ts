/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/react" />

declare module "virtual:pwa-register" {
  export interface RegisterSWOptions {
    immediate?: boolean;
    onNeedRefresh?: () => void;
    onOfflineReady?: () => void;
    onRegistered?: (swRegistration?: ServiceWorkerRegistration) => void;
    onRegisterError?: (error?: any) => void;
  }

  export function registerSW(options?: RegisterSWOptions): (reloadPage?: boolean) => Promise<void>;
}

declare global {
  interface Window {
    codemirror: import("@codemirror/view").EditorView | null;
    updateVonSim8?: () => void;
  }
}

declare const __COMMIT_HASH__: string;
