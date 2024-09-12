import clsx from "clsx";
import { useAtomValue } from "jotai";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/Popover";
import { animated, getSpring, RegisterKey } from "@/computer/shared/springs";
import type { AnyByteAtom } from "@/computer/shared/types";
import { useTranslate } from "@/lib/i18n";

export function Register({
  name,
  //title,
  valueAtom,
  springs,
  emphasis = false,
  className,
}: {
  name: string;
  //title: string;
  valueAtom: AnyByteAtom;
  springs: RegisterKey;
  emphasis?: boolean;
  className?: string;
}) {
  const translate = useTranslate();

  const reg = useAtomValue(valueAtom);
  const low = reg.low;
  //const high = reg.is16bits() ? reg.high : null;

  // Cambio aquí: Mapeo de nombres de registros a su versión de parte baja
  const nameMapping: Record<string, string> = {
    AX: "AL",
    BX: "BL",
    CX: "CL",
    DX: "DL",
  };
  const displayName = nameMapping[name] || name; // Usa el mapeo si está disponible, de lo contrario usa el nombre original

  return (
    <Popover>
      <PopoverTrigger asChild>
        <animated.button
          title= {`Registro ${displayName}`}
          className={clsx(
            "flex w-min cursor-pointer items-center rounded-md border bg-stone-800 px-2 py-1 font-mono leading-none transition-opacity",
            emphasis ? "border-mantis-400 text-lg" : "border-stone-600 text-base",
            className,
          )}
          style={getSpring(springs)}
        >
          <span className="mr-2 font-bold">{displayName}</span>
          <span className="rounded bg-stone-900 p-0.5 font-light">{low.toString("hex")}</span>
        </animated.button>
      </PopoverTrigger>

      <PopoverContent className="w-60">
        <p className="px-4 py-2 font-medium text-white">Registro {displayName}</p>
        <hr className="border-stone-600" />
        <ul className="px-4 py-2 text-sm">
          {(["hex", "bin", "uint", "int", "safe-ascii"] as const).map(rep => (
            <li key={rep}>
              <b className="font-medium">{translate(`generics.byte-representation.${rep}`)}</b>:{" "}
              <span className="font-mono text-mantis-400">{reg.low.toString(rep)}</span>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
