import { useAtomValue } from "jotai";
import { useEffect, useRef } from "react";

import { isHaltExecutionAtom, simulationAtom, useSimulation } from "@/computer/simulation";
import { programModifiedAtom } from "@/editor/state";
import { store } from "@/lib/jotai";
import { useSettings } from "@/lib/settings";
import { toast } from "@/lib/toast";

import {
  animationSyncAtom,
  currentInstructionCycleCountAtom,
  instructionCountAtom,
  // messageAtom, // DESACTIVADO: Ya no se usa porque los mensajes se agregan en simulation.ts
  messageHistoryAtom,
} from "./state";

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
function getPhaseIcon(stage: string, isActive = false) {
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
    return <span className="inline-block animate-bounce">{baseIcon}</span>;
  }

  return baseIcon;
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
  // DESACTIVADO: Ya no se usa porque los mensajes se agregan en simulation.ts
  // const message = useAtomValue(messageAtom);
  const messageHistory = useAtomValue(messageHistoryAtom);
  const simulationStatus = useAtomValue(simulationAtom);
  const programModified = useAtomValue(programModifiedAtom);
  const { devices } = useSimulation();

  const [settings] = useSettings();

  const containerRef = useRef<HTMLDivElement>(null);

  // DESACTIVADO: Ya no se usa porque los mensajes se agregan en simulation.ts
  // Función para dividir el mensaje en "Ciclo", "Etapa" y "Acción"
  /*
  const parseMessage = (msg: string, cycle: number) => {
    const [stage, ...actionParts] = msg.split(":");
    const action = actionParts.join(":").trim();
    return { cycle, stage: stage.trim(), action };
  };
  */

  // DESACTIVADO: Ahora los mensajes se agregan al historial de forma síncrona en simulation.ts
  // mediante la función setMessageAndAddToHistory() para evitar duplicados
  /*
  useEffect(() => {
    if (message) {
      const currentInstructionCycleCount = store.get(currentInstructionCycleCountAtom);
      const parsedMessage = parseMessage(message, currentInstructionCycleCount);

      // Solo agregar si no existe ya un mensaje con el mismo ciclo y acción
      store.set(messageHistoryAtom, prev => {
        const lastMessage = prev[prev.length - 1];
        if (
          lastMessage &&
          lastMessage.cycle === currentInstructionCycleCount &&
          lastMessage.action === parsedMessage.action
        ) {
          return prev;
        }
        return [...prev, parsedMessage];
      });
    }
  }, [message]);
  */

  // DESACTIVADO: Ahora los mensajes se agregan al historial de forma síncrona en simulation.ts
  // mediante la función setMessageAndAddToHistory() para evitar duplicados
  /*
  useEffect(() => {
    const unsubscribeCycleCount = store.sub(currentInstructionCycleCountAtom, () => {
      const newCount = store.get(currentInstructionCycleCountAtom);
      const currentMessage = store.get(messageAtom);

      // Si hay un mensaje actual y el contador cambió, agregarlo al historial inmediatamente
      if (currentMessage && newCount > 0) {
        const parsedMessage = parseMessage(currentMessage, newCount);

        // Pausar las animaciones hasta que el mensaje se muestre
        store.set(animationSyncAtom, {
          canAnimate: false,
          pendingMessage: currentMessage,
        });

        store.set(messageHistoryAtom, prev => {
          // Evitar duplicados
          const lastMessage = prev[prev.length - 1];
          if (
            lastMessage &&
            lastMessage.cycle === newCount &&
            lastMessage.action === parsedMessage.action
          ) {
            return prev;
          }
          return [...prev, parsedMessage];
        });

        // Permitir animaciones después de un breve delay para que el mensaje se muestre
        setTimeout(() => {
          store.set(animationSyncAtom, {
            canAnimate: true,
            pendingMessage: null,
          });
        }, 100); // 100ms de delay para que el mensaje aparezca primero
      }

      // Si el contador se reinicia a 0, es una nueva instrucción
      if (newCount === 0) {
        // Solo limpiar el historial si NO se está ejecutando HLT
        const isHaltExecution = store.get(isHaltExecutionAtom);
        console.log(
          "🔄 Cycle count reset to 0, isHaltExecution:",
          isHaltExecution,
          "current history length:",
          store.get(messageHistoryAtom).length,
        );
        if (!isHaltExecution) {
          console.log("✅ Clearing message history (not HLT execution)");
          store.set(messageHistoryAtom, []);
          store.set(animationSyncAtom, {
            canAnimate: true,
            pendingMessage: null,
          });
        } else {
          console.log("⚠️ NOT clearing message history (HLT execution detected)");
        }
      }
    });

    return () => {
      unsubscribeCycleCount();
    };
  }, []);
  */

  // Limpiar el historial cuando el contador de ciclos por instrucción se reinicie (nueva instrucción)
  // o cuando se reinicie la simulación
  useEffect(() => {
    const unsubscribeSimulation = store.sub(simulationAtom, () => {
      const simulationStatus = store.get(simulationAtom);
      // Si la simulación se detiene o se reinicia, limpiar el historial
      if (simulationStatus.type === "stopped") {
        const currentIsHaltExecution = store.get(isHaltExecutionAtom);

        // Solo limpiar el historial si NO se detuvo por HLT
        // Esto preserva los mensajes del ciclo de instrucción HLT
        if (!currentIsHaltExecution) {
          console.log("✅ Simulation stopped, clearing message history (not HLT execution)");
          store.set(messageHistoryAtom, []);
          store.set(animationSyncAtom, {
            canAnimate: true,
            pendingMessage: null,
          });
        } else {
          console.log("⚠️ Simulation stopped, preserving message history (HLT execution detected)");
        }
      }
    });

    return () => {
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

  // Limpiar el historial cuando se inicia una nueva ejecución
  // (pero no cuando se detiene por HLT para preservar los mensajes)
  useEffect(() => {
    const unsubscribeInstructionCount = store.sub(instructionCountAtom, () => {
      const instructionCount = store.get(instructionCountAtom);
      const simulationStatus = store.get(simulationAtom);

      // Si se reinicia el contador de instrucciones y la simulación está corriendo,
      // limpiar el historial (nueva ejecución)
      if (instructionCount === 0 && simulationStatus.type === "running") {
        // Solo limpiar si NO se está ejecutando HLT
        const isHaltExecution = store.get(isHaltExecutionAtom);
        console.log(
          "🔄 Instruction count reset to 0 with running simulation, isHaltExecution:",
          isHaltExecution,
          "current history length:",
          store.get(messageHistoryAtom).length,
        );
        if (!isHaltExecution) {
          console.log("✅ Clearing message history (instruction count reset, not HLT)");
          store.set(messageHistoryAtom, []);
          store.set(animationSyncAtom, {
            canAnimate: true,
            pendingMessage: null,
          });
          // Resetear la bandera de HLT al iniciar nueva ejecución
          store.set(isHaltExecutionAtom, false);
        } else {
          console.log(
            "⚠️ NOT clearing message history (HLT execution detected during instruction count reset)",
          );
        }
      }
    });

    return () => {
      unsubscribeInstructionCount();
    };
  }, []);

  // Usar useEffect para desplazar el scroll al final cuando se agregue un nuevo mensaje
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messageHistory]);

  // Si el usuario desactiva la visibilidad del ciclo de instrucción, no renderizar el componente
  if (!settings.showInstructionCycle || devices.pic) return null;

  return (
    <div className="absolute left-[20px] top-[520px] z-10 h-min w-[420px]">
      {/* Contenedor principal con efectos visuales mejorados */}
      <div className="rounded-xl border-2 border-stone-400/50 bg-gradient-to-br from-stone-800 to-stone-900 shadow-2xl backdrop-blur-sm">
        {/* Header con efectos visuales */}
        <div className="rounded-t-xl border-b-2 border-stone-600/50 bg-gradient-to-r from-stone-700 to-stone-800 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Eliminado icono a la izquierda del título */}
              <div>
                <span className="text-sm font-bold uppercase tracking-wide text-mantis-400">
                  Ciclo de instrucción
                </span>
                {/* Eliminado texto 'Seguimiento paso a paso' */}
              </div>
            </div>
            {/* Eliminado el mensaje de 'Activo' del header, se moverá al pie */}
          </div>
        </div>

        {/* Contenido principal con scroll mejorado */}
        <div ref={containerRef} className="scrollbar-thin max-h-80 overflow-y-auto p-4">
          {/* Renderizar mensajes con efectos visuales mejorados */}
          {messageHistory.map((msg, index) => {
            const isNewStage = index === 0 || messageHistory[index - 1].stage !== msg.stage;
            const isLatest = index === messageHistory.length - 1;

            return (
              <div
                key={index}
                className={`transition-all duration-300 ease-in-out ${
                  msg.stage === "Captación" || msg.stage === "Ejecución" ? "mb-1" : "mb-3"
                }`}
              >
                {/* Título de fase con efectos visuales */}
                {isNewStage && (
                  <div className="animate-fade-in mb-2">
                    <div
                      className={`flex items-center gap-3 rounded-lg border border-stone-600/30 bg-gradient-to-r from-stone-800/60 to-stone-900/60 px-4 py-2.5 shadow-md backdrop-blur-sm ${getPhaseColor(msg.stage)}`}
                    >
                      <div className="relative">
                        <span className="text-lg">{getPhaseIcon(msg.stage, isLatest)}</span>
                        {isLatest && (
                          <div className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-green-400 shadow-sm ring-1 ring-green-300/50"></div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4
                          className={`truncate text-sm font-bold tracking-wide ${getPhaseColor(msg.stage).split(" ")[0]}`}
                        >
                          {msg.stage}
                        </h4>
                        <p className="mt-0.5 text-xs leading-tight text-stone-400">
                          {msg.stage === "Captación" && "Leer instrucción desde memoria"}
                          {msg.stage === "Obtención de operandos" && "Preparar datos necesarios"}
                          {msg.stage === "Ejecución" && "Procesar instrucción"}
                          {msg.stage === "Escritura" && "Guardar resultado final"}
                          {msg.stage === "Interrupción" && "Manejar interrupción"}
                        </p>
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
                      <span className={`text-sm font-medium text-red-300`}>{msg.action}</span>
                    </div>
                  </div>
                ) : msg.stage === "Captación" ? (
                  // Diseño especial para pasos de Captación - más compacto y indentado
                  <div
                    className={`ml-8 flex items-center gap-3 rounded-lg border-l-2 border-blue-400/30 bg-gradient-to-r from-blue-900/20 to-blue-800/10 py-2 pl-4 pr-3 transition-all duration-200 hover:bg-blue-800/20 ${
                      isLatest ? "ring-1 ring-blue-400/50" : ""
                    }`}
                  >
                    {/* Número de ciclo más pequeño para pasos de captación */}
                    <div
                      className={`flex size-6 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${
                        isLatest
                          ? "bg-blue-600 shadow-md shadow-blue-400/30 ring-1 ring-blue-400/50"
                          : "bg-blue-700/80"
                      } text-white`}
                    >
                      {msg.cycle}
                    </div>

                    {/* Acción con texto más pequeño y color suave */}
                    <div className="flex-1">
                      <span className="text-xs font-medium text-blue-200/90">{msg.action}</span>
                    </div>

                    {/* Indicador de último mensaje más discreto */}
                    {isLatest && (
                      <div className="size-1.5 rounded-full bg-blue-300 shadow-sm shadow-blue-400/30"></div>
                    )}
                  </div>
                ) : msg.stage === "Ejecución" ? (
                  // Diseño especial para pasos de Ejecución - más compacto y indentado
                  <div
                    className={`ml-8 flex items-center gap-3 rounded-lg border-l-2 border-green-400/30 bg-gradient-to-r from-green-900/20 to-green-800/10 py-2 pl-4 pr-3 transition-all duration-200 hover:bg-green-800/20 ${
                      isLatest ? "ring-1 ring-green-400/50" : ""
                    }`}
                  >
                    {/* Número de ciclo más pequeño para pasos de ejecución */}
                    <div
                      className={`flex size-6 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${
                        isLatest
                          ? "bg-green-600 shadow-md shadow-green-400/30 ring-1 ring-green-400/50"
                          : "bg-green-700/80"
                      } text-white`}
                    >
                      {msg.cycle}
                    </div>

                    {/* Acción con texto más pequeño y color suave */}
                    <div className="flex-1">
                      <span className="text-xs font-medium text-green-200/90">{msg.action}</span>
                    </div>

                    {/* Indicador de último mensaje más discreto */}
                    {isLatest && (
                      <div className="size-1.5 rounded-full bg-green-300 shadow-sm shadow-green-400/30"></div>
                    )}
                  </div>
                ) : (
                  <div
                    className={`flex items-center gap-3 rounded-xl border border-stone-600/50 bg-gradient-to-r from-stone-800/80 to-stone-900/80 p-4 transition-all duration-300 hover:scale-[1.02] ${
                      isLatest ? "bg-stone-700/80 " + getBorderAnimation(isLatest, msg.stage) : ""
                    }`}
                  >
                    {/* Número de ciclo con efectos visuales */}
                    <div
                      className={`flex size-8 items-center justify-center rounded-full text-sm font-bold transition-all duration-300 ${
                        isLatest
                          ? "scale-110 bg-gradient-to-r from-green-600 to-emerald-700 shadow-lg shadow-green-400/30 ring-2 ring-green-400/50"
                          : "bg-stone-700"
                      } ${isLatest ? "text-white" : getStageColor(msg.stage, msg.action)}`}
                    >
                      {msg.cycle}
                    </div>

                    {/* Acción con efectos visuales */}
                    <div className="flex-1">
                      <span
                        className={`text-sm font-medium transition-all duration-200 ${getActionColor(msg.stage, msg.action).split(" ")[0]}`}
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
            <div className="animate-fade-in flex items-center justify-center py-12">
              <div className="text-center">
                <div className="mb-4 text-5xl">⏳</div>
                <h4 className="mb-2 bg-gradient-to-r from-stone-300 to-stone-400 bg-clip-text text-sm font-bold text-transparent">
                  Esperando instrucciones
                </h4>
                <p className="text-xs text-stone-500">Ejecuta un programa para ver el ciclo</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer con efectos visuales */}
        <div className="rounded-b-xl border-t border-stone-600/50 bg-gradient-to-r from-stone-800/80 to-stone-900/80 px-4 py-3">
          <div className="flex items-center justify-between text-xs text-stone-400">
            <span className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-blue-400"></span>
              Ciclos: {store.get(currentInstructionCycleCountAtom)}
            </span>
            <span className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-green-400 shadow-lg shadow-green-400/50"></span>
              <span className="text-xs font-medium text-green-300">Activo</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
