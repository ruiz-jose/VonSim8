import clsx from "clsx";
import { useAtomValue } from "jotai";
import { useEffect, useState } from "react";

import { Register } from "@/computer/shared/Register";
import { useTranslate } from "@/lib/i18n";

import { AddressBus } from "./AddressBus";
import { ALU } from "./ALU";
import { Control } from "./Control";
import { DataBus } from "./DataBus";
import type { PhysicalRegister } from "./state";
import { registerAtoms, showSPAtom } from "./state";

// Add IPPlusOneAnimation component
function IPPlusOneAnimation() {
  const [isVisible, setIsVisible] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);

  useEffect(() => {
    const handleIPUpdate = () => {
      setIsVisible(true);
      setAnimationKey(prev => prev + 1);

      // Hide the animation after the same duration as updateRegisterWithGlow (~3 seconds)
      setTimeout(() => {
        setIsVisible(false);
      }, 3000);
    };

    // Listen for IP register updates
    window.addEventListener("ip-register-update", handleIPUpdate);

    return () => {
      window.removeEventListener("ip-register-update", handleIPUpdate);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <>
      <style>{`
        @keyframes slideUpAndFade {
          0% {
            opacity: 1;
            transform: translateY(0px);
          }
          30% {
            opacity: 1;
            transform: translateY(-30px);
          }
          70% {
            opacity: 1;
            transform: translateY(-30px);
          }
          100% {
            opacity: 0;
            transform: translateY(-50px);
          }
        }
      `}</style>

      {/* +1 Text */}
      <div
        key={animationKey}
        className={clsx(
          "pointer-events-none absolute left-[425px] top-[342px]",
          "font-mono text-lg font-bold",
        )}
        style={{
          color: "#ff6347",
          animation: "slideUpAndFade 3s ease-out forwards",
        }}
      >
        +1
      </div>
    </>
  );
}

export function CPU() {
  const translate = useTranslate();

  const showSP = useAtomValue(showSPAtom); // Usar el átomo showSPAtom
  const [showid, setShowid] = useState(false);
  const [showri, setShowri] = useState(false);

  const [showRegisters, setShowRegisters] = useState(false);

  useEffect(() => {
    const handleInstruction = (instruction: string, modeid?: boolean, moderi?: boolean) => {
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
        setShowRegisters(true);
      } else {
        setShowRegisters(false);
      }
      if (instruction === "IRET" || modeid) {
        setShowid(true);
      } else {
        setShowid(false);
      }
      if (moderi) {
        setShowri(true);
      } else {
        setShowri(false);
      }
    };

    // Suscríbete a los cambios de instrucción aquí
    // Por ejemplo, usando un evento personalizado o un estado global
    // Aquí se muestra un ejemplo con un evento personalizado
    const eventListener = (event: Event) => {
      const customEvent = event as CustomEvent;
      handleInstruction(
        customEvent.detail.instruction,
        customEvent.detail.modeid,
        customEvent.detail.moderi,
      );
    };

    window.addEventListener("instructionChange", eventListener as EventListener);

    return () => {
      window.removeEventListener("instructionChange", eventListener);
    };
  }, []);

  return (
    <div
      data-testid="cpu-component"
      className="absolute left-0 top-0 z-10 h-[500px] w-[650px] rounded-lg border border-stone-600 bg-stone-900 [&_*]:z-20"
    >
      <span className="block w-min rounded-br-lg rounded-tl-lg border-b border-r border-stone-600 bg-mantis-500 px-2 py-1 text-3xl text-white">
        {translate("computer.cpu.name")}
      </span>

      <AddressBus showSP={showSP} showri={showri} />
      <DataBus showSP={showSP} showid={showid} showri={showri} />

      {showRegisters && (
        <>
          <Reg
            name="left"
            className={clsx("left-[96px] top-[49px]", "border-transparent", "bg-transparent")}
          />
          <Reg
            name="right"
            className={clsx("left-[96px] top-[150px]", "border-transparent", "bg-transparent")}
          />
          <Reg
            name="result"
            className={clsx("left-[280px] top-[79px]", "border-transparent", "bg-transparent")}
          />
        </>
      )}

      <ALU />

      <div className="absolute left-[450px] top-[30px] z-10">
        <Reg name="AL" emphasis className="" />
        <span
          className="absolute left-0 top-0 px-1 py-0 rounded-full bg-emerald-800 border border-emerald-400 font-mono font-bold text-emerald-400 text-xs tracking-widest select-none z-30"
        >
          AL
        </span>
      </div>
      <div className="absolute left-[450px] top-[70px] z-10">
        <Reg name="BL" emphasis className="" />
        <span
          className="absolute left-0 top-0 px-1 py-0 rounded-full bg-emerald-800 border border-emerald-400 font-mono font-bold text-emerald-400 text-xs tracking-widest select-none z-30"
        >
          BL
        </span>
      </div>
      <div className="absolute left-[450px] top-[110px] z-10">
        <Reg name="CL" emphasis className="" />
        <span
          className="absolute left-0 top-0 px-1 py-0 rounded-full bg-emerald-800 border border-emerald-400 font-mono font-bold text-emerald-400 text-xs tracking-widest select-none z-30"
        >
          CL
        </span>
      </div>
      <div className="absolute left-[450px] top-[150px] z-10">
        <Reg name="DL" emphasis className="" />
        <span
          className="absolute left-0 top-0 px-1 py-0 rounded-full bg-emerald-800 border border-emerald-400 font-mono font-bold text-emerald-400 text-xs tracking-widest select-none z-30"
        >
          DL
        </span>
      </div>
      {showid && <Reg name="id" className={clsx("left-[450px] top-[190px]", "border-cyan-400")} />}

      <div className="absolute left-[450px] top-[332px] z-10">
        <Reg name="IP" emphasis className="border-red-500" />
        <span
          className="absolute right-0 top-0 px-1 py-0 rounded-full bg-red-800 border border-red-400 font-mono font-bold text-red-200 text-xs tracking-widest select-none z-[99]"
        >
          IP
        </span>
      </div>
      <Reg name="MAR" className="right-[-11px] top-[333px] border-indigo-400 z-10" />
      <span
        className="absolute right-[7px] top-[325px] px-1 py-0 rounded-full bg-indigo-800 border border-indigo-400 font-mono font-bold text-indigo-200 text-xs tracking-widest select-none z-[99]"
      >
        MAR
      </span>
      <Reg name="MBR" className="right-[-11px] top-[233px] border-indigo-400" />
      <span
        className="absolute right-[7px] top-[225px] px-1 py-0 rounded-full bg-indigo-800/80 border border-indigo-400 font-mono font-bold text-indigo-200 text-xs shadow-[0_1px_6px_rgba(0,0,0,0.25)] tracking-widest select-none z-30"
        style={{ textShadow: "0 1px 4px #000, 0 0px 2px #fff4" }}
      >
        MBR
      </span>

      <Reg name="IR" className={clsx("left-[185px] top-[270px]", "border-indigo-400")} />
      <span
        className="absolute left-[200px] top-[260px] px-1 py-0 rounded-full bg-indigo-800 border border-indigo-400 font-mono font-bold text-indigo-200 text-xs tracking-widest select-none z-[99]"
      >
        IR
      </span>

      <Control />
      {showSP && (
        <Reg name="SP" emphasis className={clsx("left-[450px] top-[292px]", "border-yellow-400")} />
      )}
      <Reg name="IP" emphasis className={clsx("left-[450px] top-[332px]", "border-red-500")} />

      {showri && (
        <Reg name="ri" emphasis className={clsx("left-[470px] top-[372px]", "border-cyan-400")} />
      )}

      <Reg name="MAR" className={clsx("right-[-11px] top-[333px]", "border-indigo-400")} />

      <IPPlusOneAnimation />
    </div>
  );
}

function Reg({
  name,
  emphasis,
  className,
}: {
  name: PhysicalRegister | "MAR" | "MBR";
  emphasis?: boolean;
  className?: string;
}) {
  //const translate = useTranslate();

  // Mapeo explícito de nombres de registros a sus paths correspondientes
  const getSpringPath = (regName: string): string => {
    return `cpu.${regName}`;
  };

  return (
    <Register
      name={name}
      valueAtom={registerAtoms[name]}
      springs={getSpringPath(name) as any}
      emphasis={emphasis}
      // title={translate("computer.cpu.register", name)}
      className={clsx("absolute", className)}
    />
  );
}
