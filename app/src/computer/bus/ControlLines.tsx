import clsx from "clsx";

import { animated, getSpring, SimplePathKey } from "@/computer/shared/springs";
import { useSimulation } from "@/computer/simulation";
import { useTranslate } from "@/lib/i18n";
import { useAtomValue, useSetAtom } from "jotai";
import { showReadBusAnimationAtom } from "@/computer/bus/state";
import { DataFlowAnimation } from "@/computer/shared/DataFlowAnimation";
import { useState, useEffect } from "react";
import { showWriteBusAnimationAtom } from "@/computer/bus/state";

export function ControlLines() {
  const { devices } = useSimulation();
  const showReadAnim = useAtomValue(showReadBusAnimationAtom);
  const showWriteAnim = useAtomValue(showWriteBusAnimationAtom);

  const rdPath = [
    "M 380 420 H 800", // CPU -> Memory
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
      {showReadAnim && <ReadBusAnimation />}
      {showWriteAnim && <WriteBusAnimation />}
      <svg className="pointer-events-none absolute inset-0 z-[15] size-full">
        <path className="fill-none stroke-stone-900 stroke-[6px]" strokeLinejoin="round" d={rdPath} />
        <path className="fill-none stroke-stone-700 stroke-[4px]" strokeLinejoin="round" d={rdPath} />
        {/* Línea animada del bus RD - usando path dinámico del spring */}
        <animated.path
          d={rdPath_anim}
          className="fill-none stroke-red-500 stroke-[4px]"
          strokeLinejoin="round"
          pathLength={1}
          strokeDasharray={1}
          style={{
            strokeDashoffset: rdDashoffset,
            opacity: rdOpacity,
          }}
        />

        <path className="fill-none stroke-stone-900 stroke-[6px]" strokeLinejoin="round" d={wrPath} />
        <path className="fill-none stroke-stone-700 stroke-[4px]" strokeLinejoin="round" d={wrPath} />
        {/* Línea animada del bus WR - usando path dinámico del spring */}
        <animated.path
          d={wrPath_anim}
          className="fill-none stroke-blue-500 stroke-[4px]"
          strokeLinejoin="round"
          pathLength={1}
          strokeDasharray={1}
          style={{
            strokeDashoffset: wrDashoffset,
            opacity: wrOpacity,
          }}
        />

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
        {devices.pic && devices.timer && <ControlLine springs="bus.int1" d="M 475 955 H 400 V 900" />}
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
      <path className="fill-none stroke-stone-700 stroke-[4px]" strokeLinejoin="round" d={d} />
      <animated.path
        d={d}
        className="fill-none stroke-red-500 stroke-[4px]"
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
      <ControlLineLegend className="left-[384px] top-[403px]">rd</ControlLineLegend>
      <ControlLineLegend className="left-[384px] top-[423px]">wr</ControlLineLegend>
      {devices.hasIOBus && (
        <>
          <ControlLineLegend className="left-[384px] top-[443px]">io/m</ControlLineLegend>
          <ControlLineLegend className="left-[715px] top-[538px]">
            {translate("computer.chip-select.mem")}
          </ControlLineLegend>
        </>
      )}

      {devices.pic && (
        <ControlLineLegend className="left-[510px] top-[573px]">
          {translate("computer.chip-select.pic")}
        </ControlLineLegend>
      )}
      {devices.timer && (
        <ControlLineLegend className="left-[545px] top-[573px]">
          {translate("computer.chip-select.timer")}
        </ControlLineLegend>
      )}
      {devices.pio && (
        <ControlLineLegend className="left-[600px] top-[573px]">
          {translate("computer.chip-select.pio")}
        </ControlLineLegend>
      )}
      {devices.handshake && (
        <ControlLineLegend className="left-[675px] top-[573px]">
          {translate("computer.chip-select.handshake")}
        </ControlLineLegend>
      )}

      {devices.pic && (
        <>
          <ControlLineLegend className="left-[75px] top-[478px]">intr</ControlLineLegend>
          <ControlLineLegend className="left-[125px] top-[478px]">inta</ControlLineLegend>
        </>
      )}

      {devices.printer && (
        <>
          <ControlLineLegend className="left-[1310px] top-[983px]">strobe</ControlLineLegend>
          <ControlLineLegend className="left-[1310px] top-[998px]">busy</ControlLineLegend>
          <ControlLineLegend className="left-[1310px] top-[1053px]">data</ControlLineLegend>
        </>
      )}
    </>
  );
}

function ControlLineLegend({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <span
      className={clsx(
        "pointer-events-none absolute z-[15] block font-mono text-xs font-bold tracking-wider text-stone-400",
        className,
      )}
    >
      {children}
    </span>
  );
}

// Animación de texto 'Read' de izquierda a derecha sobre el bus de control
function ReadBusAnimation() {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(true);
  const setShowReadAnim = useSetAtom(showReadBusAnimationAtom);
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
        setTimeout(() => setShowReadAnim(false), 100); // Desactiva el átomo tras la animación
      }
    }
    animate();
    return () => cancelAnimationFrame(frame);
  }, [setShowReadAnim]);
  if (!visible) return null;
  // Coordenadas del bus de control RD: de 380 420 a 800 420
  const fromX = 380, toX = 800, y = 420;
  const x = fromX + (toX - fromX) * progress;
  return (
    <div
      className="pointer-events-none absolute z-[100] font-extrabold text-xs select-none"
      style={{
        left: x,
        top: y - 32,
        color: '#ef4444', // rojo tailwind-500
        textShadow: '0 0 4px #000, 0 0 2px #000',
        background: 'rgba(0,0,0,0.2)',
        padding: '2px 8px',
        borderRadius: '6px',
        transition: 'left 0.1s linear, top 0.1s linear',
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
  const fromX = 380, toX = 800, y = 440;
  const x = fromX + (toX - fromX) * progress;
  return (
    <div
      className="pointer-events-none absolute z-[100] font-extrabold text-xs select-none"
      style={{
        left: x,
        top: y - 32,
        color: '#f59e42', // naranja tailwind-400
        textShadow: '0 0 4px #000, 0 0 2px #000',
        background: 'rgba(0,0,0,0.2)',
        padding: '2px 8px',
        borderRadius: '6px',
        transition: 'left 0.1s linear, top 0.1s linear',
        opacity: visible ? 1 : 0,
      }}
    >
      Write
    </div>
  );
}
