export { LANGUAGES } from "@vonsim/common/i18n";

export const DATA_ON_LOAD_VALUES = ["randomize", "clean", "unchanged"] as const;
/*export const DEVICES = [
  "no-devices",
  "keyboard-and-screen",
  "pio-switches-and-leds",
  "pio-printer",
  "handshake",
] as const;*/

export const PIO_CONNECTIONS = ["switches-and-leds", "printer", "null"] as const;
export const HANDSHAKE_CONNECTIONS = ["printer", "null"] as const;
