import clsx from "clsx";
import { useAtomValue } from "jotai";
import { useState, useEffect } from "react";

import { animated, getSpring } from "@/computer/shared/springs";
import { useTranslate } from "@/lib/i18n";

import { cycleAtom } from "./state";

/**
 * Control component, to be used inside <CPU />
 */
export function Control() {
  const translate = useTranslate();
  const cycle = useAtomValue(cycleAtom);
  const [showControlMem, setShowControlMem] = useState(false);
  const [controlMemoryProgress, setControlMemoryProgress] = useState(0);
  const [sequencerProgress, setSequencerProgress] = useState(0);
  const [sequencerActive, setSequencerActive] = useState(false);

  // Efecto para manejar la secuencia de animación de las barras de progreso
  useEffect(() => {
    if (showControlMem) {
      // Resetear estados
      setControlMemoryProgress(0);
      setSequencerProgress(0);
      setSequencerActive(false);
      
      // Iniciar animación de memoria de control
      const controlMemoryTimer = setTimeout(() => {
        setControlMemoryProgress(1);
      }, 100);
      
      // Después de que termine la memoria de control, activar el secuenciador
      const sequencerTimer = setTimeout(() => {
        setSequencerActive(true);
        setSequencerProgress(1);
      }, 1500); // 1.5 segundos para que termine la memoria de control
      
      return () => {
        clearTimeout(controlMemoryTimer);
        clearTimeout(sequencerTimer);
      };
    } else {
      // Resetear cuando se oculta
      setControlMemoryProgress(0);
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
            {/* Animación de memoria de control desplegable */}
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
                {/* Memoria de control */}
                <div 
                  className="flex flex-col items-center rounded-md border border-fuchsia-400 bg-gradient-to-b from-fuchsia-900/95 to-fuchsia-800/85 px-2 py-1 min-w-[120px] shadow-md"
                  style={{
                    boxShadow: showControlMem ? '0 8px 25px rgba(232,121,249,0.3), 0 0 0 1px rgba(232,121,249,0.2)' : '0 4px 12px rgba(232,121,249,0.1)',
                    transform: showControlMem ? 'scale(1.05) rotateY(0deg) translateY(0)' : 'scale(0.9) rotateY(-15deg) translateY(15px)',
                    opacity: showControlMem ? 1 : 0,
                    transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    transitionDelay: showControlMem ? '0s' : '0s',
                    transformStyle: 'preserve-3d',
                  }}
                >
                  <div className="flex items-center gap-1 mb-0.5">
                    <div className="w-1.5 h-1.5 bg-fuchsia-400 rounded-full animate-pulse shadow-[0_0_4px_rgba(232,121,249,0.6)]"></div>
                    <span className="text-[10px] font-bold text-fuchsia-100 drop-shadow-[0_0_6px_rgba(232,121,249,0.6)] tracking-wide">
                      Memoria de control
                    </span>
                  </div>
                  <animated.div
                    className="w-16 h-2 rounded-full bg-fuchsia-800/60 overflow-hidden mb-0.5 border border-fuchsia-600/50"
                    style={{
                      boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3), 0 0 12px rgba(232,121,249,0.4)',
                      opacity: getSpring("cpu.decoder.progress.opacity"),
                    }}
                  >
                    <animated.div
                      className="h-full bg-gradient-to-r from-fuchsia-400 to-fuchsia-300 rounded-full"
                      style={{
                        width: `${controlMemoryProgress * 100}%`,
                        boxShadow: '0 0 8px rgba(232,121,249,0.6)',
                        transition: 'width 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      }}
                    />
                  </animated.div>
                  <span className="text-[9px] text-fuchsia-200 font-semibold tracking-wide">Lectura microinstrucción</span>
                </div>
                
                {/* Secuenciador */}
                <div 
                  className="flex flex-col items-center rounded-md border border-sky-400 bg-gradient-to-b from-sky-900/95 to-sky-800/85 px-2 py-1 min-w-[110px] shadow-md"
                  style={{
                    boxShadow: showControlMem ? '0 8px 25px rgba(56,189,248,0.3), 0 0 0 1px rgba(56,189,248,0.2)' : '0 4px 12px rgba(56,189,248,0.1)',
                    transform: showControlMem ? 'scale(1.03) translateX(0) translateY(0)' : 'scale(0.92) translateX(-20px) translateY(20px)',
                    opacity: showControlMem ? 1 : 0,
                    transition: 'all 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                    transitionDelay: showControlMem ? '0.4s' : '0s',
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
