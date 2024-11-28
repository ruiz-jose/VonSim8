import { MemoryAddress } from "@vonsim/common/address";
import type { Byte } from "@vonsim/common/byte";
import { useAtomValue } from "jotai";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/Popover";
import { animated, getSpring } from "@/computer/shared/springs";
import { useTranslate } from "@/lib/i18n";

import { memoryShownAtom, operatingAddressAtom } from "./state";

export function Memory() {
  const translate = useTranslate();

  const memory = useAtomValue(memoryShownAtom);

  const renderMemoryRows = () => {
    const rows = [];
    for (let i = 0; i < 256; i += 16) {
      const row = memory.slice(i, i + 16);
      rows.push(row);
    }
    return rows;
  };

  return (
    <div className="absolute left-[800px] top-0 z-10 h-auto w-auto rounded-lg border border-stone-600 bg-stone-900 [&_*]:z-20">
      <span className="block w-min rounded-br-lg rounded-tl-lg border-b border-r border-stone-600 bg-mantis-500 px-2 py-1 text-3xl text-white">
        {translate("computer.memory.name")}
      </span>

      <div className="m-4 overflow-x-auto">
        <table className="border-collapse w-auto mx-auto text-center font-mono">
          <thead>
            <tr>
              <th></th>
              {Array.from({ length: 16 }).map((_, index) => (
                <th key={index} className="border border-gray-300 w-8 h-8 bg-mantis-500">
                  {index.toString(16).toUpperCase()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {renderMemoryRows().map((row, rowIndex) => (
              <tr key={rowIndex}>
                <th className="border border-gray-300 w-8 h-8 bg-mantis-500">
                  {rowIndex.toString(16).toUpperCase()}
                </th>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="border border-gray-300 w-8 h-8">
                    <MemoryCell address={cell.address} value={cell.value} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MemoryCell({ address, value }: { address: MemoryAddress; value: Byte<8> }) {
  const translate = useTranslate();
  const operatingAddress = useAtomValue(operatingAddressAtom);

  const title = translate("computer.memory.cell", address);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <animated.div
          title={title}
          className="cursor-pointer border border-stone-600 w-8 h-8 flex items-center justify-center bg-stone-800 text-white"
          style={
            address.value === operatingAddress.value
              ? getSpring("memory.operating-cell")
              : undefined
          }
        >
          {value.toString("hex")}
        </animated.div>
      </PopoverTrigger>

      <PopoverContent className="w-60">
        <p className="px-4 py-2 font-medium text-white">{title}</p>
        <hr className="border-stone-600" />
        <ul className="px-4 py-2 text-sm">
          {(["hex", "bin", "uint", "int", "safe-ascii"] as const).map(rep => (
            <li key={rep}>
              <b className="font-medium">{translate(`generics.byte-representation.${rep}`)}</b>:{" "}
              <span className="font-mono text-mantis-400">{value.toString(rep)}</span>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}