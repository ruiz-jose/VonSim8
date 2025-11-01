import { faKeyboard } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useAtomValue } from "jotai";

import { simulationAtom } from "@/computer/simulation";
import { useTranslate } from "@/lib/i18n";

/**
 * Notificación flotante que aparece cuando el simulador está esperando entrada de teclado (INT 6).
 * Se muestra en la parte superior central de la pantalla sin bloquear la vista.
 */
export function KeyboardInputNotification() {
  const translate = useTranslate();
  const status = useAtomValue(simulationAtom);

  // Solo mostrar cuando está esperando input del teclado
  if (!status || status.type !== "running" || !status.waitingForInput) {
    return null;
  }

  return (
    <div
      className="fixed left-1/2 top-20 z-50 -translate-x-1/2 duration-300 animate-in fade-in slide-in-from-top-4"
      data-testid="keyboard-input-modal"
    >
      {/* Notificación flotante */}
      <div className="flex items-center gap-4 rounded-lg border-2 border-mantis-500 bg-stone-900/95 px-6 py-4 shadow-2xl backdrop-blur-sm">
        {/* Icono animado */}
        <div className="shrink-0">
          <div className="rounded-full bg-mantis-500/20 p-3">
            <FontAwesomeIcon icon={faKeyboard} className="size-6 animate-pulse text-mantis-400" />
          </div>
        </div>

        {/* Contenido */}
        <div className="flex flex-col gap-1">
          <h3 className="text-lg font-bold text-white">
            {translate("messages.keyboard-input-required")}
          </h3>
          <p className="text-sm text-stone-300">
            {translate("messages.keyboard-input-description")}
          </p>
        </div>

        {/* Indicador visual de espera */}
        <div className="flex items-center gap-1.5 pl-2">
          <div className="size-2 animate-bounce rounded-full bg-mantis-400 [animation-delay:-0.3s]"></div>
          <div className="size-2 animate-bounce rounded-full bg-mantis-400 [animation-delay:-0.15s]"></div>
          <div className="size-2 animate-bounce rounded-full bg-mantis-400"></div>
        </div>
      </div>
    </div>
  );
}
