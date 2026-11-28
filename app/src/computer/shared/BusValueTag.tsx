import { to } from "@react-spring/web";
import { useAtomValue } from "jotai";
import { useRef } from "react";

import { useSettings } from "@/lib/settings";

import { type BusKey, busValueAtoms } from "./bus-values";
import { animated, getSpring } from "./springs";

const tones = {
  data: { fill: "#14532d", stroke: "#4ade80", text: "#dcfce7" }, // verde, como el bus de datos
  address: { fill: "#1e3a8a", stroke: "#60a5fa", text: "#dbeafe" }, // azul, como el bus de direcciones
} as const;

/**
 * Etiqueta con el valor que viaja por un bus. Se dibuja dentro del mismo
 * `<svg>` que el bus y acompaña a la punta de la animación, desde el
 * registro de origen hasta el destino.
 */
export function BusValueTag({ bus }: { bus: BusKey }) {
  const [settings] = useSettings();
  const value = useAtomValue(busValueAtoms[bus]);
  const { path, strokeDashoffset, opacity } = getSpring(bus);
  // Path invisible para medir el recorrido (no se le pasa `d` desde React)
  const measureRef = useRef<SVGPathElement>(null);

  if (!settings.showBusValues || !settings.animations || !value) return null;

  const tone = bus.endsWith("address") ? tones.address : tones.data;
  const width = Math.max(30, value.text.length * 8 + 10);
  const height = 18;

  const transform = to([path, strokeDashoffset], (d, offset) => {
    const el = measureRef.current;
    if (!el || !d) return "translate(-1000 -1000)";
    if (el.getAttribute("d") !== d) el.setAttribute("d", d);
    try {
      const length = el.getTotalLength();
      const progress = Math.min(1, Math.max(0, 1 - offset));
      const point = el.getPointAtLength(length * progress);
      return `translate(${point.x} ${point.y})`;
    } catch {
      return "translate(-1000 -1000)";
    }
  });

  // Ocultar si el bus ya está mostrando otro recorrido
  const tagOpacity = to([path, opacity], (d, o) => (d === value.path ? o : 0));

  return (
    <g aria-hidden="true" className="pointer-events-none">
      <path ref={measureRef} fill="none" stroke="none" />
      <animated.g transform={transform} opacity={tagOpacity}>
        <rect
          x={-width / 2}
          y={-height / 2}
          width={width}
          height={height}
          rx={5}
          fill={tone.fill}
          stroke={tone.stroke}
          strokeWidth={1.5}
          style={{ filter: `drop-shadow(0 0 4px ${tone.stroke})` }}
        />
        <text
          x={0}
          y={1}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={tone.text}
          className="font-mono"
          fontSize={12}
          fontWeight={700}
        >
          {value.text}
        </text>
      </animated.g>
    </g>
  );
}
