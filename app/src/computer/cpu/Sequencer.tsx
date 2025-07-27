import { useState, useEffect } from "react";
import { useAtomValue } from "jotai";
import { animated, getSpring } from "@/computer/shared/springs";
import { useTranslate } from "@/lib/i18n";
import { cycleAtom } from "./state";
import { anim } from "@/computer/shared/animate";

interface SequencerProps {
  isVisible: boolean;
  onClose: () => void;
}

export function Sequencer({ isVisible, onClose }: SequencerProps) {
  const translate = useTranslate();
  const cycle = useAtomValue(cycleAtom);

  // Estados del secuenciador
  const sequencerStates = [
    {
      phase: "fetch",
      name: "Captación",
      description: "Obtener la instrucción desde memoria",
      microops: ["MAR←IP", "MBR←Mem[MAR]", "IR←MBR"],
      signals: ["RD=1", "IO/M=0", "Bus Address"],
      color: "blue"
    },
    {
      phase: "decode",
      name: "Decodificación",
      description: "Interpretar el código de operación",
      microops: ["Decodificar IR", "Generar señales de control"],
      signals: ["Control Lines", "ALU Control"],
      color: "green"
    },
    {
      phase: "execute",
      name: "Ejecución",
      description: "Ejecutar la operación específica",
      microops: ["Ejecutar microoperaciones", "Actualizar registros"],
      signals: ["ALU Enable", "Register Enable"],
      color: "yellow"
    },
    {
      phase: "writeback",
      name: "Escritura",
      description: "Guardar resultados en memoria/registros",
      microops: ["Escribir resultado", "Actualizar flags"],
      signals: ["WR=1", "Flag Update"],
      color: "purple"
    }
  ];

  // Encontrar la fase actual
  const currentPhase = cycle?.phase 
    ? sequencerStates.find(state => 
        (cycle.phase === "fetching" && state.phase === "fetch") ||
        (cycle.phase === "fetching-operands" && state.phase === "decode") ||
        (cycle.phase === "executing" && state.phase === "execute") ||
        (cycle.phase === "writeback" && state.phase === "writeback")
      )
    : null;

  // Efecto para animar la entrada y salida
  useEffect(() => {
    if (isVisible) {
      // Animar entrada
      anim(
        [
          { key: "sequencer.overlay.opacity", to: 1 },
          { key: "sequencer.container.opacity", to: 1 },
          { key: "sequencer.container.scale", to: 1 },
        ],
        { duration: 0.4, easing: "easeOutQuart" }
      );
    } else {
      // Animar salida
      anim(
        [
          { key: "sequencer.overlay.opacity", to: 0 },
          { key: "sequencer.container.opacity", to: 0 },
          { key: "sequencer.container.scale", to: 0.8 },
        ],
        { duration: 0.3, easing: "easeInQuart" }
      );
    }
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <animated.div
      className="absolute inset-0 z-30 flex items-center justify-center bg-black/50"
      style={{
        opacity: getSpring("sequencer.overlay").opacity,
      }}
      onClick={onClose}
    >
      <animated.div
        className="relative max-h-[80%] w-[90%] max-w-2xl overflow-hidden rounded-lg border border-mantis-500 bg-stone-900 p-4 shadow-2xl"
        style={{
          transform: getSpring("sequencer.container").scale.to(s => `scale(${s})`),
          opacity: getSpring("sequencer.container").opacity,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-4 flex items-center justify-between border-b border-mantis-500 pb-2">
          <h3 className="text-lg font-bold text-mantis-400">
            ⚙️ Secuenciador de Microoperaciones
          </h3>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-stone-400 hover:bg-stone-700 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Contenido */}
        <div className="space-y-4">
          {/* Descripción */}
          <div className="rounded border border-stone-600 bg-stone-800 p-3">
            <p className="text-sm text-stone-300">
              El secuenciador controla el orden y la sincronización de las microoperaciones.
              Cada fase del ciclo de instrucción genera señales de control específicas.
            </p>
          </div>

          {/* Fase actual destacada */}
          {currentPhase && (
            <div className={`rounded border-2 border-${currentPhase.color}-400 bg-${currentPhase.color}-900/50 p-3 animate-pulse`}>
              <h4 className="mb-2 font-bold text-stone-300">
                🎯 Fase Actual: {currentPhase.name}
              </h4>
              <p className="mb-2 text-sm text-stone-200">{currentPhase.description}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h5 className="font-semibold text-stone-300 mb-1">Microoperaciones:</h5>
                  <div className="space-y-1">
                    {currentPhase.microops.map((microop, index) => (
                      <div key={index} className="text-sm text-stone-200">
                        <span className="text-mantis-400">•</span> {microop}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h5 className="font-semibold text-stone-300 mb-1">Señales de Control:</h5>
                  <div className="space-y-1">
                    {currentPhase.signals.map((signal, index) => (
                      <div key={index} className="text-sm text-stone-200">
                        <span className="text-amber-400">⚡</span> {signal}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Diagrama de estados */}
          <div className="rounded border border-stone-600 bg-stone-800 p-3">
            <h4 className="mb-3 font-bold text-mantis-400">🔄 Diagrama de Estados</h4>
            <div className="flex flex-wrap justify-center gap-2">
              {sequencerStates.map((state, index) => (
                <div
                  key={index}
                  className={`relative rounded-lg p-3 border-2 transition-all ${
                    currentPhase?.phase === state.phase
                      ? `border-${state.color}-400 bg-${state.color}-900/30 animate-pulse`
                      : "border-stone-600 bg-stone-700"
                  }`}
                >
                  <div className="text-center">
                    <div className={`w-3 h-3 rounded-full mx-auto mb-2 bg-${state.color}-400`}></div>
                    <div className="text-xs font-bold text-stone-300">{state.name}</div>
                    <div className="text-xs text-stone-400">{state.phase}</div>
                  </div>
                  {index < sequencerStates.length - 1 && (
                    <div className="absolute -right-1 top-1/2 transform -translate-y-1/2 text-stone-500">
                      →
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Tabla de señales de control */}
          <div className="max-h-64 overflow-y-auto rounded border border-stone-600">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-stone-800">
                <tr className="border-b border-stone-600">
                  <th className="p-2 text-left text-mantis-400">Fase</th>
                  <th className="p-2 text-left text-mantis-400">Señales de Control</th>
                  <th className="p-2 text-left text-mantis-400">Descripción</th>
                </tr>
              </thead>
              <tbody>
                {sequencerStates.map((state, index) => (
                  <tr
                    key={index}
                    className={`border-b border-stone-700 hover:bg-stone-800 ${
                      currentPhase?.phase === state.phase
                        ? `bg-${state.color}-900/30 border-l-4 border-${state.color}-400 animate-pulse`
                        : ""
                    }`}
                  >
                    <td className="p-2 font-mono text-stone-300">{state.name}</td>
                    <td className="p-2 text-stone-300">
                      <div className="space-y-1">
                        {state.signals.map((signal, signalIndex) => (
                          <div key={signalIndex} className="text-xs">
                            {signal}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="p-2 text-stone-300 text-xs">{state.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Información adicional */}
          <div className="rounded border border-stone-600 bg-stone-800 p-3">
            <h4 className="mb-2 font-bold text-mantis-400">💡 Conceptos Clave:</h4>
            <ul className="space-y-1 text-sm text-stone-300">
              <li>• <strong>Secuenciador:</strong> Controla el orden de ejecución de microoperaciones</li>
              <li>• <strong>Señales de Control:</strong> Activan componentes específicos de la CPU</li>
              <li>• <strong>Estados:</strong> Cada fase tiene un conjunto único de señales</li>
              <li>• <strong>Sincronización:</strong> Coordina todas las operaciones internas</li>
            </ul>
          </div>
        </div>
      </animated.div>
    </animated.div>
  );
} 