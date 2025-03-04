import { useAtomValue } from "jotai";

import { useTranslate } from "@/lib/i18n";

import { cycleCountAtom, instructionCountAtom } from "./state";

export function CPUStats() {
  const translate = useTranslate();
  const cycleCount = useAtomValue(cycleCountAtom);
  const instructionCount = useAtomValue(instructionCountAtom);

  return (
    <div className="absolute left-[900px] top-[600px] z-10 h-min w-[180px] rounded-lg border border-stone-600 bg-stone-900 [&_*]:z-20">
      <span className="mb-2 block h-min w-full rounded-br-lg rounded-tl-lg border-b border-r border-stone-600 bg-blue-500 px-2 py-1 text-lg text-white">
        {translate("computer.cpu.stats")}
      </span>
      <hr className="border-stone-600" />
      <div className="flex w-full items-center justify-evenly py-2">
        <div className="text-white pl-1 text-sm">
          <div className="mb-1">Clock: {cycleCount}</div>
          <div>Instrucciones: {instructionCount}</div>
        </div>
      </div>
    </div>
  );
}