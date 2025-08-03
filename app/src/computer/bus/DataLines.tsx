import { animated, getSpring } from "@/computer/shared/springs";
import { useSimulation } from "@/computer/simulation";

export function DataLines() {
  const { devices } = useSimulation();

  const addressPath = [
    "M 610 349 H 800", // Extendido a la izquierda para llegar al registro MAR
    devices.pic && "M 725 349 V 770 H 450",
    devices.pio && "M 725 349 V 770 H 900",
    devices.timer && "M 725 349 V 770 H 618 V 875",
    devices.handshake && "M 725 349 V 980 H 900",
  ]
    .filter(Boolean)
    .join(" ");

  const dataPath = [
    "M 629 249 H 800", // CPU -> Memory - ajustado para conectar con el registro MBR redimensionado
    devices.pic && "M 765 249 V 790 H 450",
    devices.pio && "M 765 249 V 790 H 900",
    devices.timer && "M 765 249 V 790 H 598 V 875",
    devices.handshake && "M 765 249 V 1000 H 900",
  ]
    .filter(Boolean)
    .join(" ");

  // Obtener las propiedades de animación del bus de datos (similar al bus interno)
  const { path, strokeDashoffset, opacity } = getSpring("bus.data");

  // Obtener las propiedades de animación del bus de direcciones (igual que el bus interno)
  const {
    path: addressAnimPath,
    strokeDashoffset: addressStrokeDashoffset,
    opacity: addressOpacity,
  } = getSpring("bus.address");

  return (
    <svg className="pointer-events-none absolute inset-0 z-[5] size-full">
      {/* Data lines */}
      <path
        className="fill-none stroke-stone-700 stroke-bus"
        strokeLinejoin="round"
        d={dataPath}
      />
      {/* Línea animada del bus de datos - usando path dinámico del spring */}
      <animated.path
        d={path}
        className="fill-none stroke-mantis-400 stroke-[3px] drop-shadow-[0_0_8px_rgba(34,197,94,0.6)]"
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray={1}
        style={{
          strokeDashoffset,
          opacity,
        }}
      />
      {/* Efecto de brillo adicional para el bus de datos */}
      <animated.path
        d={path}
        className="fill-none stroke-mantis-300 stroke-1 opacity-50"
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray={1}
        style={{
          strokeDashoffset,
          opacity,
        }}
      />

      {/* Address lines */}
      <path
        className="fill-none stroke-stone-700 stroke-bus"
        strokeLinejoin="round"
        d={addressPath}
      />
      {/* Línea animada del bus de direcciones - usando path dinámico del spring */}
      <animated.path
        d={addressAnimPath}
        className="fill-none stroke-blue-400 stroke-[3px] drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]"
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray={1}
        style={{
          strokeDashoffset: addressStrokeDashoffset,
          opacity: addressOpacity,
        }}
      />
      {/* Efecto de brillo adicional para el bus de direcciones */}
      <animated.path
        d={addressAnimPath}
        className="fill-none stroke-blue-300 stroke-1 opacity-50"
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray={1}
        style={{
          strokeDashoffset: addressStrokeDashoffset,
          opacity: addressOpacity,
        }}
      />
    </svg>
  );
}
