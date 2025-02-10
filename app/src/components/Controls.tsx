import { faInfinity, faPlay, faStepForward, faStop } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
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
      className="bg-mantis-500 inline-flex h-9 items-center justify-center whitespace-nowrap rounded-md px-3 text-sm text-white ring-offset-stone-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
    >
      <FontAwesomeIcon icon={faPlay} className="md:mr-2" />
      <span className="hidden text-sm font-medium md:inline">{translate("control.action.run.cycle-change")}</span>
      <kbd className="ml-2 hidden text-stone-600 md:inline">F7</kbd>
    </button>
    <button
      disabled={status.type === "running"}
      onClick={runInstruction}
      className="inline-flex h-9 items-center justify-center whitespace-nowrap rounded-md bg-blue-500 px-3 text-sm text-white ring-offset-stone-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
    >
      <FontAwesomeIcon icon={faStepForward} className="md:mr-2" />
      <span className="hidden text-sm font-medium md:inline">{translate("control.action.run.end-of-instruction")}</span>
      <kbd className="ml-2 hidden text-stone-600 md:inline">F8</kbd>
    </button>
    <button
      disabled={status.type === "running"}
      onClick={runInfinity}
      className="inline-flex h-9 items-center justify-center whitespace-nowrap rounded-md bg-orange-500 px-3 text-sm text-white ring-offset-stone-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
    >
      <FontAwesomeIcon icon={faInfinity} className="md:mr-2" />
      <span className="hidden text-sm font-medium md:inline">{translate("control.action.run.infinity")}</span>
      <kbd className="ml-2 hidden text-stone-600 md:inline">F4</kbd>
    </button>
    <button
      disabled={status.type === "stopped" || status.type === "paused"}
      onClick={() => dispatch("cpu.stop")}
      className="inline-flex h-9 items-center justify-center whitespace-nowrap rounded-md bg-red-500 px-3 text-sm text-white ring-offset-stone-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
    >
      <FontAwesomeIcon icon={faStop} className="md:mr-2" />
      <span className="hidden text-sm font-medium md:inline">{translate("control.action.stop")}</span>
    </button>
  </div>
  );
}
