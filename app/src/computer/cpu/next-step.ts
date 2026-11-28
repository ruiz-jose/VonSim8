/**
 * Predice el próximo paso del ciclo de instrucción a partir de la instrucción
 * en curso, siguiendo los ciclos documentados en docs/instructioncycle. Lo usa
 * el modo práctica para preguntar "¿qué va a hacer la CPU ahora?" antes de que
 * el paso ocurra. Si no sabe predecir un paso, devuelve null y no se pregunta.
 */

export const FETCH_STEPS = ["MAR ← IP", "MBR ← read(Memoria[MAR]) | IP ← IP + 1", "IR ← MBR"];
const READ_NEXT_BYTE = ["MAR ← IP", "MBR ← read(Memoria[MAR]) | IP ← IP + 1"];
const READ = "MBR ← read(Memoria[MAR])";
const WRITE = "write(Memoria[MAR]) ← MBR";

const ALU_BINARY = new Set(["ADD", "ADC", "SUB", "SBB", "AND", "OR", "XOR", "CMP"]);
const CONDITIONAL_JUMPS: Record<string, (f: Flags) => boolean> = {
  JC: f => f.CF,
  JNC: f => !f.CF,
  JZ: f => f.ZF,
  JNZ: f => !f.ZF,
  JS: f => f.SF,
  JNS: f => !f.SF,
  JO: f => f.OF,
  JNO: f => !f.OF,
};

export type Flags = { CF: boolean; ZF: boolean; SF: boolean; OF: boolean };
export type InstructionInfo = { name: string; operands: string[] };

type OperandKind = "reg" | "ind" | "dir" | "imm";

function kindOf(operand: string): OperandKind {
  const op = operand.trim().toUpperCase();
  if (/^[A-D][LHX]$/.test(op)) return "reg";
  if (op === "[BL]") return "ind";
  if (/^\[.*\]$/.test(op)) return "dir";
  return "imm";
}

/** Operación de la instrucción con el formato que usa el panel. */
function operation(name: string, dest: string, src: string) {
  if (name === "MOV") return `${dest} ← ${src}`;
  if (name === "CMP") return `${dest} CMP ${src} | update(FLAGS)`;
  return `${dest} ← ${dest} ${name} ${src} | update(FLAGS)`;
}

function twoOperandSteps(name: string, [destOp, srcOp]: string[]): string[] | null {
  const dest = kindOf(destOp);
  const src = kindOf(srcOp);
  const isMov = name === "MOV";
  const writeBack = name === "CMP" ? [] : [WRITE];

  if (dest === "reg") {
    const rx = destOp.toUpperCase();
    if (src === "reg") return [operation(name, rx, srcOp.toUpperCase())];
    if (src === "imm") return [...READ_NEXT_BYTE, operation(name, rx, "MBR")];
    if (src === "dir") return [...READ_NEXT_BYTE, "MAR ← MBR", READ, operation(name, rx, "MBR")];
    if (src === "ind") return ["MAR ← BL", READ, operation(name, rx, "MBR")];
  }

  if ((dest === "dir" || dest === "ind") && src === "reg") {
    const ry = srcOp.toUpperCase();
    const address = dest === "dir" ? [...READ_NEXT_BYTE, "MAR ← MBR"] : ["MAR ← BL"];
    if (isMov) return [...address, `MBR ← ${ry}`, WRITE];
    return [...address, READ, operation(name, "MBR", ry), ...writeBack];
  }

  if (dest === "dir" && src === "imm") {
    const start = [
      ...READ_NEXT_BYTE,
      "MAR ← IP | ri ← MBR",
      "MBR ← read(Memoria[MAR]) | IP ← IP + 1",
    ];
    if (isMov) return [...start, "MAR ← ri", WRITE];
    return [...start, "MAR ← ri | id ← MBR", READ, operation(name, "MBR", "id"), ...writeBack];
  }

  if (dest === "ind" && src === "imm") {
    if (isMov) return [...READ_NEXT_BYTE, "MAR ← BL", WRITE];
    return [
      ...READ_NEXT_BYTE,
      "MAR ← BL | id ← MBR",
      READ,
      operation(name, "MBR", "id"),
      ...writeBack,
    ];
  }

  return null;
}

/**
 * Pasos de la etapa de ejecución (después de la captación) de una
 * instrucción, o null si no se conocen.
 */
export function executeSteps(ins: InstructionInfo, flags: Flags): string[] | null {
  const name = ins.name.toUpperCase();
  const ops = ins.operands;

  if (name === "MOV" || ALU_BINARY.has(name)) {
    return ops.length === 2 ? twoOperandSteps(name, ops) : null;
  }
  if (name === "JMP") return [...READ_NEXT_BYTE, "IP ← MBR"];
  if (name in CONDITIONAL_JUMPS) {
    return [...READ_NEXT_BYTE, ...(CONDITIONAL_JUMPS[name](flags) ? ["IP ← MBR"] : [])];
  }
  if (name === "CALL") {
    return [
      ...READ_NEXT_BYTE,
      "ri ← MBR | SP ← SP - 1",
      "MAR ← SP | MBR ← IP",
      "write(Memoria[MAR]) ← MBR | IP ← ri",
    ];
  }
  if (name === "RET") return ["MAR ← SP", READ, "IP ← MBR | SP ← SP + 1"];
  if (name === "PUSH" && ops.length === 1) {
    return [`MBR ← ${ops[0].toUpperCase()} | SP ← SP - 1`, "MAR ← SP", WRITE];
  }
  if (name === "POP" && ops.length === 1) {
    return ["MAR ← SP", READ, `${ops[0].toUpperCase()} ← MBR | SP ← SP + 1`];
  }
  if (name === "CLI") return ["update(Flags I=0)"];
  if (name === "STI") return ["update(Flags I=1)"];
  return null;
}

/**
 * Próximo paso, sabiendo cuántos pasos de la instrucción actual ya ocurrieron.
 * Con 0 pasos (instrucción nueva) siempre es "MAR ← IP".
 */
export function predictNextStep(
  stepsDone: number,
  ins: InstructionInfo | null,
  flags: Flags,
): string | null {
  if (stepsDone < FETCH_STEPS.length) return FETCH_STEPS[stepsDone];
  if (!ins) return null;
  const execute = executeSteps(ins, flags);
  if (!execute) return null;
  return execute[stepsDone - FETCH_STEPS.length] ?? null;
}

/** Forma comparable de un paso: sin espacios extra, "=" como "←" y partes ordenadas. */
export function normalizeStep(step: string): string {
  return step
    .split(/\s*[|;]\s*/)
    .map(part => part.trim().replace(/\s+/g, " ").replace(/ = /g, " ← ").toUpperCase())
    .filter(Boolean)
    .sort()
    .join(" | ");
}

export const sameStep = (a: string, b: string) => normalizeStep(a) === normalizeStep(b);
