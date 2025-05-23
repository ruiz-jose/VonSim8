import { useAtomValue } from "jotai";
import { useEffect, useRef} from "react";

import { simulationAtom } from "@/computer/simulation"; // Importar simulationAtom
import { programModifiedAtom } from "@/editor/state";
import { useTranslate } from "@/lib/i18n";
import { store } from "@/lib/jotai";
import { useSettings } from "@/lib/settings"; // Importar useSettings
import { toast } from "@/lib/toast";

import { cycleCountAtom, messageAtom, messageHistoryAtom } from "./state";

export function RegisterTransferMessages() {
  const translate = useTranslate();
  const message = useAtomValue(messageAtom);
  const cycleCount = useAtomValue(cycleCountAtom);
  const messageHistory = useAtomValue(messageHistoryAtom);
  const simulationStatus = useAtomValue(simulationAtom);
  const programModified = useAtomValue(programModifiedAtom);
 
  const [settings] = useSettings(); // Obtener settings desde el menú de configuración

  const containerRef = useRef<HTMLDivElement>(null); // Referencia al contenedor para el scroll


  // Función para dividir el mensaje en "Ciclo", "Etapa" y "Acción"
  const parseMessage = (msg: string, cycle: number) => {

    const [stage, ...actionParts] = msg.split(":");
    const action = actionParts.join(":").trim(); // Resto del mensaje como acción
    return { cycle, stage: stage.trim(), action };
  };

  // Usar useEffect para agregar el mensaje actual al historial
  useEffect(() => {
    if (message) {
      const parsedMessage = parseMessage(message, cycleCount); // Parsear el mensaje con el ciclo
      store.set(messageHistoryAtom, prev => [...prev, parsedMessage]); // Guardar en el historial
    }
  }, [message]); // Ejecutar solo cuando cambien `message` o `cycleCount`

  // Avisar al usuario si el programa en ejecución es modificado
  useEffect(() => {
    if (simulationStatus.type === "running" && programModified) {
      toast({
        title: "El programa ha sido modificado",
        description: "La ejecución se reiniciará desde el principio para aplicar los cambios.",
        variant: "info", // Cambiar a "info" para un aviso menos crítico
      });
    }
  }, [simulationStatus, programModified]);

  // Usar useEffect para desplazar el scroll al final cuando se agregue un nuevo mensaje
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight; // Desplazar el scroll al final
    }
  }, [messageHistory]); // Ejecutar cada vez que cambie el historial de mensajes

  
  
  // Si el usuario desactiva la visibilidad del ciclo de instrucción, no renderizar el componente
  if (!settings.showInstructionCycle) return null;

  return (
    <div
      className="absolute left-[120px] top-[520px] z-10 h-min w-[300px] rounded-lg border border-stone-600 bg-stone-900 [&_*]:z-20"
    >
      <span
        className="mb-2 block h-min w-full rounded-br-lg rounded-tl-lg border-b border-stone-600 bg-purple-500 px-2 py-1 text-lg text-white cursor-move"
      >
        {translate("computer.cpu.instruction-cycle")}
      </span>
      <hr className="border-stone-600" />
      <div
        ref={containerRef} // Referencia al contenedor para el scroll
        className="flex flex-col w-full py-2 px-2 overflow-y-auto max-h-[300px]"
      >
        {/* Renderizar mensajes con títulos dinámicos */}
        {messageHistory.map((msg, index) => {
          const isNewStage =
            index === 0 || messageHistory[index - 1].stage !== msg.stage;

          return (
            <div key={index}>
              {/* Nuevo título de etapa si es una nueva etapa */}
              {isNewStage && (
                <>
                  <div
                    className={`mb-2 ${
                      msg.stage === "Captación"
                      ? "text-blue-400 text-lg font-serif"
                      : msg.stage === "Ejecución"
                      ? "text-green-400 text-lg font-sans"
                      : msg.stage === "Interrupción"
                      ? "text-red-400 text-lg font-mono"
                      : "text-white text-sm font-bold"
                    }`}
                  >
                    Etapa: {msg.stage}
                  </div>
                  {/* Títulos de las columnas */}
                  {msg.stage !== "Interrupción" && (
                    <div className="flex text-white text-sm font-bold mb-2 font-serif">
                      <div className="w-1/4 text-center">Ciclo</div>
                      <div className="w-3/4 text-left">Acción</div>
                    </div>
                  )}
                </>
              )}
              {/* Mensaje de la etapa */}
              {msg.stage === "Interrupción" ? (
                // Mostrar solo msg.action si la etapa es "Interrupción"
                <div className="text-white text-sm mb-1">{msg.action}</div>
              ) : (
                // Mostrar ciclo y acción para otras etapas
                <div className="flex text-white text-sm mb-1">
                  <div className="w-1/4 text-center">{msg.cycle}</div>
                  <div className="w-3/4 text-left">{msg.action}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}