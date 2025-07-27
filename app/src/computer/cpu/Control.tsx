import clsx from "clsx";
import { useAtomValue } from "jotai";
import { useState } from "react";

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
        <div className="min-w-[180px] overflow-hidden rounded-b-lg border border-t-0 border-stone-600 bg-stone-900 px-3 py-0.5">
          <div style={{ position: "relative", left: 0 }}>
            <div className="flex items-center justify-between">
              <div style={{ position: "relative", left: 0, display: 'flex', alignItems: 'center' }}>
                <span className="text-sm leading-none">{translate("computer.cpu.decoder")}</span>
                <button
                  type="button"
                  aria-label={showControlMem ? 'Ocultar memoria de control' : 'Mostrar memoria de control'}
                  className={"ml-2 rounded bg-mantis-700 hover:bg-mantis-600 text-white w-5 h-5 flex items-center justify-center transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-mantis-400"}
                  style={{ fontSize: '1.1em', lineHeight: 1, padding: 0, minWidth: 0, minHeight: 0 }}
                  onClick={() => setShowControlMem(v => !v)}
                >
                  {showControlMem ? <span style={{fontWeight:'bold'}}>-</span> : <span style={{fontWeight:'bold'}}>+</span>}
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
                maxHeight: showControlMem ? 70 : 0,
                opacity: showControlMem ? 1 : 0,
                transition: 'max-height 0.4s cubic-bezier(.4,2,.6,1), opacity 0.3s',
                overflow: 'hidden',
              }}
            >
              <div className="flex flex-row items-center gap-2 mt-1">
                {/* Memoria de control */}
                <div className="flex flex-col items-center rounded-lg border border-fuchsia-500 bg-fuchsia-900/80 px-2 py-1 min-w-[120px] shadow-lg">
                  <span className="text-xs font-bold text-fuchsia-300 mb-0.5">Memoria de control</span>
                  <animated.div
                    className="w-16 h-2 rounded-full bg-fuchsia-700 overflow-hidden mb-0.5"
                    style={{
                      boxShadow: '0 0 8px 2px rgba(232,121,249,0.3)',
                      opacity: getSpring("cpu.decoder.progress.opacity"),
                    }}
                  >
                    <animated.div
                      className="h-full bg-fuchsia-400"
                      style={{
                        width: getSpring("cpu.decoder.progress.progress").to(t => `${t * 100}%`),
                      }}
                    />
                  </animated.div>
                  <span className="text-[10px] text-fuchsia-200">Lectura microinstrucción</span>
                </div>
                {/* Secuenciador */}
                <div className="flex flex-col items-center rounded-lg border border-sky-500 bg-sky-900/80 px-2 py-1 min-w-[110px] shadow-lg">
                  <span className="text-xs font-bold text-sky-300 mb-0.5">Secuenciador</span>
                  <animated.div
                    className="w-16 h-2 rounded-full bg-sky-700 overflow-hidden mb-0.5"
                    style={{
                      boxShadow: '0 0 8px 2px rgba(56,189,248,0.3)',
                      opacity: getSpring("cpu.decoder.progress.opacity"),
                    }}
                  >
                    <animated.div
                      className="h-full bg-sky-400"
                      style={{
                        width: getSpring("cpu.decoder.progress.progress").to(t => `${t * 100}%`),
                      }}
                    />
                  </animated.div>
                  <span className="text-[10px] text-sky-200">Señales CPU</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Información de la instrucción en curso */}
        <div className="flex w-full flex-1 items-start justify-center p-0.5">
          <div className="w-[220px] max-w-[220px]">
            <div className="mb-0.5 flex items-center justify-between">
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
