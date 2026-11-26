import {
  faCheckCircle,
  faChevronLeft,
  faChevronRight,
  faHandPointer,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { Byte } from "@vonsim/common/byte";
import clsx from "clsx";
import { atom, type PrimitiveAtom, useAtom, useAtomValue } from "jotai";
import { memo, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/Button";
import { instructionCountAtom, registerAtoms } from "@/computer/cpu/state";
import { COMPUTER_FOCUS_EVENT } from "@/computer/focus";
import { dataAddressesAtom, memoryAtom } from "@/computer/memory/state";
import { useSimulation } from "@/computer/simulation";

/**
 * Guía de "Primeros pasos": un recorrido práctico en el que el alumno carga
 * un programa de ejemplo, lo ensambla, lo ejecuta instrucción por instrucción
 * y observa cómo cambian los registros y la memoria.
 *
 * A diferencia del recorrido por la interfaz (WelcomeTour), el resto de la
 * aplicación sigue siendo utilizable mientras la guía está abierta: el
 * alumno puede presionar los botones reales resaltados (o F7/F8/F9).
 */

export const firstStepsOpenAtom = atom(false);

const STORAGE_KEY = "vonsim8-first-steps-completed";

export const FIRST_STEPS_PROGRAM = `; Primeros pasos: calcula z = x + y
x DB 3        ; variable x, vale 3
y DB 2        ; variable y, vale 2
z DB 0        ; acá se guardará el resultado
MOV AL, x     ; copia x en el registro AL
ADD AL, y     ; suma y a AL  (AL = 3 + 2)
MOV z, AL     ; guarda AL en la variable z
HLT           ; detiene la CPU
`;

type Placement = "top" | "bottom" | "left" | "right";

type Live = {
  programLoaded: boolean;
  started: boolean;
  instructions: number;
  al: number;
  ip: number;
  vars: { label: string; address: number; value: number }[];
};

type Step = {
  id: string;
  /** Selector CSS del elemento a resaltar. Sin selector, la tarjeta se centra. */
  target?: string;
  placement?: Placement;
  /** Componente del panel de la computadora a centrar (pan/zoom) al entrar al paso. */
  focus?: string;
  title: string;
  body: (live: Live) => React.ReactNode;
  /** Acción opcional que el alumno puede pedirle a la guía ("hacelo por mí"). */
  action?: { label: string; run: () => void };
  /** Si devuelve un texto, se muestra como logro alcanzado en el paso. */
  done?: (live: Live) => string | null;
};

const hex = (n: number, digits = 2) => n.toString(16).toUpperCase().padStart(digits, "0") + "h";

const Code = ({ children }: { children: React.ReactNode }) => (
  <code className="rounded bg-stone-800 px-1 py-0.5 font-mono text-mantis-300">{children}</code>
);

const Key = ({ children }: { children: React.ReactNode }) => (
  <kbd className="rounded border border-stone-600 bg-stone-800 px-1 font-mono text-xs text-stone-200">
    {children}
  </kbd>
);

const INSTRUCTION_BUTTON = '[data-testid="controls"] [data-testid="new-button"]';
const CYCLE_BUTTON = '[data-testid="controls"] [data-testid="cycle-button"]';

function getEditorText() {
  return window.codemirror?.state.doc.toString() ?? "";
}

const useLiveState = (): Live => {
  const { status } = useSimulation();
  const instructions = useAtomValue(instructionCountAtom);
  const al = useAtomValue(registerAtoms.AL as PrimitiveAtom<Byte<8>>);
  const ip = useAtomValue(registerAtoms.IP as PrimitiveAtom<Byte<16>>);
  const memory = useAtomValue(memoryAtom);
  const dataAddresses = useAtomValue(dataAddressesAtom);

  // El contenido del editor no vive en un átomo: lo consultamos periódicamente.
  const [programLoaded, setProgramLoaded] = useState(false);
  useEffect(() => {
    const check = () => setProgramLoaded(getEditorText().trim() === FIRST_STEPS_PROGRAM.trim());
    check();
    const id = window.setInterval(check, 400);
    return () => window.clearInterval(id);
  }, []);

  const vars = dataAddresses
    .filter(d => d.label)
    .map(d => ({
      label: d.label as string,
      address: d.address,
      value: Number(memory[d.address]?.unsigned ?? 0),
    }));

  return {
    programLoaded,
    started: status.type !== "stopped" || instructions > 0,
    instructions,
    al: Number(al?.unsigned ?? 0),
    ip: Number(ip?.unsigned ?? 0),
    vars,
  };
};

const useSteps = (): Step[] => {
  const { status, dispatch } = useSimulation();

  const loadProgram = useCallback(() => {
    if (!window.codemirror) return;
    if (status.type !== "stopped") dispatch("cpu.stop", true);
    window.codemirror.dispatch({
      changes: { from: 0, to: window.codemirror.state.doc.length, insert: FIRST_STEPS_PROGRAM },
    });
  }, [status.type, dispatch]);

  const runInstruction = useCallback(() => {
    if (status.type === "running") return;
    if (status.type === "stopped" && getEditorText().trim() !== FIRST_STEPS_PROGRAM.trim()) {
      loadProgram();
    }
    dispatch("cpu.run", "end-of-instruction");
  }, [status.type, dispatch, loadProgram]);

  const runCycle = useCallback(() => {
    if (status.type === "running") return;
    dispatch("cpu.run", "cycle-change");
  }, [status.type, dispatch]);

  const varLine = (live: Live, name: string) => {
    const v = live.vars.find(x => x.label.toLowerCase() === name);
    return v ? (
      <li key={name}>
        <Code>{name}</Code> está en la dirección <Code>{hex(v.address)}</Code> y vale{" "}
        <Code>{hex(v.value)}</Code>
      </li>
    ) : null;
  };

  return [
    {
      id: "intro",
      title: "Primeros pasos con VonSim8",
      body: () => (
        <>
          <p>
            En unos minutos vas a <strong>escribir</strong> un programa,{" "}
            <strong>ensamblarlo</strong>, <strong>ejecutarlo paso a paso</strong> y ver qué pasa
            adentro de la computadora.
          </p>
          <p>
            El programa calcula <Code>z = x + y</Code>. Podés cerrar esta guía cuando quieras con{" "}
            <Key>Esc</Key> y volver a abrirla desde el botón de ayuda{" "}
            <span className="font-bold text-mantis-400">?</span> de arriba.
          </p>
        </>
      ),
    },
    {
      id: "editor",
      target: '[data-testid="panel-editor"]',
      placement: "right",
      title: "1. El editor",
      body: () => (
        <>
          <p>
            Acá se escribe el programa en lenguaje ensamblador. Cargá el ejemplo con el botón de
            abajo (si tenías código, podés recuperarlo con <Key>Ctrl+Z</Key>).
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <Code>DB</Code> reserva un byte de memoria para una variable.
            </li>
            <li>
              <Code>MOV</Code> copia datos, <Code>ADD</Code> suma y <Code>HLT</Code> detiene la CPU.
            </li>
            <li>
              Lo que va después de <Code>;</Code> es un comentario.
            </li>
          </ul>
        </>
      ),
      action: { label: "Cargar programa de ejemplo", run: loadProgram },
      done: live => (live.programLoaded ? "Programa cargado en el editor" : null),
    },
    {
      id: "assemble",
      target: INSTRUCTION_BUTTON,
      placement: "bottom",
      title: "2. Ensamblar y ejecutar",
      body: () => (
        <>
          <p>
            <strong>Ensamblar</strong> es traducir tu programa a <em>código máquina</em>: los bytes
            que la CPU entiende. VonSim8 ensambla solo cuando empezás a ejecutar, y si hay un error
            te avisa qué línea revisar.
          </p>
          <p>
            Presioná el botón resaltado <strong>Instrucción</strong> (o <Key>F8</Key>) para
            ensamblar y ejecutar la primera instrucción: <Code>MOV AL, x</Code>.
          </p>
        </>
      ),
      action: { label: "Ejecutar 1 instrucción", run: runInstruction },
      done: live =>
        live.instructions > 0 ? "¡Ensamblado! Ya se ejecutó la primera instrucción" : null,
    },
    {
      id: "memory",
      target: '[data-testid="memory-component"]',
      focus: '[data-testid="memory-component"]',
      placement: "left",
      title: "3. La memoria",
      body: live => (
        <>
          <p>
            Al ensamblar, las variables y las instrucciones se guardaron en la memoria. Cada celda
            es un byte y se muestra en hexadecimal (por eso el sufijo <Code>h</Code>).
          </p>
          {live.vars.length > 0 ? (
            <ul className="list-disc space-y-1 pl-5">
              {["x", "y", "z"].map(name => varLine(live, name))}
            </ul>
          ) : (
            <p className="text-stone-400">
              Ejecutá al menos una instrucción para ver dónde quedó cada variable.
            </p>
          )}
          <p className="text-xs text-stone-400">
            Si no ves la memoria, arrastrá el panel de la computadora o usá el zoom.
          </p>
        </>
      ),
    },
    {
      id: "registers",
      target: '[data-tour="register-AL"]',
      focus: '[data-testid="cpu-component"]',
      placement: "left",
      title: "4. Los registros",
      body: live => (
        <>
          <p>
            Los registros son la memoria interna y rapidísima de la CPU. <Code>MOV AL, x</Code>{" "}
            copió el valor de <Code>x</Code> en <Code>AL</Code>, que ahora vale{" "}
            <Code>{hex(live.al)}</Code>.
          </p>
          <p>
            El registro <Code>IP</Code> (abajo, en rojo) indica la dirección de la <em>próxima</em>{" "}
            instrucción: ahora vale <Code>{hex(live.ip)}</Code>.
          </p>
        </>
      ),
    },
    {
      id: "step",
      target: INSTRUCTION_BUTTON,
      placement: "bottom",
      title: "5. Seguí paso a paso",
      body: live => {
        const z = live.vars.find(v => v.label.toLowerCase() === "z");
        return (
          <>
            <p>
              Presioná <strong>Instrucción</strong> (<Key>F8</Key>) dos veces más y observá:
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                después de <Code>ADD AL, y</Code>, <Code>AL</Code> pasa a valer <Code>05h</Code>{" "}
                (ahora: <Code>{hex(live.al)}</Code>);
              </li>
              <li>
                después de <Code>MOV z, AL</Code>, la celda de <Code>z</Code> en memoria también
                vale <Code>05h</Code> (ahora: <Code>{hex(z?.value ?? 0)}</Code>).
              </li>
            </ul>
          </>
        );
      },
      action: { label: "Ejecutar siguiente instrucción", run: runInstruction },
      done: live => {
        const z = live.vars.find(v => v.label.toLowerCase() === "z");
        return z && z.value === 5 ? "¡Listo! z = x + y = 05h" : null;
      },
    },
    {
      id: "cycle",
      target: CYCLE_BUTTON,
      placement: "bottom",
      title: "6. Más detalle: por ciclo",
      body: () => (
        <>
          <p>
            El botón <strong>Ciclo</strong> (<Key>F7</Key>) avanza de a una microoperación: vas a
            ver cómo la CPU <em>busca</em>, <em>decodifica</em> y <em>ejecuta</em> cada instrucción,
            y cómo viajan los datos por los buses.
          </p>
          <p>
            Con <strong>Reiniciar</strong> (<Key>F9</Key>) volvés al principio para probar de nuevo
            o editar el programa.
          </p>
        </>
      ),
      action: { label: "Avanzar 1 ciclo", run: runCycle },
    },
    {
      id: "end",
      title: "¡Ya sabés lo básico!",
      body: () => (
        <>
          <p>Probá cambiar los valores de x e y, o la operación, y volvé a ejecutar.</p>
          <p>
            En la barra de abajo del editor hay más <strong>ejemplos</strong>, y desde el botón de
            ayuda <span className="font-bold text-mantis-400">?</span> podés repetir esta guía o
            hacer un recorrido por toda la interfaz.
          </p>
        </>
      ),
    },
  ];
};

type Rect = { top: number; left: number; width: number; height: number };

const sameRect = (a: Rect | null, b: Rect | null) =>
  a === b ||
  (!!a &&
    !!b &&
    Math.abs(a.top - b.top) < 1 &&
    Math.abs(a.left - b.left) < 1 &&
    Math.abs(a.width - b.width) < 1 &&
    Math.abs(a.height - b.height) < 1);

/** Rectángulo visible del objetivo (recortado a la ventana), o null si no existe. */
function measureTarget(selector?: string): Rect | null {
  if (!selector) return null;
  const el = document.querySelector(selector);
  if (!el) return null;
  // Algunos contenedores tienen tamaño 0 y sus hijos están posicionados en
  // forma absoluta: en ese caso se usa la unión de los rectángulos de sus descendientes.
  let r: {
    top: number;
    left: number;
    right: number;
    bottom: number;
    width: number;
    height: number;
  } = el.getBoundingClientRect();
  if (r.width === 0 && r.height === 0 && el.children.length > 0) {
    const rects = Array.from(el.querySelectorAll("*"))
      .map(c => c.getBoundingClientRect())
      .filter(x => x.width > 0 && x.height > 0);
    if (rects.length === 0) return null;
    const top = Math.min(...rects.map(x => x.top));
    const left = Math.min(...rects.map(x => x.left));
    const right = Math.max(...rects.map(x => x.right));
    const bottom = Math.max(...rects.map(x => x.bottom));
    r = { top, left, right, bottom, width: right - left, height: bottom - top };
  }
  if (r.width === 0 && r.height === 0) return null;
  const pad = 6;
  const top = Math.max(r.top - pad, 4);
  const left = Math.max(r.left - pad, 4);
  const bottom = Math.min(r.bottom + pad, window.innerHeight - 4);
  const right = Math.min(r.right + pad, window.innerWidth - 4);
  if (bottom <= top || right <= left) return null;
  return { top, left, width: right - left, height: bottom - top };
}

const GAP = 14;
const MARGIN = 12;

function placeCard(
  target: Rect | null,
  card: { width: number; height: number },
  preferred: Placement,
): { top: number; left: number } {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

  if (!target) {
    return { top: (vh - card.height) / 2, left: (vw - card.width) / 2 };
  }

  const candidates: Record<Placement, { top: number; left: number; fits: boolean }> = {
    bottom: {
      top: target.top + target.height + GAP,
      left: target.left + target.width / 2 - card.width / 2,
      fits: target.top + target.height + GAP + card.height <= vh - MARGIN,
    },
    top: {
      top: target.top - GAP - card.height,
      left: target.left + target.width / 2 - card.width / 2,
      fits: target.top - GAP - card.height >= MARGIN,
    },
    right: {
      top: target.top + target.height / 2 - card.height / 2,
      left: target.left + target.width + GAP,
      fits: target.left + target.width + GAP + card.width <= vw - MARGIN,
    },
    left: {
      top: target.top + target.height / 2 - card.height / 2,
      left: target.left - GAP - card.width,
      fits: target.left - GAP - card.width >= MARGIN,
    },
  };

  const order: Placement[] = [
    preferred,
    ...(["bottom", "right", "left", "top"] as Placement[]).filter(p => p !== preferred),
  ];
  const chosen = order.map(p => candidates[p]).find(c => c.fits);

  // Si no entra en ningún lado (objetivo muy grande), la tarjeta va abajo a la derecha.
  const pos = chosen ?? { top: vh - card.height - MARGIN, left: vw - card.width - MARGIN };

  return {
    top: clamp(pos.top, MARGIN, Math.max(MARGIN, vh - card.height - MARGIN)),
    left: clamp(pos.left, MARGIN, Math.max(MARGIN, vw - card.width - MARGIN)),
  };
}

export const FirstStepsTour = memo(() => {
  const [open, setOpen] = useAtom(firstStepsOpenAtom);

  const close = useCallback(() => {
    setOpen(false);
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // localStorage puede no estar disponible (modo privado); no es crítico
    }
  }, [setOpen]);

  // El contenido se monta solo mientras la guía está abierta: así cada
  // apertura empieza desde el primer paso y no hay suscripciones en segundo plano.
  if (open !== true) return null;
  return <TourOverlay onClose={close} />;
});

FirstStepsTour.displayName = "FirstStepsTour";

function TourOverlay({ onClose: close }: { onClose: () => void }) {
  const [index, setIndex] = useState(0);
  const steps = useSteps();
  const live = useLiveState();
  const cardRef = useRef<HTMLDivElement>(null);
  const [target, setTarget] = useState<Rect | null>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  const step = steps[Math.min(index, steps.length - 1)];
  const isFirst = index === 0;
  const isLast = index === steps.length - 1;

  const next = useCallback(() => setIndex(i => Math.min(i + 1, steps.length - 1)), [steps.length]);
  const prev = useCallback(() => setIndex(i => Math.max(i - 1, 0)), []);

  // Seguir la posición del objetivo: los paneles se pueden redimensionar,
  // desplazar o hacer zoom mientras la guía está abierta.
  useLayoutEffect(() => {
    const update = () => {
      const t = measureTarget(step.target);
      setTarget(prevRect => (sameRect(prevRect, t) ? prevRect : t));
      const card = cardRef.current;
      if (card) {
        const p = placeCard(
          t,
          { width: card.offsetWidth, height: card.offsetHeight },
          step.placement ?? "bottom",
        );
        setPos(prevPos =>
          prevPos && Math.abs(prevPos.top - p.top) < 1 && Math.abs(prevPos.left - p.left) < 1
            ? prevPos
            : p,
        );
      }
    };
    update();
    const id = window.setInterval(update, 250);
    window.addEventListener("resize", update);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("resize", update);
    };
  }, [step]);

  // Centrar en el panel de la computadora el componente del paso
  useEffect(() => {
    if (!step.focus) return;
    window.dispatchEvent(
      new CustomEvent(COMPUTER_FOCUS_EVENT, { detail: { selector: step.focus } }),
    );
  }, [step.focus]);

  // Mover el foco a la tarjeta en cada paso (accesibilidad)
  useEffect(() => {
    cardRef.current?.focus({ preventScroll: true });
  }, [index]);

  // Teclado: Esc cierra; flechas navegan salvo que se esté escribiendo en el editor
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
        return;
      }
      const el = e.target as HTMLElement | null;
      const typing =
        !!el &&
        (el.isContentEditable ||
          el.tagName === "INPUT" ||
          el.tagName === "TEXTAREA" ||
          !!el.closest?.(".cm-editor"));
      if (typing) return;
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [close, next, prev]);

  const achievement = step.done?.(live) ?? null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50" data-testid="first-steps-tour">
      {/* Fondo oscurecido con un "hueco" sobre el elemento resaltado. No bloquea clics. */}
      {target ? (
        <div
          className="absolute rounded-lg border-2 border-mantis-400 transition-all duration-300"
          style={{ ...target, boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.55)" }}
        />
      ) : (
        <div className="absolute inset-0 bg-black/55" />
      )}

      <div
        ref={cardRef}
        role="dialog"
        aria-modal="false"
        aria-labelledby="first-steps-title"
        tabIndex={-1}
        data-testid="first-steps-card"
        className={clsx(
          "pointer-events-auto absolute w-[min(380px,calc(100vw-24px))] rounded-lg border border-mantis-400 bg-stone-900 p-5 text-white shadow-2xl focus:outline-none",
          pos ? "animate-fade-in" : "invisible",
        )}
        style={pos ?? { top: 0, left: 0 }}
      >
        <button
          onClick={close}
          className="absolute right-2 top-2 rounded p-1 text-stone-400 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-mantis-400"
          aria-label="Cerrar guía"
          data-testid="first-steps-close"
        >
          <FontAwesomeIcon icon={faTimes} size="sm" />
        </button>

        <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-stone-700">
          <div
            className="h-full bg-mantis-500 transition-all duration-300"
            style={{ width: `${((index + 1) / steps.length) * 100}%` }}
          />
        </div>

        <h3 id="first-steps-title" className="mb-2 pr-6 text-lg font-semibold text-mantis-400">
          {step.title}
        </h3>
        <div className="space-y-2 text-sm leading-relaxed text-stone-300">{step.body(live)}</div>

        {(step.action || achievement) && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {step.action && !achievement && (
              <Button
                size="sm"
                variant="outline"
                onClick={step.action.run}
                leftIcon={<FontAwesomeIcon icon={faHandPointer} />}
                data-testid="first-steps-action"
              >
                {step.action.label}
              </Button>
            )}
            {achievement && (
              <span
                className="flex items-center gap-1.5 text-sm font-medium text-mantis-300"
                role="status"
              >
                <FontAwesomeIcon icon={faCheckCircle} />
                {achievement}
              </span>
            )}
          </div>
        )}

        <div className="mt-4 flex items-center justify-between gap-2">
          <span className="text-xs text-stone-500">
            Paso {index + 1} de {steps.length}
          </span>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={prev}
              disabled={isFirst}
              leftIcon={<FontAwesomeIcon icon={faChevronLeft} />}
              data-testid="first-steps-prev"
            >
              Anterior
            </Button>
            {isLast ? (
              <Button
                size="sm"
                onClick={close}
                className="bg-mantis-600 hover:bg-mantis-700"
                rightIcon={<FontAwesomeIcon icon={faCheckCircle} />}
                data-testid="first-steps-finish"
              >
                Terminar
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={next}
                className="bg-mantis-600 hover:bg-mantis-700"
                rightIcon={<FontAwesomeIcon icon={faChevronRight} />}
                data-testid="first-steps-next"
              >
                {isFirst ? "Empezar" : "Siguiente"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
