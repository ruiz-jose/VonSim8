// Declaraciones de tipos globales para VonSim8

type CodemirrorType = {
  state: {
    doc: {
      toString(): string;
      length: number;
      lineAt(pos: number): { from: number; to: number };
    };
  };
  dispatch: (transaction: any) => void;
  destroy?: () => void;
  dom?: {
    addEventListener: (type: string, listener: EventListener) => void;
    removeEventListener: (type: string, listener: EventListener) => void;
  };
};

declare global {
  // Usar type en vez de interface para Window
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  type WindowWithCodemirror = Window & { codemirror?: CodemirrorType };
  // Extender la interface Window global
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface Window {
    codemirror?: CodemirrorType;
    // Funciones globales para el sistema de actualizaciones
    updateVonSim8?: () => void;
    checkVonSim8Updates?: () => void;
    VonSimAddNotification?: (notification: {
      type: "info" | "success" | "warning" | "error";
      title: string;
      message: string;
    }) => void;
    // Función para el tour de bienvenida
    startWelcomeTour?: () => void;
  }
}

export {};
