import { MemoryAddress } from "@vonsim/common/address";
import type { Byte } from "@vonsim/common/byte";
import clsx from "clsx";
import { useAtomValue } from "jotai";
import { useEffect, useRef, useState } from "react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/Popover";
import {
  hasINTInstructionAtom,
  mayUsePICAtom,
  registerAtoms,
  showSPAtom,
} from "@/computer/cpu/state";
import { dataAddressesAtom, programAddressesAtom } from "@/computer/memory/state";
import { animated, getSpring } from "@/computer/shared/springs";
import { useTranslate } from "@/lib/i18n";

import { memoryShownAtom, operatingAddressAtom, writtenAddressesAtom } from "./state";

export function Memory() {
  const translate = useTranslate();

  const memory = useAtomValue(memoryShownAtom);
  const ip = useAtomValue(registerAtoms.IP);
  const programAddresses = useAtomValue(programAddressesAtom);
  const dataAddresses = useAtomValue(dataAddressesAtom);
  const sp = useAtomValue(registerAtoms.SP);
  const showSP = useAtomValue(showSPAtom);
  const hasINT = useAtomValue(hasINTInstructionAtom);
  const mayUsePIC = useAtomValue(mayUsePICAtom);
  const writtenAddresses = useAtomValue(writtenAddressesAtom);

  // Determinar si se debe mostrar el vector de interrupciones
  // Solo mostrar si hay instrucciones INT o si el programa usa PIC
  const showInterruptVector = hasINT || mayUsePIC;

  // Nueva condición: no renderizar celdas si la memoria está vacía
  const isMemoryEmpty = memory.length === 0;

  if (isMemoryEmpty) {
    return null; // No renderizar nada si la memoria está vacía
  }

  const renderMemoryRows = () => {
    const rows = [];
    for (let i = 0; i < 256; i += 16) {
      const row = memory.slice(i, i + 16);
      rows.push(row);
    }
    return rows;
  };

  const COLUMNS = 16;
  const ipRow = Math.floor(Number(ip.valueOf()) / COLUMNS);
  const ipCol = Number(ip.valueOf()) % COLUMNS;

  return (
    <div
      className="absolute left-[800px] top-[-160px] z-10 size-auto rounded-lg border border-stone-600 bg-stone-900 shadow-2xl [&_*]:z-20"
      data-testid="memory-component"
    >
      <span className="block w-min rounded-br-lg rounded-tl-lg border-b border-r border-stone-600 bg-mantis-500 px-2 py-1 text-3xl text-white shadow">
        {translate("computer.memory.name")}
      </span>

      <div className="m-4 overflow-x-auto">
        <table className="mx-auto w-auto min-w-[600px] border-separate text-center font-mono text-base">
          <thead>
            <tr>
              <th></th>
              {Array.from({ length: 16 }).map((_, index) => (
                <th
                  key={index}
                  className={clsx(
                    "relative size-10 border border-gray-500 bg-mantis-500",
                    index % 4 === 0 && index !== 0 ? "border-l-4 border-mantis-600" : "",
                  )}
                >
                  <span className="inline-flex items-center">
                    {index.toString(16).toUpperCase()}
                    {/* Flecha en columna donde apunta IP */}
                    {index === ipCol && (
                      <span className="ml-0.5 align-middle text-xs text-red-500">↓</span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {renderMemoryRows().map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className={
                  rowIndex % 4 === 0 && rowIndex !== 0 ? "border-t-4 border-mantis-600" : ""
                }
              >
                <th className="relative size-10 border border-gray-500 bg-mantis-500">
                  <span className="inline-flex items-center">
                    {rowIndex.toString(16).toUpperCase()}
                    {/* Flecha en fila donde apunta IP */}
                    {rowIndex === ipRow && (
                      <span className="ml-0.5 align-middle text-xs text-red-500">→</span>
                    )}
                  </span>
                </th>
                {row.map((cell, cellIndex) => (
                  <td
                    key={cellIndex}
                    className={clsx(
                      "size-10 border border-gray-500 p-0 transition-shadow duration-200",
                      cellIndex % 4 === 0 && cellIndex !== 0 ? "border-l-4 border-mantis-600" : "",
                    )}
                  >
                    <MemoryCell
                      address={cell.address}
                      value={cell.value}
                      isIP={cell.address.valueOf() === ip.valueOf()}
                      isSP={showSP && cell.address.valueOf() === sp.valueOf()}
                      isStackData={showSP && cell.address.valueOf() > sp.valueOf()}
                      isProgramAddress={
                        !!programAddresses.find(entry => entry.address === cell.address.value)
                      }
                      isDataAddress={
                        !!dataAddresses.find(entry => entry.address === cell.address.value)
                      }
                      isInterruptVector={
                        showInterruptVector &&
                        cell.address.valueOf() >= 0 &&
                        cell.address.valueOf() <= 7
                      }
                      isWritten={writtenAddresses.has(cell.address.valueOf())}
                      label={
                        programAddresses.find(entry => entry.address === cell.address.value)
                          ?.name ||
                        dataAddresses.find(entry => entry.address === cell.address.value)?.label ||
                        null
                      }
                      length={
                        programAddresses.find(entry => entry.address === cell.address.value)
                          ?.length ?? null
                      }
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
  isStackData,
  isProgramAddress,
  isDataAddress,
  isInterruptVector,
  isWritten,
  label,
  length,
}: {
  address: MemoryAddress;
  value: Byte<8>;
  isIP: boolean;
  isSP?: boolean;
  isStackData?: boolean;
  isProgramAddress: boolean;
  isDataAddress: boolean;
  isInterruptVector?: boolean;
  isWritten?: boolean;
  label: string | null;
  length: string | null;
}) {
  const translate = useTranslate();
  const operatingAddress = useAtomValue(operatingAddressAtom);

  // Animación de destello al actualizar valor
  const [flash, setFlash] = useState(false);
  const prevValue = useRef(value);
  useEffect(() => {
    if (prevValue.current !== value) {
      setFlash(true);
      setTimeout(() => setFlash(false), 300);
      prevValue.current = value;
    }
  }, [value]);

  const title = translate("computer.memory.cell", address);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <animated.div
          title={title}
          className={clsx(
            "relative flex size-10 cursor-pointer select-none items-center justify-center border font-mono text-base transition-all duration-200",
            // Colores de fondo y borde según tipo
            isIP
              ? "z-10 shadow-lg shadow-red-500/50 outline outline-2 outline-red-500 ring-2 ring-red-500 ring-offset-2"
              : isSP
                ? "z-10 shadow-lg shadow-yellow-400/50 outline outline-2 outline-yellow-400 ring-2 ring-yellow-400 ring-offset-2"
                : "",
            // Cambiar fondos de colores sólidos por fondo oscuro consistente
            "bg-stone-800",
            // Subrayado para celdas escritas recientemente
            isWritten ? "underline decoration-red-400 decoration-2 underline-offset-1" : "",
            isInterruptVector && !isSP && !isStackData ? "border-l-4 border-orange-500" : "",
            isProgramAddress && !isSP && !isStackData && !isInterruptVector
              ? "border-l-4 border-blue-500"
              : "",
            isDataAddress && !isSP && !isStackData && !isProgramAddress && !isInterruptVector
              ? "border-l-4 border-green-500"
              : "",
            // Agregar bordes laterales para stack data y SP
            isStackData && !isSP ? "border-l-4 border-yellow-500" : "",
            isSP ? "border-l-4 border-yellow-400" : "",
            // Color de texto consistente
            "text-stone-100",
            // Hover y animación de destello
            "hover:z-20 hover:scale-110 hover:shadow-xl",
            flash && "animate-pulse",
          )}
          style={
            address.value === operatingAddress.value
              ? getSpring("memory.operating-cell")
              : undefined
          }
        >
          {/* Iconos para instrucciones, datos y vector de interrupciones */}
          {isInterruptVector && !isSP && !isStackData && (
            <span
              className="pointer-events-none absolute left-0.5 top-0.5 rounded bg-stone-900/80 px-0.5 text-[10px] text-orange-400"
              title="Vector de interrupción"
              style={{ lineHeight: 1 }}
            >
              ⚡
            </span>
          )}
          {isProgramAddress && !isSP && !isStackData && !isInterruptVector && (
            <span
              className="pointer-events-none absolute left-0.5 top-0.5 rounded bg-stone-900/80 px-0.5 text-[10px] text-blue-400"
              title="Instrucción"
              style={{ lineHeight: 1 }}
            >
              📘
            </span>
          )}
          {isDataAddress && !isSP && !isStackData && !isProgramAddress && !isInterruptVector && (
            <span
              className="pointer-events-none absolute left-0.5 top-0.5 rounded bg-stone-900/80 px-0.5 text-[10px] text-green-400"
              title="Dato"
              style={{ lineHeight: 1 }}
            >
              📦
            </span>
          )}
          {/* Nuevo: Icono para datos de la pila */}
          {isStackData && !isSP && (
            <span
              className="pointer-events-none absolute left-0.5 top-0.5 rounded bg-stone-900/80 px-0.5 text-[10px] text-yellow-400"
              title="Dato de la pila"
              style={{ lineHeight: 1 }}
            >
              📚
            </span>
          )}
          {/* Nuevo: Icono para SP */}
          {isSP && (
            <span
              className="pointer-events-none absolute left-0.5 top-0.5 rounded bg-stone-900/80 px-0.5 text-[10px] text-yellow-300"
              title="Stack Pointer"
              style={{ lineHeight: 1 }}
            >
              📍
            </span>
          )}
          {/* Valor de la celda */}
          <span className="z-10 mt-3 block font-mono text-lg font-bold">
            {value.toString("hex")}
          </span>
          {isIP && (
            <span
              className="absolute right-0 top-0 text-xs text-red-500"
              title="IP"
              style={{ lineHeight: 1 }}
            >
              ▲
            </span>
          )}
          {isSP && (
            <span
              className="absolute right-0 top-0 text-xs text-yellow-500"
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
            <span className="font-bold text-mantis-400">
              ({label})
              {length !== null && length !== "" && (
                <span className="text-xs font-normal text-white"> Bytes: {length}</span>
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
