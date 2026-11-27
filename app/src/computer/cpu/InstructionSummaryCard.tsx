import type { InstructionSummary } from "./instruction-summary";

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

function memoryText(s: InstructionSummary) {
  if (s.memoryReads === 0 && s.memoryWrites === 0) return "no accedió a la memoria";
  const parts: string[] = [];
  if (s.memoryReads > 0) {
    const execReads = s.memoryReads - s.fetchMemoryReads;
    let detail = "";
    if (s.fetchMemoryReads > 0 && execReads > 0)
      detail = ` (${s.fetchMemoryReads} en la búsqueda, ${execReads} en la ejecución)`;
    else if (execReads === 0)
      detail = s.memoryReads === 1 ? " (la de la búsqueda)" : " (en la búsqueda)";
    parts.push(plural(s.memoryReads, "lectura", "lecturas") + detail);
  }
  if (s.memoryWrites > 0) {
    const where = s.writtenTo.length > 0 ? ` en ${s.writtenTo.join(", ")}` : "";
    parts.push(plural(s.memoryWrites, "escritura", "escrituras") + where);
  }
  return parts.join(" y ");
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-1.5">
      <dt className="shrink-0 font-semibold text-stone-300">{label}:</dt>
      <dd className="text-stone-200">{children}</dd>
    </div>
  );
}

/**
 * Tarjeta que aparece al terminar una instrucción: cuántos ciclos llevó cada
 * parte del ciclo (búsqueda y ejecución), cuántas veces fue a la memoria y
 * qué registros cambiaron.
 */
export function InstructionSummaryCard({ summary: s }: { summary: InstructionSummary }) {
  const io = s.ioReads + s.ioWrites;
  return (
    <li
      className="ml-6 mt-2 list-none rounded-lg border border-mantis-400/50 bg-mantis-950/40 px-3 py-2 text-xs"
      aria-label={`Resumen de ${s.instruction ?? "la instrucción"}`}
    >
      <p className="mb-1.5 font-bold text-mantis-300">
        <span aria-hidden="true">🧾 </span>
        Resumen{s.instruction ? ` de ${s.instruction}` : ""}
      </p>

      <div
        className="mb-1.5 flex h-2 overflow-hidden rounded-full bg-stone-700"
        role="img"
        aria-label={`${s.fetchCycles} ciclos de búsqueda y ${s.executeCycles} de ejecución`}
      >
        <span className="bg-blue-500" style={{ flexGrow: s.fetchCycles }} />
        <span className="bg-green-500" style={{ flexGrow: s.executeCycles }} />
        {s.interruptCycles > 0 && (
          <span className="bg-red-500" style={{ flexGrow: s.interruptCycles }} />
        )}
      </div>

      <dl className="space-y-0.5 leading-snug">
        <Row label="Ciclos">
          {s.cycles} = <span className="text-blue-300">{s.fetchCycles} de búsqueda</span> +{" "}
          <span className="text-green-300">{s.executeCycles} de ejecución</span>
          {s.interruptCycles > 0 && (
            <>
              {" "}
              + <span className="text-red-300">{s.interruptCycles} de interrupción</span>
            </>
          )}
        </Row>
        <Row label="Memoria">{memoryText(s)}</Row>
        {io > 0 && (
          <Row label="E/S">
            {[
              s.ioReads > 0 && plural(s.ioReads, "lectura", "lecturas"),
              s.ioWrites > 0 && plural(s.ioWrites, "escritura", "escrituras"),
            ]
              .filter(Boolean)
              .join(" y ")}
          </Row>
        )}
        <Row label="Cambió">
          {s.changedRegisters.length > 0
            ? s.changedRegisters.join(", ")
            : "ningún registro del programador"}
          {s.jumped && " · IP saltó a otra dirección"}
        </Row>
      </dl>
    </li>
  );
}
