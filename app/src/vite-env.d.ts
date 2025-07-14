/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/react" />

type ImportMetaEnv = {
  readonly VITE_API_URL: string;
  // otras variables de entorno personalizadas...
};

type ImportMeta = {
  readonly env: ImportMetaEnv;
};

declare module "virtual:pwa-register" {
  export type RegisterSWOptions = {
    immediate?: boolean;
    onNeedRefresh?: () => void;
    onOfflineReady?: () => void;
    onRegistered?: (swRegistration?: ServiceWorkerRegistration) => void;
    onRegisterError?: (error?: any) => void;
  };

  export function registerSW(options?: RegisterSWOptions): (reloadPage?: boolean) => Promise<void>;
}

declare global {
  type Window = typeof globalThis & {
    codemirror: import("@codemirror/view").EditorView | null;
    updateVonSim8?: () => void;
  };
}

declare const __COMMIT_HASH__: string;
