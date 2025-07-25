import { useAtomValue } from "jotai";

import { Switch } from "@/components/ui/Switch";
import { useSimulation } from "@/computer/simulation";
import { useTranslate } from "@/lib/i18n";

import { switchesAtom } from "./state";

export function Switches() {
  const translate = useTranslate();
  //const { status, dispatch, devices } = useSimulation();
  const { dispatch, devices } = useSimulation();
  const state = useAtomValue(switchesAtom).toArray();

  if (!devices.switches) return null;

  /**
   * We do `flex-row-reverse` to show this order:
   * 7 6 5 4 3 2 1 0
   *
   * Because the array is:
   * 0 1 2 3 4 5 6 7
   *
   * This way, we can use the index as the switch number
   * and the user will the switches as shown on the PIO.
   */

  return (
    <div className="absolute left-[1300px] top-[680px] z-10 size-min rounded-lg border border-stone-600 bg-stone-900 [&_*]:z-20">
      <span className="block size-min rounded-br-lg rounded-tl-lg border-b border-r border-stone-600 bg-mantis-500 px-2 py-1 text-2xl text-white">
        {translate("computer.switches")}
      </span>

      <div className="flex flex-row-reverse gap-3 p-4">
        {state.map((on: boolean, i: number) => (
          <div key={i} className="flex w-8 flex-col items-center">
            <span className="mb-1 w-full text-center text-xs text-white">{i}</span>
            <Switch
              checked={on}
              onCheckedChange={() => dispatch("switch.toggle", i)}
              className="-translate-x-3 -rotate-90 data-[state=unchecked]:!bg-stone-800"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
