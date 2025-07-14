import { useAtomValue } from "jotai";
import { useEffect, useRef } from "react";

import { simulationAtom } from "@/computer/simulation";
import { programModifiedAtom } from "@/editor/state";
import { useTranslate } from "@/lib/i18n";
import { store } from "@/lib/jotai";
import { useSettings } from "@/lib/settings";
import { toast } from "@/lib/toast";
import { Tooltip } from "@/components/ui/Tooltip";

import { cycleCountAtom, messageAtom, messageHistoryAtom } from "./state";

// Función para obtener el color de la fase
function getPhaseColor(stage: string) {
  switch (stage) {
    case "Captación":
      return "text-blue-400";
    case "Obtención de operandos":
      return "text-yellow-400";
    case "Ejecución":
      return "text-green-400";
    case "Escritura":
      return "text-purple-400";
    default:
      return "text-stone-400";
  }
}

function getActionColor(stage: string, action: string) {
  // Si la fase es Ejecución, detectar las subfases específicas
  if (stage === "Ejecución") {
    // Subfase: Obtener operando (amarillo)
    if (/obten/i.test(action) || /operando/i.test(action) || /leer/i.test(action) || /cargar/i.test(action)) {
      return "text-yellow-400";
    }
    // Subfase: Escribir resultado (violeta)
    if (/escrib/i.test(action) || /guardar/i.test(action) || /almacenar/i.test(action) || /resultado/i.test(action)) {
      return "text-purple-400";
    }
    // Subfase: Procesar en ALU (verde)
    if (/procesar/i.test(action) || /alu/i.test(action) || /calcular/i.test(action) || /operar/i.test(action) || /ejecut/i.test(action)) {
      return "text-green-400";
    }
    // Si no se detecta subtipo específico, usar verde por defecto para ejecución
    return "text-green-400";
  }
  
  // Fases normales (no ejecución)
  switch (stage) {
    case "Captación":
      return "text-blue-400";
    case "Obtención de operandos":
      return "text-yellow-400";
    case "Ejecución":
      return "text-green-400";
    case "Escritura":
      return "text-purple-400";
    default:
      return "text-stone-400";
  }
}

// Función para obtener el icono de la fase
function getPhaseIcon(stage: string) {
  switch (stage) {
    case "Captación":
      return "📥";
    case "Obtención de operandos":
      return "🔍";
    case "Ejecución":
      return "⚡";
    case "Escritura":
      return "💾";
    case "Interrupción":
      return "🚨";
    default:
      return "⚙️";
  }
}

// Función para obtener el color de fondo de la fase
function getPhaseBgColor(stage: string) {
  switch (stage) {
    case "Captación":
      return "bg-blue-500/10 border-blue-400/30";
    case "Obtención de operandos":
      return "bg-yellow-500/10 border-yellow-400/30";
    case "Ejecución":
      return "bg-green-500/10 border-green-400/30";
    case "Escritura":
      return "bg-purple-500/10 border-purple-400/30";
    case "Interrupción":
      return "bg-red-500/10 border-red-400/30";
    default:
      return "bg-stone-500/10 border-stone-400/30";
  }
}

// Función para obtener el color de fondo específico de las subfases de ejecución
function getExecutionSubphaseBgColor(action: string) {
  // Subfase: Obtener operando (amarillo)
  if (/obten/i.test(action) || /operando/i.test(action) || /leer/i.test(action) || /cargar/i.test(action)) {
    return "bg-yellow-500/5 border-yellow-400/20";
  }
  // Subfase: Escribir resultado (violeta)
  if (/escrib/i.test(action) || /guardar/i.test(action) || /almacenar/i.test(action) || /resultado/i.test(action)) {
    return "bg-purple-500/5 border-purple-400/20";
  }
  // Subfase: Procesar en ALU (verde)
  if (/procesar/i.test(action) || /alu/i.test(action) || /calcular/i.test(action) || /operar/i.test(action) || /ejecut/i.test(action)) {
    return "bg-green-500/5 border-green-400/20";
  }
  // Por defecto, usar el color de ejecución
  return "bg-green-500/5 border-green-400/20";
}

export function RegisterTransferMessages() {
  const translate = useTranslate();
  const message = useAtomValue(messageAtom);
  const messageHistory = useAtomValue(messageHistoryAtom);
  const simulationStatus = useAtomValue(simulationAtom);
  const programModified = useAtomValue(programModifiedAtom);

  const [settings] = useSettings();

  const containerRef = useRef<HTMLDivElement>(null);

  // Función para dividir el mensaje en "Ciclo", "Etapa" y "Acción"
  const parseMessage = (msg: string, cycle: number) => {
    const [stage, ...actionParts] = msg.split(":");
    const action = actionParts.join(":").trim();
    return { cycle, stage: stage.trim(), action };
  };

  // Usar useEffect para agregar el mensaje actual al historial
  useEffect(() => {
    if (message) {
      const currentCycleCount = store.get(cycleCountAtom);
      const parsedMessage = parseMessage(message, currentCycleCount);
      store.set(messageHistoryAtom, prev => [...prev, parsedMessage]);
    }
  }, [message]);

  // Avisar al usuario si el programa en ejecución es modificado
  useEffect(() => {
    if (simulationStatus.type === "running" && programModified) {
      toast({
        title: "El programa ha sido modificado",
        description: "La ejecución se reiniciará desde el principio para aplicar los cambios.",
        variant: "info",
      });
    }
  }, [simulationStatus, programModified]);

  // Usar useEffect para desplazar el scroll al final cuando se agregue un nuevo mensaje
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messageHistory]);

  // Si el usuario desactiva la visibilidad del ciclo de instrucción, no renderizar el componente
  if (!settings.showInstructionCycle) return null;

  return (
    <div className="absolute left-[120px] top-[520px] z-10 h-min w-[360px]">
      {/* Contenedor principal simplificado */}
      <div className="rounded-lg border-2 border-stone-400 bg-gradient-to-br from-stone-800 to-stone-900 shadow-lg">
        {/* Header simple y claro */}
        <div className="border-b-2 border-stone-600 bg-stone-700 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">🔄</span>
              <div>
                <h3 className="text-sm font-bold text-stone-200">
                  Ciclo de Instrucción
                </h3>
                <p className="text-xs text-stone-400">Seguimiento paso a paso</p>
              </div>
            </div>
            <div className="flex items-center gap-1 rounded-full bg-green-500/20 px-2 py-1">
              <div className="size-2 animate-pulse rounded-full bg-green-400"></div>
              <span className="text-xs font-medium text-green-300">Activo</span>
            </div>
          </div>
        </div>

        {/* Contenido principal simplificado */}
        <div
          ref={containerRef}
          className="max-h-[300px] overflow-y-auto p-3"
        >
          {/* Renderizar mensajes de forma más simple */}
          {messageHistory.map((msg, index) => {
            const isNewStage = index === 0 || messageHistory[index - 1].stage !== msg.stage;
            const isLatest = index === messageHistory.length - 1;

            return (
              <div key={index} className="mb-3">
                {/* Título de fase simplificado */}
                {isNewStage && (
                  <div className="mb-3">
                    <div className="flex items-center gap-2 rounded-lg bg-stone-700/50 p-2">
                      <span className="text-lg">{getPhaseIcon(msg.stage)}</span>
                      <div>
                        <h4 className={`text-sm font-bold ${getPhaseColor(msg.stage)}`}>
                          {msg.stage}
                        </h4>
                        <p className="text-xs text-stone-400">
                          {msg.stage === "Captación" && "Leer instrucción"}
                          {msg.stage === "Obtención de operandos" && "Preparar datos"}
                          {msg.stage === "Ejecución" && "Procesar instrucción"}
                          {msg.stage === "Escritura" && "Guardar resultado"}
                          {msg.stage === "Interrupción" && "Manejar interrupción"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Mensaje individual simplificado */}
                {msg.stage === "Interrupción" ? (
                  <div className={`rounded-lg border-l-4 border-red-400 bg-red-900/20 p-3 ${isLatest ? 'ring-2 ring-red-400/30' : ''}`}>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">🚨</span>
                      <span className={`text-sm font-medium ${getActionColor(msg.stage, msg.action)}`}>
                        {msg.action}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className={`flex items-center gap-3 rounded-lg border p-3 ${
                    msg.stage === "Ejecución" 
                      ? `${getExecutionSubphaseBgColor(msg.action)} ${isLatest ? 'ring-2 ring-stone-400/30' : ''}`
                      : `border-stone-600 bg-stone-800/50 ${isLatest ? 'ring-2 ring-stone-400/30 bg-stone-700/50' : ''}`
                  }`}>
                    {/* Número de ciclo */}
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-700 font-bold text-stone-300 text-sm">
                      {msg.cycle}
                    </div>
                    
                    {/* Acción */}
                    <div className="flex-1">
                      <span className={`text-sm font-medium ${getActionColor(msg.stage, msg.action)}`}>
                        {msg.action}
                      </span>
                    </div>
                    
                    {/* Indicador de último mensaje */}
                    {isLatest && (
                      <div className="flex h-2 w-2 animate-pulse rounded-full bg-stone-400"></div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          
          {/* Estado vacío simplificado */}
          {messageHistory.length === 0 && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="mb-3 text-4xl">⏳</div>
                <h4 className="mb-1 text-sm font-bold text-stone-300">Esperando instrucciones</h4>
                <p className="text-xs text-stone-500">Ejecuta un programa para ver el ciclo</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer simple */}
        <div className="border-t border-stone-600 bg-stone-800/50 px-4 py-2">
          <div className="flex items-center justify-between text-xs text-stone-400">
            <span>Ciclos: {messageHistory.length}</span>
            <span>Monitor en tiempo real</span>
          </div>
        </div>
      </div>
    </div>
  );
}
