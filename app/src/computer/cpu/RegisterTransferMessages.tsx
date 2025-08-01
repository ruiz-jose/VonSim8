import { useAtomValue } from "jotai";
import { useEffect, useRef, useState } from "react";

import { simulationAtom } from "@/computer/simulation";
import { programModifiedAtom } from "@/editor/state";
import { store } from "@/lib/jotai";
import { useSettings } from "@/lib/settings";
import { toast } from "@/lib/toast";

import { currentInstructionCycleCountAtom, messageAtom, messageHistoryAtom } from "./state";

// Función para obtener el color de la fase con gradientes mejorados
function getPhaseColor(stage: string) {
  switch (stage) {
    case "Captación":
      return "text-blue-300 bg-gradient-to-r from-blue-500/10 to-cyan-500/10";
    case "Obtención de operandos":
      return "text-yellow-300 bg-gradient-to-r from-yellow-500/10 to-orange-500/10";
    case "Ejecución":
      return "text-green-300 bg-gradient-to-r from-green-500/10 to-emerald-500/10";
    case "Escritura":
      return "text-purple-300 bg-gradient-to-r from-purple-500/10 to-violet-500/10";
    default:
      return "text-stone-300 bg-gradient-to-r from-stone-500/10 to-gray-500/10";
  }
}

// Función mejorada para obtener colores de acción con efectos visuales
function getActionColor(stage: string, action: string) {
  // Si la fase es Ejecución, detectar las subfases específicas
  if (stage === "Ejecución") {
    // Subfase: Obtener operando (amarillo con efecto de búsqueda)
    if (
      /obten/i.test(action) ||
      /operando/i.test(action) ||
      /leer/i.test(action) ||
      /cargar/i.test(action)
    ) {
      return "text-yellow-300 bg-yellow-500/5 border-yellow-400/30 shadow-yellow-400/20";
    }
    // Subfase: Escribir resultado (violeta con efecto de guardado)
    if (
      /escrib/i.test(action) ||
      /guardar/i.test(action) ||
      /almacenar/i.test(action) ||
      /resultado/i.test(action)
    ) {
      return "text-purple-300 bg-purple-500/5 border-purple-400/30 shadow-purple-400/20";
    }
    // Subfase: Procesar en ALU (verde con efecto de procesamiento)
    if (
      /procesar/i.test(action) ||
      /alu/i.test(action) ||
      /calcular/i.test(action) ||
      /operar/i.test(action) ||
      /ejecut/i.test(action)
    ) {
      return "text-green-300 bg-green-500/5 border-green-400/30 shadow-green-400/20";
    }
    // Si no se detecta subtipo específico, usar verde por defecto para ejecución
    return "text-green-300 bg-green-500/5 border-green-400/30 shadow-green-400/20";
  }

  // Fases normales (no ejecución)
  switch (stage) {
    case "Captación":
      return "text-blue-300 bg-blue-500/5 border-blue-400/30 shadow-blue-400/20";
    case "Obtención de operandos":
      return "text-yellow-300 bg-yellow-500/5 border-yellow-400/30 shadow-yellow-400/20";
    case "Escritura":
      return "text-purple-300 bg-purple-500/5 border-purple-400/30 shadow-purple-400/20";
    default:
      return "text-stone-300 bg-stone-500/5 border-stone-400/30 shadow-stone-400/20";
  }
}

// Función mejorada para obtener íconos con animaciones
function getPhaseIcon(stage: string, isActive: boolean = false) {
  const baseIcon = (() => {
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
  })();

  // Aplicar animación si está activo
  if (isActive) {
    return (
      <span className="inline-block animate-bounce">
        {baseIcon}
      </span>
    );
  }

  return baseIcon;
}



// Función para obtener el color de fondo específico de las subfases de ejecución
function getExecutionSubphaseBgColor(action: string) {
  // Subfase: Obtener operando (amarillo)
  if (
    /obten/i.test(action) ||
    /operando/i.test(action) ||
    /leer/i.test(action) ||
    /cargar/i.test(action)
  ) {
    return "bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-400/30 shadow-lg shadow-yellow-400/10";
  }
  // Subfase: Escribir resultado (violeta)
  if (
    /escrib/i.test(action) ||
    /guardar/i.test(action) ||
    /almacenar/i.test(action) ||
    /resultado/i.test(action)
  ) {
    return "bg-gradient-to-r from-purple-500/10 to-violet-500/10 border-purple-400/30 shadow-lg shadow-purple-400/10";
  }
  // Subfase: Procesar en ALU (verde)
  if (
    /procesar/i.test(action) ||
    /alu/i.test(action) ||
    /calcular/i.test(action) ||
    /operar/i.test(action) ||
    /ejecut/i.test(action)
  ) {
    return "bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-400/30 shadow-lg shadow-green-400/10";
  }
  // Por defecto, usar el color de ejecución
  return "bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-400/30 shadow-lg shadow-green-400/10";
}

// Función para obtener efectos de borde animado
function getBorderAnimation(isLatest: boolean, stage: string) {
  if (!isLatest) return "";
  
  switch (stage) {
    case "Captación":
      return "ring-2 ring-blue-400/50 ring-offset-2 ring-offset-stone-800";
    case "Obtención de operandos":
      return "ring-2 ring-yellow-400/50 ring-offset-2 ring-offset-stone-800";
    case "Ejecución":
      return "ring-2 ring-green-400/50 ring-offset-2 ring-offset-stone-800";
    case "Escritura":
      return "ring-2 ring-purple-400/50 ring-offset-2 ring-offset-stone-800";
    default:
      return "ring-2 ring-stone-400/50 ring-offset-2 ring-offset-stone-800";
  }
}

// Definición de fases y subfases unificadas
const fases = [
  {
    id: "captacion",
    label: "Captación",
    color: "text-blue-400",
    icon: "📥",
    descripcion: "Captando instrucción desde memoria",
    pasos: [
      "IP apunta a la dirección de memoria, el MAR recibe la dirección del IP",
      "Se lee el contenido de memoria y se almacena en el MBR, IP se incrementa automáticamente",
      "La instrucción se transfiere al IR",
    ],
  },
  {
    id: "ejecucion",
    label: "Ejecución",
    color: "text-green-400",
    icon: "⚡",
    descripcion: "Ejecutando instrucción",
    subfases: [
      {
        id: "operandos",
        label: "Obtención de operandos",
        color: "text-yellow-400",
        icon: "🔍",
        descripcion: "Obteniendo operandos de la instrucción",
        pasos: ["Se identifican y preparan los operandos necesarios para la operación."],
      },
      {
        id: "alu",
        label: "Procesar en ALU",
        color: "text-green-400",
        icon: "⚡",
        descripcion: "Procesando en la ALU",
        pasos: ["La ALU ejecuta la operación aritmética o lógica con los operandos."],
      },
      {
        id: "escritura",
        label: "Escribir resultado",
        color: "text-purple-400",
        icon: "💾",
        descripcion: "Escribiendo resultado en registros",
        pasos: ["El resultado de la operación se almacena en el registro destino."],
      },
    ],
  },
];

// Función para obtener el color de la fase o subfase
function getStageColor(stage: string, action: string) {
  if (stage === "Captación") return "text-blue-400";
  if (stage === "Ejecución") {
    if (
      /obten/i.test(action) ||
      /operando/i.test(action) ||
      /leer/i.test(action) ||
      /cargar/i.test(action)
    ) {
      return "text-yellow-400";
    }
    if (
      /escrib/i.test(action) ||
      /guardar/i.test(action) ||
      /almacenar/i.test(action) ||
      /resultado/i.test(action)
    ) {
      return "text-purple-400";
    }
    if (
      /procesar/i.test(action) ||
      /alu/i.test(action) ||
      /calcular/i.test(action) ||
      /operar/i.test(action) ||
      /ejecut/i.test(action)
    ) {
      return "text-green-400";
    }
    return "text-green-400";
  }
  if (stage === "Escritura") return "text-purple-400";
  if (stage === "Obtención de operandos") return "text-yellow-400";
  return "text-stone-400";
}

export function RegisterTransferMessages() {
  const message = useAtomValue(messageAtom);
  const messageHistory = useAtomValue(messageHistoryAtom);
  const simulationStatus = useAtomValue(simulationAtom);
  const programModified = useAtomValue(programModifiedAtom);

  const [settings] = useSettings();
  const [showCaptacionSteps, setShowCaptacionSteps] = useState(false);

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
      const currentInstructionCycleCount = store.get(currentInstructionCycleCountAtom);
      const parsedMessage = parseMessage(message, currentInstructionCycleCount);
      store.set(messageHistoryAtom, prev => [...prev, parsedMessage]);
    }
  }, [message]);

  // Limpiar el historial cuando el contador de ciclos por instrucción se reinicie (nueva instrucción)
  // o cuando se reinicie la simulación
  useEffect(() => {
    const unsubscribeCycleCount = store.sub(currentInstructionCycleCountAtom, () => {
      const newCount = store.get(currentInstructionCycleCountAtom);
      if (newCount === 0) {
        // Si el contador se reinicia a 0, es una nueva instrucción
        store.set(messageHistoryAtom, []);
      }
    });

    const unsubscribeSimulation = store.sub(simulationAtom, () => {
      const simulationStatus = store.get(simulationAtom);
      // Si la simulación se detiene o se reinicia, limpiar el historial
      if (simulationStatus.type === "stopped") {
        store.set(messageHistoryAtom, []);
      }
    });

    return () => {
      unsubscribeCycleCount();
      unsubscribeSimulation();
    };
  }, []);

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
    <div className="absolute left-[120px] top-[520px] z-10 h-min w-[420px]">
      {/* Contenedor principal con efectos visuales mejorados */}
      <div className="rounded-xl border-2 border-stone-400/50 bg-gradient-to-br from-stone-800 to-stone-900 shadow-2xl backdrop-blur-sm">
        {/* Header con efectos visuales */}
        <div className="border-b-2 border-stone-600/50 bg-gradient-to-r from-stone-700 to-stone-800 px-4 py-3 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <span className="text-xl animate-spin-slow">🔄</span>
                <div className="absolute -top-1 -right-1 size-2 bg-green-400 rounded-full"></div>
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-200 bg-gradient-to-r from-stone-200 to-stone-300 bg-clip-text text-transparent">
                  Ciclo de Instrucción
                </h3>
                <p className="text-xs text-stone-400">Seguimiento paso a paso</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-gradient-to-r from-green-500/20 to-emerald-500/20 px-3 py-1.5 border border-green-400/30">
              <div className="size-2 rounded-full bg-green-400 shadow-lg shadow-green-400/50"></div>
              <span className="text-xs font-medium text-green-300">Activo</span>
            </div>
          </div>
        </div>

        {/* Contenido principal con scroll mejorado */}
        <div ref={containerRef} className="max-h-80 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-stone-600 scrollbar-track-stone-800">
          {/* Renderizar mensajes con efectos visuales mejorados */}
          {messageHistory.map((msg, index) => {
            const isNewStage = index === 0 || messageHistory[index - 1].stage !== msg.stage;
            const isLatest = index === messageHistory.length - 1;

            return (
              <div key={index} className="mb-3 transition-all duration-300 ease-in-out">
                {/* Título de fase con efectos visuales */}
                {isNewStage && (
                  <div className="mb-3 animate-fade-in">
                    <div className={`flex items-center gap-3 rounded-xl p-4 bg-gradient-to-r from-stone-700/80 to-stone-800/80 border border-stone-600/50 shadow-lg ${getPhaseColor(msg.stage)}`}>
                      <div className="relative">
                        <span className="text-xl">{getPhaseIcon(msg.stage, isLatest)}</span>
                        {isLatest && (
                          <div className="absolute -top-1 -right-1 size-3 bg-green-400 rounded-full"></div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className={`text-sm font-bold ${getPhaseColor(msg.stage).split(' ')[0]}`}>
                          {msg.stage}
                        </h4>
                        <p className="text-xs text-stone-400">
                          {msg.stage === "Captación" && (
                            <>
                              Leer instrucción
                              <button
                                className="ml-2 rounded-lg bg-blue-500/20 px-2 py-1 text-xs text-blue-300 transition-all duration-200 hover:bg-blue-500/40 hover:scale-105 active:scale-95 border border-blue-400/30"
                                onClick={() => setShowCaptacionSteps(v => !v)}
                              >
                                {showCaptacionSteps ? "− Ocultar pasos" : "+ Ver pasos"}
                              </button>
                            </>
                          )}
                          {msg.stage === "Obtención de operandos" && "Preparar datos"}
                          {msg.stage === "Ejecución" && "Procesar instrucción"}
                          {msg.stage === "Escritura" && "Guardar resultado"}
                          {msg.stage === "Interrupción" && "Manejar interrupción"}
                        </p>
                        {/* Pasos de captación expandibles con animación */}
                        {msg.stage === "Captación" && showCaptacionSteps && (
                          <div className="mt-3 animate-slide-down">
                            <ul className="ml-2 list-decimal text-xs text-blue-300 space-y-1">
                              {fases
                                .find(f => f.id === "captacion")
                                ?.pasos.map((paso, i) => (
                                  <li key={i} className="transition-all duration-200 hover:text-blue-200">
                                    {paso}
                                  </li>
                                ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Mensaje individual con efectos visuales mejorados */}
                {msg.stage === "Interrupción" ? (
                  <div
                    className={`rounded-xl border-l-4 border-red-400 bg-gradient-to-r from-red-900/30 to-red-800/20 p-4 shadow-lg transition-all duration-300 ${
                      isLatest ? "ring-2 ring-red-400/50 ring-offset-2 ring-offset-stone-800" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">🚨</span>
                      <span
                        className={`text-sm font-medium text-red-300`}
                      >
                        {msg.action}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div
                    className={`flex items-center gap-3 rounded-xl border p-4 transition-all duration-300 hover:scale-[1.02] ${
                      msg.stage === "Ejecución"
                        ? `${getExecutionSubphaseBgColor(msg.action)} ${
                            isLatest ? getBorderAnimation(isLatest, msg.stage) : ""
                          }`
                        : `border-stone-600/50 bg-gradient-to-r from-stone-800/80 to-stone-900/80 ${
                            isLatest ? "bg-stone-700/80 " + getBorderAnimation(isLatest, msg.stage) : ""
                          }`
                    }`}
                  >
                    {/* Número de ciclo con efectos visuales */}
                    <div
                      className={`flex size-8 items-center justify-center rounded-full text-sm font-bold transition-all duration-300 ${
                        isLatest 
                          ? "bg-gradient-to-r from-green-600 to-emerald-700 shadow-lg shadow-green-400/30 scale-110 ring-2 ring-green-400/50" 
                          : "bg-stone-700"
                      } ${isLatest ? "text-white" : getStageColor(msg.stage, msg.action)}`}
                    >
                      {msg.cycle}
                    </div>

                    {/* Acción con efectos visuales */}
                    <div className="flex-1">
                      <span
                        className={`text-sm font-medium transition-all duration-200 ${getActionColor(msg.stage, msg.action).split(' ')[0]}`}
                      >
                        {msg.action}
                      </span>
                    </div>

                    {/* Indicador de último mensaje con efectos mejorados */}
                    {isLatest && (
                      <div className="flex items-center gap-1">
                        <div className="size-2 rounded-full bg-green-400 shadow-lg shadow-green-400/50"></div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Estado vacío con efectos visuales */}
          {messageHistory.length === 0 && (
            <div className="flex items-center justify-center py-12 animate-fade-in">
              <div className="text-center">
                <div className="mb-4 text-5xl">⏳</div>
                <h4 className="mb-2 text-sm font-bold text-stone-300 bg-gradient-to-r from-stone-300 to-stone-400 bg-clip-text text-transparent">
                  Esperando instrucciones
                </h4>
                <p className="text-xs text-stone-500">Ejecuta un programa para ver el ciclo</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer con efectos visuales */}
        <div className="border-t border-stone-600/50 bg-gradient-to-r from-stone-800/80 to-stone-900/80 px-4 py-3 rounded-b-xl">
          <div className="flex items-center justify-between text-xs text-stone-400">
            <span className="flex items-center gap-2">
              <span className="size-2 bg-blue-400 rounded-full"></span>
              Ciclos: {store.get(currentInstructionCycleCountAtom)}
            </span>
            <span className="flex items-center gap-2">
              <span className="size-2 bg-green-400 rounded-full"></span>
              Monitor en tiempo real
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
