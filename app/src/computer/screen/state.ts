import type { ComputerState } from "@vonsim/simulator";
import { atom } from "jotai";

import { store } from "@/lib/jotai";

export const screenAtom = atom("");

export function resetScreenState(computer: ComputerState) {
  if (!("screen" in computer.io)) return;

  if (computer.io.screen !== null) {
    store.set(screenAtom, computer.io.screen);
  }
}
