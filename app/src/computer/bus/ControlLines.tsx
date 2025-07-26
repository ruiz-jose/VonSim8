import { useAtomValue, useSetAtom } from "jotai";
import { useEffect, useRef, useState } from "react";

import { showReadBusAnimationAtom, showWriteBusAnimationAtom } from "@/computer/bus/state";
import { animated, getSpring, SimplePathKey } from "@/computer/shared/springs";
import { useSimulation } from "@/computer/simulation";
import { useTranslate } from "@/lib/i18n";

export function ControlLines() {
  const { devices } = useSimulation();
  const showReadAnim = useAtomValue(showReadBusAnimationAtom);
  const showWriteAnim = useAtomValue(showWriteBusAnimationAtom);

  // Ref para el path SVG del bus RD
  const rdPathRef = useRef<SVGPathElement>(null);
  // Ref para el path animado del bus RD
  const rdAnimatedPathRef = useRef<SVGPathElement>(null);

  const rdPath = [
    "M 380 420 H 800", // CPU -> Memory (recto)
    devices.pic && "M 780 420 V 805 H 450",
    devices.pio && "M 780 420 V 805 H 900",
    devices.timer && "M 780 420 V 805 H 583 V 875",
    devices.handshake && "M 780 420 V 1015 H 900",
  ]
    .filter(Boolean)
    .join(" ");

  const wrPath = [
    "M 380 440 H 800", // CPU -> Memory
    devices.pic && "M 790 440 V 815 H 450",
    devices.pio && "M 790 440 V 815 H 900",
    devices.timer && "M 790 440 V 815 H 573 V 875",
    devices.handshake && "M 790 440 V 1025 H 900",
  ]
    .filter(Boolean)
    .join(" ");

  const memPath = "M 750 545 H 800";

  // Obtener las propiedades de animación de los buses de control
  const {
    path: rdPath_anim,
    strokeDashoffset: rdDashoffset,
    opacity: rdOpacity,
  } = getSpring("bus.rd");
  const {
    path: wrPath_anim,
    strokeDashoffset: wrDashoffset,
    opacity: wrOpacity,
  } = getSpring("bus.wr");

  return (
    <>
      {showReadAnim && (
        <ReadBusAnimation pathRef={rdAnimatedPathRef} progressSpring={rdDashoffset} />
      )}
      {showWriteAnim && <WriteBusAnimation />}
      <svg className="pointer-events-none absolute inset-0 z-[15] size-full">
        <path
          ref={rdPathRef}
          className="fill-none stroke-stone-900 stroke-[6px]"
          strokeLinejoin="round"
          d={rdPath}
        />
        <path
          className="fill-none stroke-stone-700 stroke-[4px]"
          strokeLinejoin="round"
          d={rdPath}
        />
        {/* Línea animada del bus RD - usando path dinámico del spring */}
        {showReadAnim && (
          <animated.path
            ref={rdAnimatedPathRef}
            d={rdPath_anim}
            className="fill-none stroke-red-500 stroke-[3px] drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]"
            strokeLinejoin="round"
            pathLength={1}
            strokeDasharray={1}
            style={{
              strokeDashoffset: rdDashoffset,
              opacity: rdOpacity,
            }}
          />
        )}
        {/* Efecto de brillo adicional para el bus RD */}
        {showReadAnim && (
          <animated.path
            d={rdPath_anim}
            className="fill-none stroke-red-300 stroke-1 opacity-50"
            strokeLinejoin="round"
            pathLength={1}
            strokeDasharray={1}
            style={{
              strokeDashoffset: rdDashoffset,
              opacity: rdOpacity,
            }}
          />
        )}

        <path
          className="fill-none stroke-stone-900 stroke-[6px]"
          strokeLinejoin="round"
          d={wrPath}
        />
        <path
          className="fill-none stroke-stone-700 stroke-[4px]"
          strokeLinejoin="round"
          d={wrPath}
        />
        {/* Línea animada del bus WR - usando path dinámico del spring */}
        {showWriteAnim && (
          <animated.path
            d={wrPath_anim}
            className="fill-none stroke-orange-400 stroke-[3px] drop-shadow-[0_0_8px_rgba(251,146,60,0.6)]"
            strokeLinejoin="round"
            pathLength={1}
            strokeDasharray={1}
            style={{
              strokeDashoffset: wrDashoffset,
              opacity: wrOpacity,
            }}
          />
        )}
        {/* Efecto de brillo adicional para el bus WR */}
        {showWriteAnim && (
          <animated.path
            d={wrPath_anim}
            className="fill-none stroke-orange-300 stroke-1 opacity-50"
            strokeLinejoin="round"
            pathLength={1}
            strokeDasharray={1}
            style={{
              strokeDashoffset: wrDashoffset,
              opacity: wrOpacity,
            }}
          />
        )}

        {/* Chip select */}

        {devices.hasIOBus && (
          <>
            <ControlLine springs="bus.iom" d="M 380 460 H 675 V 525" />

            <path
              className="fill-none stroke-stone-900 stroke-[6px]"
              strokeLinejoin="round"
              d={memPath}
            />
            <animated.path
              className="fill-none stroke-[4px]"
              strokeLinejoin="round"
              d={memPath}
              style={getSpring("bus.mem")}
            />
          </>
        )}

        {devices.pic && <ControlLine springs="bus.pic" d="M 521 595 V 730 H 450" />}
        {devices.timer && <ControlLine springs="bus.timer" d="M 563 595 V 875" />}
        {devices.pio && <ControlLine springs="bus.pio" d="M 612 595 V 730 H 900" />}
        {devices.handshake && <ControlLine springs="bus.handshake" d="M 710 595 V 950 H 900" />}

        {/* CPU/PIC */}

        {devices.pic && (
          <>
            <ControlLine springs="bus.intr" d="M 110 700 V 470" />
            <ControlLine springs="bus.inta" d="M 160 470 V 700" />
          </>
        )}

        {/* Interrupt lines */}

        {devices.pic && devices.f10 && <ControlLine springs="bus.int0" d="M 145 950 V 900" />}
        {devices.pic && devices.timer && (
          <ControlLine springs="bus.int1" d="M 475 955 H 400 V 900" />
        )}
        {devices.pic && devices.handshake && (
          <ControlLine springs="bus.int2" d="M 900 1075 H 300 V 900" />
        )}

        {/* Other devices */}

        {devices.pio === "switches-and-leds" && (
          <>
            <ControlLine springs="bus.switches->pio" d="M 1300 758 H 1120" />
            <ControlLine springs="bus.pio->leds" d="M 1120 868 H 1300" />
          </>
        )}

        {devices.pio === "printer" && (
          <>
            <ControlLine springs="bus.printer.strobe" d="M 1120 770 H 1225 V 992 H 1300" />
            <ControlLine springs="bus.printer.busy" d="M 1300 1007 H 1210 V 782 H 1120" />
            <ControlLine springs="bus.printer.data" d="M 1120 850 H 1175 V 1062 H 1300" />
          </>
        )}

        {devices.handshake === "printer" && (
          <>
            <ControlLine springs="bus.printer.strobe" d="M 1120 992 H 1300" />
            <ControlLine springs="bus.printer.busy" d="M 1300 1007 H 1120" />
            <ControlLine springs="bus.printer.data" d="M 1120 1062 H 1300" />
          </>
        )}
      </svg>
    </>
  );
}

function ControlLine({ d, springs }: { d: string; springs: SimplePathKey }) {
  return (
    <>
      <path className="fill-none stroke-stone-900 stroke-[6px]" strokeLinejoin="round" d={d} />
      <path className="fill-none stroke-stone-700 stroke-[3px]" strokeLinejoin="round" d={d} />
      <animated.path
        d={d}
        className="fill-none stroke-red-500 stroke-[3px] drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]"
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray={1}
        style={getSpring(springs)}
      />
      {/* Efecto de brillo adicional para las líneas de control */}
      <animated.path
        d={d}
        className="fill-none stroke-red-300 stroke-1 opacity-50"
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray={1}
        style={getSpring(springs)}
      />
    </>
  );
}

/**
 * Legends are not inside the SVG as `<text>` elements because of a bug
 * in Chrome that causes these text to render in another position when
 * zooming in/out. Maybe related to this https://bugs.webkit.org/show_bug.cgi?id=202588
 */
export function ControlLinesLegends() {
  const translate = useTranslate();
  const { devices } = useSimulation();

  return (
    <>
      {/* rd al lado de la unidad de control y justo arriba del bus RD */}
      <ControlLineLegend style={{ left: 385, top: 405 }}>rd</ControlLineLegend>
      {/* wr al lado de la unidad de control y justo arriba del bus WR */}
      <ControlLineLegend style={{ left: 385, top: 425 }}>wr</ControlLineLegend>
      {devices.hasIOBus && (
        <>
          <ControlLineLegend>io/m</ControlLineLegend>
          <ControlLineLegend>{translate("computer.chip-select.mem")}</ControlLineLegend>
        </>
      )}

      {devices.pic && (
        <ControlLineLegend>{translate("computer.chip-select.pic")}</ControlLineLegend>
      )}
      {devices.timer && (
        <ControlLineLegend>{translate("computer.chip-select.timer")}</ControlLineLegend>
      )}
      {devices.pio && (
        <ControlLineLegend>{translate("computer.chip-select.pio")}</ControlLineLegend>
      )}
      {devices.handshake && (
        <ControlLineLegend>{translate("computer.chip-select.handshake")}</ControlLineLegend>
      )}

      {devices.pic && (
        <>
          <ControlLineLegend>intr</ControlLineLegend>
          <ControlLineLegend>inta</ControlLineLegend>
        </>
      )}

      {devices.printer && (
        <>
          <ControlLineLegend>strobe</ControlLineLegend>
          <ControlLineLegend>busy</ControlLineLegend>
          <ControlLineLegend>data</ControlLineLegend>
        </>
      )}
    </>
  );
}

function ControlLineLegend({
  children,
  style,
}: {
  children?: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <span
      className="pointer-events-none absolute z-[15] block font-mono text-xs font-bold tracking-wider text-stone-400"
      style={style}
    >
      {children}
    </span>
  );
}

// Animación de texto 'Read' siguiendo exactamente la animación roja del bus de control
type ReadBusAnimationProps = {
  pathRef: React.RefObject<SVGPathElement>;
  progressSpring: any;
};
function ReadBusAnimation({ pathRef, progressSpring }: ReadBusAnimationProps) {
  const [visible, setVisible] = useState(true);
  const setShowReadAnim = useSetAtom(showReadBusAnimationAtom);
  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState(0);

  // Sincroniza el progreso con el valor actual del spring (que va de 1 a 0)
  useEffect(() => {
    if (!progressSpring || typeof progressSpring.get !== "function") return;
    let running = true;
    function update() {
      if (!running) return;
      const val = progressSpring.get();
      setProgress(1 - val);
      if (val > 0) requestAnimationFrame(update);
    }
    update();
    return () => {
      running = false;
    };
  }, [progressSpring]);

  useEffect(() => {
    // Esperar a que el path esté disponible
    if (!pathRef.current) {
      const timeout = setTimeout(() => setReady(r => !r), 10);
      return () => clearTimeout(timeout);
    }
    setReady(true);
  }, [pathRef]); // Eliminado pathRef.current del array de dependencias

  useEffect(() => {
    if (!ready) return;
    // Cuando el progreso llegue a 1, ocultar el texto
    if (progress >= 1) {
      setVisible(false);
      setTimeout(() => setShowReadAnim(false), 100);
    }
  }, [progress, ready, setShowReadAnim]);

  if (!visible || !ready) return null;
  // Usar getPointAtLength para seguir el path animado
  let x = 0,
    y = 0;
  if (pathRef.current) {
    const path = pathRef.current;
    const totalLength = path.getTotalLength();
    const point = path.getPointAtLength(progress * totalLength);
    x = point.x + 40; // Desplazamiento extra a la derecha
    y = point.y;
  } else {
    // Fallback: línea recta
    x = 380 + (800 - 380) * progress + 40;
    y = 420;
  }
  return (
    <div
      className="pointer-events-none absolute z-[100] select-none text-xs font-extrabold"
      style={{
        left: x,
        top: y - 32,
        color: "#ef4444",
        textShadow: "0 0 4px #000, 0 0 2px #000",
        background: "rgba(0,0,0,0.2)",
        padding: "2px 8px",
        borderRadius: "6px",
        transition: "left 0.1s linear, top 0.1s linear",
        opacity: visible ? 1 : 0,
      }}
    >
      Read
    </div>
  );
}

// Animación de texto 'Write' de izquierda a derecha sobre el bus de control WR
function WriteBusAnimation() {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(true);
  const setShowWriteAnim = useSetAtom(showWriteBusAnimationAtom);
  useEffect(() => {
    let frame: number;
    const duration = 2000;
    const start = Date.now();
    function animate() {
      const elapsed = Date.now() - start;
      const p = Math.min(elapsed / duration, 1);
      setProgress(p);
      if (p < 1) {
        frame = requestAnimationFrame(animate);
      } else {
        setVisible(false);
        setTimeout(() => setShowWriteAnim(false), 100);
      }
    }
    animate();
    return () => cancelAnimationFrame(frame);
  }, [setShowWriteAnim]);
  if (!visible) return null;
  // Coordenadas del bus de control WR: de 380 440 a 800 440
  const fromX = 380,
    toX = 800,
    y = 440;
  const x = fromX + (toX - fromX) * progress + 40;
  return (
    <div
      className="pointer-events-none absolute z-[100] select-none text-xs font-extrabold"
      style={{
        left: x,
        top: y + 12, // Debajo del bus
        color: "#f59e42", // naranja tailwind-400 (igual que la animación)
        textShadow: "0 0 4px #000, 0 0 2px #000",
        background: "rgba(0,0,0,0.2)",
        padding: "2px 8px",
        borderRadius: "6px",
        transition: "left 0.1s linear, top 0.1s linear",
        opacity: visible ? 1 : 0,
      }}
    >
      Write
    </div>
  );
}
