import clsx from "clsx";
import { useCallback } from "react";
import { useKey } from "react-use";

import { useSimulation } from "@/computer/simulation";
import { useTranslate } from "@/lib/i18n";

export function Controls({ className }: { className?: string }) {
  const translate = useTranslate();
  const { status, dispatch } = useSimulation();

  const runCycle = useCallback(() => {
    if (status.type === "running") return;
    dispatch("cpu.run", "cycle-change");
  }, [status.type, dispatch]);
  useKey(
    "F7",
    ev => {
      ev.preventDefault();
      runCycle();
    },
    undefined,
    [runCycle],
  );

  const runInstruction = useCallback(() => {
    if (status.type === "running") return;
    dispatch("cpu.run", "end-of-instruction");
  }, [status.type, dispatch]);
  useKey(
    "F8",
    ev => {
      ev.preventDefault();
      runInstruction();
    },
    undefined,
    [runInstruction],
  );

  const runInfinity = useCallback(() => {
    if (status.type === "running") return;
    dispatch("cpu.run", "infinity");
  }, [status.type, dispatch]);
  useKey(
    "F4",
    ev => {
      ev.preventDefault();
      runInfinity();
    },
    undefined,
    [runInfinity],
  );

  return (
    <div className={clsx("flex items-center justify-center gap-4", className)}>
      <button
        disabled={status.type === "running"}
        onClick={runCycle}
        className="bg-green-500 focus-visible:ring-green-500 inline-flex h-9 items-center justify-center whitespace-nowrap rounded-md px-3 text-sm text-white ring-offset-stone-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
      >
        <span className="icon-[lucide--chevron-right] mr-2 h-4 w-4" />
        {translate("control.action.run.cycle-change")}
        <kbd className="ml-2 text-stone-600">F7</kbd>
      </button>
      <button
        disabled={status.type === "running"}
        onClick={runInstruction}
        className="bg-mantis-500 focus-visible:ring-mantis-500 inline-flex h-9 items-center justify-center whitespace-nowrap rounded-md px-3 text-sm text-white ring-offset-stone-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
      >
        <span className="icon-[lucide--chevrons-right] mr-2 h-4 w-4" />
        {translate("control.action.run.end-of-instruction")}
        <kbd className="ml-2 text-stone-600">F8</kbd>
      </button>
      <button
        disabled={status.type === "running"}
        onClick={runInfinity}
        className="bg-mantis-500 focus-visible:ring-mantis-500 inline-flex h-9 items-center justify-center whitespace-nowrap rounded-md px-3 text-sm text-white ring-offset-stone-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
      >
        <span className="icon-[lucide--infinity] mr-2 h-4 w-4" />
        {translate("control.action.run.infinity")}
        <kbd className="ml-2 text-stone-600">F4</kbd>
      </button>
      <button
        disabled={status.type === "stopped"}
        onClick={() => dispatch("cpu.stop")}
        className="bg-mantis-500 focus-visible:ring-mantis-500 inline-flex h-9 items-center justify-center whitespace-nowrap rounded-md px-3 text-sm text-white ring-offset-stone-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
      >
        <span className="icon-[lucide--stop-circle] mr-2 h-4 w-4" />
        {translate("control.action.stop")}
      </button>
    </div>
  );
}
