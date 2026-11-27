/**
 * Explicaciones en lenguaje simple para el panel "Ciclo de instrucción".
 *
 * El simulador describe cada paso con notación de transferencia de registros
 * (por ejemplo "MAR ← IP"). Estas funciones traducen esa notación a frases
 * cortas pensadas para alumnos, sin tocar la lógica de la simulación.
 */

export type CycleStage =
  | "Captación"
  | "Obtención de operandos"
  | "Ejecución"
  | "Escritura"
  | "Interrupción";

type CpuPhase =
  | "fetching"
  | "fetching-operands"
  | "fetching-operands-completed"
  | "executing"
  | "writeback"
  | "interrupt"
  | "int6"
  | "int7"
  | "halting"
  | "stopped"
  | string;

/**
 * Nombre de la fase que se muestra en el panel. El simulador etiqueta como
 * "Ejecución" todos los pasos posteriores a la captación; acá se usa la fase
 * real de la CPU para que el panel coincida con la etiqueta de la unidad de
 * control (búsqueda de operandos, ejecución o escritura).
 */
export function resolveStage(rawStage: string, phase: CpuPhase | undefined, action = ""): string {
  if (rawStage !== "Ejecución") return rawStage;
  // Leer el byte siguiente de la instrucción (un dato inmediato o una
  // dirección) siempre es obtener un operando, aunque la CPU ya haya pasado a
  // la fase de escritura (pasa en MOV AL, 5).
  if (READS_NEXT_INSTRUCTION_BYTE.has(action)) return "Obtención de operandos";
  switch (phase) {
    case "fetching-operands":
    case "fetching-operands-completed":
      return "Obtención de operandos";
    case "writeback":
      return "Escritura";
    default:
      return "Ejecución";
  }
}

const READS_NEXT_INSTRUCTION_BYTE = new Set(["MAR ← IP", "MBR ← read(Memoria[MAR]) | IP ← IP + 1"]);

export const STAGE_DESCRIPTIONS: Record<string, string> = {
  Captación: "La CPU trae la instrucción desde la memoria",
  "Obtención de operandos": "La CPU busca los datos que necesita la instrucción",
  Ejecución: "La CPU realiza la operación",
  Escritura: "La CPU guarda el resultado",
  Interrupción: "La CPU atiende una interrupción",
};

const ALU_OPS = new Set([
  "ADD",
  "ADC",
  "SUB",
  "SBB",
  "AND",
  "OR",
  "XOR",
  "CMP",
  "INC",
  "DEC",
  "NEG",
  "NOT",
]);
const INTERNAL_REGS: Record<string, string> = {
  ri: "ri, un registro interno donde la CPU guarda una dirección por un momento",
  id: "id, un registro interno donde la CPU guarda un dato por un momento",
};

type ExplainContext = {
  stage: string;
  /** Nombre de la variable que está en la dirección de MAR, si la hay. */
  marLabel?: string | null;
};

function variableSuffix(ctx: ExplainContext) {
  return ctx.marLabel ? ` (la variable ${ctx.marLabel})` : "";
}

function explainPart(part: string, ctx: ExplainContext): string | null {
  const p = part.trim();
  if (!p) return null;

  if (p === "Detenido") return "La CPU se detuvo: el programa terminó.";

  // Lecturas y escrituras
  if (/^MBR ← read\(Memoria\[MAR\]\)$/.test(p)) {
    return `Se lee la memoria en la dirección que indica MAR${variableSuffix(ctx)} y el valor llega a MBR.`;
  }
  if (/^MBR ← read\(PIO\[MAR\]\)$/.test(p)) {
    return "Se lee el puerto de entrada/salida que indica MAR y el valor llega a MBR.";
  }
  if (/^write\(Memoria\[MAR\]\) ← MBR$/.test(p)) {
    return `Se escribe el valor de MBR en la memoria, en la dirección que indica MAR${variableSuffix(ctx)}.`;
  }
  if (/^write\(PIO\[MAR\]\) ← MBR$/.test(p)) {
    return "Se envía el valor de MBR al puerto de entrada/salida que indica MAR.";
  }

  // Registros especiales
  if (p === "MAR ← IP") {
    return ctx.stage === "Captación" || ctx.stage === "Interrupción"
      ? "MAR recibe la dirección de la próxima instrucción, que está en IP."
      : "MAR recibe la dirección del siguiente byte de la instrucción, que está en IP.";
  }
  if (p === "MAR ← SP") return "MAR recibe la dirección del tope de la pila, que está en SP.";
  if (p === "MAR ← MBR") {
    return "El byte leído es una dirección de memoria: pasa a MAR para ir a buscar el dato ahí.";
  }
  if (p === "IR ← MBR") {
    return "El byte leído pasa a IR (registro de instrucción). Ahora el decodificador sabe qué instrucción es.";
  }
  if (p === "IP ← IP + 1") return "IP avanza para apuntar al byte siguiente.";
  if (p === "IP ← MBR")
    return "IP toma una nueva dirección: la próxima instrucción se buscará ahí.";
  if (p === "IP ← ri")
    return "IP toma la dirección guardada en ri: la próxima instrucción se buscará ahí.";
  if (/^SP (?:←|=) SP - 1$/.test(p)) return "SP baja una posición: la pila crece.";
  if (/^SP (?:←|=) SP \+ 1$/.test(p)) return "SP sube una posición: se libera un lugar de la pila.";
  if (/^Flags ← MBR$/i.test(p)) return "Los flags recuperan el valor guardado en la pila.";
  if (/^update\(Flags I=0\)$/i.test(p)) return "Se desactivan las interrupciones (flag I = 0).";
  if (/^update\(Flags I=1\)$/i.test(p)) return "Se activan las interrupciones (flag I = 1).";
  if (/^update\(FLAGS\)$/i.test(p)) return "Los flags se actualizan según el resultado.";

  // Operación de la ALU: "AL ADD MBR" o "AL ← AL ADD MBR"
  const alu = /^(?:\S+ ← )?(\S+) ([A-Z]+) (\S+)$/.exec(p);
  if (alu && ALU_OPS.has(alu[2])) {
    const [, dest, op, src] = alu;
    return op === "CMP"
      ? `La ALU compara ${dest} con ${src} (resta sin guardar el resultado).`
      : `La ALU hace ${op} entre ${dest} y ${src}, y el resultado queda en ${dest}.`;
  }

  // Transferencias entre registros: "X ← Y"
  const copy = /^(\S+) ← (\S+)$/.exec(p);
  if (copy) {
    const [, dest, src] = copy;
    if (src === "MBR" && INTERNAL_REGS[dest])
      return `El byte leído se guarda en ${INTERNAL_REGS[dest]}.`;
    if (src === "MBR") return `El dato que llegó a MBR se copia a ${dest}.`;
    if (dest === "MBR") return `El valor de ${src} se copia a MBR para enviarlo a la memoria.`;
    if (dest === "MAR") return `MAR recibe la dirección guardada en ${src}.`;
    return `El valor de ${src} se copia a ${dest}.`;
  }

  return null;
}

/**
 * Devuelve una explicación en lenguaje simple para un paso del ciclo, o null
 * si la notación no es reconocida (en ese caso el panel solo muestra la
 * notación original).
 */
export function explainStep(action: string, ctx: ExplainContext): string | null {
  const parts = action.split(/\s*[|;]\s*/);
  const sentences = parts.map(part => explainPart(part, ctx)).filter(Boolean);
  if (sentences.length === 0) return null;
  // Evitar repetir "Los flags se actualizan" si la ALU ya lo dijo de otra forma
  return Array.from(new Set(sentences)).join(" ");
}

const strip = (reg: string) => reg.replace(/\.[lh]$/, "");

/**
 * Texto breve del paso que se está animando en este momento. Se muestra
 * mientras dura la animación, antes de que el paso quede registrado.
 */
export function describeLiveEvent(event: { type: string; [key: string]: any }): string | null {
  switch (event.type) {
    case "cpu:cycle.start":
      return "Empieza una nueva instrucción";
    case "cpu:mar.set":
      return `Copiando ${strip(event.register)} a MAR`;
    case "cpu:mbr.get":
      return `Copiando MBR a ${strip(event.register)}`;
    case "cpu:mbr.set":
      return `Copiando ${strip(event.register)} a MBR`;
    case "cpu:register.copy":
    case "cpu:register.buscopy":
      return `Copiando ${strip(event.src)} a ${strip(event.dest)}`;
    case "cpu:register.update":
      return `Actualizando ${strip(event.register)}`;
    case "cpu:rd.on":
    case "memory:read":
      return "Leyendo la memoria";
    case "cpu:wr.on":
    case "memory:write":
      return "Escribiendo en la memoria";
    case "cpu:alu.execute":
      return `La ALU calcula (${event.operation})`;
    case "cpu:decode":
      return "El decodificador interpreta la instrucción";
    default:
      return null;
  }
}
