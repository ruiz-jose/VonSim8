import clsx from "clsx";
import { useAtomValue } from "jotai";

import { EducationalTooltip } from "@/components/EducationalTooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/Popover";
import { animated, getSpring, RegisterKey } from "@/computer/shared/springs";
import type { AnyByteAtom } from "@/computer/shared/types";
import { useChangeHighlight } from "@/hooks/useChangeHighlight";
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
  const changed = useChangeHighlight(Number(low));

  // Cambio aquí: Mapeo de nombres de registros a su versión de parte baja
  const nameMapping: Record<string, string> = {
    AX: "AL",
    BX: "BL",
    CX: "CL",
    DX: "DL",
  };
  const displayName = nameMapping[name] || name;

  // Estilo alternativo profesional para AL, BL, CL, DL, IP, SP, MBR, MAR, IR, id y ri
  const isGeneralPurpose = ["AL", "BL", "CL", "DL"].includes(name);
  const isIP = name === "IP";
  const isSP = name === "SP";
  const isMBR = name === "MBR";
  const isMAR = name === "MAR";
  const isIR = name === "IR";
  const isTemporal = ["id", "ri"].includes(name);

  // Estilo distintivo para FLAGS, acorde al simulador
  const isFlags = displayName === "FLAGS";

  // Registros internos de la ALU cuyo valor se muestra en el bus, no en la caja
  const isHiddenValue =
    displayName === "left" || displayName === "right" || displayName === "result";

  return (
    <Popover>
      <div className="relative">
        {title && (
          <span className="absolute -left-1 -top-3 z-30 rounded bg-mantis-700 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-md">
            {title}
          </span>
        )}
        <PopoverTrigger asChild>
          <animated.button
            type="button"
            data-changed={changed && !isHiddenValue ? "true" : undefined}
            title={
              !isHiddenValue
                ? `Registro ${displayName}${changed ? " (cambió en el último paso)" : ""}`
                : displayName
            }
            aria-label={
              !isHiddenValue
                ? `Registro ${displayName}: ${low.toString("hex")}${changed ? ", cambió en el último paso" : ""}`
                : undefined
            }
            className={clsx(
              "flex cursor-pointer items-center font-mono leading-none transition-opacity",
              // Contenedor del indicador de cambio (si no viene ya posicionado)
              !className?.includes("absolute") && "relative",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mantis-300",
              changed &&
                !isHiddenValue &&
                "!shadow-[0_0_14px_4px_rgba(252,211,77,0.55)] ring ring-amber-300 ring-offset-2 ring-offset-stone-900",
              isGeneralPurpose || isIP || isSP || isMBR || isMAR || isIR || isTemporal
                ? "size-10 justify-center rounded border-2 text-lg font-bold shadow-[0_2px_8px_0_rgba(60,180,120,0.10)] transition-all duration-200 hover:scale-110 hover:shadow-xl"
                : isFlags
                  ? "min-h-[32px] min-w-[90px] gap-2 rounded border-2 border-yellow-400 bg-gradient-to-br from-yellow-900 via-yellow-800 to-stone-900 px-2.5 py-0.5 font-bold text-yellow-200 shadow-[0_2px_8px_0_rgba(250,204,21,0.10)]"
                  : "rounded-md border bg-stone-800 px-2 py-1",
              // Colores específicos para cada tipo
              isGeneralPurpose
                ? "border-mantis-500 bg-stone-800 text-mantis-300"
                : isIP
                  ? "border-red-500 bg-stone-800 text-red-300"
                  : isSP
                    ? "border-yellow-400 bg-stone-800 text-yellow-300"
                    : isMBR || isMAR || isIR
                      ? "border-indigo-400 bg-stone-800 text-indigo-300"
                      : isTemporal
                        ? "border-cyan-400 bg-stone-800 text-cyan-300"
                        : isFlags
                          ? ""
                          : emphasis
                            ? "border-mantis-400 text-lg"
                            : "border-stone-600 text-base",
              className,
            )}
            style={
              displayName === "left" || displayName === "right" || displayName === "result"
                ? { backgroundColor: "transparent" }
                : getSpring(springs)
            }
          >
            {changed && !isHiddenValue && (
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -right-2 -top-2 z-40 size-3.5 rounded-full border-2 border-stone-900 bg-amber-300"
              />
            )}
            {isGeneralPurpose || isSP || isMBR || isMAR || isIR || isTemporal ? (
              // Formato tipo celda de memoria para registros generales, SP, MBR, MAR, IR, id y ri
              <>
                <span
                  className={clsx(
                    isGeneralPurpose || isTemporal
                      ? "mt-4"
                      : isIR || isMAR || isMBR
                        ? "mt-4"
                        : "mt-2",
                    "font-mono text-base font-bold",
                  )}
                >
                  {low.toString("hex")}
                </span>
              </>
            ) : isIP ? (
              // IP: nombre y valor juntos
              <>
                <span className={clsx("mt-4 font-mono text-base font-bold text-red-300")}>
                  {low.toString("hex")}
                </span>
              </>
            ) : displayName === "left" ? (
              // Para el registro left, no mostrar el valor - será mostrado en el texto del bus
              <span className="opacity-0" />
            ) : displayName === "right" ? (
              // Para el registro right, no mostrar el valor - será mostrado en el texto del bus
              <span className="opacity-0" />
            ) : displayName === "result" ? (
              // Para el registro result, no mostrar el valor - será mostrado en el texto del bus
              <span className="opacity-0" />
            ) : (
              // Formato original para otros registros
              <>
                <span
                  className={clsx(
                    "mr-2 font-extrabold tracking-wide",
                    isGeneralPurpose && "text-mantis-300 drop-shadow",
                    isFlags && "text-yellow-200",
                    isTemporal && "text-cyan-300",
                    // Reducir tamaño para left y right
                    (displayName === "left" || displayName === "right") && "text-xs",
                    // Agregar margen superior cuando hay título para evitar solapamiento
                    title && "mt-2",
                  )}
                >
                  {displayName}
                </span>
                <span
                  className={clsx(
                    "rounded px-1 py-0.5 font-light",
                    isGeneralPurpose
                      ? "border border-mantis-400 bg-stone-950 text-mantis-300"
                      : isFlags
                        ? "border border-yellow-400 bg-yellow-950 text-yellow-200"
                        : isTemporal
                          ? "border border-cyan-400 bg-cyan-950 text-cyan-200"
                          : "border border-stone-600 bg-stone-900 text-white",
                  )}
                >
                  {low.toString("hex")}
                </span>
              </>
            )}
            {isFlags && (
              <span className="ml-2 flex gap-1">
                <span
                  className={clsx(
                    "rounded border px-1 text-xs font-bold",
                    Number(low) & 0b10
                      ? "border-yellow-300 bg-yellow-400 text-yellow-950"
                      : "border-yellow-700 bg-stone-800 text-yellow-300",
                  )}
                >
                  Z
                </span>
                <span
                  className={clsx(
                    "rounded border px-1 text-xs font-bold",
                    Number(low) & 0b01
                      ? "border-yellow-300 bg-yellow-400 text-yellow-950"
                      : "border-yellow-700 bg-stone-800 text-yellow-300",
                  )}
                >
                  C
                </span>
              </span>
            )}
          </animated.button>
        </PopoverTrigger>
      </div>

      <PopoverContent className="w-60">
        <div className="px-4 py-2">
          <div className="flex items-center justify-between">
            <p className="font-medium text-white">
              {displayName !== "left" && displayName !== "right" && displayName !== "result"
                ? `Registro ${displayName}`
                : displayName}
            </p>
            {displayName !== "left" && displayName !== "right" && displayName !== "result" && (
              <EducationalTooltip concept="register" level="beginner">
                <span className="text-xs text-mantis-400">💡</span>
              </EducationalTooltip>
            )}
          </div>
        </div>
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
