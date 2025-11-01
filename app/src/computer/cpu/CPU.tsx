import clsx from "clsx";
import { useAtomValue } from "jotai";
import { useEffect, useState } from "react";

import { Register } from "@/computer/shared/Register";
import { getSpring } from "@/computer/shared/springs";
import { useTranslate } from "@/lib/i18n";
import { getSettings } from "@/lib/settings";

import { AddressBus } from "./AddressBus";
import { ALU } from "./ALU";
import { Control } from "./Control";
import { DataBus } from "./DataBus";
import type { PhysicalRegister } from "./state";
import { registerAtoms, showriAtom,showSPAtom } from "./state";

// Add IPPlusOneAnimation component
function IPPlusOneAnimation() {
  const [isVisible, setIsVisible] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);

  useEffect(() => {
    const handleIPUpdate = () => {
      setIsVisible(true);
      setAnimationKey(prev => prev + 1);

      // Usar la velocidad de animación global (executionUnit)
      const settings = getSettings();
      const animationDuration = settings.executionUnit * 10;

      setTimeout(() => {
        setIsVisible(false);
      }, animationDuration);
    };

    window.addEventListener("ip-register-update", handleIPUpdate);

    return () => {
      window.removeEventListener("ip-register-update", handleIPUpdate);
    };
  }, []);

  // No mostrar si las animaciones están desactivadas
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
            transform: translateY(-20px);
          }
          70% {
            opacity: 1;
            transform: translateY(-20px);
          }
          100% {
            opacity: 0;
            transform: translateY(-40px);
          }
        }
      `}</style>

      {/* +1 Text solo si las animaciones están activadas */}
      {getSettings().animations && (
        <div
          key={animationKey}
          className={clsx(
            "pointer-events-none absolute left-[435px] top-[332px]",
            "font-mono text-xs font-bold",
          )}
          style={{
            color: "#ff6347",
            animation: `slideUpAndFade ${getSettings().executionUnit * 10}ms ease-out forwards`,
          }}
        >
          +1
        </div>
      )}
    </>
  );
}

// Add SPAnimation component for +1/-1 text
function SPAnimation() {
  const [isVisible, setIsVisible] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);
  const [animationType, setAnimationType] = useState<"+1" | "-1">("+1");

  useEffect(() => {
    const handleSPUpdate = (event: CustomEvent<{ type: "+1" | "-1" }>) => {
      setAnimationType(event.detail.type);
      setIsVisible(true);
      setAnimationKey(prev => prev + 1);

      // Usar la velocidad de animación global (executionUnit)
      const settings = getSettings();
      const animationDuration = settings.executionUnit * 10;

      setTimeout(() => {
        setIsVisible(false);
      }, animationDuration);
    };

    window.addEventListener("sp-register-update", handleSPUpdate as EventListener);

    return () => {
      window.removeEventListener("sp-register-update", handleSPUpdate as EventListener);
    };
  }, []);

  // No mostrar si las animaciones están desactivadas
  if (!isVisible) return null;

  return (
    <>
      {/* SP Animation Text solo si las animaciones están activadas */}
      {getSettings().animations && (
        <div
          key={animationKey}
          className={clsx(
            "pointer-events-none absolute left-[435px] top-[292px]",
            "font-mono text-xs font-bold",
          )}
          style={{
            color: "#facc15", // Amarillo similar al del registro SP (yellow-400)
            animation: `slideUpAndFade ${getSettings().executionUnit * 10}ms ease-out forwards`,
          }}
        >
          {animationType}
        </div>
      )}
    </>
  );
}

export function CPU() {
  const translate = useTranslate();

  const showSP = useAtomValue(showSPAtom); // Usar el átomo showSPAtom
  const showri = useAtomValue(showriAtom); // Usar el átomo showriAtom
  const [showid, setShowid] = useState(false);

  const [showRegisters, setShowRegisters] = useState(false);

  // Sincronizar la opacidad del registro ri con el átomo showriAtom
  useEffect(() => {
    const riOpacity = getSpring("cpu.ri").opacity;
    if (showri) {
      riOpacity.start(1);
    } else {
      riOpacity.start(0);
    }
  }, [showri]);

  // Sincronizar la opacidad del registro SP con el átomo showSPAtom
  useEffect(() => {
    const spOpacity = getSpring("cpu.SP").opacity;
    if (showSP) {
      spOpacity.start(1);
    } else {
      spOpacity.start(1); // SP siempre visible cuando no está en uso especial
    }
  }, [showSP]);

  // Sincronizar la opacidad del registro id con el estado local showid
  useEffect(() => {
    const idOpacity = getSpring("cpu.id").opacity;
    if (showid) {
      idOpacity.start(1);
    } else {
      idOpacity.start(0);
    }
  }, [showid]);

  useEffect(() => {
    const handleInstruction = (instruction: string, modeid?: boolean) => {
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
      if (modeid) {
        setShowid(true);
      } else {
        setShowid(false);
      }
    };

    // Suscríbete a los cambios de instrucción aquí
    // Por ejemplo, usando un evento personalizado o un estado global
    // Aquí se muestra un ejemplo con un evento personalizado
    const eventListener = (event: Event) => {
      const customEvent = event as CustomEvent;
      handleInstruction(customEvent.detail.instruction, customEvent.detail.modeid);
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
        <span className="absolute left-0 top-0 z-30 select-none rounded-full border border-emerald-400 bg-emerald-800 px-1 py-0 font-mono text-xs font-bold tracking-widest text-emerald-400">
          AL
        </span>
      </div>
      <div className="absolute left-[450px] top-[70px] z-10">
        <Reg name="BL" emphasis className="" />
        <span className="absolute left-0 top-0 z-30 select-none rounded-full border border-emerald-400 bg-emerald-800 px-1 py-0 font-mono text-xs font-bold tracking-widest text-emerald-400">
          BL
        </span>
      </div>
      <div className="absolute left-[450px] top-[110px] z-10">
        <Reg name="CL" emphasis className="" />
        <span className="absolute left-0 top-0 z-30 select-none rounded-full border border-emerald-400 bg-emerald-800 px-1 py-0 font-mono text-xs font-bold tracking-widest text-emerald-400">
          CL
        </span>
      </div>
      <div className="absolute left-[450px] top-[150px] z-10">
        <Reg name="DL" emphasis className="" />
        <span className="absolute left-0 top-0 z-30 select-none rounded-full border border-emerald-400 bg-emerald-800 px-1 py-0 font-mono text-xs font-bold tracking-widest text-emerald-400">
          DL
        </span>
      </div>
      {showid && (
        <div className="absolute left-[450px] top-[190px] z-10">
          <Reg name="id" className="border-cyan-400 pt-1" />
          <span className="absolute left-0 top-0 z-30 select-none rounded-full border border-cyan-400 bg-cyan-800 px-1 py-0 font-mono text-xs font-bold tracking-widest text-cyan-400">
            id
          </span>
        </div>
      )}

      <div className="absolute left-[450px] top-[332px] z-10">
        <Reg name="IP" emphasis className="border-red-500" />
        <span
          className="absolute left-0 top-0 z-30 select-none rounded-full border border-red-500 bg-red-800 px-1 py-0 font-mono text-[10px] font-bold tracking-widest text-red-200"
          style={{
            textShadow: "0 1px 4px #000, 0 0px 2px #fff4",
          }}
        >
          IP
        </span>
      </div>
      <div className="absolute left-[594px] top-[332px] z-10">
        <Reg name="MAR" className="border-indigo-400" />
        <span
          className="absolute left-0 top-0 z-30 select-none rounded-full border border-indigo-400 bg-indigo-800 px-1 py-0 font-mono text-[10px] font-bold tracking-widest text-indigo-200"
          style={{
            textShadow: "0 1px 4px #000, 0 0px 2px #fff4",
          }}
        >
          MAR
        </span>
      </div>
      <div className="absolute left-[594px] top-[233px] z-10">
        <Reg name="MBR" className="border-indigo-400" />
        <span
          className="absolute left-0 top-0 z-30 select-none rounded-full border border-indigo-400 bg-indigo-800 px-1 py-0 font-mono text-[10px] font-bold tracking-widest text-indigo-200"
          style={{
            textShadow: "0 1px 4px #000, 0 0px 2px #fff4",
          }}
        >
          MBR
        </span>
      </div>

      <div className="absolute left-[230px] top-[270px] z-10">
        <Reg name="IR" className="border-indigo-400" />
        <span
          className="absolute left-0 top-0 z-30 select-none rounded-full border border-indigo-400 bg-indigo-800 px-1 py-0 font-mono text-[10px] font-bold tracking-widest text-indigo-200"
          style={{
            textShadow: "0 1px 4px #000, 0 0px 2px #fff4",
          }}
        >
          IR
        </span>
      </div>

      <Control />
      {showSP && (
        <div className="absolute left-[450px] top-[292px] z-10">
          <Reg name="SP" emphasis className="border-yellow-400 pt-2" />
          <span
            className="absolute left-0 top-0 z-30 select-none rounded-full border border-yellow-400 bg-yellow-800 px-1 py-0 font-mono text-[10px] font-bold tracking-widest text-yellow-200"
            style={{
              textShadow: "0 1px 4px #000, 0 0px 2px #fff4",
            }}
          >
            SP
          </span>
        </div>
      )}
      {/* Eliminado para evitar duplicado visual del registro IP */}

      {showri && (
        <div className="absolute left-[450px] top-[372px] z-10">
          <Reg name="ri" emphasis className="border-cyan-400" />
          <span className="absolute left-0 top-0 z-30 select-none rounded-full border border-cyan-400 bg-cyan-800 px-1 py-0 font-mono text-xs font-bold tracking-widest text-cyan-400">
            ri
          </span>
        </div>
      )}

      {/* Eliminado MAR duplicado sin título */}

      <IPPlusOneAnimation />
      <SPAnimation />
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
