import { useCallback } from "react";

import { useSimulation } from "@/computer/simulation";
import type { MobileTab } from "@/lib/mobile-tab";

import { FIRST_STEPS_PROGRAM, getEditorText, type Live } from "./live";
import type { Placement } from "./positioning";

export type Step = {
  id: string;
  /** Selector CSS del elemento a resaltar. Sin selector, la tarjeta se centra. */
  target?: string;
  placement?: Placement;
  /** En el diseño móvil, pestaña que debe estar visible en este paso. */
  mobileTab?: MobileTab;
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

export const useSteps = (): Step[] => {
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
      mobileTab: "editor",
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
      mobileTab: "computer",
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
      mobileTab: "computer",
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
      mobileTab: "computer",
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
      mobileTab: "computer",
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
      mobileTab: "computer",
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
