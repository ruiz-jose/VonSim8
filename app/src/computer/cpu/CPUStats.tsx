import clsx from "clsx";
import { useAtomValue } from "jotai";
import { memo, useState } from "react";

import { useTranslate } from "@/lib/i18n";
import { useSettings } from "@/lib/settings";
import { Tooltip } from "@/components/ui/Tooltip";

import { cycleCountAtom, instructionCountAtom } from "./state";

type CPUStatsProps = {
  className?: string;
};

export const CPUStats = memo(({ className }: CPUStatsProps) => {
  const translate = useTranslate();
  const cycleCount = useAtomValue(cycleCountAtom);
  const instructionCount = useAtomValue(instructionCountAtom);
  const [settings] = useSettings();
  const [showDetails, setShowDetails] = useState(false);

  // Convertir cpuSpeed de Hz a tiempo de ciclo en milisegundos
  const cpuSpeedHz = parseInt(settings.cpuSpeed);
  const cycleTimeMs = 1000 / cpuSpeedHz; // Convertir Hz a milisegundos por ciclo

  if (!settings.showStatsCPU) return null;

  const cpi = instructionCount > 0 ? (cycleCount / instructionCount).toFixed(2) : "-";
  const cpuTimeMs = cycleCount * cycleTimeMs;
  const cycleTimeSeconds = cycleTimeMs / 1000; // Convertir a segundos para mostrar

  // Icono y color para el header
  const getStatsIcon = () => {
    if (cycleCount === 0) return "📊";
    if (instructionCount === 0) return "⏸️";
    return "⚡";
  };
  const getStatsColor = () => {
    if (cycleCount === 0) return "text-stone-400";
    if (instructionCount === 0) return "text-yellow-400";
    return "text-mantis-400";
  };

  // Contenido educativo para las métricas de rendimiento
  const performanceEducationalContent = (
    <div className="space-y-2 text-xs">
      <div>
        <strong className="text-mantis-300">CPI (Ciclos por Instrucción):</strong>
        <br />
        Métrica fundamental que indica la eficiencia del procesador. Un CPI más bajo significa mejor
        rendimiento.
      </div>
      <div>
        <strong className="text-mantis-300">Tiempo de CPU:</strong>
        <br />
        Depende de los ciclos ejecutados y la velocidad del reloj del sistema.
      </div>
    </div>
  );

  // Contenido educativo para la configuración
  const configEducationalContent = (
    <div className="space-y-2 text-xs">
      <div>
        <strong className="text-mantis-300">Velocidad CPU:</strong>
        <br />
        Determina qué tan rápido ejecuta el procesador cada ciclo. Mayor Hz = ciclos más rápidos.
      </div>
    </div>
  );

  return (
    <div
      className={clsx(
        "flex flex-col gap-2 rounded-lg border border-stone-600 bg-stone-900/95 p-3 shadow-lg",
        "min-w-[300px] max-w-[350px]",
        className,
      )}
    >
      {/* Header igual que InstructionCycleInfo */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold uppercase tracking-wide text-mantis-400">
            {translate("computer.cpu.stats")}
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

      {/* Estado actual igual que InstructionCycleInfo */}
      <div className="flex items-center gap-3 rounded border border-stone-600 bg-stone-800/80 p-2">
        <div className={clsx("text-2xl", getStatsColor())}>{getStatsIcon()}</div>
        <div className="flex-1">
          <div className={clsx("text-sm font-semibold", getStatsColor())}>
            {cycleCount > 0 ? "Ejecutando" : "En espera"}
          </div>
          <div className="mt-1 text-xs text-stone-400">
            {instructionCount > 0
              ? `${instructionCount} instrucciones ejecutadas`
              : "Sin instrucciones ejecutadas"}
          </div>
        </div>
      </div>

      {/* Información detallada */}
      {showDetails && (
        <div className="space-y-3">
          {/* Métricas principales */}
          <div className="rounded border border-stone-600 bg-stone-800/80 p-2">
            <div className="mb-2 text-xs font-bold text-mantis-400">Métricas principales:</div>
            <div className="mb-2 text-xs text-stone-400">
              Estadísticas acumuladas del programa completo
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="text-xs text-stone-300">Ciclos totales del programa</div>
                <div className="font-mono text-lg text-white">{cycleCount}</div>
              </div>
              <div>
                <div className="text-xs text-stone-300">
                  {translate("computer.cpu.instruction-count")}
                </div>
                <div className="font-mono text-lg text-white">{instructionCount}</div>
              </div>
            </div>
          </div>

          {/* Métricas de rendimiento */}
          <div className="rounded border border-stone-600 bg-stone-800/80 p-2">
            <div className="mb-2 flex items-center gap-2">
              <span className="text-xs font-bold text-mantis-400">Métricas de Rendimiento:</span>
              <Tooltip
                content={performanceEducationalContent}
                position="top"
                maxWidth={350}
                className="text-stone-400 hover:text-mantis-400 transition-colors"
              >
                <button className="text-xs hover:scale-110 transition-transform">💡</button>
              </Tooltip>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-stone-300" title={translate("computer.cpu.cpi-help")}>
                  {translate("computer.cpu.cpi")}:
                </span>
                <span className="font-mono text-sm text-mantis-300">{cpi}</span>
              </div>
              <div className="flex items-center justify-between">
                <span
                  className="text-xs text-stone-300"
                  title={`${translate("computer.cpu.cpu-time-help")} (${cycleTimeSeconds.toFixed(1)} s)`}
                >
                  {translate("computer.cpu.cpu-time")}
                </span>
                <span className="font-mono text-sm text-mantis-300">
                  {(cpuTimeMs / 1000).toFixed(1)} s
                </span>
              </div>
            </div>
          </div>

          {/* Configuración actual */}
          <div className="rounded border border-stone-600 bg-stone-800/80 p-2">
            <div className="mb-2 flex items-center gap-2">
              <span className="text-xs font-bold text-mantis-400">Configuración Actual:</span>
              <Tooltip
                content={configEducationalContent}
                position="top"
                maxWidth={350}
                className="text-stone-400 hover:text-mantis-400 transition-colors"
              >
                <button className="text-xs hover:scale-110 transition-transform">⚙️</button>
              </Tooltip>
            </div>
            <div className="space-y-1 text-xs text-stone-300">
              <div className="flex items-center justify-between">
                <span className="text-stone-300">
                  <strong>Velocidad CPU:</strong>
                </span>
                <span className="font-mono text-mantis-300">
                  {settings.cpuSpeed} Hz ({cycleTimeSeconds.toFixed(1)} s/ciclo)
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

CPUStats.displayName = "CPUStats";
