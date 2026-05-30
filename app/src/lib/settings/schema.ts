import type { Language } from "@vonsim/common/i18n";
import { z } from "zod";

import { DATA_ON_LOAD_VALUES, LANGUAGES } from "./consts";

export const settingsSchema = z.object({
  /**
   * Show or hide the instruction cycle.
   * Controls whether the instruction cycle is visible in the UI.
   */
  showInstructionCycle: z.boolean().catch(false),

  /**
   * Show or hide the CPU statistics.
   * Controls whether the CPU statistics are visible in the UI.
   */
  showStatsCPU: z.boolean().catch(false),

  /**
   * Interface language.
   */
  language: z.enum(LANGUAGES).catch(getDefaultLanguage),

  /**
   * Font size of the editor. Default is 14.
   */
  editorFontSize: z.number().int().min(8).max(64).catch(14),

  /**
   * Value of data on load.
   */
  dataOnLoad: z.enum(DATA_ON_LOAD_VALUES).catch("clean"),

  /**
   * Value of {@link ComputerOptions.devices}.
   */
  devices: z
    .object({
      keyboardAndScreen: z.boolean(),
      pic: z.boolean(),
      pio: z.enum(["switches-and-leds", "printer"]).nullable(),
      handshake: z.enum(["printer"]).nullable(),
    })
    .catch({ keyboardAndScreen: false, pic: false, pio: null, handshake: null }),

  /**
   * Disable animations for faster running. Only affects animations affected
   * by the simulation speed (e.g. the cpu). Other animations (like the clock
   * tick and the printer "printing bar") will run normally.
   */
  animations: z.boolean().catch(true),

  /**
   * Unified simulation speed in Hz.
   * Controls both animation timing and CPU statistics.
   * Maps to ms per execution unit as: 1000 / simulationSpeed
   *   1 Hz  -> 1000 ms/cycle  (Muy lenta)
   *   2 Hz  ->  500 ms/cycle  (Lenta)
   *   4 Hz  ->  250 ms/cycle  (Normal)
   *  10 Hz  ->  100 ms/cycle  (Rapida)
   */
  simulationSpeed: z.union([z.literal(1), z.literal(2), z.literal(4), z.literal(10)]).catch(4),

  /**
   * This property states how many milliseconds takes for the clock to tick.
   */
  clockSpeed: z.number().min(100).max(1000).catch(1000),

  /**
   * This property states how many milliseconds units takes for the printer
   * to print a character.
   */
  printerSpeed: z.number().min(500).max(5000).catch(5000),

  /**
   * Flags visibility setting.
   * Controls which flags are visible in the ALU.
   */
  flagsVisibility: z.enum(["CF_ZF", "SF_OF_CF_ZF", "IF_CF_ZF", "IF_SF_OF_CF_ZF"]).catch("CF_ZF"),

  /**
   * CSS filter applied to the page.
   */
  filterBightness: z.number().min(0).catch(1),
  filterContrast: z.number().min(0).catch(1),
  filterInvert: z.boolean().catch(false),
  filterSaturation: z.number().min(0).catch(1),
});

export type Settings = z.infer<typeof settingsSchema>;

// Returns an object with default values (`.catch()`)
export const defaultSettings = settingsSchema.parse({ animations: false });

function getDefaultLanguage(): Language {
  // Return browser default language
  const userLang = navigator.language.toLowerCase();
  for (const lang of LANGUAGES) {
    if (userLang.startsWith(lang)) return lang;
  }
  return "en";
}
