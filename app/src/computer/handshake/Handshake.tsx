import { IOAddress } from "@vonsim/common/address";

import { Register } from "@/computer/shared/Register";
import { useSimulation } from "@/computer/simulation";
import { useTranslate } from "@/lib/i18n";

import { DATAAtom, STATEAtom } from "./state";

export function Handshake() {
  const translate = useTranslate();
  const { devices } = useSimulation();

  if (!devices.handshake) return null;

  return (
    <div className="absolute left-[900px] top-[925px] z-10 h-min w-[220px] rounded-lg border border-stone-600 bg-stone-900 [&_*]:z-20">
      <span className="block size-min rounded-br-lg rounded-tl-lg border-b border-r border-stone-600 bg-mantis-500 px-2 py-1 text-2xl text-white">
        {translate("computer.handshake.name")}
      </span>

      <div className="my-4 ml-auto mr-8 w-fit">
        <Register
          name="STATE"
          title={IOAddress.format(0x41)}
          valueAtom={STATEAtom}
          springs="handshake.STATE"
        />
      </div>

      <hr className="border-stone-600" />

      <div className="my-4 ml-auto mr-8 w-fit">
        <Register
          name="DATA"
          title={IOAddress.format(0x40)}
          valueAtom={DATAAtom}
          springs="handshake.DATA"
        />
      </div>
    </div>
  );
}
