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
}: {
  progress: SpringValue<number>;
  phase?: string;
  memAnimKey: number;
  resetAnimations?: boolean;
}) {
  // Número de pines de salida
  const outputs = 8;

  // Animación de opacidad basada en el progreso (misma lógica que memoria de control)
  const { opacity, filterIntensity } = useSpring({
    opacity: progress.to(p => {
      // Por defecto semi-transparente (0.4), durante animación completamente visible (1.0)
      if (resetAnimations) return 0.4; // Forzar opaco cuando resetAnimations es true
      if (p === 0) return 0.4;
      if (p === 1) return 1.0; // Solo activo cuando memoria de control termina
      // Durante la animación de memoria de control, mantener semi-transparente
      return 0.4;
    }),
    filterIntensity: progress.to(p => {
      // Intensidad del filtro de sombra basada en el progreso
      if (resetAnimations) return 0.25; // Forzar intensidad baja cuando resetAnimations es true
      if (p === 0) return 0.25;
      if (p === 1) return 0.6; // Solo activo cuando memoria de control termina
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
              // Efecto: barrido de encendido - solo cuando progreso es 1
              if (resetAnimations) return "#0ea5e9"; // Forzar color oscuro cuando resetAnimations es true
              return p === 1 ? "#7dd3fc" : "#0ea5e9";
            })}
            style={{
              filter: progress.to(p => {
                if (resetAnimations) return "none"; // Forzar sin filtro cuando resetAnimations es true
                return p === 1 ? "drop-shadow(0 0 8px #38bdf8)" : "none";
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
              if (resetAnimations) return "#0c4a6e"; // Forzar color oscuro cuando resetAnimations es true
              if (p !== 1) return "#0c4a6e";
              if (p === 1) return "#7dd3fc";
              return "#0c4a6e";
            })}
            style={{
              filter: progress.to(p => {
                if (resetAnimations) return "none"; // Forzar sin filtro cuando resetAnimations es true
                if (p !== 1) return "none";
                if (p === 1) return "drop-shadow(0 0 6px #38bdf8)";
                return "none";
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
            // Forzar strokeDashoffset completo cuando resetAnimations es true
            if (resetAnimations) return 160;
            return p === 1 ? 0 : 160;
          })}
          style={{
            opacity: progress.to(p => {
              // Forzar opacidad 0 cuando resetAnimations es true
              if (resetAnimations) return 0;
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
}: {
  progress: SpringValue<number>;
  phase?: string;
  resetAnimations?: boolean;
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
            // Forzar color negro cuando resetAnimations es true
            if (resetAnimations) return "#581c87";
            if (phase === "fetching" && v === 0) return "#581c87";
            if (v === 0) return "#581c87";
            if (v >= (i + 1) / total) return "#f0abfc";
            if (Math.floor(v * total) === i && v > 0 && v < 1) return "#fff1fb";
            return "#581c87";
          })}
          style={{
            filter: progress.to(v => {
              // Forzar sin filtro cuando resetAnimations es true
              if (resetAnimations) return "none";
              if (phase === "fetching" && v === 0) return "none";
              if (v === 0) return "none";
              if (v >= (i + 1) / total) return "drop-shadow(0 0 6px #e879f9)";
              if (Math.floor(v * total) === i && v > 0 && v < 1)
                return "drop-shadow(0 0 12px #e879f9)";
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
          // Forzar strokeDashoffset completo cuando resetAnimations es true
          if (resetAnimations) return 160;
          return phase === "fetching" && v === 0 ? 160 : v === 0 ? 160 : 160 - 160 * v;
        })}
        style={{
          opacity: progress.to(v => {
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
}: {
  progress: SpringValue<number>;
  showControlMem: boolean;
}) {
  // Animación de opacidad y pulso basada en el progreso
  const { opacity, pulseActive } = useSpring({
    opacity: progress.to(p => {
      // Por defecto semi-transparente (0.4), durante animación completamente visible (1.0)
      if (p === 0) return 0.4;
      if (p > 0 && p < 1) return 1.0;
      // Al finalizar, volver a opaco para resaltar la próxima animación
      return 0.4;
    }),
    pulseActive: progress.to(p => {
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
          animation: pulseActive.to(active => active ? "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite" : "none"),
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
}: {
  progress: SpringValue<number>;
  showControlMem: boolean;
}) {
  // Animación de opacidad y pulso basada en el progreso
  const { opacity, pulseActive } = useSpring({
    opacity: progress.to(p => {
      // Por defecto semi-transparente (0.4), durante animación del secuenciador completamente visible (1.0)
      if (p === 0) return 0.4;
      if (p === 1) return 1.0; // Solo activo cuando memoria de control termina
      // Durante la animación de memoria de control y al finalizar, mantener semi-transparente
      return 0.4;
    }),
    pulseActive: progress.to(p => {
      // Activar el pulso solo cuando el progreso es 1 (secuenciador activo)
      // y cuando la memoria de control está visible
      return showControlMem && p === 1;
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
          animation: pulseActive.to(active => active ? "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite" : "none"),
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
}: {
  progress: SpringValue<number>;
  phase?: string;
  memAnimKey: number;
  resetAnimations?: boolean;
}) {
  // Animación de opacidad basada en el progreso
  const { opacity, filterIntensity } = useSpring({
    opacity: progress.to(p => {
      // Por defecto semi-transparente (0.4), durante animación completamente visible (1.0)
      if (p === 0) return 0.4;
      if (p > 0 && p < 1) return 1.0;
      // Al finalizar, volver a opaco para resaltar la próxima animación
      return 0.4;
    }),
    filterIntensity: progress.to(p => {
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
        <AnimatedMemoryCells key={memAnimKey} progress={progress} phase={phase} resetAnimations={resetAnimations} />
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


  useEffect(() => {
    let last = 0;
    const unsub = getSpring("cpu.decoder.progress.progress").to((v: number) => {
      // Incrementar memAnimKey cuando comienza una nueva animación (0 -> >0)
      if (last === 0 && v > 0) {
        setMemAnimKey(k => k + 1);
        setResetAnimations(false);
      }
      // También incrementar cuando termina una animación y vuelve a 0 para resetear
      if (last > 0 && v === 0) {
        setMemAnimKey(k => k + 1);
        setResetAnimations(true);
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
  

  // El progreso de la memoria de control ahora depende del progreso del decodificador
  const [, setSequencerActive] = useState(false);

  // Efecto para manejar la secuencia de animación de las barras de progreso
  // Sincronizar la animación de la memoria de control con la barra progresiva del decodificador
  useEffect(() => {
    let sequencerTimeout: NodeJS.Timeout | null = null;
    setSequencerActive(false);
    let unsub: (() => void) | undefined;
    if (showControlMem) {
      // Activar el secuenciador solo después de que termine la animación de la memoria de control
      unsub = getSpring("cpu.decoder.progress.progress").to(progress => {
        if (progress === 1) {
          // Esperar a que termine completamente la animación de la memoria de control antes de activar el secuenciador
          // La memoria de control tiene una duración de animación de ~1.2s, así que esperamos un poco más
          sequencerTimeout = setTimeout(() => {
            setSequencerActive(true);
          }, 1500); // Aumentar el delay para asegurar que la memoria de control termine completamente
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
            <div className="my-1 h-1 w-full overflow-hidden rounded-full bg-stone-600">
              <animated.div
                className="h-full bg-mantis-400"
                style={{
                  width: getSpring("cpu.decoder.progress.progress").to(t => `${t * 100}%`),
                  opacity: getSpring("cpu.decoder.progress.opacity"),
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
                          progress={getSpring("cpu.decoder.progress.progress")}
                          showControlMem={showControlMem}
                        />
                        Memoria de control
                      </span>
                      <AnimatedControlMemory
                        progress={getSpring("cpu.decoder.progress.progress")}
                        phase={cycle?.phase}
                        memAnimKey={memAnimKey}
                        resetAnimations={resetAnimations}
                      />
                    </div>
                    {/* Columna Secuenciador */}
                    <div className="flex min-w-[90px] flex-col items-center">
                      <span
                        className="mb-0.5 flex items-center gap-1 text-center text-[10px] font-bold tracking-wide text-sky-100 drop-shadow-[0_0_6px_rgba(56,189,248,0.6)]"
                        style={{ minHeight: "18px" }}
                      >
                        <AnimatedSequencerBadge
                          progress={getSpring("cpu.decoder.progress.progress")}
                          showControlMem={showControlMem}
                        />
                        Secuenciador
                      </span>
                      <AnimatedSequencerChip
                        progress={getSpring("cpu.decoder.progress.progress")}
                        phase={cycle?.phase}
                        memAnimKey={memAnimKey}
                        resetAnimations={resetAnimations}
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
        <div className="flex w-full flex-1 items-start justify-center p-1">
          <div className="w-[220px] max-w-[220px]">
            <div className="mb-1 flex items-center justify-between">
              <span className="w-16 whitespace-nowrap text-xs font-bold uppercase tracking-wide text-mantis-400">
                Instrucción
              </span>
            </div>

            {/* Instrucción actual */}
            <div className="mb-0.5 rounded border border-stone-600 bg-stone-900/80 p-0.5">
              <div className="min-w-0 flex-1 text-center">
                {cycle && "metadata" in cycle && cycle.metadata ? (
                  <div className="truncate text-xs text-stone-300">
                    <span className="font-mono text-mantis-300">{cycle.metadata.name}</span>
                    {cycle.metadata.operands.length > 0 && (
                      <span className="text-white"> {cycle.metadata.operands.join(", ")}</span>
                    )}
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
