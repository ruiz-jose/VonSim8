import clsx from "clsx";
import { useAtomValue } from "jotai";
import { memo, useState } from "react";

import { cycleAtom } from "./state";

type InstructionCycleInfoProps = {
  className?: string;
};

export const InstructionCycleInfo = memo(({ className }: InstructionCycleInfoProps) => {
  const cycle = useAtomValue(cycleAtom);
  const [showDetails, setShowDetails] = useState(false);

  // Obtener información de la instrucción actual
  const currentInstruction =
    cycle && "metadata" in cycle && cycle.metadata
      ? `${cycle.metadata.name}${cycle.metadata.operands.length ? " " + cycle.metadata.operands.join(", ") : ""}`
      : "";

  // Obtener descripción de la fase actual
  const getPhaseDescription = () => {
    if (!cycle) return "CPU detenida";

    switch (cycle.phase) {
      case "fetching":
        return "Leyendo instrucción desde memoria";
      case "fetching-operands":
        return "Obteniendo operandos de la instrucción";
      case "executing":
        return "Ejecutando operación en la ALU";
      case "writeback":
        return "Escribiendo resultado en registros";
      case "interrupt":
        return "Procesando interrupción";
      case "int6":
      case "int7":
        return "Ejecutando rutina de interrupción";
      case "stopped":
        return cycle.error ? `Error: ${cycle.error.message}` : "CPU detenida";
      default:
        return "Estado desconocido";
    }
  };

  // Obtener icono de la fase
  const getPhaseIcon = () => {
    if (!cycle) return "⏹️";

    switch (cycle.phase) {
      case "fetching":
        return "📥";
      case "fetching-operands":
        return "🔍";
      case "executing":
        return "⚡";
      case "writeback":
        return "💾";
      case "interrupt":
        return "🚨";
      case "int6":
      case "int7":
        return "🔄";
      case "stopped":
        return cycle.error ? "❌" : "⏹️";
      default:
        return "❓";
    }
  };

  // Obtener color de la fase
  const getPhaseColor = () => {
    if (!cycle) return "text-stone-400";

    switch (cycle.phase) {
      case "fetching":
        return "text-blue-400";
      case "fetching-operands":
        return "text-yellow-400";
      case "executing":
        return "text-green-400";
      case "writeback":
        return "text-purple-400";
      case "interrupt":
        return "text-red-400";
      case "int6":
      case "int7":
        return "text-orange-400";
      case "stopped":
        return cycle.error ? "text-red-400" : "text-stone-400";
      default:
        return "text-stone-400";
    }
  };

  return (
    <div
      className={clsx(
        "flex flex-col gap-2 rounded-lg border border-stone-600 bg-stone-900/95 p-3 shadow-lg",
        "min-w-[300px] max-w-[350px]",
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold uppercase tracking-wide text-mantis-400">
            Información del Ciclo
          </span>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className={clsx(
              "rounded px-2 py-1 text-xs transition-colors",
              showDetails
                ? "bg-mantis-400/20 text-mantis-400"
                : "text-stone-400 hover:bg-mantis-400/10 hover:text-mantis-400",
            )}
          >
            {showDetails ? "−" : "+"}
          </button>
        </div>
      </div>

      {/* Estado actual */}
      <div className="flex items-center gap-3 rounded border border-stone-600 bg-stone-800/80 p-2">
        <div className={clsx("text-2xl", getPhaseColor())}>{getPhaseIcon()}</div>
        <div className="flex-1">
          <div className={clsx("text-sm font-semibold", getPhaseColor())}>
            {getPhaseDescription()}
          </div>
          {currentInstruction && (
            <div className="mt-1 text-xs text-stone-400">
              Instrucción: <span className="font-mono text-mantis-300">{currentInstruction}</span>
            </div>
          )}
        </div>
      </div>

      {/* Información detallada */}
      {showDetails && (
        <div className="space-y-3">
          {/* Fases del ciclo */}
          <div className="rounded border border-stone-600 bg-stone-800/80 p-2">
            <div className="mb-2 text-xs font-bold text-mantis-400">
              Fases del Ciclo de Instrucción:
            </div>
            <div className="space-y-1 text-xs text-stone-300">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-blue-400"></span>
                <span>
                  <strong>Fetch:</strong> Leer instrucción desde memoria
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-yellow-400"></span>
                <span>
                  <strong>Decode:</strong> Interpretar opcode y operandos
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-green-400"></span>
                <span>
                  <strong>Execute:</strong> Ejecutar operación en ALU
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-purple-400"></span>
                <span>
                  <strong>Writeback:</strong> Guardar resultado
                </span>
              </div>
            </div>
          </div>

          {/* Registros involucrados */}
          <div className="rounded border border-stone-600 bg-stone-800/80 p-2">
            <div className="mb-2 text-xs font-bold text-mantis-400">Registros Clave:</div>
            <div className="grid grid-cols-2 gap-1 text-xs text-stone-400">
              <div>IP: Contador de programa</div>
              <div>IR: Registro de instrucción</div>
              <div>MAR: Registro de dirección</div>
              <div>MBR: Registro de datos</div>
              <div>AL, BL, CL, DL: Registros de 8 bits</div>
              <div>Flags: Banderas de estado</div>
            </div>
          </div>

          {/* Información de la instrucción */}
          {cycle && "metadata" in cycle && cycle.metadata && (
            <div className="rounded border border-stone-600 bg-stone-800/80 p-2">
              <div className="mb-2 text-xs font-bold text-mantis-400">
                Detalles de la Instrucción:
              </div>
              <div className="space-y-1 text-xs text-stone-300">
                <div>
                  <strong>Nombre:</strong> {cycle.metadata.name}
                </div>
                <div>
                  <strong>Operandos:</strong>{" "}
                  {cycle.metadata.operands.length > 0
                    ? cycle.metadata.operands.join(", ")
                    : "Ninguno"}
                </div>
                <div>
                  <strong>Posición:</strong> {cycle.metadata.position.start}-
                  {cycle.metadata.position.end}
                </div>
                {cycle.metadata.willUse && (
                  <div>
                    <strong>Usa:</strong>{" "}
                    {Object.entries(cycle.metadata.willUse)
                      .map(([key, value]) => (value ? key : null))
                      .filter(Boolean)
                      .join(", ") || "Ninguno"}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Información educativa */}
          <div className="rounded border border-stone-600 bg-stone-800/80 p-2">
            <div className="mb-2 text-xs font-bold text-mantis-400">💡 Concepto Educativo:</div>
            <div className="text-xs leading-relaxed text-stone-300">
              El ciclo fetch-decode-execute es el corazón de toda CPU. Cada instrucción pasa por
              estas fases de manera secuencial, permitiendo que la computadora ejecute programas
              complejos una instrucción a la vez.
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

InstructionCycleInfo.displayName = "InstructionCycleInfo";
