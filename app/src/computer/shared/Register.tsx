import clsx from "clsx";
import { useAtomValue } from "jotai";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/Popover";
import { animated, getSpring, RegisterKey } from "@/computer/shared/springs";
import type { AnyByteAtom } from "@/computer/shared/types";
import { useTranslate } from "@/lib/i18n";

export function Register({
  name,
  title,
  valueAtom,
  springs,
  emphasis = false,
  className,
}: {
  name: string;
  title?: string;
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
  const displayName = nameMapping[name] || name;

  // Estilo alternativo profesional para AL, BL, CL y DL usando la paleta del simulador
  const isGeneralPurpose = ["AX", "BX", "CX", "DX"].includes(name);

  // Estilo distintivo para FLAGS, acorde al simulador
  const isFlags = displayName === "FLAGS";

  return (
    <Popover>
      <PopoverTrigger asChild>
        <animated.button
          title={displayName !== "left" && displayName !== "right" ? `Registro ${displayName}` : displayName}
          className={clsx(
            "flex w-min cursor-pointer items-center font-mono leading-none transition-opacity",
            isGeneralPurpose
              ? "border-mantis-500 ring-mantis-300 min-h-[28px] min-w-[68px] rounded-lg border-2 bg-stone-900/90 px-1.5 py-0.5 shadow-[0_2px_8px_0_rgba(60,180,120,0.10)] ring-1"
              : isFlags
              ? "min-h-[32px] min-w-[90px] gap-2 rounded border-2 border-yellow-400 bg-gradient-to-br from-yellow-900 via-yellow-800 to-stone-900 px-2.5 py-0.5 font-bold text-yellow-200 shadow-[0_2px_8px_0_rgba(250,204,21,0.10)]"
              : "rounded-md border bg-stone-800 px-2 py-1",
            isGeneralPurpose
              ? "text-mantis-300 font-bold"
              : isFlags
              ? ""
              : emphasis
              ? "border-mantis-400 text-lg"
              : "border-stone-600 text-base",
            className,
          )}
          style={displayName === "left" || displayName === "right" ? { backgroundColor: "transparent" } : getSpring(springs)}
        >
          <span
            className={clsx(
              "mr-2 font-extrabold tracking-wide",
              isGeneralPurpose && "text-mantis-300 drop-shadow",
              isFlags && "text-yellow-200"
            )}
          >
            {displayName}
          </span>
          <span className={clsx(
            "rounded px-1 py-0.5 font-light",
            isGeneralPurpose
              ? "bg-mantis-900 text-mantis-200 border-mantis-400 border"
              : isFlags
              ? "border border-yellow-400 bg-yellow-950 text-yellow-200"
              : "bg-stone-900"
          )}>
            {low.toString("hex")}
          </span>
          {isFlags && (
            <span className="flex gap-1 ml-2">
              <span className={clsx(
                "px-1 text-xs font-bold rounded border",
                (Number(low) & 0b10) ? "border-yellow-300 bg-yellow-400 text-yellow-950" : "border-yellow-700 bg-stone-800 text-yellow-300"
              )}>Z</span>
              <span className={clsx(
                "px-1 text-xs font-bold rounded border",
                (Number(low) & 0b01) ? "border-yellow-300 bg-yellow-400 text-yellow-950" : "border-yellow-700 bg-stone-800 text-yellow-300"
              )}>C</span>
            </span>
          )}
        </animated.button>
      </PopoverTrigger>

      <PopoverContent className="w-60">
        <p className="px-4 py-2 font-medium text-white">
          {displayName !== "left" && displayName !== "right" ? `Registro ${displayName}` : displayName}
        </p>
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
