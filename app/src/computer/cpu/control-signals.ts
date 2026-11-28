/**
 * Señales de control que el secuenciador envía a los componentes de la CPU
 * para ejecutar una microinstrucción (un paso del ciclo, con la notación del
 * panel "Ciclo de instrucción", ej. "MBR ← read(Memoria[MAR]) | IP ← IP + 1").
 *
 * La unidad de control las muestra como si las leyera de la memoria de
 * control: cada paso del ciclo es una palabra de la memoria de control y cada
 * señal es un bit encendido de esa palabra.
 */

export type SignalKind = "out" | "load" | "mem" | "alu" | "inc";

export type ControlSignal = {
  /** Texto corto que se muestra en la señal (ej. "carga MAR") */
  label: string;
  /** Explicación para el alumno (se muestra al pasar el mouse) */
  hint: string;
  kind: SignalKind;
};

const out = (reg: string): ControlSignal => ({
  label: `salida ${reg}`,
  hint: `${reg} pone su valor en el bus`,
  kind: "out",
});

const load = (reg: string): ControlSignal => ({
  label: `carga ${reg}`,
  hint: `${reg} guarda el valor que llega por el bus`,
  kind: "load",
});

const alu = (op: string): ControlSignal => ({
  label: `ALU: ${op}`,
  hint: `La ALU hace la operación ${op}`,
  kind: "alu",
});

// Registros que se incrementan o decrementan sin pasar por la ALU
const COUNTERS = new Set(["IP", "SP"]);

function signalsForPart(part: string): ControlSignal[] {
  let m: RegExpExecArray | null;

  if (/^update\(FLAGS\)$/i.test(part)) return [load("FLAGS")];

  if ((m = /^update\(Flags I=([01])\)$/i.exec(part))) {
    return [{ label: `FLAGS: I ← ${m[1]}`, hint: `El flag I pasa a ${m[1]}`, kind: "load" }];
  }

  if (/^MBR ← read\(Memoria\[MAR\]\)$/i.test(part)) {
    return [
      { label: "RD", hint: "Ordena a la memoria leer la celda que indica MAR", kind: "mem" },
      load("MBR"),
    ];
  }

  if (/^write\(Memoria\[MAR\]\) ← MBR$/i.test(part)) {
    return [
      out("MBR"),
      { label: "WR", hint: "Ordena a la memoria escribir en la celda que indica MAR", kind: "mem" },
    ];
  }

  // X ← X + 1 / X ← X - 1
  if ((m = /^(\w+) ← (\w+) ([+-]) 1$/.exec(part)) && m[1] === m[2]) {
    const [, reg, , sign] = m;
    if (COUNTERS.has(reg.toUpperCase())) {
      const text = sign === "+" ? "+ 1" : "− 1";
      return [
        {
          label: `${reg} ${text}`,
          hint: `${reg} ${sign === "+" ? "se incrementa" : "se decrementa"} en 1`,
          kind: "inc",
        },
      ];
    }
    return [out(reg), alu(sign === "+" ? "INC" : "DEC"), load(reg)];
  }

  // X ← NOT X / X ← NEG X
  if ((m = /^(\w+) ← (NOT|NEG) (\w+)$/.exec(part))) {
    return [out(m[3]), alu(m[2]), load(m[1])];
  }

  // X ← X op Y
  if ((m = /^(\w+) ← (\w+) (ADD|ADC|SUB|SBB|AND|OR|XOR) (\w+)$/.exec(part))) {
    return [out(m[2]), out(m[4]), alu(m[3]), load(m[1])];
  }

  // X CMP Y (no guarda el resultado)
  if ((m = /^(\w+) CMP (\w+)$/.exec(part))) {
    return [out(m[1]), out(m[2]), alu("CMP")];
  }

  // X ← Y
  if ((m = /^(\w+) ← (\w+)$/.exec(part))) {
    return [out(m[2]), load(m[1])];
  }

  return [];
}

/** Señales de control de un paso del ciclo, sin repetir. */
export function controlSignals(step: string | null | undefined): ControlSignal[] {
  if (!step) return [];
  const signals: ControlSignal[] = [];
  for (const raw of step.split("|")) {
    const part = raw.trim().replace(/\s+/g, " ");
    for (const signal of signalsForPart(part)) {
      if (!signals.some(s => s.label === signal.label)) signals.push(signal);
    }
  }
  return signals;
}
