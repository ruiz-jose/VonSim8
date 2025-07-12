import { memo, useEffect, useState } from "react";
import clsx from "clsx";
import { useAtomValue } from "jotai";
import { cycleAtom } from "./state";

type ExecutionPhase = 'fetch' | 'decode' | 'execute' | 'idle';

interface ExecutionPhasesProps {
  currentPhase?: ExecutionPhase;
  className?: string;
}

export const ExecutionPhases = memo(({ 
  currentPhase = 'idle', 
  className 
}: ExecutionPhasesProps) => {
  const [pulsePhase, setPulsePhase] = useState<ExecutionPhase>('idle');
  const [showDetails, setShowDetails] = useState(false);

  const cycle = useAtomValue(cycleAtom);

  // Efecto para animar la fase actual
  useEffect(() => {
    if (currentPhase !== 'idle') {
      setPulsePhase(currentPhase);
      const timer = setTimeout(() => setPulsePhase('idle'), 1000);
      return () => clearTimeout(timer);
    }
  }, [currentPhase]);

  // Obtener información de la instrucción actual
  const currentInstruction = cycle && "metadata" in cycle && cycle.metadata 
    ? `${cycle.metadata.name}${cycle.metadata.operands.length ? " " + cycle.metadata.operands.join(", ") : ""}`
    : "";

  const phases = [
    {
      id: 'fetch' as ExecutionPhase,
      label: 'Fetch',
      icon: '📥',
      description: 'Leer instrucción',
      color: 'bg-blue-500',
      details: {
        title: 'Fase Fetch',
        description: 'La CPU lee la instrucción desde la dirección apuntada por el IP',
        steps: [
          'IP apunta a la dirección de memoria',
          'MAR recibe la dirección del IP',
          'Se lee el contenido de memoria',
          'MBR almacena la instrucción',
          'IP se incrementa automáticamente'
        ],
        registers: ['IP', 'MAR', 'MBR']
      }
    },
    {
      id: 'decode' as ExecutionPhase,
      label: 'Decode',
      icon: '🔍',
      description: 'Interpretar instrucción',
      color: 'bg-yellow-500',
      details: {
        title: 'Fase Decode',
        description: 'La CPU interpreta el código de operación y determina la operación a realizar',
        steps: [
          'IR recibe el código de operación del MBR',
          'Se analiza el opcode',
          'Se identifican los operandos',
          'Se determina el modo de direccionamiento',
          'Se preparan los operandos para la ejecución'
        ],
        registers: ['IR', 'MBR']
      }
    },
    {
      id: 'execute' as ExecutionPhase,
      label: 'Execute',
      icon: '⚡',
      description: 'Ejecutar operación',
      color: 'bg-green-500',
      details: {
        title: 'Fase Execute',
        description: 'La CPU ejecuta la operación especificada y actualiza registros y flags',
        steps: [
          'ALU recibe los operandos',
          'Se ejecuta la operación aritmética/lógica',
          'Se actualiza el registro destino (AL, BL, CL, DL)',
          'Se actualizan las flags según el resultado',
          'Se completa el ciclo de instrucción'
        ],
        registers: ['ALU', 'AL/BL/CL/DL', 'Flags']
      }
    }
  ];

  return (
    <div className={clsx(
      "flex flex-col gap-2 p-2 rounded-lg bg-stone-900/95 border-2 border-mantis-400/50 shadow-lg backdrop-blur-sm",
      "min-w-[280px] max-w-[320px]",
      className
    )}>
      {/* Header mejorado */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-mantis-400 uppercase tracking-wide">
            Ciclo CPU
          </span>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className={clsx(
              "text-xs px-2 py-1 rounded transition-colors",
              showDetails 
                ? "bg-mantis-400/20 text-mantis-400" 
                : "text-stone-400 hover:text-mantis-400 hover:bg-mantis-400/10"
            )}
          >
            {showDetails ? '−' : '+'}
          </button>
        </div>
      </div>
      
      {/* Fases principales */}
      <div className="flex items-center justify-center gap-2">
        {phases.map((phase, index) => (
          <div key={phase.id} className="flex items-center">
            <div
              className={clsx(
                "flex flex-col items-center gap-1 px-2 py-1 rounded transition-all duration-300 cursor-pointer",
                "border border-transparent hover:border-mantis-400/30",
                currentPhase === phase.id && "border-mantis-400 bg-mantis-400/20 shadow-lg",
                pulsePhase === phase.id && "animate-pulse"
              )}
              onClick={() => {
                if (showDetails) {
                  // Mostrar información detallada de la fase
                  const details = phase.details;
                  alert(`${details.title}\n\n${details.description}\n\nPasos:\n${details.steps.map((step, i) => `${i + 1}. ${step}`).join('\n')}\n\nRegistros involucrados: ${details.registers.join(', ')}`);
                }
              }}
            >
              <div className={clsx(
                "text-lg transition-transform duration-300",
                currentPhase === phase.id && "scale-110"
              )}>
                {phase.icon}
              </div>
              <span className={clsx(
                "text-xs font-bold transition-colors uppercase tracking-wide",
                currentPhase === phase.id 
                  ? "text-mantis-400" 
                  : "text-stone-400"
              )}>
                {phase.label}
              </span>
              <span className="text-[9px] text-stone-500 text-center max-w-16 leading-tight">
                {phase.description}
              </span>
            </div>
            {/* Flecha entre fases */}
            {index < phases.length - 1 && (
              <div className="text-stone-500 mx-1">→</div>
            )}
          </div>
        ))}
      </div>



      {/* Información detallada */}
      {showDetails && (
        <div className="mt-2 p-2 bg-stone-800/80 rounded border border-stone-600">
          <div className="text-xs text-stone-300">
            <div className="font-bold mb-1 text-mantis-400">Estado actual:</div>
            {currentPhase === 'fetch' && (
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
                <span>Leyendo instrucción desde memoria</span>
              </div>
            )}
            {currentPhase === 'decode' && (
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
                <span>Interpretando código de operación</span>
              </div>
            )}
            {currentPhase === 'execute' && (
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                <span>Ejecutando operación en ALU</span>
              </div>
            )}
            {currentPhase === 'idle' && (
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-stone-400 rounded-full"></span>
                <span>CPU en espera de instrucciones</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Información educativa */}
      <div className="text-[8px] text-stone-500 text-center">
        Haz clic en las fases para ver detalles
      </div>
    </div>
  );
});

ExecutionPhases.displayName = 'ExecutionPhases'; 