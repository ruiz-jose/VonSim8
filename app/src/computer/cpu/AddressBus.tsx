import type { MARRegister } from "@vonsim/simulator/cpu";

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

  const paths = [
    showSP ? "M 400 309 H 550 V 250" : "", // SP (ampliado desde la izquierda)
    "M 400 349 H 550 V 255", // IP (ampliado desde la izquierda)
    showri ? "M 420 388 H 550 V 300" : "", // ri (ampliado desde la izquierda)
    "M 400 349 H 659", // Connection to MAR (ampliado desde la izquierda)
  ];

  return (
    <svg viewBox="0 0 650 500" className="pointer-events-none absolute inset-0 z-30">
      {/* Primero los paths base (grises) */}
      {paths.map((d, index) => (
        <path
          key={index}
          className={`fill-none stroke-stone-700 stroke-bus`}
          strokeLinejoin="round"
          d={d}
        />
      ))}

      {/* Luego los paths animados (azules) para que queden arriba */}
      <animated.path
        d={path}
        className="fill-none stroke-[#3B82F6] stroke-[3px] drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]"
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray={1}
        style={style}
      />

      {/* Efecto de brillo adicional para el bus de direcciones */}
      <animated.path
        d={path}
        className="fill-none stroke-[#60A5FA] stroke-1 opacity-50"
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray={1}
        style={style}
      />
    </svg>
  );
}
