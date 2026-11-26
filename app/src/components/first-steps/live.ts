import type { Byte } from "@vonsim/common/byte";
import { type PrimitiveAtom, useAtomValue } from "jotai";
import { useEffect, useState } from "react";

import { instructionCountAtom, registerAtoms } from "@/computer/cpu/state";
import { dataAddressesAtom, memoryAtom } from "@/computer/memory/state";
import { useSimulation } from "@/computer/simulation";

export const FIRST_STEPS_PROGRAM = `; Primeros pasos: calcula z = x + y
x DB 3        ; variable x, vale 3
y DB 2        ; variable y, vale 2
z DB 0        ; acá se guardará el resultado
MOV AL, x     ; copia x en el registro AL
ADD AL, y     ; suma y a AL  (AL = 3 + 2)
MOV z, AL     ; guarda AL en la variable z
HLT           ; detiene la CPU
`;

/** Estado de la simulación que la guía muestra en vivo. */
export type Live = {
  programLoaded: boolean;
  started: boolean;
  instructions: number;
  al: number;
  ip: number;
  vars: { label: string; address: number; value: number }[];
};

export function getEditorText() {
  return window.codemirror?.state.doc.toString() ?? "";
}

export const useLiveState = (): Live => {
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
