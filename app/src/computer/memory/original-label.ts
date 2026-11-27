/**
 * El ensamblador guarda las etiquetas en mayúsculas. Para mostrarlas como las
 * escribió el alumno (ej. "x" y no "X"), se toma el texto original del código.
 */
export function originalLabel(
  code: string,
  data: { label: string | null; position: { start: number; end: number } },
): string | null {
  if (!data.label) return null;
  // La posición del dato empieza en la directiva (DB), así que la etiqueta es
  // la última palabra antes de ella en la misma línea.
  const lineStart = code.lastIndexOf("\n", data.position.start - 1) + 1;
  const before = code.slice(lineStart, data.position.start);
  const written = /([A-Z_]\w*)\s*(?::\s*)?$/i.exec(before)?.[1];
  return written && written.toUpperCase() === data.label.toUpperCase() ? written : data.label;
}
