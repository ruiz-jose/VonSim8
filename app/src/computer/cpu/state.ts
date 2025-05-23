import { Byte } from "@vonsim/common/byte";
import type { ComputerState, SimulatorError } from "@vonsim/simulator";
import type { ByteRegister, InstructionMetadata, WordRegister } from "@vonsim/simulator/cpu";
import { atom, PrimitiveAtom, SetStateAction, WritableAtom } from "jotai";

import type { ByteAtom } from "@/computer/shared/types";
import { store } from "@/lib/jotai";

const AXAtom = atom(Byte.zero(16)); // Accumulator
const BXAtom = atom(Byte.zero(16)); // Base
const CXAtom = atom(Byte.zero(16)); // Counter
const DXAtom = atom(Byte.zero(16)); // Data
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
export const messageAtom = atom<string | null>(null);
// Define el átomo para cycleCount
export const cycleCountAtom = atom(0);
export const showSPAtom = atom(false);
export const showriAtom = atom(false);
export const instructionCountAtom = atom(0); // Variable global para contar las instrucciones
export const messageHistoryAtom = atom<{ cycle: number; stage: string; action: string; }[]>([]);
// Crear un átomo para almacenar el valor de connectScreenAndKeyboard
export const connectScreenAndKeyboardAtom = atom(false);
export const showInstructionCycleAtom = atom(true); // Por defecto, visible
export const showCPUStatsAtom = atom(true); // Por defecto, visible

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

type RegistersMap = Record<ByteRegister | "MBR", ByteAtom<8>> &
  Record<WordRegister | "MAR", ByteAtom<16>>;

export const registerAtoms: RegistersMap = {
  AX: AXAtom,
  AL: lowAtom(AXAtom),
  AH: highAtom(AXAtom),
  BX: BXAtom,
  BL: lowAtom(BXAtom),
  BH: highAtom(BXAtom),
  CX: CXAtom,
  CL: lowAtom(CXAtom),
  CH: highAtom(CXAtom),
  DX: DXAtom,
  DL: lowAtom(DXAtom),
  DH: highAtom(DXAtom),
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

export type Cycle =
  | { phase: "fetching"; metadata: InstructionMetadata }
  | { phase: "fetching-operands"; metadata: InstructionMetadata }
  | { phase: "executing"; metadata: InstructionMetadata }
  | { phase: "writeback"; metadata: InstructionMetadata }
  | { phase: "interrupt"; metadata: InstructionMetadata }
  | { phase: "int6" | "int7" }
  | { phase: "stopped"; error?: SimulatorError<any> };

export const cycleAtom = atom<Cycle>({ phase: "stopped" });

export const aluOperationAtom = atom("ADD");

export function resetCPUState(computer: ComputerState, clearRegisters = false) {
  if (clearRegisters) {
    store.set(registerAtoms.AX, Byte.zero(16));
    store.set(registerAtoms.BX, Byte.zero(16));
    store.set(registerAtoms.CX, Byte.zero(16));
    store.set(registerAtoms.DX, Byte.zero(16));
    store.set(registerAtoms.SP, Byte.zero(16));
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
    store.set(registerAtoms.AX, Byte.fromUnsigned(computer.cpu.AX, 16));
    store.set(registerAtoms.BX, Byte.fromUnsigned(computer.cpu.BX, 16));
    store.set(registerAtoms.CX, Byte.fromUnsigned(computer.cpu.CX, 16));
    store.set(registerAtoms.DX, Byte.fromUnsigned(computer.cpu.DX, 16));
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
