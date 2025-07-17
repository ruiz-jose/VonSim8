import type { MARRegister } from "@vonsim/simulator/cpu";
import { useState } from "react";

import { animated, getSpring } from "@/computer/shared/springs";

export type { MARRegister as AddressRegister };

type AddressBusProps = {
  showSP: boolean;
  showri: boolean;
};

/**
 * Given an {@link MARRegister}, returns the shortest path between it
 * and the MAR register.
 * @returns The path as a SVG path.
 * @throws If there is the register isn't valid.
 */
export function generateAddressPath(
  from: MARRegister,
  showpath1?: boolean,
  showpath2?: boolean,
): string {
  let path = "";
  if (showpath1) {
    path = "M 470 388 H 550 V 349 H 659"; // ri - ajustado para conectar con MAR desde registro redimensionado
  }
  if (showpath2) {
    path = "M 629 250 H 550 V 349 H 659"; // mbr - ajustado para conectar con MAR
  }
  switch (from) {
    case "SP":
      return "M 451 309 H 550 V 349 H 659";

    case "IP":
      return "M 451 349 H 659";

    case "ri":
      return showpath1 || showpath2 ? path : "";

    default:
      throw new Error(`Invalid register ${from}`);
  }
}

/**
 * AddressBus component, to be used inside <CPU />
 */
export function AddressBus({ showSP, showri }: AddressBusProps) {
  const { path, ...style } = getSpring("cpu.internalBus.address");
  const [highlight] = useState(false);

  const paths = [
    showSP ? "M 451 309 H 550 V 250" : "", // SP
    "M 451 349 H 550 V 255", // IP
    showri ? "M 470 388 H 550 V 300" : "", // ri - ajustado para conectar con registro redimensionado
    "M 451 349 H 659", // Connection to MAR - ajustado
  ];

  return (
    <svg viewBox="0 0 650 500" className="pointer-events-none absolute inset-0">
      {paths.map((d, index) => (
        <path
          key={index}
          className={`fill-none stroke-bus ${highlight && d === "M 444 388 H 575 V 349" ? "stroke-mantis-400" : "stroke-stone-700"}`}
          strokeLinejoin="round"
          d={d}
        />
      ))}

      <animated.path
        d={path}
        className="fill-none stroke-mantis-400 stroke-[3px] drop-shadow-[0_0_8px_rgba(34,197,94,0.6)]"
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray={1}
        style={style}
      />

      {/* Efecto de brillo adicional para el bus de direcciones */}
      <animated.path
        d={path}
        className="fill-none stroke-mantis-300 stroke-1 opacity-50"
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray={1}
        style={style}
      />
    </svg>
  );
}
