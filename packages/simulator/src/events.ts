import type { BusEvent } from "./bus";
import type { CPUMicroOperation } from "./cpu/micro-ops";
import type { ClockEvent } from "./io/devices/clock";
import type { F10Event } from "./io/devices/f10";
import type { KeyboardEvent } from "./io/devices/keyboard";
import type { LedsEvent } from "./io/devices/leds";
import type { PrinterEvent } from "./io/devices/printer";
import type { ScreenEvent } from "./io/devices/screen";
import type { SwitchesEvent } from "./io/devices/switches";
import type { HandshakeOperation } from "./io/modules/handshake";
import type { PICOperation } from "./io/modules/pic";
import type { PIOOperation } from "./io/modules/pio";
import type { TimerOperation } from "./io/modules/timer";
import type { MemoryOperation } from "./memory";
/**
 * An event that was generated by the Simulator.
 * All events contain a `type` property that identifies the event.
 * `type` is a string that follows the pattern `device:event`.
 */
export type SimulatorEvent =
  | BusEvent // bus:*
  | ClockEvent // clock:*
  | CPUMicroOperation // cpu:*
  | F10Event // f10:*
  | HandshakeOperation // handshake:*
  | KeyboardEvent // keyboard:*
  | LedsEvent // leds:*
  | MemoryOperation // memory:*
  | PICOperation // pic:*
  | PIOOperation // pio:*
  | PrinterEvent // printer:*
  | ScreenEvent // screen:*
  | SwitchesEvent // switches:*
  | TimerOperation; // timer:*

export type EventGenerator<TReturn = void> = Generator<SimulatorEvent, TReturn>;
