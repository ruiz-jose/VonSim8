import { Byte } from "@vonsim/common/byte";
import type { ComputerState, SimulatorError } from "@vonsim/simulator";
import type { PhysicalRegister as SimulatorPhysicalRegister } from "@vonsim/simulator/cpu";
import { atom, PrimitiveAtom, SetStateAction, WritableAtom } from "jotai";

import { store } from "@/lib/jotai";

// Define a simple InstructionMetadata type
type InstructionMetadata = {
  name: string;
  position: { start: number; end: number };
  operands: string[];
  willUse?: { ri?: boolean; id?: boolean };
};

// Internal register atoms - not exported directly
const SPAtom = atom(Byte.zero(16)); // Stack Pointer
const IPAtom = atom(Byte.zero(16)); // Instruction Pointer
const IRAtom = atom(Byte.zero(8)); // Instruction Register
const riAtom = atom(Byte.zero(16)); // Register Index
const idAtom = atom(Byte.zero(16)); // Immediate Register
const leftAtom = atom(Byte.zero(16)); // Left operand for ALU
const rightAtom = atom(Byte.zero(16)); // Right operand for ALU
const resultAtom = atom(Byte.zero(16)); // Result of ALU
const FLAGSAtom = atom(Byte.zero(16)); // Flags
export const MARAtom = atom(Byte.zero(16)); // Memory Address Register
export const MBRAtom = atom(Byte.zero(8)); // Memory Buffer Register
export const messageAtom = atom<string>("");
// Define el átomo para cycleCount
export const cycleCountAtom = atom(0);
// Átomo para el total acumulado de ciclos ejecutados en todo el programa
export const totalCycleCountAtom = atom(0);
// Define el átomo para el contador de ciclos por instrucción actual
export const currentInstructionCycleCountAtom = atom(0);
export const showSPAtom = atom(false);
export const showriAtom = atom(false);
export const instructionCountAtom = atom(0); // Variable global para contar las instrucciones
export const messageHistoryAtom = atom<{ cycle: number; stage: string; action: string }[]>([]);
// Crear un átomo para almacenar el valor de connectScreenAndKeyboard
export const connectScreenAndKeyboardAtom = atom(false);
export const showInstructionCycleAtom = atom(true); // Por defecto, visible
export const showCPUStatsAtom = atom(true); // Por defecto, visible
export const hasINTInstructionAtom = atom(false); // Nueva bandera que indica si el programa tiene instrucciones INT
export const hasINT0InstructionAtom = atom(false); // Nueva bandera que indica si el programa usa INT 0 específicamente
export const hasINT6InstructionAtom = atom(false); // Nueva bandera que indica si el programa usa INT 6 específicamente
export const hasINT7InstructionAtom = atom(false); // Nueva bandera que indica si el programa usa INT 7 específicamente
export const mayUsePICAtom = atom(false); // Nueva bandera que indica si el programa puede usar el PIC
// Átomo para controlar la sincronización de animaciones con mensajes
export const animationSyncAtom = atom<{ canAnimate: boolean; pendingMessage: string | null }>({
  canAnimate: true,
  pendingMessage: null,
});

const lowAtom = (
  primitive: PrimitiveAtom<Byte<16>>,
): WritableAtom<Byte<8>, [SetStateAction<Byte<8>>], void> =>
  atom(
    get => get(primitive).low,
    (get, set, update) => {
      const value = get(primitive);
      const low = typeof update === "function" ? update(value.low) : update;
      set(primitive, value.withLow(low));
    },
  );

const highAtom = (
  primitive: PrimitiveAtom<Byte<16>>,
): WritableAtom<Byte<8>, [SetStateAction<Byte<8>>], void> =>
  atom(
    get => get(primitive).high,
    (get, set, update) => {
      const value = get(primitive);
      const high = typeof update === "function" ? update(value.high) : update;
      set(primitive, value.withHigh(high));
    },
  );

export const registerAtoms: Record<string, any> = {
  AL: atom(Byte.zero(8)),
  BL: atom(Byte.zero(8)),
  CL: atom(Byte.zero(8)),
  DL: atom(Byte.zero(8)),
  SP: SPAtom,
  "SP.l": lowAtom(SPAtom),
  "SP.h": highAtom(SPAtom),
  IP: IPAtom,
  "IP.l": lowAtom(IPAtom),
  "IP.h": highAtom(IPAtom),
  IR: IRAtom,
  ri: riAtom,
  "ri.l": lowAtom(riAtom),
  "ri.h": highAtom(riAtom),
  id: idAtom,
  "id.l": lowAtom(idAtom),
  "id.h": highAtom(idAtom),
  left: leftAtom,
  "left.l": lowAtom(leftAtom),
  "left.h": highAtom(leftAtom),
  right: rightAtom,
  "right.l": lowAtom(rightAtom),
  "right.h": highAtom(rightAtom),
  result: resultAtom,
  "result.l": lowAtom(resultAtom),
  "result.h": highAtom(resultAtom),
  FLAGS: FLAGSAtom,
  "FLAGS.l": lowAtom(FLAGSAtom),
  "FLAGS.h": highAtom(FLAGSAtom),
  MAR: MARAtom,
  MBR: MBRAtom,
};

// Tipo extendido para incluir registros de 8 bits
export type PhysicalRegister =
  | SimulatorPhysicalRegister
  | "AL"
  | "BL"
  | "CL"
  | "DL"
  | "MAR"
  | "result";

export type Cycle =
  | { phase: "fetching"; metadata: InstructionMetadata }
  | { phase: "fetching-operands"; metadata: InstructionMetadata }
  | { phase: "fetching-operands-completed"; metadata: InstructionMetadata }
  | { phase: "executing"; metadata: InstructionMetadata }
  | { phase: "writeback"; metadata: InstructionMetadata }
  | { phase: "interrupt"; metadata: InstructionMetadata }
  | { phase: "int6" | "int7" }
  | { phase: "halting"; metadata: InstructionMetadata }
  | { phase: "stopped"; error?: SimulatorError<any> };

export const cycleAtom = atom<Cycle>({ phase: "stopped" });

export const aluOperationAtom = atom("ADD");

export function resetCPUState(computer: ComputerState, clearRegisters = false) {
  if (clearRegisters) {
    store.set(registerAtoms.AL, Byte.zero(8));
    store.set(registerAtoms.BL, Byte.zero(8));
    store.set(registerAtoms.CL, Byte.zero(8));
    store.set(registerAtoms.DL, Byte.zero(8));
    store.set(registerAtoms.SP, Byte.fromUnsigned(0xff, 16));
    store.set(registerAtoms.IP, Byte.zero(16));
    store.set(registerAtoms.IR, Byte.zero(8));
    store.set(registerAtoms.ri, Byte.zero(16));
    store.set(registerAtoms.id, Byte.zero(16));
    store.set(registerAtoms.left, Byte.zero(16));
    store.set(registerAtoms.right, Byte.zero(16));
    store.set(registerAtoms.result, Byte.zero(16));
    store.set(registerAtoms.FLAGS, Byte.zero(16));
    store.set(registerAtoms.MAR, Byte.zero(16));
    store.set(registerAtoms.MBR, Byte.zero(8));
  } else {
    store.set(registerAtoms.AL, Byte.fromUnsigned(computer.cpu.AX & 0xff, 8));
    store.set(registerAtoms.BL, Byte.fromUnsigned(computer.cpu.BX & 0xff, 8));
    store.set(registerAtoms.CL, Byte.fromUnsigned(computer.cpu.CX & 0xff, 8));
    store.set(registerAtoms.DL, Byte.fromUnsigned(computer.cpu.DX & 0xff, 8));
    store.set(registerAtoms.SP, Byte.fromUnsigned(computer.cpu.SP, 16));
    store.set(registerAtoms.IP, Byte.fromUnsigned(computer.cpu.IP, 16));
    store.set(registerAtoms.IR, Byte.fromUnsigned(computer.cpu.IR, 8));
    store.set(registerAtoms.ri, Byte.fromUnsigned(computer.cpu.ri, 16));
    store.set(registerAtoms.id, Byte.fromUnsigned(computer.cpu.id, 16));
    store.set(registerAtoms.left, Byte.fromUnsigned(computer.cpu.left, 16));
    store.set(registerAtoms.right, Byte.fromUnsigned(computer.cpu.right, 16));
    store.set(registerAtoms.result, Byte.fromUnsigned(computer.cpu.result, 16));
    // Inicializar los flags ZF, CF, OF y SF a cero
    // Establecer el flag IF a 1
    computer.cpu.FLAGS = 16;

    store.set(registerAtoms.FLAGS, Byte.fromUnsigned(computer.cpu.FLAGS, 16));
    store.set(registerAtoms.MAR, Byte.fromUnsigned(computer.cpu.MAR, 16));
    store.set(registerAtoms.MBR, Byte.fromUnsigned(computer.cpu.MBR, 8));
  }
  store.set(cycleAtom, { phase: "stopped" });
}
