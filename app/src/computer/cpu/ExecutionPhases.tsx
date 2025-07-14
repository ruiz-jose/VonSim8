import clsx from "clsx";
import { memo, useEffect, useState } from "react";

type ExecutionPhase = "fetch" | "decode" | "execute" | "idle";

type ExecutionPhasesProps = {
  currentPhase?: ExecutionPhase;
  className?: string;
};

export const ExecutionPhases = memo(
  ({ currentPhase = "idle", className }: ExecutionPhasesProps) => {
    const [pulsePhase, setPulsePhase] = useState<ExecutionPhase>("idle");
    const [showDetails, setShowDetails] = useState(false);

    // Efecto para animar la fase actual
    useEffect(() => {
      if (currentPhase !== "idle") {
        setPulsePhase(currentPhase);
        const timer = setTimeout(() => setPulsePhase("idle"), 1000);
        return () => clearTimeout(timer);
      }
    }, [currentPhase]);

    const phases = [
      {
        id: "fetch" as ExecutionPhase,
        label: "Fetch",
        icon: "📥",
        description: "Leer instrucción",
        details: {
          title: "Fase Fetch",
          description: "La CPU lee la instrucción desde la dirección apuntada por el IP",
          steps: [
            "IP apunta a la dirección de memoria",
            "MAR recibe la dirección del IP",
            "Se lee el contenido de memoria",
            "MBR almacena la instrucción",
            "IP se incrementa automáticamente",
          ],
          registers: ["IP", "MAR", "MBR"],
        },
      },
      {
        id: "decode" as ExecutionPhase,
        label: "Decode",
        icon: "🔍",
        description: "Interpretar instrucción",
        details: {
          title: "Fase Decode",
          description:
            "La CPU interpreta el código de operación y determina la operación a realizar",
          steps: [
            "IR recibe el código de operación del MBR",
            "Se analiza el opcode",
            "Se identifican los operandos",
            "Se determina el modo de direccionamiento",
            "Se preparan los operandos para la ejecución",
          ],
          registers: ["IR", "MBR"],
        },
      },
      {
        id: "execute" as ExecutionPhase,
        label: "Execute",
        icon: "⚡",
        description: "Ejecutar operación",
        details: {
          title: "Fase Execute",
          description: "La CPU ejecuta la operación especificada y actualiza registros y flags",
          steps: [
            "ALU recibe los operandos",
            "Se ejecuta la operación aritmética/lógica",
            "Se actualiza el registro destino (AL, BL, CL, DL)",
            "Se actualizan las flags según el resultado",
            "Se completa el ciclo de instrucción",
          ],
          registers: ["ALU", "AL/BL/CL/DL", "Flags"],
        },
      },
    ];

    return (
      <div
        className={clsx(
          "flex flex-col gap-2 rounded-lg border-2 border-stone-400 bg-gradient-to-br from-stone-700 via-stone-600 to-stone-800 p-3 shadow-lg ring-1 ring-stone-300",
          "min-w-[280px] max-w-[320px]",
          className,
        )}
      >
        {/* Header unificado */}
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="pointer-events-none absolute left-0.5 top-0.5 rounded bg-stone-900/80 px-0.5 text-[6px] font-bold text-stone-300">
              CICLO CPU
            </span>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className={clsx(
                "rounded border px-2 py-1 text-[10px] font-bold transition-all duration-200",
                showDetails
                  ? "border-stone-300 bg-stone-300 text-stone-950 shadow-[0_0_4px_rgba(120,113,108,0.6)]"
                  : "border-stone-600 bg-stone-800 text-stone-300 hover:border-stone-400 hover:bg-stone-700",
              )}
            >
              {showDetails ? "−" : "+"}
            </button>
          </div>
        </div>

        {/* Fases principales con estilo unificado */}
        <div className="mt-2 flex items-center justify-center gap-2">
          {phases.map((phase, index) => (
            <div key={phase.id} className="flex items-center">
              <div
                className={clsx(
                  "flex cursor-pointer flex-col items-center gap-1 rounded border-2 px-2 py-1 transition-all duration-200",
                  "hover:border-stone-300 hover:bg-stone-700",
                  currentPhase === phase.id 
                    ? "border-stone-300 bg-stone-300 text-stone-950 shadow-[0_0_4px_rgba(120,113,108,0.6)]" 
                    : "border-stone-600 bg-stone-800 text-stone-300",
                  pulsePhase === phase.id && "animate-pulse",
                )}
                onClick={() => {
                  if (showDetails) {
                    const details = phase.details;
                    alert(
                      `${details.title}\n\n${details.description}\n\nPasos:\n${details.steps.map((step, i) => `${i + 1}. ${step}`).join("\n")}\n\nRegistros involucrados: ${details.registers.join(", ")}`,
                    );
                  }
                }}
              >
                <div
                  className={clsx(
                    "text-lg transition-transform duration-300",
                    currentPhase === phase.id && "scale-110",
                  )}
                >
                  {phase.icon}
                </div>
                <span
                  className={clsx(
                    "text-[10px] font-bold uppercase tracking-wide transition-colors",
                    currentPhase === phase.id ? "text-stone-950" : "text-stone-300",
                  )}
                >
                  {phase.label}
                </span>
                <span className="max-w-16 text-center text-[9px] leading-tight text-stone-500">
                  {phase.description}
                </span>
              </div>
              {/* Flecha entre fases */}
              {index < phases.length - 1 && (
                <div className="mx-1 text-stone-400 font-bold">→</div>
              )}
            </div>
          ))}
        </div>

        {/* Información detallada con estilo unificado */}
        {showDetails && (
          <div className="mt-2 rounded border-2 border-stone-600 bg-stone-800/80 p-2">
            <div className="text-xs text-stone-300">
              <div className="mb-1 font-bold text-stone-200">Estado actual:</div>
              {currentPhase === "fetch" && (
                <div className="flex items-center gap-2">
                  <span className="size-2 animate-pulse rounded-full bg-stone-300"></span>
                  <span>Leyendo instrucción desde memoria</span>
                </div>
              )}
              {currentPhase === "decode" && (
                <div className="flex items-center gap-2">
                  <span className="size-2 animate-pulse rounded-full bg-stone-300"></span>
                  <span>Interpretando código de operación</span>
                </div>
              )}
              {currentPhase === "execute" && (
                <div className="flex items-center gap-2">
                  <span className="size-2 animate-pulse rounded-full bg-stone-300"></span>
                  <span>Ejecutando operación en ALU</span>
                </div>
              )}
              {currentPhase === "idle" && (
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-stone-400"></span>
                  <span>CPU en espera de instrucciones</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Información educativa */}
        <div className="text-center text-[8px] text-stone-500">
          Haz clic en las fases para ver detalles
        </div>
      </div>
    );
  },
);

ExecutionPhases.displayName = "ExecutionPhases";
