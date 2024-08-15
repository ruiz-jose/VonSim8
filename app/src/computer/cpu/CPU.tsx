import type { PhysicalRegister } from "@vonsim/simulator/cpu";
import clsx from "clsx";

import { Register } from "@/computer/shared/Register";
import { useTranslate } from "@/lib/i18n";

import { AddressBus } from "./AddressBus";
import { ALU } from "./ALU";
import { Control } from "./Control";
import { DataBus } from "./DataBus";
import { registerAtoms } from "./state";

export function CPU() {
  const translate = useTranslate();

  return (
    <div className="absolute left-0 top-0 z-10 h-[500px] w-[650px] rounded-lg border border-stone-600 bg-stone-900 [&_*]:z-20">
      <span className="block w-min rounded-br-lg rounded-tl-lg border-b border-r border-stone-600 bg-mantis-500 px-2 py-1 text-3xl text-white">
        {translate("computer.cpu.name")}
      </span>

      <AddressBus />
      <DataBus />

      <Reg name="left" className="invisible left-[60px] top-[70px]" />
      <Reg name="right" className="invisible left-[60px] top-[130px]" />
      <Reg name="result" className="invisible left-[300px] top-[100px]" />

      <ALU />

      <Reg name="AX" emphasis className="left-[450px] top-[30px]" />
      <Reg name="BX" emphasis className="left-[450px] top-[70px]" />
      <Reg name="CX" emphasis className="left-[450px] top-[110px]" />
      <Reg name="DX" emphasis className="left-[450px] top-[150px]" />
      <Reg name="id" className="invisible left-[450px] top-[190px]" />

      <Reg name="MBR" className="right-[-51px] top-[233px]" />

      <Reg name="IR" className="left-[171px] top-[270px]" />

      <Control />

      <Reg name="IP" emphasis className="left-[450px] top-[292px]" />
      <Reg name="SP" emphasis className="left-[450px] top-[332px]" />
      <Reg name="ri" className="invisible left-[450px] top-[372px]" />

      <Reg name="MAR" className="right-[-51px] top-[333px]" />
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
  const translate = useTranslate();

  return (
    <Register
      name={name}
      valueAtom={registerAtoms[name]}
      springs={`cpu.${name}`}
      emphasis={emphasis}
      title={translate("computer.cpu.register", name)}
      className={clsx("absolute", className)}
    />
  );
}
