import clsx from "clsx";
import { memo, useEffect, useState } from "react";

type ExecutionPhase = "fetch" | "decode" | "execute" | "idle";

type ExecutionPhasesProps = {
  currentPhase?: ExecutionPhase;
  className?: string;
};

// Definición de tipos para fases y subfases
type Subfase = {
  id: string;
  label: string;
  color: string;
  icon: string;
  descripcion: string;
  pasos: string[];
};
type Fase = {
  id: string;
  label: string;
  color: string;
  icon: string;
  descripcion: string;
  pasos?: string[];
  subfases?: Subfase[];
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

    // Definición de fases y subfases unificadas
    const fases: Fase[] = [
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
          {fases.map((fase, index) => (
            <div key={fase.id} className="flex items-center">
              <div
                className={clsx(
                  "flex cursor-pointer flex-col items-center gap-1 rounded border-2 px-2 py-1 transition-all duration-200",
                  "hover:border-stone-300 hover:bg-stone-700",
                  currentPhase === fase.id
                    ? "border-stone-300 bg-stone-300 text-stone-950 shadow-[0_0_4px_rgba(120,113,108,0.6)]"
                    : "border-stone-600 bg-stone-800 text-stone-300",
                  pulsePhase === fase.id && "animate-pulse",
                )}
                onClick={() => {
                  if (showDetails) {
                    if (fase.subfases) {
                      // Mostrar info de todas las subfases
                      let mensaje = "";
                      fase.subfases.forEach(sub => {
                        mensaje += `${sub.label}\n${sub.descripcion}\nPasos:\n${sub.pasos.map((step, i) => `${i + 1}. ${step}`).join("\n")}`;
                        mensaje += "\n\n";
                      });
                      alert(mensaje);
                    } else {
                      alert(
                        `${fase.label}\n\n${fase.descripcion}\n\nPasos:\n${fase.pasos?.map((step, i) => `${i + 1}. ${step}`).join("\n")}`,
                      );
                    }
                  }
                }}
              >
                <div
                  className={clsx(
                    "text-lg transition-transform duration-300",
                    currentPhase === fase.id && "scale-110",
                  )}
                >
                  {fase.icon}
                </div>
                <span
                  className={clsx(
                    "text-[10px] font-bold uppercase tracking-wide transition-colors",
                    currentPhase === fase.id ? "text-stone-950" : "text-stone-300",
                  )}
                >
                  {fase.label}
                </span>
                <span className="max-w-16 text-center text-[9px] leading-tight text-stone-500">
                  {fase.descripcion}
                </span>
              </div>
              {/* Flecha entre fases */}
              {index < fases.length - 1 && <div className="mx-1 font-bold text-stone-400">→</div>}
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
