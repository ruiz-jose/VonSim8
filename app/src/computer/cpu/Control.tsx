import clsx from "clsx";
import { useAtomValue } from "jotai";

import { animated, getSpring } from "@/computer/shared/springs";
import { useTranslate } from "@/lib/i18n";

import { cycleAtom } from "./state";

/**
 * Control component, to be used inside <CPU />
 */
export function Control() {
  const translate = useTranslate();
  const cycle = useAtomValue(cycleAtom);

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
