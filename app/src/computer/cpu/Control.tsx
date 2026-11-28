import { animated } from "@react-spring/web";
import { useAtomValue } from "jotai";

import { dataAddressesAtom } from "@/computer/memory/state";
import { getSpring } from "@/computer/shared/springs";
import { useTranslate } from "@/lib/i18n";
import { store } from "@/lib/jotai";

import { showMicroprogramAtom } from "./control-step";
import { Microprogram } from "./Microprogram";
import { cycleAtom } from "./state";

const REGISTERS = new Set([
  "AL",
  "AH",
  "BL",
  "BH",
  "CL",
  "CH",
  "DL",
  "DH",
  "AX",
  "BX",
  "CX",
  "DX",
  "SP",
  "IP",
]);

type DataLabel = { address: number; label: string | null };

function colorizeOperand(operand: string, dataLabels: DataLabel[] = []) {
  // Acceso a memoria: [...]
  if (operand.startsWith("[") && operand.endsWith("]")) {
    const inner = operand.slice(1, -1);
    const isRegister = REGISTERS.has(inner.toUpperCase());
    // Si la dirección corresponde a una variable, mostrar su nombre (ej. [07] x)
    const address = /^[0-9a-f]+h?$/i.test(inner) ? parseInt(inner, 16) : NaN;
    const label = isRegister ? null : dataLabels.find(d => d.address === address)?.label;
    return (
      <span>
        <span className="text-amber-400">[</span>
        <span className={isRegister ? "text-sky-300" : "text-amber-300"}>{inner}</span>
        <span className="text-amber-400">]</span>
        {label && (
          <span
            className="ml-1 rounded bg-green-900/60 px-1 text-sm text-green-300"
            title={`Variable ${label}`}
          >
            {label}
          </span>
        )}
      </span>
    );
  }

  // Registro
  if (REGISTERS.has(operand.toUpperCase())) {
    return <span className="text-sky-300">{operand}</span>;
  }

  // Valor inmediato: número decimal o hexadecimal (ej: 05h, 255, 0FFh)
  if (/^[0-9a-f]+h$/i.test(operand) || /^\d+$/.test(operand)) {
    return <span className="text-violet-300">{operand}</span>;
  }

  // Etiqueta u otro
  return <span className="text-stone-300">{operand}</span>;
}

function phaseClasses(phase: string | undefined) {
  switch (phase) {
    case "fetching":
      return "bg-blue-600/30 text-blue-300 ring-1 ring-blue-500/50";
    case "fetching-operands":
    case "fetching-operands-completed":
      return "bg-yellow-600/30 text-yellow-300 ring-1 ring-yellow-500/50";
    case "executing":
      return "bg-mantis-600/30 text-mantis-300 ring-1 ring-mantis-500/50";
    case "writeback":
      return "bg-purple-600/30 text-purple-300 ring-1 ring-purple-500/50";
    case "interrupt":
    case "halting":
      return "bg-red-600/30 text-red-300 ring-1 ring-red-500/50";
    default:
      return "bg-stone-600/30 text-stone-300 ring-1 ring-stone-500/50";
  }
}

function phaseName(phase: string | undefined) {
  switch (phase) {
    case "fetching":
      return "Captación";
    case "fetching-operands":
      return "Obtención de operandos";
    case "fetching-operands-completed":
      return "Operandos obtenidos";
    case "executing":
      return "Ejecución";
    case "writeback":
      return "Escritura";
    case "interrupt":
      return "Interrupción";
    case "halting":
      return "Detener CPU";
    default:
      return "Procesando";
  }
}

/** Instrucción vigente: grande, o en una sola línea si se ve la memoria de control. */
function CurrentInstruction({ compact }: { compact: boolean }) {
  const cycle = useAtomValue(cycleAtom);
  const dataLabels = useAtomValue(dataAddressesAtom);

  if (!(cycle && "metadata" in cycle && cycle.metadata)) {
    return (
      <span className={compact ? "text-xs italic text-stone-500" : "text-sm italic text-stone-500"}>
        {cycle?.phase === "stopped" ? "CPU detenida" : "Esperando..."}
      </span>
    );
  }

  const pill = (
    <span
      className={`whitespace-nowrap rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-widest transition-all duration-300 ${phaseClasses(cycle.phase)}`}
    >
      {phaseName(cycle.phase)}
    </span>
  );
  const operands = cycle.metadata.operands.length > 0 && (
    <span className={`font-mono font-medium leading-none ${compact ? "text-sm" : "text-lg"}`}>
      {cycle.metadata.operands.map((op, i) => (
        <span key={i}>
          {i > 0 && <span className="text-stone-500">, </span>}
          {colorizeOperand(op, dataLabels)}
        </span>
      ))}
    </span>
  );
  const name = (
    <span
      className={`font-mono font-bold leading-none text-mantis-300 ${compact ? "text-lg" : "text-3xl"}`}
      style={{
        textShadow: "0 0 14px rgba(74,222,128,0.75), 0 0 30px rgba(74,222,128,0.35)",
      }}
    >
      {cycle.metadata.name}
    </span>
  );

  if (compact) {
    return (
      <div className="flex items-center justify-center gap-2">
        {pill}
        <div className="flex items-baseline gap-1.5 whitespace-nowrap">
          {name}
          {operands}
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col items-center gap-1.5">
      {pill}
      <div className="flex flex-wrap items-baseline justify-center gap-x-2 gap-y-0.5">
        {name}
        {operands}
      </div>
    </div>
  );
}

/**
 * Control component, to be used inside <CPU />
 */
export function Control() {
  const translate = useTranslate();
  const showMicro = useAtomValue(showMicroprogramAtom) === true;

  return (
    <>
      <svg viewBox="0 0 650 500" className="pointer-events-none absolute inset-0">
        <animated.path
          d="M 250 310 V 320" // alineado con IR
          className="fill-none stroke-mantis-400 stroke-[3px] drop-shadow-[0_0_8px_rgba(34,197,94,0.6)]"
          strokeLinejoin="round"
          pathLength={1}
          strokeDasharray={1}
          style={getSpring("cpu.decoder.path")}
        />
        {/* Efecto de brillo adicional para el bus del decodificador */}
        <animated.path
          d="M 250 310 V 320"
          className="fill-none stroke-mantis-300 stroke-1 opacity-50"
          strokeLinejoin="round"
          pathLength={1}
          strokeDasharray={1}
          style={getSpring("cpu.decoder.path")}
        />
      </svg>

      <div className="absolute bottom-[172px] left-[30px] flex w-full items-start">
        <span className="block w-min whitespace-nowrap rounded-t-lg border border-b-0 border-stone-600 bg-mantis-700 px-2 pb-3 pt-1 text-xs tracking-wide text-white">
          {translate("computer.cpu.control-unit")}
        </span>
      </div>

      <div className="absolute bottom-[17px] left-[30px] flex h-[160px] w-[350px] flex-col items-center rounded-lg border border-stone-600 bg-stone-800">
        <div className="flex items-center gap-2 rounded-b-lg border border-t-0 border-stone-600 bg-stone-900 px-3 py-0.5">
          <span className="text-sm leading-none">{translate("computer.cpu.decoder")}</span>
          <button
            type="button"
            aria-label={showMicro ? "Ocultar memoria de control" : "Mostrar memoria de control"}
            title={
              showMicro
                ? "Ocultar la memoria de control y el secuenciador"
                : "Ver cómo la unidad de control lee la memoria de control y envía las señales"
            }
            aria-pressed={showMicro}
            className="flex size-5 items-center justify-center rounded-md bg-gradient-to-r from-mantis-600 to-mantis-500 text-sm font-bold leading-none text-white shadow transition-colors hover:from-mantis-500 hover:to-mantis-400 focus:outline-none focus:ring-2 focus:ring-mantis-400"
            onClick={() => store.set(showMicroprogramAtom, !showMicro)}
          >
            {showMicro ? "−" : "+"}
          </button>
        </div>

        {showMicro ? (
          <>
            <div className="mt-1 flex h-[22px] w-full items-center justify-center px-2">
              <CurrentInstruction compact />
            </div>
            <div className="min-h-0 w-full flex-1 px-2 pb-1.5 pt-1">
              <Microprogram />
            </div>
          </>
        ) : (
          <div className="flex w-full flex-1 items-center justify-center px-3">
            <CurrentInstruction compact={false} />
          </div>
        )}
      </div>
    </>
  );
}
