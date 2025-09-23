// Componente SVG animado de secuenciador tipo chip
import { animated, SpringValue, useSpring } from "@react-spring/web";
import { useAtomValue } from "jotai";
import { useEffect, useState } from "react";

import { getSpring } from "@/computer/shared/springs";
import { useTranslate } from "@/lib/i18n";

import { cycleAtom } from "./state";

function AnimatedSequencerChip({
  progress,
  resetAnimations,
  returnToOriginal,
}: {
  progress: SpringValue<number>;
  phase?: string;
  memAnimKey: number;
  resetAnimations?: boolean;
  returnToOriginal?: boolean;
}) {
  // Número de pines de salida
  const outputs = 8;

  // Animación de opacidad basada en el progreso del secuenciador
  const { opacity, filterIntensity } = useSpring({
    opacity: progress.to(p => {
      // Si returnToOriginal está activo, forzar opacidad baja
      if (returnToOriginal) return 0.4;
      // Por defecto semi-transparente (0.4), durante animación completamente visible (1.0)
      if (resetAnimations) return 0.4; // Forzar opaco cuando resetAnimations es true
      if (p === 0) return 0.4;
      if (p > 0 && p < 1) return 1.0; // Durante la ejecución de instrucción, mostrar activo
      if (p >= 1) return 0.4; // Al completar, volver a semi-transparente
      return 0.4;
    }),
    filterIntensity: progress.to(p => {
      // Si returnToOriginal está activo, forzar intensidad baja
      if (returnToOriginal) return 0.25;
      // Intensidad del filtro de sombra basada en el progreso del secuenciador
      if (resetAnimations) return 0.25; // Forzar intensidad baja cuando resetAnimations es true
      if (p === 0) return 0.25;
      if (p > 0 && p < 1) return 0.6; // Durante la ejecución de instrucción, brillante
      if (p >= 1) return 0.25; // Al completar, volver a intensidad baja
      return 0.25;
    }),
    config: {
      tension: 280,
      friction: 60,
      duration: 300,
    },
  });

  return (
    <animated.div
      style={{
        opacity,
        filter: filterIntensity.to(
          intensity => `drop-shadow(0 0 ${8 * intensity}px rgba(56,189,248,${intensity}))`,
        ),
        transition: "opacity 0.3s ease-out, filter 0.3s ease-out",
      }}
    >
      <svg width="90" height="42" viewBox="0 0 90 42">
        {/* Cuerpo del chip - más ancho y profesional */}
        <rect
          x="10"
          y="8"
          width="50"
          height="26"
          rx="8"
          fill="#0369a1"
          stroke="#38bdf8"
          strokeWidth="2.5"
        />

        {/* Pines de entrada (izquierda) - más espaciados */}
        {Array.from({ length: 4 }).map((_, i) => (
          <rect key={i} x={2} y={10 + i * 5} width={8} height={2.5} rx={1.2} fill="#38bdf8" />
        ))}

        {/* Pines de salida (derecha) - más espaciados y organizados */}
        {Array.from({ length: outputs }).map((_, i) => (
          <animated.rect
            key={i}
            x={60}
            y={8 + i * 3.2}
            width={24}
            height={2.5}
            rx={1.2}
            fill={progress.to(p => {
              // Si returnToOriginal está activo, forzar color oscuro
              if (returnToOriginal) return "#0ea5e9";
              // Efecto: barrido de encendido - progresivo durante ejecución de instrucción
              if (resetAnimations) return "#0ea5e9"; // Forzar color oscuro cuando resetAnimations es true
              // Activar pines progresivamente según el progreso del secuenciador
              const pinIndex = i / (outputs - 1); // Normalizar índice del pin (0 a 1)
              return p >= pinIndex ? "#7dd3fc" : "#0ea5e9";
            })}
            style={{
              filter: progress.to(p => {
                // Si returnToOriginal está activo, forzar sin filtro
                if (returnToOriginal) return "none";
                if (resetAnimations) return "none"; // Forzar sin filtro cuando resetAnimations es true
                // Aplicar brillo a pines activos progresivamente
                const pinIndex = i / (outputs - 1); // Normalizar índice del pin (0 a 1)
                return p >= pinIndex ? "drop-shadow(0 0 8px #38bdf8)" : "none";
              }),
            }}
          />
        ))}

        {/* Celdas internas del secuenciador animadas - más anchas */}
        {Array.from({ length: 5 }).map((_, i) => (
          <animated.rect
            key={i}
            x={15}
            y={progress.to(() => 12 + i * 3.5)}
            width={40}
            height={2.8}
            rx={1.4}
            fill={progress.to(p => {
              // Si returnToOriginal está activo, forzar color oscuro
              if (returnToOriginal) return "#0c4a6e";
              if (resetAnimations) return "#0c4a6e"; // Forzar color oscuro cuando resetAnimations es true
              if (p === 0) return "#0c4a6e";
              // Activar celdas progresivamente según el progreso del secuenciador
              const cellIndex = i / 4; // Normalizar índice de la celda (0 a 1)
              return p >= cellIndex ? "#7dd3fc" : "#0c4a6e";
            })}
            style={{
              filter: progress.to(p => {
                // Si returnToOriginal está activo, forzar sin filtro
                if (returnToOriginal) return "none";
                if (resetAnimations) return "none"; // Forzar sin filtro cuando resetAnimations es true
                if (p === 0) return "none";
                // Aplicar brillo a celdas activas progresivamente
                const cellIndex = i / 4; // Normalizar índice de la celda (0 a 1)
                return p >= cellIndex ? "drop-shadow(0 0 6px #38bdf8)" : "none";
              }),
              transition: "fill 0.7s, filter 0.7s",
            }}
          />
        ))}

        {/* Efecto de "secuenciación" (borde animado) - ajustado al nuevo tamaño */}
        <animated.rect
          x="10"
          y="8"
          width="50"
          height="26"
          rx="8"
          fill="none"
          stroke="#7dd3fc"
          strokeWidth="2.5"
          strokeDasharray="160"
          strokeDashoffset={progress.to(p => {
            // Si returnToOriginal está activo, forzar strokeDashoffset completo
            if (returnToOriginal) return 160;
            // Forzar strokeDashoffset completo cuando resetAnimations es true
            if (resetAnimations) return 160;
            if (p > 0 && p < 1) return 160; // Durante animación de memoria de control mantener completo
            return p === 1 ? 0 : 160;
          })}
          style={{
            opacity: progress.to(p => {
              // Si returnToOriginal está activo, forzar opacidad 0
              if (returnToOriginal) return 0;
              // Forzar opacidad 0 cuando resetAnimations es true
              if (resetAnimations) return 0;
              if (p > 0 && p < 1) return 0; // Durante animación de memoria de control mantener invisible
              return p === 1 ? 0.8 : 0;
            }),
            transition: "stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />
      </svg>
    </animated.div>
  );
}

function AnimatedMemoryCells({
  progress,
  phase,
  resetAnimations,
  returnToOriginal,
}: {
  progress: SpringValue<number>;
  phase?: string;
  resetAnimations?: boolean;
  returnToOriginal?: boolean;
}) {
  const total = 5;
  // Si está en fetching y progreso es 0, forzar todas las líneas oscuras
  return (
    <>
      {Array.from({ length: total }).map((_, i) => (
        <animated.rect
          key={i}
          x={16}
          y={progress.to(() => 10 + i * 4)}
          width={38}
          height={3}
          rx={1}
          fill={progress.to(v => {
            // Si returnToOriginal está activo, forzar color oscuro para resetear
            if (returnToOriginal) return "#581c87";
            // Forzar color oscuro cuando resetAnimations es true
            if (resetAnimations) return "#581c87";
            if (phase === "fetching" && v === 0) return "#581c87";
            if (v === 0) return "#581c87";
            // Durante la animación: líneas completadas en color claro
            if (v >= (i + 1) / total) return "#f0abfc";
            // Línea actualmente siendo animada
            if (Math.floor(v * total) === i && v > 0 && v < 1) return "#fff1fb";
            // Al finalizar animación (v === 1), forzar que todas vuelvan a oscuro
            if (v === 1) return "#581c87";
            return "#581c87";
          })}
          style={{
            filter: progress.to(v => {
              // Si returnToOriginal está activo, forzar sin filtro para resetear completamente
              if (returnToOriginal) return "none";
              // Forzar sin filtro cuando resetAnimations es true
              if (resetAnimations) return "none";
              if (phase === "fetching" && v === 0) return "none";
              if (v === 0) return "none";
              // Durante la animación: efectos de brillo
              if (v >= (i + 1) / total) return "drop-shadow(0 0 6px #e879f9)";
              if (Math.floor(v * total) === i && v > 0 && v < 1)
                return "drop-shadow(0 0 12px #e879f9)";
              // Al finalizar animación (v === 1), quitar todos los efectos
              if (v === 1) return "none";
              return "none";
            }),
            transition: "fill 0.7s, filter 0.7s",
          }}
        />
      ))}
      {/* Rayo de lectura animado */}
      <animated.rect
        x={15}
        y={progress.to(v => 10 + Math.floor(v * 5) * 4 - 0.5)}
        width={40}
        height={3.5}
        rx={1.5}
        fill="#e879f9"
        style={{
          opacity: progress.to(v => {
            // Si returnToOriginal está activo, forzar opacidad 0
            if (returnToOriginal) return 0;
            // Forzar opacidad 0 cuando resetAnimations es true
            if (resetAnimations) return 0;
            return v > 0 && v < 1 ? 0.25 + 0.25 * Math.sin(v * Math.PI) : 0;
          }),
          transition: "y 0.3s, opacity 0.2s",
        }}
      />
      {/* Efecto de "lectura" (borde animado) */}
      <animated.rect
        x="8"
        y="6"
        width="54"
        height="26"
        rx="4"
        fill="none"
        stroke="#f0abfc"
        strokeWidth="2"
        strokeDasharray="160"
        strokeDashoffset={progress.to(v => {
          // Si returnToOriginal está activo, forzar strokeDashoffset completo
          if (returnToOriginal) return 160;
          // Forzar strokeDashoffset completo cuando resetAnimations es true
          if (resetAnimations) return 160;
          return phase === "fetching" && v === 0 ? 160 : v === 0 ? 160 : 160 - 160 * v;
        })}
        style={{
          opacity: progress.to(v => {
            // Si returnToOriginal está activo, forzar opacidad 0
            if (returnToOriginal) return 0;
            // Forzar opacidad 0 cuando resetAnimations es true
            if (resetAnimations) return 0;
            return v > 0 && v < 1 && phase === "fetching-operands" ? 0.7 : 0;
          }),
          transition: "stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      />
    </>
  );
}

// Componente para la memoria de control con animación de opacidad
function AnimatedControlMemoryBadge({
  progress,
  showControlMem,
  returnToOriginal,
}: {
  progress: SpringValue<number>;
  showControlMem: boolean;
  returnToOriginal?: boolean;
}) {
  // Animación de opacidad y pulso basada en el progreso
  const { opacity, pulseActive } = useSpring({
    opacity: progress.to(p => {
      // Si returnToOriginal está activo, forzar opacidad baja
      if (returnToOriginal) return 0.4;
      // Por defecto semi-transparente (0.4), durante animación completamente visible (1.0)
      if (p === 0) return 0.4;
      if (p > 0 && p < 1) return 1.0;
      // Al finalizar, volver a opaco para resaltar la próxima animación
      return 0.4;
    }),
    pulseActive: progress.to(p => {
      // Si returnToOriginal está activo, desactivar el pulso
      if (returnToOriginal) return false;
      // Activar el pulso solo durante la animación (cuando progreso está entre 0 y 1)
      // y cuando la memoria de control está visible
      return showControlMem && p > 0 && p < 1;
    }),
    config: {
      tension: 280,
      friction: 60,
      duration: 300,
    },
  });

  return (
    <animated.span
      className="flex size-4 items-center justify-center rounded-full bg-fuchsia-400 text-[10px] font-extrabold text-white shadow-[0_0_4px_rgba(232,121,249,0.6)]"
      style={{
        opacity,
        fontVariantNumeric: "tabular-nums",
        fontFamily: "monospace",
        transition: "opacity 0.3s ease-out",
      }}
      title="Lectura de microinstrucciones"
    >
      <animated.span
        style={{
          animation: pulseActive.to(active =>
            active ? "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite" : "none",
          ),
        }}
      >
        1
      </animated.span>
    </animated.span>
  );
}

function AnimatedSequencerBadge({
  progress,
  showControlMem,
  returnToOriginal,
}: {
  progress: SpringValue<number>;
  showControlMem: boolean;
  returnToOriginal?: boolean;
}) {
  // Animación de opacidad y pulso basada en el progreso
  const { opacity, pulseActive } = useSpring({
    opacity: progress.to(p => {
      // Si returnToOriginal está activo, forzar opacidad baja
      if (returnToOriginal) return 0.4;
      // Por defecto semi-transparente (0.4), durante ejecución completamente visible (1.0)
      if (p === 0) return 0.4;
      if (p > 0 && p < 1) return 1.0; // Durante la ejecución de instrucción, mostrar activo
      if (p >= 1) return 0.4; // Al completar, volver a semi-transparente
      return 0.4;
    }),
    pulseActive: progress.to(p => {
      // Si returnToOriginal está activo, desactivar el pulso
      if (returnToOriginal) return false;
      // Activar el pulso durante la ejecución de la instrucción
      // y cuando la memoria de control está visible
      return showControlMem && p > 0 && p < 1;
    }),
    config: {
      tension: 280,
      friction: 60,
      duration: 300,
    },
  });

  return (
    <animated.span
      className="flex size-4 items-center justify-center rounded-full bg-sky-400 text-[10px] font-extrabold text-white shadow-[0_0_4px_rgba(56,189,248,0.6)]"
      style={{
        opacity,
        fontVariantNumeric: "tabular-nums",
        fontFamily: "monospace",
        transition: "opacity 0.3s ease-out",
      }}
      title="Envío de señales de control"
    >
      <animated.span
        style={{
          animation: pulseActive.to(active =>
            active ? "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite" : "none",
          ),
        }}
      >
        2
      </animated.span>
    </animated.span>
  );
}

function AnimatedControlMemory({
  progress,
  phase,
  memAnimKey,
  resetAnimations,
  returnToOriginal,
}: {
  progress: SpringValue<number>;
  phase?: string;
  memAnimKey: number;
  resetAnimations?: boolean;
  returnToOriginal?: boolean;
}) {
  // Animación de opacidad basada en el progreso
  const { opacity, filterIntensity } = useSpring({
    opacity: progress.to(p => {
      // Si returnToOriginal está activo, forzar opacidad baja
      if (returnToOriginal) return 0.4;
      // Por defecto semi-transparente (0.4), durante animación completamente visible (1.0)
      if (p === 0) return 0.4;
      if (p > 0 && p < 1) return 1.0;
      // Al finalizar, volver a opaco para resaltar la próxima animación
      return 0.4;
    }),
    filterIntensity: progress.to(p => {
      // Si returnToOriginal está activo, forzar intensidad baja
      if (returnToOriginal) return 0.25;
      // Intensidad del filtro de sombra basada en el progreso
      if (p === 0) return 0.25;
      if (p > 0 && p < 1) return 0.6;
      // Al finalizar, volver a intensidad baja para resaltar la próxima animación
      return 0.25;
    }),
    config: {
      tension: 280,
      friction: 60,
      duration: 300,
    },
  });

  return (
    <animated.div
      style={{
        opacity,
        filter: filterIntensity.to(
          intensity => `drop-shadow(0 0 ${8 * intensity}px rgba(232,121,249,${intensity}))`,
        ),
        transition: "opacity 0.3s ease-out, filter 0.3s ease-out",
      }}
    >
      <svg width="70" height="38" viewBox="0 0 70 38" className="mb-0.5">
        {/* Cuerpo de la memoria */}
        <rect
          x="8"
          y="6"
          width="54"
          height="26"
          rx="4"
          fill="#a21caf"
          stroke="#e879f9"
          strokeWidth="2"
        />
        {/* Pines laterales */}
        {Array.from({ length: 4 }).map((_, i) => (
          <rect key={i} x={2} y={9 + i * 6} width={6} height={2} rx={1} fill="#e879f9" />
        ))}
        {Array.from({ length: 4 }).map((_, i) => (
          <rect key={i} x={62} y={9 + i * 6} width={6} height={2} rx={1} fill="#e879f9" />
        ))}
        {/* Celdas de memoria animadas con efecto de lectura sincronizadas con la barra del decodificador */}
        <AnimatedMemoryCells
          key={memAnimKey}
          progress={progress}
          phase={phase}
          resetAnimations={resetAnimations}
          returnToOriginal={returnToOriginal}
        />
      </svg>
    </animated.div>
  );
}

/**
 * Control component, to be used inside <CPU />
 */
export function Control() {
  // Estado para forzar el remount de la animación de memoria de control
  const [memAnimKey, setMemAnimKey] = useState(0);
  // Estado para controlar el reset de animaciones
  const [resetAnimations, setResetAnimations] = useState(false);
  // Estado para controlar cuándo las animaciones deben volver al estado original
  const [returnToOriginal, setReturnToOriginal] = useState(false);

  useEffect(() => {
    let last = 0;
    const unsub = getSpring("sequencer.progress.progress").to((v: number) => {
      // Incrementar memAnimKey cuando comienza una nueva animación (0 -> >0)
      if (last === 0 && v > 0) {
        setMemAnimKey(k => k + 1);
        setResetAnimations(false);
        setReturnToOriginal(false);
      }
      // También incrementar cuando termina una animación y vuelve a 0 para resetear
      if (last > 0 && v === 0) {
        setMemAnimKey(k => k + 1);
        setResetAnimations(true);
        // Después de un breve período, activar el retorno al estado original
        setTimeout(() => {
          setReturnToOriginal(true);
        }, 100); // Reducir aún más el tiempo para que el secuenciador vuelva inmediatamente al estado oscuro
        // Resetear después de un breve delay para asegurar que se aplique
        setTimeout(() => setResetAnimations(false), 100);
      }
      last = v;
    });
    return () => {
      if (typeof unsub === "function") unsub();
    };
  }, []);

  const translate = useTranslate();
  const cycle = useAtomValue(cycleAtom);
  const [showControlMem, setShowControlMem] = useState(false);

  // El progreso de la memoria de control ahora depende del progreso del secuenciador
  const [, setSequencerActive] = useState(false);

  // Efecto para manejar la secuencia de animación de las barras de progreso
  // Sincronizar la animación de la memoria de control con la barra progresiva del secuenciador
  useEffect(() => {
    let sequencerTimeout: NodeJS.Timeout | null = null;
    setSequencerActive(false);
    let unsub: (() => void) | undefined;
    if (showControlMem) {
      // Activar el secuenciador basándose en el progreso del secuenciador
      unsub = getSpring("sequencer.progress.progress").to(progress => {
        if (progress >= 0.5) {
          // Activar cuando el progreso del secuenciador llegue al 50% (fase executing)
          sequencerTimeout = setTimeout(() => {
            setSequencerActive(true);
          }, 500); // Reducir el delay ya que ahora está basado en el progreso real
        } else {
          if (sequencerTimeout) clearTimeout(sequencerTimeout);
          setSequencerActive(false);
        }
      });
    } else {
      setSequencerActive(false);
    }
    return () => {
      if (sequencerTimeout) clearTimeout(sequencerTimeout);
      if (typeof unsub === "function") unsub();
    };
  }, [showControlMem]);

  return (
    <>
      <svg viewBox="0 0 650 500" className="pointer-events-none absolute inset-0">
        <animated.path
          d="M 250 310 V 320" // alineado con IR
          className="fill-none stroke-mantis-400 stroke-[3px] drop-shadow-[0_0_8px_rgba(34,197,94,0.6)]"
          strokeLinejoin="round"
          pathLength={1}
          strokeDasharray={1}
          style={getSpring("cpu.decoder.path")}
        />
        {/* Efecto de brillo adicional para el bus del decodificador */}
        <animated.path
          d="M 250 310 V 320"
          className="fill-none stroke-mantis-300 stroke-1 opacity-50"
          strokeLinejoin="round"
          pathLength={1}
          strokeDasharray={1}
          style={getSpring("cpu.decoder.path")}
        />
      </svg>

      <div className="absolute bottom-[172px] left-[30px] flex w-full items-start">
        <span className="block w-min whitespace-nowrap rounded-t-lg border border-b-0 border-stone-600 bg-mantis-500 px-2 pb-3 pt-1 text-xs tracking-wide text-white">
          {translate("computer.cpu.control-unit")}
        </span>
      </div>

      <div className="absolute bottom-[17px] left-[30px] flex h-[160px] w-[350px] flex-col items-center rounded-lg border border-stone-600 bg-stone-800">
        <div className="min-w-[180px] overflow-hidden rounded-b-lg border border-t-0 border-stone-600 bg-stone-900 px-3 py-1">
          <div style={{ position: "relative", left: 0 }}>
            <div className="flex items-center justify-between">
              <div style={{ position: "relative", left: 0, display: "flex", alignItems: "center" }}>
                <span className="text-sm leading-none">{translate("computer.cpu.decoder")}</span>
                <button
                  type="button"
                  aria-label={
                    showControlMem ? "Ocultar memoria de control" : "Mostrar memoria de control"
                  }
                  className={
                    "ml-2 flex size-6 items-center justify-center rounded-lg bg-gradient-to-r from-mantis-600 to-mantis-500 text-white shadow-lg transition-all duration-300 hover:from-mantis-500 hover:to-mantis-400 focus:outline-none focus:ring-2 focus:ring-mantis-400"
                  }
                  style={{
                    fontSize: "1.2em",
                    lineHeight: 1,
                    padding: 0,
                    minWidth: 0,
                    minHeight: 0,
                    transform: showControlMem ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    boxShadow: showControlMem
                      ? "0 4px 12px rgba(34,197,94,0.4)"
                      : "0 2px 8px rgba(34,197,94,0.2)",
                  }}
                  onClick={() => setShowControlMem(v => !v)}
                >
                  <span
                    style={{
                      fontWeight: "bold",
                      transform: showControlMem ? "scale(0.8)" : "scale(1)",
                      transition: "transform 0.2s ease-out",
                    }}
                  >
                    {showControlMem ? "−" : "+"}
                  </span>
                </button>
              </div>
            </div>
            {/* Barra de progreso del secuenciador */}
            <div className="my-1 h-1 w-full overflow-hidden rounded-full bg-stone-600">
              <animated.div
                className="h-full bg-sky-400"
                style={{
                  width: getSpring("sequencer.progress.progress").to(t => `${t * 100}%`),
                  opacity: getSpring("sequencer.progress.opacity"),
                }}
              />
            </div>
            {/* Memoria de control: siempre visible y fuera del colapsable */}
            <div className="flex w-full justify-center">
              {showControlMem && (
                <div className="flex min-w-[120px] flex-col items-center">
                  <div className="flex flex-row items-start gap-4">
                    {/* Columna Memoria de control */}
                    <div className="flex min-w-[90px] flex-col items-center">
                      <span
                        className="mb-0.5 flex items-center gap-1 text-center text-[10px] font-bold tracking-wide text-fuchsia-100 drop-shadow-[0_0_6px_rgba(232,121,249,0.6)]"
                        style={{ minHeight: "18px" }}
                      >
                        <AnimatedControlMemoryBadge
                          progress={getSpring("sequencer.progress.progress")}
                          showControlMem={showControlMem}
                          returnToOriginal={returnToOriginal}
                        />
                        Memoria de control
                      </span>
                      <AnimatedControlMemory
                        progress={getSpring("sequencer.progress.progress")}
                        phase={cycle?.phase}
                        memAnimKey={memAnimKey}
                        resetAnimations={resetAnimations}
                        returnToOriginal={returnToOriginal}
                      />
                    </div>
                    {/* Columna Secuenciador */}
                    <div className="flex min-w-[90px] flex-col items-center">
                      <span
                        className="mb-0.5 flex items-center gap-1 text-center text-[10px] font-bold tracking-wide text-sky-100 drop-shadow-[0_0_6px_rgba(56,189,248,0.6)]"
                        style={{ minHeight: "18px" }}
                      >
                        <AnimatedSequencerBadge
                          progress={getSpring("sequencer.progress.progress")}
                          showControlMem={showControlMem}
                          returnToOriginal={returnToOriginal}
                        />
                        Secuenciador
                      </span>
                      <AnimatedSequencerChip
                        progress={getSpring("sequencer.progress.progress")}
                        phase={cycle?.phase}
                        memAnimKey={memAnimKey}
                        resetAnimations={resetAnimations}
                        returnToOriginal={returnToOriginal}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Secuenciador y otros elementos colapsables */}
            <div
              className="flex w-full justify-center"
              style={{
                maxHeight: showControlMem ? 90 : 0,
                opacity: showControlMem ? 1 : 0,
                transform: showControlMem ? "translateY(0)" : "translateY(-10px)",
                transition:
                  "max-height 0.6s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.5s ease-out, transform 0.5s ease-out",
                overflow: "hidden",
              }}
            >
              {/* Eliminado el componente anterior del secuenciador */}
            </div>
          </div>
        </div>

        {/* Información de la instrucción en curso */}
        <div className="flex w-full flex-1 items-start justify-center p-0.5">
          <div className="w-[220px] max-w-[220px]">
            {/* Instrucción actual */}
            <div className="mb-0 p-0.5">
              <div className="min-w-0 flex-1 text-center">
                {cycle && "metadata" in cycle && cycle.metadata ? (
                  <div className="text-xs text-stone-300">
                    {/* Mostrar la fase actual como título con estilo coherente con la unidad de control */}
                    <div className="mb-1 flex justify-center">
                      <div
                        className={`
                          flex min-h-[20px] items-center justify-center whitespace-nowrap rounded-md border
                          border-stone-600 px-3 py-1 text-[11px] font-bold uppercase tracking-wide
                          transition-all duration-300 ease-in-out
                          ${(() => {
                            switch (cycle.phase) {
                              case "fetching":
                                return "bg-gradient-to-r from-blue-600/80 to-blue-500/80 text-blue-100 shadow-[0_0_8px_rgba(59,130,246,0.3)]";
                              case "fetching-operands":
                                return "bg-gradient-to-r from-yellow-600/80 to-yellow-500/80 text-yellow-100 shadow-[0_0_8px_rgba(234,179,8,0.3)]";
                              case "fetching-operands-completed":
                                return "bg-gradient-to-r from-yellow-600/80 to-yellow-500/80 text-yellow-100 shadow-[0_0_8px_rgba(234,179,8,0.3)]";
                              case "executing":
                                return "bg-gradient-to-r from-mantis-600/80 to-mantis-500/80 text-mantis-100 shadow-[0_0_8px_rgba(34,197,94,0.3)]";
                              case "writeback":
                                return "bg-gradient-to-r from-purple-600/80 to-purple-500/80 text-purple-100 shadow-[0_0_8px_rgba(147,51,234,0.3)]";
                              case "interrupt":
                                return "bg-gradient-to-r from-red-600/80 to-red-500/80 text-red-100 shadow-[0_0_8px_rgba(239,68,68,0.3)]";
                              case "halting":
                                return "bg-gradient-to-r from-red-600/80 to-red-500/80 text-red-100 shadow-[0_0_8px_rgba(239,68,68,0.3)]";
                              default:
                                return "bg-gradient-to-r from-stone-600/80 to-stone-500/80 text-stone-100 shadow-[0_0_8px_rgba(120,113,108,0.3)]";
                            }
                          })()}
                        `}
                      >
                        {(() => {
                          switch (cycle.phase) {
                            case "fetching":
                              return "Captación";
                            case "fetching-operands":
                              return "Obtención de operandos";
                            case "fetching-operands-completed":
                              return "Operandos obtenidos";
                            case "executing":
                              return "Ejecución";
                            case "writeback":
                              return "Escritura";
                            case "interrupt":
                              return "Interrupción";
                            case "halting":
                              return "Detener CPU";
                            default:
                              return "Procesando";
                          }
                        })()}
                      </div>
                    </div>
                    <div className="truncate text-center">
                      <span className="font-mono text-mantis-300">{cycle.metadata.name}</span>
                      {cycle.metadata.operands.length > 0 && (
                        <span className="text-white"> {cycle.metadata.operands.join(", ")}</span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-stone-500">
                    {cycle?.phase === "stopped" ? "CPU detenida" : "Esperando..."}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
