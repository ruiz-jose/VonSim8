import clsx from "clsx";
import { useAtomValue } from "jotai";

import { EducationalTooltip } from "@/components/EducationalTooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/Popover";
import { animated, getSpring, RegisterKey } from "@/computer/shared/springs";
import type { AnyByteAtom } from "@/computer/shared/types";
import { useTranslate } from "@/lib/i18n";

export function Register({
  name,
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

  return (
    <Popover>
      <PopoverTrigger asChild>
        <animated.button
          title={
            displayName !== "left" && displayName !== "right" && displayName !== "result"
              ? `Registro ${displayName}`
              : displayName
          }
          className={clsx(
            "flex cursor-pointer items-center font-mono leading-none transition-opacity",
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
          {isGeneralPurpose || isSP || isMBR || isMAR || isIR || isTemporal ? (
            // Formato tipo celda de memoria para registros generales, SP, MBR, MAR, IR, id y ri
            <>
              <span
                className={clsx(
                  isGeneralPurpose ? "mt-4" : isIR || isMAR || isMBR ? "mt-4" : "mt-2",
                  "font-mono text-base font-bold",
                )}
              >
                {low.toString("hex")}
              </span>
            </>
          ) : isIP ? (
            // IP: nombre y valor juntos
            <>
              <span className={clsx("mt-2 font-mono text-base font-bold text-red-300")}>
                {low.toString("hex")}
              </span>
            </>
          ) : displayName === "left" || displayName === "right" || displayName === "result" ? (
            // Formato especial para left, right y result - estilo similar a los textos de los buses
            <span
              className="ml-12 font-mono text-xs font-bold"
              style={{
                color:
                  displayName === "left"
                    ? "#34D399"
                    : displayName === "right"
                      ? "#60A5FA"
                      : "#F59E0B",
                fontSize: "12px",
                fontWeight: "bold",
                textShadow:
                  displayName === "left"
                    ? "0 0 8px rgba(52, 211, 153, 0.6)"
                    : displayName === "right"
                      ? "0 0 8px rgba(96, 165, 250, 0.6)"
                      : "0 0 8px rgba(245, 158, 11, 0.6)",
              }}
            >
              {low.toString("hex")}
            </span>
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
