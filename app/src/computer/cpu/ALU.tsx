import clsx from "clsx";
import { useAtomValue } from "jotai";
import { useEffect,useState } from "react";

import { animated, getSpring } from "@/computer/shared/springs";
import { useSettings } from "@/lib/settings";

import { aluOperationAtom, connectScreenAndKeyboardAtom,registerAtoms } from "./state";

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
      if (instruction === "ADD" || instruction === "SUB" || instruction === "CMP" || instruction === "AND" || instruction === "OR" || instruction === "XOR" || instruction === "NOT" || instruction === "NEG" || instruction === "DEC" || instruction === "INC") {
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
        <animated.path
          className="fill-none stroke-mantis-400 stroke-bus"
          strokeLinejoin="round"
          d="M 120 85 H 220"
          pathLength={1}
          strokeDasharray={1}
          style={getSpring("cpu.alu.operands")}
        />
        <animated.path
          className="fill-none stroke-mantis-400 stroke-bus"
          strokeLinejoin="round"
          d="M 120 145 H 220"
          pathLength={1}
          strokeDasharray={1}
          style={getSpring("cpu.alu.operands")}
        />       
        {/* ALU */}
        <path
          d="M 220 65 v 40 l 17.32 10 l -17.32 10 v 40 l 51.96 -30 v -40 Z"
          className="fill-stone-800 stroke-stone-600"
          strokeLinejoin="round"
        />
      </svg>

      <animated.span
        className="icon-[lucide--settings] absolute left-[242px] top-[103px] block h-6 w-6 text-stone-300"
        style={{
          transform: getSpring("cpu.alu.cog").rot.to(t => `rotate(${t * 60}deg)`),
        }}
      />

      {showOperation && (
        <animated.span
          className="absolute left-[260px] top-[50px] flex w-min items-center rounded-md border border-stone-600 px-2 py-1 font-mono leading-none"
          style={getSpring("cpu.alu.operation")}
        >
          {operation}
        </animated.span>
      )}

      {/* Flags */}
      <animated.div
        className={clsx(
          "absolute top-[190px] flex w-min items-center gap-1 rounded-md border border-mantis-400 bg-stone-800 px-2 py-1 font-mono leading-none",
          settings.flagsVisibility === "SF_OF_CF_ZF" ? "left-[200px]" : "left-[220px]"
        )}
        style={getSpring("cpu.FLAGS")}
      >
        {connectScreenAndKeyboard && (<span className={clsx("rounded p-1 font-light", IF ? "bg-mantis-400" : "bg-stone-900")}>
          I
        </span> )}
        {settings.flagsVisibility === "SF_OF_CF_ZF" && (
          <>
            <span className={clsx("rounded p-1 font-light", SF ? "bg-mantis-400" : "bg-stone-900")}>
              S
            </span>
            <span className={clsx("rounded p-1 font-light", OF ? "bg-mantis-400" : "bg-stone-900")}>
              O
            </span>
          </>
        )}
        <span className={clsx("rounded p-1 font-light", CF ? "bg-mantis-400" : "bg-stone-900")}>
          C
        </span>
        <span className={clsx("rounded p-1 font-light", ZF ? "bg-mantis-400" : "bg-stone-900")}>
          Z
        </span>
        {/*<span className={clsx("rounded p-1 font-light", SF ? "bg-mantis-400" : "bg-stone-900")}>
          SF
        </span>
        <span className={clsx("rounded p-1 font-light", OF ? "bg-mantis-400" : "bg-stone-900")}>
          OF
        </span>*/}
      </animated.div>
    </>
  );
}
