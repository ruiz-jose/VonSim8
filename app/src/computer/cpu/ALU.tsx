import clsx from "clsx";
import { useAtomValue } from "jotai";
import { useEffect, useState } from "react";

import { animated, getSpring } from "@/computer/shared/springs";
import { useSettings } from "@/lib/settings";

import { aluOperationAtom, connectScreenAndKeyboardAtom, registerAtoms } from "./state";

/**
 * ALU component, to be used inside <CPU />
 */
export function ALU() {
  const FLAGS = useAtomValue(registerAtoms.FLAGS);
  const operation = useAtomValue(aluOperationAtom);
  const [showOperation, setShowOperation] = useState(false);

  const connectScreenAndKeyboard = useAtomValue(connectScreenAndKeyboardAtom); // Obtener el valor del átomo

  const [settings] = useSettings(); // Obtener settings desde el menú de configuración

  useEffect(() => {
    const handleInstruction = (instruction: string) => {
      if (
        instruction === "ADD" ||
        instruction === "SUB" ||
        instruction === "CMP" ||
        instruction === "AND" ||
        instruction === "OR" ||
        instruction === "XOR" ||
        instruction === "NOT" ||
        instruction === "NEG" ||
        instruction === "DEC" ||
        instruction === "INC"
      ) {
        setShowOperation(true);
      } else {
        setShowOperation(false);
      }
    };

    const eventListener = (event: Event) => {
      const customEvent = event as CustomEvent;
      handleInstruction(customEvent.detail.instruction);
    };

    window.addEventListener("instructionChange", eventListener as EventListener);

    return () => {
      window.removeEventListener("instructionChange", eventListener);
    };
  }, []);

  // https://vonsim.github.io/docs/cpu/#flags
  const CF = FLAGS.bit(1);
  const ZF = FLAGS.bit(0);
  const SF = FLAGS.bit(3);
  const IF = FLAGS.bit(4);
  const OF = FLAGS.bit(2);

  return (
    <>
      <svg viewBox="0 0 650 500" className="pointer-events-none absolute inset-0">
        {/* Buses de entrada con mejor animación */}
        <animated.path
          className="fill-none stroke-mantis-400 stroke-bus drop-shadow-[0_0_4px_rgba(60,180,120,0.4)]"
          strokeLinejoin="round"
          d="M 120 85 H 220"
          pathLength={1}
          strokeDasharray={1}
          style={getSpring("cpu.alu.operands")}
        />
        <animated.path
          className="fill-none stroke-mantis-400 stroke-bus drop-shadow-[0_0_4px_rgba(60,180,120,0.4)]"
          strokeLinejoin="round"
          d="M 120 145 H 220"
          pathLength={1}
          strokeDasharray={1}
          style={getSpring("cpu.alu.operands")}
        />

        {/* ALU con gradiente mejorado */}
        <defs>
          <linearGradient id="aluGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#374151" />
            <stop offset="50%" stopColor="#4B5563" />
            <stop offset="100%" stopColor="#1F2937" />
          </linearGradient>
          <filter id="aluShadow">
            <feDropShadow dx="2" dy="2" stdDeviation="3" floodColor="rgba(0,0,0,0.3)" />
          </filter>
        </defs>

        {/* ALU más grande */}
        <path
          d="M 220 60 v 50 l 20 12 l -20 12 v 50 l 60 -36 v -52 Z"
          fill="url(#aluGradient)"
          stroke="#6B7280"
          strokeWidth="2"
          strokeLinejoin="round"
          filter="url(#aluShadow)"
        />

        {/* Etiqueta ALU centrada */}
        <text x="250" y="105" fill="#E5E7EB" fontSize="12" fontWeight="bold" textAnchor="middle">
          ALU
        </text>
      </svg>

      <animated.span
        className="icon-[lucide--settings] absolute left-[244px] top-[120px] block h-5 w-5 text-stone-300"
        style={{
          transform: getSpring("cpu.alu.cog").rot.to(t => `rotate(${t * 60}deg)`),
        }}
      />

      {showOperation && (
        <animated.span
          className="absolute left-[244px] top-[40px] flex w-min items-center rounded-md border border-stone-600 px-2 py-1 font-mono leading-none z-30"
          style={getSpring("cpu.alu.operation")}
        >
          {operation}
        </animated.span>
      )}

      {/* Flags mejoradas */}
      <animated.div
        className={clsx(
          "absolute flex w-min items-center gap-0.5 rounded-lg border-2 border-stone-400 bg-gradient-to-br from-stone-700 via-stone-600 to-stone-800 px-0.5 py-1 text-stone-200 font-bold min-w-[38px] min-h-[30px] shadow-lg ring-1 ring-stone-300",
          settings.flagsVisibility === "SF_OF_CF_ZF"
            ? "top-[190px] left-[210px]"
            : "top-[190px] left-[230px]",
        )}
        style={getSpring("cpu.FLAGS")}
      >
        <span className="absolute top-0.5 left-0.5 text-stone-300 text-[6px] bg-stone-900/80 px-0.5 rounded pointer-events-none font-bold">
          FLAGS
        </span>

        {/* Espaciado adicional para evitar solapamiento con el título */}
        <div className="mt-2 flex items-center gap-0.5">
          {connectScreenAndKeyboard && (
            <span
              className={clsx(
                "px-0.5 py-0 text-[10px] font-bold rounded border transition-all duration-200",
                IF
                  ? "border-stone-300 bg-stone-300 text-stone-950 shadow-[0_0_4px_rgba(120,113,108,0.6)]"
                  : "border-stone-600 bg-stone-800 text-stone-300",
              )}
            >
              I
            </span>
          )}

          {settings.flagsVisibility === "SF_OF_CF_ZF" && (
            <>
              <span
                className={clsx(
                  "px-0.5 py-0 text-[10px] font-bold rounded border transition-all duration-200",
                  SF
                    ? "border-stone-300 bg-stone-300 text-stone-950 shadow-[0_0_4px_rgba(120,113,108,0.6)]"
                    : "border-stone-600 bg-stone-800 text-stone-300",
                )}
              >
                S
              </span>
              <span
                className={clsx(
                  "px-0.5 py-0 text-[10px] font-bold rounded border transition-all duration-200",
                  OF
                    ? "border-stone-300 bg-stone-300 text-stone-950 shadow-[0_0_4px_rgba(120,113,108,0.6)]"
                    : "border-stone-600 bg-stone-800 text-stone-300",
                )}
              >
                O
              </span>
            </>
          )}

          <span
            className={clsx(
              "px-0.5 py-0 text-[10px] font-bold rounded border transition-all duration-200",
              CF
                ? "border-stone-300 bg-stone-300 text-stone-950 shadow-[0_0_4px_rgba(120,113,108,0.6)]"
                : "border-stone-600 bg-stone-800 text-stone-300",
            )}
          >
            C
          </span>
          <span
            className={clsx(
              "px-0.5 py-0 text-[10px] font-bold rounded border transition-all duration-200",
              ZF
                ? "border-stone-300 bg-stone-300 text-stone-950 shadow-[0_0_4px_rgba(120,113,108,0.6)]"
                : "border-stone-600 bg-stone-800 text-stone-300",
            )}
          >
            Z
          </span>
        </div>
      </animated.div>
    </>
  );
}
