import { useAtomValue } from "jotai";

import { useTranslate } from "@/lib/i18n";
import { useSettings } from "@/lib/settings"; // Importar useSettings

import { cycleCountAtom, instructionCountAtom } from "./state";

export function CPUStats() {
  const translate = useTranslate();
  const cycleCount = useAtomValue(cycleCountAtom);
  const instructionCount = useAtomValue(instructionCountAtom);

  const [settings] = useSettings(); // Obtener settings desde el menú de configuración

  // Si el usuario desactiva la visibilidad del ciclo de instrucción, no renderizar el componente
  if (!settings.showStatsCPU) return null;

  return (
    <div
      className="absolute left-[120px] top-[-120px] z-10 h-min w-[300px] rounded-lg border border-stone-600 bg-stone-900 [&_*]:z-20"      
    >
      <span
        className="mb-2 block h-min w-full rounded-br-lg rounded-tl-lg border-b border-r border-stone-600 bg-blue-500 px-2 py-1 text-lg text-white cursor-move"
      >
        {translate("computer.cpu.stats")}
      </span>
      <hr className="border-stone-600" />
      <div className="flex flex-col w-full items-start py-2 px-2">
        <div className="text-white pl-1 text-sm text-left">
          <div className="mb-1">Total de ciclos: {cycleCount}</div>
          <div>Recuento de instrucciones: {instructionCount}</div>
        </div>
      </div>
    </div>
  );
}