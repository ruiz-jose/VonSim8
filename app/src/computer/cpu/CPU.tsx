import type { PhysicalRegister } from "@vonsim/simulator/cpu";
import clsx from "clsx";
import { useAtomValue } from "jotai";
import { useEffect, useState } from "react";

import { Register } from "@/computer/shared/Register";
import { useTranslate } from "@/lib/i18n";

import { AddressBus } from "./AddressBus";
import { ALU } from "./ALU";
import { Control } from "./Control";
import { DataBus } from "./DataBus";
import { cycleCountAtom, registerAtoms } from "./state";

export function CPU( ) {
  const translate = useTranslate();
  const cycleCount = useAtomValue(cycleCountAtom); 

  const [showRegisters, setShowRegisters] = useState(false);

  useEffect(() => {
    const handleInstruction = (instruction: string) => {
      if (instruction === "ADD" || instruction === "SUB" || instruction === "CMP") {
        setShowRegisters(true);
      } else {
        setShowRegisters(false);
      }
    };

    // Suscríbete a los cambios de instrucción aquí
    // Por ejemplo, usando un evento personalizado o un estado global
    // Aquí se muestra un ejemplo con un evento personalizado
    const eventListener = (event: Event) => {
      const customEvent = event as CustomEvent;
      handleInstruction(customEvent.detail.instruction);
    };

    window.addEventListener("instructionChange", eventListener as EventListener);

    return () => {
      window.removeEventListener("instructionChange", eventListener);
    };
  }, []);

  return (
    <div className="absolute left-0 top-0 z-10 h-[500px] w-[650px] rounded-lg border border-stone-600 bg-stone-900 [&_*]:z-20">
      <span className="block w-min rounded-br-lg rounded-tl-lg border-b border-r border-stone-600 bg-mantis-500 px-2 py-1 text-3xl text-white">
        {translate("computer.cpu.name")}
      </span>
      <span className="absolute top-0 right-0 w-min rounded-bl-lg rounded-tr-lg border-b border-l border-stone-600 bg-teal-500 px-2 py-1 text-3xl text-white">
        {cycleCount}
      </span>

      <AddressBus />
      <DataBus />

      {showRegisters && (
        <>
          <Reg name="left" className="left-[60px] top-[50px]" />
          <Reg name="right" className="left-[60px] top-[110px]" />
          <Reg name="result" className="left-[300px] top-[80px]" />
        </>
      )}

      <ALU />

      <Reg name="AX" emphasis className="left-[450px] top-[30px]" />
      <Reg name="BX" emphasis className="left-[450px] top-[70px]" />
      <Reg name="CX" emphasis className="left-[450px] top-[110px]" />
      <Reg name="DX" emphasis className="left-[450px] top-[150px]" />
      <Reg name="id" emphasis className="left-[450px] top-[190px] opacity-0" />

      <Reg name="MBR" className={clsx("right-[-51px] top-[233px]", "border-red-color")} />

      <Reg name="IR" className={clsx("left-[171px] top-[270px]", "border-red-color")} />

      <Control />

      <Reg name="SP" emphasis className={clsx("left-[450px] top-[292px]", "border-red-color")} />
      <Reg name="IP" emphasis className={clsx("left-[450px] top-[332px]", "border-red-color")} />
      <Reg name="ri" emphasis className="left-[450px] top-[372px] opacity-0" />

      <Reg name="MAR" className={clsx("right-[-51px] top-[333px]", "border-red-color")} />

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

  return (
    <Register
      name={name}
      valueAtom={registerAtoms[name]}
      springs={`cpu.${name}`}
      emphasis={emphasis}
     // title={translate("computer.cpu.register", name)}
      className={clsx("absolute", className)}
    />
  );
}
