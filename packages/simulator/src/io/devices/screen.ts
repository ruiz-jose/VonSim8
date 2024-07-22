import { decimalToChar } from "@vonsim/common/ascii";
import { Byte } from "@vonsim/common/byte";

import { Component, ComponentInit } from "../../component";
import type { EventGenerator } from "../../events";

export type ScreenEvent = { type: "screen:send-char"; char: Byte<8>; output: string };

/**
 * This component displays text on an screen, given by the CPU
 * with an `INT 7` syscall.
 *
 * @see {@link https://vonsim.github.io/docs/io/devices/screen/}.
 *
 * ---
 * This class is: MUTABLE
 */
export class Screen<
  TDevices extends "keyboard-and-screen" | "pio-switches-and-leds" | "pio-printer" | "handshake",
> extends Component<TDevices> {
  #output: string;

  constructor(options: ComponentInit<TDevices>) {
    super(options);
    if (options.data === "unchanged" && "screen" in options.previous.io) {
      this.#output = options.previous.io.screen.#output;
    } else {
      this.#output = "";
    }
  }

  /**
   * Clears the screen.
   *
   * ---
   * Called by the outside.
   */
  clear(): EventGenerator {
    // Sends a form feed character, clearing the screen
    return this.sendChar(Byte.fromUnsigned(12, 8));
  }

  /**
   * Sends a character to the screen.
   * @see {@link https://vonsim.github.io/docs/io/devices/screen/}.
   *
   * ---
   * Called by the CPU.
   */
  *sendChar(char: Byte<8>): EventGenerator {
    switch (char.unsigned) {
      case 8: // Backspace
        this.#output = this.#output.slice(0, -1);
        break;

      case 10: // Line feed
        this.#output += "\n";
        break;

      case 12: // Form feed
        this.#output = "";
        break;

      default:
        this.#output += decimalToChar(char.unsigned);
        break;
    }

    yield { type: "screen:send-char", char, output: this.#output };
  }

  toJSON() {
    return this.#output;
  }
}
