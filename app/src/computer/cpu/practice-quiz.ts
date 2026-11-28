/**
 * Modo práctica del panel del ciclo: después de cada paso, el alumno elige
 * qué hizo la CPU entre tres opciones (la correcta y dos distractores
 * verosímiles), y recién después se muestra la explicación.
 */

const FETCH_POOL = ["MAR ← IP", "MBR ← read(Memoria[MAR]) | IP ← IP + 1", "IR ← MBR"];
const EXECUTE_POOL = [
  "MAR ← IP",
  "MAR ← MBR",
  "MBR ← read(Memoria[MAR])",
  "write(Memoria[MAR]) ← MBR",
  "MAR ← SP",
  "SP ← SP - 1",
  "IP ← MBR",
  "IR ← MBR",
];
const REGISTERS = ["AL", "BL", "CL", "DL"];

/** Solo se pregunta por pasos con notación de transferencia (no "Detenido", etc.). */
export function isQuizzable(action: string): boolean {
  return action.includes("←");
}

/** Variantes parecidas a la respuesta correcta: el error típico de un alumno. */
function mutations(action: string): string[] {
  const out: string[] = [];
  const parts = action.split(" | ");
  parts.forEach((part, i) => {
    const replaceWith = (next: string) => {
      const copy = [...parts];
      copy[i] = next;
      out.push(copy.join(" | "));
    };
    // Invertir el sentido de la transferencia: "AL ← MBR" → "MBR ← AL"
    const copy = /^(\w+) ← (\w+)$/.exec(part);
    if (copy) replaceWith(`${copy[2]} ← ${copy[1]}`);
    // Confundir lectura con escritura
    if (part === "MBR ← read(Memoria[MAR])") replaceWith("write(Memoria[MAR]) ← MBR");
    if (part === "write(Memoria[MAR]) ← MBR") replaceWith("MBR ← read(Memoria[MAR])");
    // Confundir el origen de la dirección
    if (part === "MAR ← IP") replaceWith("MAR ← MBR");
    if (part === "MAR ← MBR") replaceWith("MAR ← IP");
    // Otro registro del programador
    const reg = REGISTERS.find(r => new RegExp(`\\b${r}\\b`).test(part));
    if (reg) {
      const other = REGISTERS[(REGISTERS.indexOf(reg) + 1) % REGISTERS.length];
      replaceWith(part.replace(new RegExp(`\\b${reg}\\b`, "g"), other));
    }
  });
  return out;
}

/** Generador pseudoaleatorio con semilla: las opciones no cambian al redibujar. */
function seeded(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function hash(text: string) {
  let h = 0;
  for (const ch of text) h = (h * 31 + ch.charCodeAt(0)) | 0;
  return Math.abs(h);
}

/**
 * Tres opciones para el paso: la correcta y dos distractores, en un orden que
 * depende de la semilla (por ejemplo, la posición del paso en el historial).
 */
export function buildOptions(action: string, stage: string, seed: number): string[] {
  const random = seeded(seed * 7919 + hash(action) + 1);
  const pick = (list: string[]) => list[Math.floor(random() * list.length)];

  const pool = stage === "Captación" ? FETCH_POOL : EXECUTE_POOL;
  const close = mutations(action).filter(o => o !== action);
  const far = [...pool, ...FETCH_POOL, ...EXECUTE_POOL].filter(o => o !== action);

  const distractors: string[] = [];
  // Un distractor "cercano" (si existe) y otro de la misma fase
  if (close.length > 0) distractors.push(pick(close));
  for (const list of [pool.filter(o => o !== action), far]) {
    const candidates = list.filter(o => !distractors.includes(o));
    while (distractors.length < 2 && candidates.length > 0) {
      const choice = pick(candidates);
      distractors.push(choice);
      candidates.splice(candidates.indexOf(choice), 1);
    }
  }

  const options = [action, ...distractors.slice(0, 2)];
  // Mezclar (Fisher-Yates)
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }
  return options;
}
