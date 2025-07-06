import {
  faInfinity,
  faPause,
  faPlay,
  faRedo,
  faStepForward,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import clsx from "clsx";
import { useCallback, useEffect, useState } from "react";
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

  const handlePause = useCallback(() => {
    if (status.type === "running") {
      dispatch("cpu.stop", false); // pausar
    }
  }, [status.type, dispatch]);

  const handleReset = useCallback(() => {
    if (status.type !== "running") {
      dispatch("cpu.stop", true); // reset
    }
  }, [status.type, dispatch]);

  // Agregar tecla F9 para reset
  useKey(
    "F9",
    ev => {
      ev.preventDefault();
      handleReset();
    },
    undefined,
    [handleReset],
  );

  // Tecla Space solo para pausar cuando está corriendo y no estamos en un input/textarea
  useKey(
    " ",
    ev => {
      // Solo prevenir si no estamos en un elemento de entrada de texto
      const target = ev.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.contentEditable === "true"
      ) {
        return; // No interferir con la escritura
      }

      ev.preventDefault();
      if (status.type === "running") {
        handlePause();
      }
    },
    { event: "keydown" },
    [status.type, handlePause],
  );

  // Detectar si es móvil/PWA
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => {
      // Considera móvil si ancho de pantalla <= 600px o si es standalone PWA
      setIsMobile(
        window.innerWidth <= 600 ||
          (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches),
      );
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <div
      className={clsx(
        // Reduce py-4 a py-1 y px-8 a px-4 para menor altura
        "flex items-center justify-center gap-6 rounded-xl border border-stone-700 bg-stone-900/80 px-4 py-1 shadow-lg",
        className,
      )}
    >
      <button
        disabled={status.type === "running"}
        onClick={runCycle}
        title={translate("control.action.run.cycle-change")}
        className="group flex flex-col items-center focus-visible:ring-2 focus-visible:ring-mantis-400 rounded-lg px-2 py-1 transition hover:bg-mantis-600/20 disabled:opacity-50 relative"
      >
        <span className="flex items-center justify-center">
          <FontAwesomeIcon
            icon={faPlay}
            size="lg"
            className="text-mantis-400 group-hover:scale-110 transition"
          />
          {!isMobile && (
            <span className="ml-1 text-[10px] text-stone-400 font-mono opacity-80 pointer-events-none">
              F7
            </span>
          )}
        </span>
        {!isMobile && (
          <span className="text-xs mt-1">{translate("control.action.run.cycle-change")}</span>
        )}
      </button>
      <button
        disabled={status.type === "running"}
        onClick={runInstruction}
        title={translate("control.action.run.end-of-instruction")}
        className="group flex flex-col items-center focus-visible:ring-2 focus-visible:ring-blue-400 rounded-lg px-2 py-1 transition hover:bg-blue-600/20 disabled:opacity-50 relative"
      >
        <span className="flex items-center justify-center">
          <FontAwesomeIcon
            icon={faStepForward}
            size="lg"
            className="text-blue-400 group-hover:scale-110 transition"
          />
          {!isMobile && (
            <span className="ml-1 text-[10px] text-stone-400 font-mono opacity-80 pointer-events-none">
              F8
            </span>
          )}
        </span>
        {!isMobile && (
          <span className="text-xs mt-1">{translate("control.action.run.end-of-instruction")}</span>
        )}
      </button>
      <button
        disabled={status.type === "running"}
        onClick={runInfinity}
        title={translate("control.action.run.infinity")}
        className="group flex flex-col items-center focus-visible:ring-2 focus-visible:ring-orange-400 rounded-lg px-2 py-1 transition hover:bg-orange-600/20 disabled:opacity-50 relative"
      >
        <span className="flex items-center justify-center">
          <FontAwesomeIcon
            icon={faInfinity}
            size="lg"
            className="text-orange-400 group-hover:scale-110 transition"
          />
          {!isMobile && (
            <span className="ml-1 text-[10px] text-stone-400 font-mono opacity-80 pointer-events-none">
              F4
            </span>
          )}
        </span>
        {!isMobile && (
          <span className="text-xs mt-1">{translate("control.action.run.infinity")}</span>
        )}
      </button>
      {status.type === "running" ? (
        <button
          onClick={handlePause}
          title={translate("control.action.pause")}
          className="group flex flex-col items-center focus-visible:ring-2 focus-visible:ring-red-400 rounded-lg px-2 py-1 transition hover:bg-red-600/20 relative"
        >
          <span className="flex items-center justify-center">
            <FontAwesomeIcon
              icon={faPause}
              size="lg"
              className="text-red-400 group-hover:scale-110 transition"
            />
            {!isMobile && (
              <span className="ml-1 text-[10px] text-stone-400 font-mono opacity-80 pointer-events-none">
                F9
              </span>
            )}
          </span>
          {!isMobile && <span className="text-xs mt-1">{translate("control.action.pause")}</span>}
        </button>
      ) : (
        <button
          onClick={handleReset}
          disabled={status.type === "stopped"}
          title={translate("control.action.reset")}
          className="group flex flex-col items-center focus-visible:ring-2 focus-visible:ring-red-400 rounded-lg px-2 py-1 transition hover:bg-red-600/20 disabled:opacity-50 relative"
        >
          <span className="flex items-center justify-center">
            <FontAwesomeIcon
              icon={faRedo}
              size="lg"
              className="text-red-400 group-hover:scale-110 transition"
            />
            {!isMobile && (
              <span className="ml-1 text-[10px] text-stone-400 font-mono opacity-80 pointer-events-none">
                F9
              </span>
            )}
          </span>
          {!isMobile && <span className="text-xs mt-1">{translate("control.action.reset")}</span>}
        </button>
      )}
    </div>
  );
}
