// Componente SVG animado de secuenciador tipo chip
import { useSpring, animated as a } from "@react-spring/web";
function AnimatedSequencerChip({ active }: { active: boolean }) {
  // Número de pines de salida
  const outputs = 8;
  // Animación: avanza un "barrido" de encendido por los pines
  const { phase } = useSpring({
    phase: active ? 1 : 0,
    config: { duration: 1200 },
    reset: !active,
    loop: active,
  });
  return (
    <svg width="70" height="38" viewBox="0 0 70 38" style={{ filter: 'drop-shadow(0 0 8px rgba(56,189,248,0.25))' }}>
      {/* Cuerpo del chip */}
      <rect x="8" y="6" width="38" height="26" rx="6" fill="#0369a1" stroke="#38bdf8" strokeWidth="2" />
      {/* Pines de entrada (izquierda) */}
      {Array.from({ length: 3 }).map((_, i) => (
        <rect key={i} x={2} y={12 + i * 6} width={6} height={2} rx={1} fill="#38bdf8" />
      ))}
      {/* Pines de salida (derecha) */}
      {Array.from({ length: outputs }).map((_, i) => (
        <a.rect
          key={i}
          x={46}
          y={7 + i * 3}
          width={20}
          height={2}
          rx={1}
          fill={phase.to(p => {
            // Efecto: barrido de encendido
            const pos = i / outputs;
            return active && p > pos && p < pos + 0.15 ? '#7dd3fc' : '#0ea5e9';
          })}
          style={{ filter: phase.to(p => {
            const pos = i / outputs;
            return active && p > pos && p < pos + 0.15 ? 'drop-shadow(0 0 8px #38bdf8)' : 'none';
          }) }}
        />
      ))}
      {/* Etiqueta */}
      <text x="27" y="22" fontSize="8" fill="#e0f2fe" fontWeight="bold" textAnchor="middle" style={{ letterSpacing: 1 }}>SEQ</text>
    </svg>
  );
}


import clsx from "clsx";
import { useAtomValue } from "jotai";


import { useState, useEffect } from "react";
// Componente auxiliar para animar las celdas de la memoria de control sincronizadas con el progreso
import { SpringValue, animated } from "@react-spring/web";
// ...existing code...
function AnimatedMemoryCells({ progress, phase }: { progress: SpringValue<number>, phase?: string }) {
  const total = 5;
  // Si está en fetching y progreso es 0, forzar todas las líneas oscuras
  return (
    <>
      {Array.from({ length: total }).map((_, i) => (
        <animated.rect
          key={i}
          x={16}
          y={progress.to(v => 10 + i * 4)}
          width={38}
          height={3}
          rx={1}
          fill={progress.to(v => {
            if (phase === 'fetching' && v === 0) return '#581c87';
            if (v === 0) return '#581c87';
            if (v >= (i + 1) / total) return '#f0abfc';
            if (Math.floor(v * total) === i && v > 0 && v < 1) return '#fff1fb';
            return '#581c87';
          })}
          style={{
            filter: progress.to(v => {
              if (phase === 'fetching' && v === 0) return 'none';
              if (v === 0) return 'none';
              if (v >= (i + 1) / total) return 'drop-shadow(0 0 6px #e879f9)';
              if (Math.floor(v * total) === i && v > 0 && v < 1) return 'drop-shadow(0 0 12px #e879f9)';
              return 'none';
            }),
            transition: 'fill 0.7s, filter 0.7s',
          }}
        />
      ))}
      {/* Rayo de lectura animado */}
      <animated.rect
        x={15}
        y={progress.to(v => 10 + Math.floor(v * 5) * 4 - 0.5)}
        width={40}
        height={3.5}
        rx={1.5}
        fill="#e879f9"
        style={{
          opacity: progress.to(v => (v > 0 && v < 1) ? 0.25 + 0.25 * Math.sin(v * Math.PI) : 0),
          transition: 'y 0.3s, opacity 0.2s',
        }}
      />
      {/* Efecto de "lectura" (borde animado) */}
      <animated.rect
        x="8" y="6" width="54" height="26" rx="4"
        fill="none"
        stroke="#f0abfc"
        strokeWidth="2"
        strokeDasharray="160"
        strokeDashoffset={progress.to(v => ((phase === 'fetching' && v === 0) ? 160 : (v === 0 ? 160 : 160 - 160 * v)))}
        style={{
          opacity: progress.to(v => (v > 0 && v < 1) ? 0.7 : 0),
          transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      />
    </>
  );
}

import { getSpring } from "@/computer/shared/springs";
import { useTranslate } from "@/lib/i18n";

import { cycleAtom } from "./state";

/**
 * Control component, to be used inside <CPU />
 */
export function Control() {
  // Estado para forzar el remount de la animación de memoria de control
  const [memAnimKey, setMemAnimKey] = useState(0);

  useEffect(() => {
    let last = 0;
    const unsub = getSpring("cpu.decoder.progress.progress").to((v: number) => {
      if (last === 0 && v > 0) {
        setMemAnimKey(k => k + 1);
      }
      last = v;
    });
    return () => { if (typeof unsub === 'function') unsub(); };
  }, []);
  const translate = useTranslate();
  const cycle = useAtomValue(cycleAtom);
  const [showControlMem, setShowControlMem] = useState(false);
  // El progreso de la memoria de control ahora depende del progreso del decodificador
  const [sequencerProgress, setSequencerProgress] = useState(0);
  const [sequencerActive, setSequencerActive] = useState(false);

  // Efecto para manejar la secuencia de animación de las barras de progreso
  // Sincronizar la animación de la memoria de control con la barra progresiva del decodificador
  useEffect(() => {
    let sequencerTimeout: NodeJS.Timeout | null = null;
    setSequencerProgress(0);
    setSequencerActive(false);
    if (showControlMem) {
      // Cuando la barra del decodificador llega a 1, activar el secuenciador
      const unsub = getSpring("cpu.decoder.progress.progress").to((progress: number) => {
        if (progress >= 1) {
          sequencerTimeout = setTimeout(() => {
            setSequencerActive(true);
            setSequencerProgress(1);
          }, 300);
        }
      });
      return () => {
        if (sequencerTimeout) clearTimeout(sequencerTimeout);
        if (typeof unsub === 'function') unsub();
      };
    } else {
      setSequencerProgress(0);
      setSequencerActive(false);
    }
  }, [showControlMem]);

  return (
    <>
      <svg viewBox="0 0 650 500" className="pointer-events-none absolute inset-0">
        <animated.path
          d="M 250 310 V 320" // alineado con IR
          className="fill-none stroke-mantis-400 stroke-[3px] drop-shadow-[0_0_8px_rgba(34,197,94,0.6)]"
          strokeLinejoin="round"
          pathLength={1}
          strokeDasharray={1}
          style={getSpring("cpu.decoder.path")}
        />
        {/* Efecto de brillo adicional para el bus del decodificador */}
        <animated.path
          d="M 250 310 V 320"
          className="fill-none stroke-mantis-300 stroke-1 opacity-50"
          strokeLinejoin="round"
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

      <div className="absolute bottom-[17px] left-[30px] flex h-[160px] w-[350px] flex-col items-center rounded-lg border border-stone-600 bg-stone-800">
        <div className="min-w-[180px] overflow-hidden rounded-b-lg border border-t-0 border-stone-600 bg-stone-900 px-3 py-1">
          <div style={{ position: "relative", left: 0 }}>
            <div className="flex items-center justify-between">
              <div style={{ position: "relative", left: 0, display: 'flex', alignItems: 'center' }}>
                <span className="text-sm leading-none">{translate("computer.cpu.decoder")}</span>
                <button
                  type="button"
                  aria-label={showControlMem ? 'Ocultar memoria de control' : 'Mostrar memoria de control'}
                  className={"ml-2 rounded-lg bg-gradient-to-r from-mantis-600 to-mantis-500 hover:from-mantis-500 hover:to-mantis-400 text-white w-6 h-6 flex items-center justify-center transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-mantis-400 shadow-lg"}
                  style={{ 
                    fontSize: '1.2em', 
                    lineHeight: 1, 
                    padding: 0, 
                    minWidth: 0, 
                    minHeight: 0,
                    transform: showControlMem ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: showControlMem ? '0 4px 12px rgba(34,197,94,0.4)' : '0 2px 8px rgba(34,197,94,0.2)'
                  }}
                  onClick={() => setShowControlMem(v => !v)}
                >
                  <span style={{
                    fontWeight:'bold',
                    transform: showControlMem ? 'scale(0.8)' : 'scale(1)',
                    transition: 'transform 0.2s ease-out'
                  }}>
                    {showControlMem ? '−' : '+'}
                  </span>
                </button>
              </div>
            </div>
            <div className="my-1 h-1 w-full overflow-hidden rounded-full bg-stone-600">
              <animated.div
                className="h-full bg-mantis-400"
                style={{
                  width: getSpring("cpu.decoder.progress.progress").to(t => `${t * 100}%`),
                  opacity: getSpring("cpu.decoder.progress.opacity"),
                }}
              />
            </div>
            {/* Memoria de control: siempre visible y fuera del colapsable */}
            <div className="w-full flex justify-center">
              <div className="flex flex-col items-center min-w-[120px]">
                <div className="flex items-center gap-1 mb-0.5">
                  <div className="w-1.5 h-1.5 bg-fuchsia-400 rounded-full animate-pulse shadow-[0_0_4px_rgba(232,121,249,0.6)]"></div>
                  <span className="text-[10px] font-bold text-fuchsia-100 drop-shadow-[0_0_6px_rgba(232,121,249,0.6)] tracking-wide">
                    Memoria de control
                  </span>
                </div>
                <div className="flex flex-row items-center gap-2">
                  {/* Memoria de control */}
                  <svg width="70" height="38" viewBox="0 0 70 38" className="mb-1" style={{filter: 'drop-shadow(0 0 8px rgba(232,121,249,0.25))'}}>
                    {/* Cuerpo de la memoria */}
                    <rect x="8" y="6" width="54" height="26" rx="4" fill="#a21caf" stroke="#e879f9" strokeWidth="2" />
                    {/* Pines laterales */}
                    {Array.from({length: 4}).map((_, i) => (
                      <rect key={i} x={2} y={9 + i*6} width={6} height={2} rx={1} fill="#e879f9" />
                    ))}
                    {Array.from({length: 4}).map((_, i) => (
                      <rect key={i} x={62} y={9 + i*6} width={6} height={2} rx={1} fill="#e879f9" />
                    ))}
                    {/* Celdas de memoria animadas con efecto de lectura sincronizadas con la barra del decodificador */}
                    <AnimatedMemoryCells key={memAnimKey} progress={getSpring("cpu.decoder.progress.progress")} phase={cycle?.phase} />
                  </svg>
                  {/* Secuenciador animado */}
                  <AnimatedSequencerChip active={sequencerActive} />
                </div>
                <span className="text-[9px] text-fuchsia-200 font-semibold tracking-wide">Lectura microinstrucción</span>
              </div>
            </div>

            {/* Secuenciador y otros elementos colapsables */}
            <div
              className="w-full flex justify-center"
              style={{
                maxHeight: showControlMem ? 90 : 0,
                opacity: showControlMem ? 1 : 0,
                transform: showControlMem ? 'translateY(0)' : 'translateY(-10px)',
                transition: 'max-height 0.6s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.5s ease-out, transform 0.5s ease-out',
                overflow: 'hidden',
              }}
            >
              <div className="flex flex-row items-center gap-4 mt-2 px-2">
                {/* Secuenciador (solo visible si showControlMem) */}
                {showControlMem && (
                  <div 
                    className="flex flex-col items-center rounded-md border border-sky-400 bg-gradient-to-b from-sky-900/95 to-sky-800/85 px-2 py-1 min-w-[110px] shadow-md"
                    style={{
                      boxShadow: '0 8px 25px rgba(56,189,248,0.3), 0 0 0 1px rgba(56,189,248,0.2)',
                      transform: 'scale(1.03) translateX(0) translateY(0)',
                      opacity: 1,
                      transition: 'all 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                      transitionDelay: '0.4s',
                    }}
                  >
                    <div className="flex items-center gap-1 mb-0.5">
                      <div className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-pulse shadow-[0_0_4px_rgba(56,189,248,0.6)]"></div>
                      <span className="text-[10px] font-bold text-sky-100 drop-shadow-[0_0_6px_rgba(56,189,248,0.6)] tracking-wide">
                        Secuenciador
                      </span>
                    </div>
                    <animated.div
                      className="w-16 h-2 rounded-full bg-sky-800/60 overflow-hidden mb-0.5 border border-sky-600/50"
                      style={{
                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3), 0 0 12px rgba(56,189,248,0.4)',
                        opacity: sequencerActive ? getSpring("cpu.decoder.progress.opacity") : 0.3,
                      }}
                    >
                      <animated.div
                        className="h-full bg-gradient-to-r from-sky-400 to-sky-300 rounded-full"
                        style={{
                          width: `${sequencerProgress * 100}%`,
                          boxShadow: '0 0 8px rgba(56,189,248,0.6)',
                          transition: 'width 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                      />
                    </animated.div>
                    <span className="text-[9px] text-sky-200 font-semibold tracking-wide">Señales CPU</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Información de la instrucción en curso */}
        <div className="flex w-full flex-1 items-start justify-center p-1">
          <div className="w-[220px] max-w-[220px]">
            <div className="mb-1 flex items-center justify-between">
              <span className="w-16 whitespace-nowrap text-xs font-bold uppercase tracking-wide text-mantis-400">
                Instrucción
              </span>
            </div>

            {/* Instrucción actual */}
            <div className="mb-0.5 rounded border border-stone-600 bg-stone-900/80 p-0.5">
              <div className="min-w-0 flex-1 text-center">
                {cycle && "metadata" in cycle && cycle.metadata ? (
                  <div className="truncate text-xs text-stone-300">
                    <span className="font-mono text-mantis-300">{cycle.metadata.name}</span>
                    {cycle.metadata.operands.length > 0 && (
                      <span className="text-white"> {cycle.metadata.operands.join(", ")}</span>
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-stone-500">
                    {cycle?.phase === "stopped" ? "CPU detenida" : "Esperando..."}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>


    </>
  );
}
