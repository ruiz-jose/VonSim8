import { useAtomValue, useSetAtom } from "jotai";
import { useEffect, useRef, useState } from "react";

import { showReadBusAnimationAtom, showWriteBusAnimationAtom } from "@/computer/bus/state";
import { animated, getSpring, SimplePathKey } from "@/computer/shared/springs";
import { useSimulation } from "@/computer/simulation";
import { useTranslate } from "@/lib/i18n";
import { useSettings } from "@/lib/settings";

export function ControlLines() {
  const { devices } = useSimulation();
  const showReadAnim = useAtomValue(showReadBusAnimationAtom);
  const showWriteAnim = useAtomValue(showWriteBusAnimationAtom);

  // Ref para el path SVG del bus RD
  const rdPathRef = useRef<SVGPathElement>(null);
  // Ref para el path animado del bus RD
  const rdAnimatedPathRef = useRef<SVGPathElement>(null);
  // Ref para el path animado del bus WR
  const wrAnimatedPathRef = useRef<SVGPathElement>(null);

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
      {showReadAnim && <ReadBusAnimation pathRef={rdAnimatedPathRef} />}
      {showWriteAnim && <WriteBusAnimation pathRef={wrAnimatedPathRef} />}
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
            d={rdPath_anim || rdPath}
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
            d={rdPath_anim || rdPath}
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
            ref={wrAnimatedPathRef}
            d={wrPath_anim || wrPath}
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
            d={wrPath_anim || wrPath}
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

        
        {devices.pio && <ControlLine springs="bus.pio" d="M 612 595 V 730 H 900" />}
       

        {devices.handshake && <ControlLine springs="bus.int0" d="M 900 1015 H 900" />}

        {/* Printer connections */}
        {devices.pio === "printer" && (
        <>
            <ControlLine springs="bus.printer.strobe" d="M 1120 767 H 1225 V 992 H 1300" />
            <ControlLine springs="bus.printer.busy" d="M 1300 1007 H 1210 V 782 H 1120" />
            <ControlLine springs="bus.printer.data" d="M 1120 837 H 1175 V 1062 H 1300" />
          </>
        )}

        {devices.handshake === "printer" && (
          <>
            <ControlLine springs="bus.printer.strobe" d="M 1120 992 H 1300" />
            <ControlLine springs="bus.printer.busy" d="M 1300 1007 H 1120" />
            <ControlLine springs="bus.printer.data" d="M 1120 1062 H 1300" />
          </>
        )}

        {/* PIO to switches and LEDs */}
        {devices.pio && devices.switches && (
          <ControlLine springs="bus.switches->pio" d="M 1300 768 H 1120" />
        )}

        {devices.pio && devices.leds && (
          <ControlLine springs="bus.pio->leds" d="M 1300 848 H 1120" />
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
          <ControlLineLegend style={{ left: 384, top: 443 }}>io/m</ControlLineLegend>
          <ControlLineLegend style={{ left: 715, top: 538 }}>
            {translate("computer.chip-select.mem")}
          </ControlLineLegend>
        </>
      )}

      {devices.pic && (
        <>
        <ControlLineLegend className="left-[510px] top-[573px]">
          {translate("computer.chip-select.pic")}
        </ControlLineLegend>
        </>
      )}
      {devices.timer && (
        <>
          <ControlLineLegend className="left-[545px] top-[573px]">{translate("computer.chip-select.timer")}</ControlLineLegend>
        </>
      )}
      {devices.pio && (
        <>
          <ControlLineLegend className="left-[600px] top-[573px]">{translate("computer.chip-select.pio")}</ControlLineLegend>
        </>
      )}
      {devices.handshake && (
        <>
          <ControlLineLegend className="left-[675px] top-[573px]">{translate("computer.chip-select.handshake")}</ControlLineLegend>
        </>
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
  children,
  style,
  className,
}: {
  children?: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}) {
  return (
    <span
      className={`pointer-events-none absolute z-[50] block font-mono text-xs font-bold tracking-wider text-stone-400${className ? " " + className : ""}`}
      style={style}
    >
      {children}
    </span>
  );
}

// Animación de texto 'Read' siguiendo exactamente la animación roja del bus de control
type ReadBusAnimationProps = {
  pathRef: React.RefObject<SVGPathElement>;
};
function ReadBusAnimation({ pathRef }: ReadBusAnimationProps) {
  const [visible, setVisible] = useState(true);
  const setShowReadAnim = useSetAtom(showReadBusAnimationAtom);
  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState(0);
  const [settings] = useSettings();

  // Animación manual que funciona - simular progreso
  useEffect(() => {
    if (visible && ready) {
      const startTime = Date.now();
      // Usar la duración del sistema de springs (executionUnit) para sincronizar
      const MAX_EXECUTION_UNIT_MS = 250;
      const duration = settings.animations
        ? Math.min(settings.executionUnit, MAX_EXECUTION_UNIT_MS)
        : 1; // Misma duración que drawRDControlPath

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const newProgress = Math.min(elapsed / duration, 1);
        setProgress(newProgress);

        if (newProgress < 1) {
          requestAnimationFrame(animate);
        } else {
          // Cuando la animación termina, ocultar el texto
          setVisible(false);
          setTimeout(() => setShowReadAnim(false), 100);
        }
      };

      animate();
    }
  }, [visible, ready, setShowReadAnim, settings.animations, settings.executionUnit]);

  useEffect(() => {
    // Esperar a que el path esté disponible con retry
    let attempts = 0;
    const maxAttempts = 50; // 500ms máximo

    const checkPath = () => {
      if (pathRef.current) {
        setReady(true);
        return;
      }

      attempts++;
      if (attempts < maxAttempts) {
        setTimeout(checkPath, 10);
      } else {
        setReady(false);
      }
    };

    checkPath();
  }, [pathRef]);

  if (!visible || !ready || !settings.animations) return null;

  // Calcular coordenadas para llegar hasta la memoria
  // El path va desde CPU (380, 420) hasta Memory (800, 420)
  const startX = 380;
  const endX = 800;
  const y = 420;

  // Interpolar posición basada en el progreso (sin offset adicional para que llegue exactamente a la memoria)
  const x = startX + (endX - startX) * progress;

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

// Animación de texto 'Write' siguiendo exactamente la animación naranja del bus de control
type WriteBusAnimationProps = {
  pathRef: React.RefObject<SVGPathElement>;
};
function WriteBusAnimation({ pathRef }: WriteBusAnimationProps) {
  const [visible, setVisible] = useState(true);
  const setShowWriteAnim = useSetAtom(showWriteBusAnimationAtom);
  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState(0);
  const [settings] = useSettings();

  // Animación manual que funciona - simular progreso
  useEffect(() => {
    if (visible && ready) {
      const startTime = Date.now();
      // Usar la duración del sistema de springs (executionUnit) para sincronizar
      const MAX_EXECUTION_UNIT_MS = 250;
      const duration = settings.animations
        ? Math.min(settings.executionUnit, MAX_EXECUTION_UNIT_MS)
        : 1; // Misma duración que drawWRControlPath

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const newProgress = Math.min(elapsed / duration, 1);
        setProgress(newProgress);

        if (newProgress < 1) {
          requestAnimationFrame(animate);
        } else {
          // Cuando la animación termina, ocultar el texto
          setVisible(false);
          setTimeout(() => setShowWriteAnim(false), 100);
        }
      };

      animate();
    }
  }, [visible, ready, setShowWriteAnim, settings.animations, settings.executionUnit]);

  useEffect(() => {
    // Esperar a que el path esté disponible con retry
    let attempts = 0;
    const maxAttempts = 50; // 500ms máximo

    const checkPath = () => {
      if (pathRef.current) {
        setReady(true);
        return;
      }

      attempts++;
      if (attempts < maxAttempts) {
        setTimeout(checkPath, 10);
      } else {
        setReady(false);
      }
    };

    checkPath();
  }, [pathRef]);

  if (!visible || !ready) return null;

  // Calcular coordenadas para llegar hasta la memoria
  // El path va desde CPU (380, 440) hasta Memory (800, 440)
  const startX = 380;
  const endX = 800;
  const y = 440;

  // Interpolar posición basada en el progreso (sin offset adicional para que llegue exactamente a la memoria)
  const x = startX + (endX - startX) * progress;

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
