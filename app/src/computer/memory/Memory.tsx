import { MemoryAddress } from "@vonsim/common/address";
import type { Byte } from "@vonsim/common/byte";
import { useAtomValue } from "jotai";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/Popover";
import { registerAtoms, showSPAtom } from "@/computer/cpu/state"; // Importa los átomos de los registros
import { dataAddressesAtom, programAddressesAtom } from "@/computer/memory/state";
import { animated, getSpring } from "@/computer/shared/springs";
import { hasINTInstructionAtom } from "@/computer/cpu/state";
import { useTranslate } from "@/lib/i18n";

import { memoryShownAtom, operatingAddressAtom } from "./state";

export function Memory() {
  const translate = useTranslate();

  const memory = useAtomValue(memoryShownAtom);
  const ip = useAtomValue(registerAtoms.IP); // Obtén el valor del registro IP
  const programAddresses = useAtomValue(programAddressesAtom); // Obtener las direcciones del programa
  const dataAddresses = useAtomValue(dataAddressesAtom); // Obtener las direcciones del programa
  const sp = useAtomValue(registerAtoms.SP); // <-- Agrega esto
  const showSP = useAtomValue(showSPAtom); 
  const hasINT = useAtomValue(hasINTInstructionAtom);

  //console.log("Direcciones del programa:", showSP);

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
                    <MemoryCell
                      address={cell.address}
                      value={cell.value}
                      isIP={cell.address.valueOf() === ip.valueOf()}
                      isSP={showSP && cell.address.valueOf() === sp.valueOf()}
                      isStackData={showSP && cell.address.valueOf() > sp.valueOf()} // NUEVO: zona de pila activa
                      isProgramAddress={!!programAddresses.find(entry => entry.address === cell.address.value)}
                      isDataAddress={!!dataAddresses.find(entry => entry.address === cell.address.value)}
                      isInterruptVector={hasINT && cell.address.valueOf() >= 0 && cell.address.valueOf() <= 7}
                      label={
                        programAddresses.find(entry => entry.address === cell.address.value)?.name ||
                        dataAddresses.find(entry => entry.address === cell.address.value)?.label ||
                        null
                      }
                      length={programAddresses.find(entry => entry.address === cell.address.value)?.length ?? null}
                    />
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

function MemoryCell({
  address,
  value,
  isIP,
  isSP,
  isStackData, // NUEVO
  isProgramAddress,
  isDataAddress,
  isInterruptVector,
  label,
  length, 
}: {
  address: MemoryAddress;
  value: Byte<8>;
  isIP: boolean;
  isSP?: boolean;
  isStackData?: boolean; // NUEVO
  isProgramAddress: boolean;
  isDataAddress: boolean;
  isInterruptVector?: boolean;
  label: string | null;
  length: string | null;
}) {   
  const translate = useTranslate();
  const operatingAddress = useAtomValue(operatingAddressAtom);

  const title = translate("computer.memory.cell", address);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <animated.div
          title={title}
          className={`cursor-pointer border border-stone-600 w-8 h-8 flex items-center justify-center relative
            ${
              isIP
                ? "ring-2 ring-red-500 ring-offset-2 animate-pulse shadow-lg shadow-red-500/50 outline outline-2 outline-red-500"
                : isSP
                ? "ring-2 ring-yellow-400 ring-offset-2 animate-pulse shadow-lg shadow-yellow-400/50 outline outline-2 outline-yellow-400"
                : ""
            }
            ${
              isSP
                ? "bg-yellow-400"
                : isStackData
                ? "bg-yellow-200"
                : isInterruptVector
                ? "bg-purple-100"
                : "bg-stone-800"
            }
            ${
              isInterruptVector && !isSP && !isStackData ? "border-l-4 border-purple-500" : ""
            }
            ${
              isProgramAddress && !isSP && !isStackData && !isInterruptVector ? "border-l-4 border-blue-500" : ""
            }
            ${
              isDataAddress && !isSP && !isStackData && !isProgramAddress && !isInterruptVector ? "border-l-4 border-green-500" : ""
            }
            ${
              isSP || isStackData ? "text-black" : isInterruptVector ? "text-black" : "text-white"
            }`
          }
          style={
            address.value === operatingAddress.value
              ? getSpring("memory.operating-cell")
              : undefined
          }
        >
          {/* Íconos para instrucciones, datos y vector de interrupciones */}
          {isInterruptVector && !isSP && !isStackData && (
            <span className="absolute top-0 left-0 text-purple-500 text-xs" title="Vector de interrupción" style={{lineHeight:1}}>
              ⚡
            </span>
          )}
          {isProgramAddress && !isSP && !isStackData && !isInterruptVector && (
            <span className="absolute top-0 left-0 text-blue-400 text-xs" title="Instrucción" style={{lineHeight:1}}>
              📘
            </span>
          )}
          {isDataAddress && !isSP && !isStackData && !isProgramAddress && !isInterruptVector && (
            <span className="absolute top-0 left-0 text-green-400 text-xs" title="Dato" style={{lineHeight:1}}>
              📦
            </span>
          )}
          {value.toString("hex")}
          {isIP && (
            <span
              className="absolute top-0 right-0 text-red-500 text-xs"
              title="IP"
              style={{ lineHeight: 1 }}
            >
              ▲
            </span>
          )}
          {isSP && (
            <span
              className="absolute top-0 left-0 text-yellow-500 text-xs"
              title="SP"
              style={{ lineHeight: 1 }}
            >
              ▲
            </span>
          )}
        </animated.div>
      </PopoverTrigger>

      <PopoverContent className="w-60">
      <p className="px-4 py-2 font-medium text-white">
        {title}{" "}
        {label ? (
          <span className="text-mantis-400 font-bold">
            ({label})
            {length !== null && length !== "" && (
              <span className="text-white text-xs font-normal"> Bytes: {length}</span>
            )}
          </span>
        ) : (
          ""
        )}
      </p>
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