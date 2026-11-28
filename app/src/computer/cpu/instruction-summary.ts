import type { CycleMessage } from "./state";

/**
 * Resumen de una instrucción ya ejecutada, armado a partir de los pasos del
 * ciclo que quedaron registrados en el panel. Sigue la división de Stallings:
 * ciclo de búsqueda (captación) + ciclo de ejecución.
 */
export type InstructionSummary = {
  instruction?: string;
  /** Ciclos de reloj totales de la instrucción. */
  cycles: number;
  fetchCycles: number;
  executeCycles: number;
  interruptCycles: number;
  memoryReads: number;
  /** Lecturas hechas durante la búsqueda (traer el código de la instrucción). */
  fetchMemoryReads: number;
  memoryWrites: number;
  ioReads: number;
  ioWrites: number;
  /** Registros visibles para el programador que cambiaron (AL, BL, SP, Flags…). */
  changedRegisters: string[];
  /** Direcciones (o nombres de variable) donde se escribió en memoria. */
  writtenTo: string[];
  /** La instrucción cambió IP a otra dirección (salto, CALL, RET…). */
  jumped: boolean;
};

const VISIBLE_REGISTER = /^(?:[A-D][LHX]|SP)$/;
const ALU = /^(?:(\S+) ← )?(\S+) (ADD|ADC|SUB|SBB|AND|OR|XOR|CMP|INC|DEC|NEG|NOT) \S+$/;

const hex = (n: number) => `${n.toString(16).toUpperCase().padStart(2, "0")}h`;

function addUnique(list: string[], value: string) {
  if (!list.includes(value)) list.push(value);
}

export function summarizeInstruction(steps: CycleMessage[]): InstructionSummary {
  const summary: InstructionSummary = {
    instruction: steps.find(s => s.instruction)?.instruction,
    cycles: steps.length > 0 ? Math.max(...steps.map(s => s.cycle)) : 0,
    fetchCycles: steps.filter(s => s.stage === "Captación").length,
    executeCycles: 0,
    interruptCycles: steps.filter(s => s.stage === "Interrupción").length,
    memoryReads: 0,
    fetchMemoryReads: 0,
    memoryWrites: 0,
    ioReads: 0,
    ioWrites: 0,
    changedRegisters: [],
    writtenTo: [],
    jumped: false,
  };
  summary.executeCycles = Math.max(
    0,
    summary.cycles - summary.fetchCycles - summary.interruptCycles,
  );

  for (const step of steps) {
    for (const raw of step.action.split(/\s*[|;]\s*/)) {
      const part = raw.trim();
      if (/^MBR ← read\(Memoria\[MAR\]\)$/.test(part)) {
        summary.memoryReads++;
        if (step.stage === "Captación") summary.fetchMemoryReads++;
      } else if (/^MBR ← read\(PIO\[MAR\]\)$/.test(part)) summary.ioReads++;
      else if (/^write\(PIO\[MAR\]\) ← MBR$/.test(part)) summary.ioWrites++;
      else if (/^write\(Memoria\[MAR\]\) ← MBR$/.test(part)) {
        summary.memoryWrites++;
        const where =
          step.marLabel ?? (step.marAddress !== undefined ? hex(step.marAddress) : null);
        if (where) addUnique(summary.writtenTo, where);
      } else if (/^update\(FLAGS\)$/i.test(part) || /^Flags ← /i.test(part)) {
        addUnique(summary.changedRegisters, "Flags");
      } else if (/^SP (?:←|=) SP [-+] 1$/.test(part)) {
        addUnique(summary.changedRegisters, "SP");
      } else if (/^IP ← (?:MBR|ri)$/.test(part)) {
        summary.jumped = true;
      } else {
        const alu = ALU.exec(part);
        if (alu) {
          const [, assigned, dest, op] = alu;
          const target = assigned ?? dest;
          if (op !== "CMP" && VISIBLE_REGISTER.test(target))
            addUnique(summary.changedRegisters, target);
          addUnique(summary.changedRegisters, "Flags");
          continue;
        }
        const copy = /^(\S+) ← \S+$/.exec(part);
        if (copy && VISIBLE_REGISTER.test(copy[1])) addUnique(summary.changedRegisters, copy[1]);
      }
    }
  }

  // Flags al final, como en la pantalla de la CPU
  summary.changedRegisters.sort((a, b) => Number(a === "Flags") - Number(b === "Flags"));
  return summary;
}

/** Agrupa los pasos del panel por instrucción (el contador de ciclos vuelve a empezar). */
export function groupByInstruction(messages: CycleMessage[]): CycleMessage[][] {
  const groups: CycleMessage[][] = [];
  messages.forEach((msg, index) => {
    const prev = messages[index - 1];
    if (index === 0 || msg.cycle <= prev.cycle) groups.push([msg]);
    else groups[groups.length - 1].push(msg);
  });
  return groups;
}
