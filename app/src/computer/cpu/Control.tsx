import clsx from "clsx";
import { useAtomValue } from "jotai";
import { useMemo, useState } from "react";

import { animated, getSpring } from "@/computer/shared/springs";
import { useSimulation } from "@/computer/simulation";
import { useTranslate } from "@/lib/i18n";

import { cycleAtom, cycleCountAtom, messageAtom } from "./state";

/**
 * Control component, to be used inside <CPU />
 */
export function Control() {
  const translate = useTranslate();
  const cycleCount = useAtomValue(cycleCountAtom); // Obtener el valor de cycleCount
  const [showCycleInfo, setShowCycleInfo] = useState(false);

  const { status } = useSimulation();
  const cycle = useAtomValue(cycleAtom);
  const message = useAtomValue(messageAtom);

  const operandsText = useMemo(() => {
    if (!("metadata" in cycle)) return "";
    if (cycle.metadata.operands.length === 0) return "";

    if (cycle.phase === "fetching-operands") {
      let text = " __";
      for (let i = 1; i < cycle.metadata.operands.length; i++) {
        text += ", __";
      }
      return text;
    } else {
      return " " + cycle.metadata.operands.join(", ");
    }
  }, [cycle]);



  // Funciones para la información del ciclo
  const getPhaseDescription = () => {
    if (!cycle) return "CPU detenida";
    
    switch (cycle.phase) {
      case 'fetching':
        return "Leyendo instrucción";
      case 'fetching-operands':
        return "Obteniendo operandos";
      case 'executing':
        return "Ejecutando operación";
      case 'writeback':
        return "Escribiendo resultado";
      case 'interrupt':
        return "Procesando interrupción";
      case 'int6':
      case 'int7':
        return "Rutina de interrupción";
      case 'stopped':
        return cycle.error ? `Error: ${cycle.error.message}` : "CPU detenida";
      default:
        return "Estado desconocido";
    }
  };

  const getPhaseIcon = () => {
    if (!cycle) return "⏹️";
    
    switch (cycle.phase) {
      case 'fetching':
        return "📥";
      case 'fetching-operands':
        return "🔍";
      case 'executing':
        return "⚡";
      case 'writeback':
        return "💾";
      case 'interrupt':
        return "🚨";
      case 'int6':
      case 'int7':
        return "🔄";
      case 'stopped':
        return cycle.error ? "❌" : "⏹️";
      default:
        return "❓";
    }
  };

  const getPhaseColor = () => {
    if (!cycle) return "text-stone-400";
    
    switch (cycle.phase) {
      case 'fetching':
        return "text-blue-400";
      case 'fetching-operands':
        return "text-yellow-400";
      case 'executing':
        return "text-green-400";
      case 'writeback':
        return "text-purple-400";
      case 'interrupt':
        return "text-red-400";
      case 'int6':
      case 'int7':
        return "text-orange-400";
      case 'stopped':
        return cycle.error ? "text-red-400" : "text-stone-400";
      default:
        return "text-stone-400";
    }
  };

  const getCurrentPhase = () => {
    if (!cycle) return 'idle';
    
    if (cycle.phase === 'fetching') return 'fetch';
    if (cycle.phase === 'fetching-operands') return 'execute';
    if (cycle.phase === 'executing') return 'execute';
    if (cycle.phase === 'writeback') return 'execute';
    
    return 'idle';
  };

  return (
    <>
      <svg viewBox="0 0 650 500" className="pointer-events-none absolute inset-0">
        <animated.path
          className="fill-none stroke-mantis-400 stroke-bus"
          strokeLinejoin="round"
          d="M 205 310 V 320"
          pathLength={1}
          strokeDasharray={1}
          style={getSpring("cpu.decoder.path")}
        />
      </svg>

      <div className="absolute bottom-[172px] left-[30px] flex w-full items-start">
        <span className="block w-min whitespace-nowrap rounded-t-lg border border-b-0 border-stone-600 bg-mantis-500 px-2 pb-3 pt-1 text-xs tracking-wide text-white">
          {translate("computer.cpu.control-unit")}
        </span>
      </div>

      <div className="absolute bottom-[17px] left-[30px] flex w-[350px] h-[160px] flex-col items-center rounded-lg border border-stone-600 bg-stone-800">
        <div className="overflow-hidden rounded-b-lg border border-t-0 border-stone-600 bg-stone-900 px-3 py-0.5">
          <span className="text-sm leading-none">{translate("computer.cpu.decoder")}</span>
          <div className="my-1 h-1 w-full overflow-hidden rounded-full bg-stone-600">
            <animated.div
              className="h-full bg-mantis-400"
              style={{
                width: getSpring("cpu.decoder.progress.progress").to(t => `${t * 100}%`),
                opacity: getSpring("cpu.decoder.progress.opacity"),
              }}
            />
          </div>
        </div>

        {/* Información del ciclo de instrucción - Compacta */}
        <div className="w-full flex-1 p-0.5">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-xs font-bold text-mantis-400 uppercase tracking-wide w-16 whitespace-nowrap">
              Ciclo CPU
            </span>
            <button
              onClick={() => setShowCycleInfo(!showCycleInfo)}
              className={clsx(
                "text-xs px-1 py-0.5 rounded transition-colors",
                showCycleInfo 
                  ? "bg-mantis-400/20 text-mantis-400" 
                  : "text-stone-400 hover:text-mantis-400 hover:bg-mantis-400/10"
              )}
            >
              {showCycleInfo ? '−' : '+'}
            </button>
          </div>

          {/* Estado actual del ciclo - Compacto */}
          <div className="flex items-center gap-1 p-0.5 bg-stone-900/80 rounded border border-stone-600 mb-0.5">
            <div className={clsx("text-sm", getPhaseColor())}>
              {getPhaseIcon()}
            </div>
            <div className="flex-1 min-w-0 text-center">
              <div className={clsx("text-xs font-semibold", getPhaseColor())}>
                {getPhaseDescription()}
              </div>
              {cycle && "metadata" in cycle && cycle.metadata && (
                <div className="text-xs text-stone-400 truncate">
                  <span className="font-mono text-mantis-300">{cycle.metadata.name}</span>
                  {cycle.metadata.operands.length > 0 && (
                    <span className="text-white"> {cycle.metadata.operands.join(", ")}</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Información detallada del ciclo - Solo cuando está expandida */}
          {showCycleInfo && (
            <div className="space-y-0.5">
              {/* Fases del ciclo - Solo Busqueda y Ejecución */}
              <div className="p-0.5 bg-stone-900/80 rounded border border-stone-600">
                <div className="text-xs font-bold text-mantis-400 mb-1">Fases:</div>
                <div className="flex items-center justify-center gap-1 text-xs text-stone-300">
                  <div className={clsx("px-1 py-0.5 rounded", getCurrentPhase() === 'fetch' ? "bg-blue-500/20 text-blue-400" : "text-stone-500")}>
                    📥 Busqueda
                  </div>
                  <span className="text-stone-500">→</span>
                  <div className={clsx("px-1 py-0.5 rounded", getCurrentPhase() === 'execute' ? "bg-green-500/20 text-green-400" : "text-stone-500")}>
                    ⚡ Ejecución
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
