import {
  faCheckCircle,
  faChevronLeft,
  faChevronRight,
  faHandPointer,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import clsx from "clsx";
import { atom, useAtom } from "jotai";
import { memo, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/Button";
import { COMPUTER_FOCUS_EVENT } from "@/computer/focus";
import { MOBILE_TAB_EVENT } from "@/lib/mobile-tab";

import { useLiveState } from "./first-steps/live";
import { measureTarget, placeCard, type Rect, sameRect } from "./first-steps/positioning";
import { useSteps } from "./first-steps/steps";

export { FIRST_STEPS_PROGRAM } from "./first-steps/live";

/**
 * Guía de "Primeros pasos": un recorrido práctico en el que el alumno carga
 * un programa de ejemplo, lo ensambla, lo ejecuta instrucción por instrucción
 * y observa cómo cambian los registros y la memoria.
 *
 * A diferencia del recorrido por la interfaz (WelcomeTour), el resto de la
 * aplicación sigue siendo utilizable mientras la guía está abierta: el
 * alumno puede presionar los botones reales resaltados (o F7/F8/F9).
 */

export const firstStepsOpenAtom = atom(false);

const STORAGE_KEY = "vonsim8-first-steps-completed";

export const FirstStepsTour = memo(() => {
  const [open, setOpen] = useAtom(firstStepsOpenAtom);

  const close = useCallback(() => {
    setOpen(false);
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // localStorage puede no estar disponible (modo privado); no es crítico
    }
  }, [setOpen]);

  // El contenido se monta solo mientras la guía está abierta: así cada
  // apertura empieza desde el primer paso y no hay suscripciones en segundo plano.
  if (open !== true) return null;
  return <TourOverlay onClose={close} />;
});

FirstStepsTour.displayName = "FirstStepsTour";

function TourOverlay({ onClose: close }: { onClose: () => void }) {
  const [index, setIndex] = useState(0);
  const steps = useSteps();
  const live = useLiveState();
  const cardRef = useRef<HTMLDivElement>(null);
  const [target, setTarget] = useState<Rect | null>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  const step = steps[Math.min(index, steps.length - 1)];
  const isFirst = index === 0;
  const isLast = index === steps.length - 1;

  const next = useCallback(() => setIndex(i => Math.min(i + 1, steps.length - 1)), [steps.length]);
  const prev = useCallback(() => setIndex(i => Math.max(i - 1, 0)), []);

  // Seguir la posición del objetivo: los paneles se pueden redimensionar,
  // desplazar o hacer zoom mientras la guía está abierta.
  useLayoutEffect(() => {
    const update = () => {
      const t = measureTarget(step.target);
      setTarget(prevRect => (sameRect(prevRect, t) ? prevRect : t));
      const card = cardRef.current;
      if (card) {
        const p = placeCard(
          t,
          { width: card.offsetWidth, height: card.offsetHeight },
          step.placement ?? "bottom",
        );
        setPos(prevPos =>
          prevPos && Math.abs(prevPos.top - p.top) < 1 && Math.abs(prevPos.left - p.left) < 1
            ? prevPos
            : p,
        );
      }
    };
    update();
    const id = window.setInterval(update, 250);
    window.addEventListener("resize", update);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("resize", update);
    };
  }, [step]);

  // Centrar en el panel de la computadora el componente del paso
  useEffect(() => {
    // En móvil, primero mostrar la pestaña correcta (la computadora puede no estar montada)
    if (step.mobileTab) {
      window.dispatchEvent(new CustomEvent(MOBILE_TAB_EVENT, { detail: { tab: step.mobileTab } }));
    }
    if (!step.focus) return;
    const selector = step.focus;
    const id = window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent(COMPUTER_FOCUS_EVENT, { detail: { selector } }));
    }, 150);
    return () => window.clearTimeout(id);
  }, [step.mobileTab, step.focus]);

  // Mover el foco a la tarjeta en cada paso (accesibilidad)
  useEffect(() => {
    cardRef.current?.focus({ preventScroll: true });
  }, [index]);

  // Teclado: Esc cierra; flechas navegan salvo que se esté escribiendo en el editor
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
        return;
      }
      const el = e.target as HTMLElement | null;
      const typing =
        !!el &&
        (el.isContentEditable ||
          el.tagName === "INPUT" ||
          el.tagName === "TEXTAREA" ||
          !!el.closest?.(".cm-editor"));
      if (typing) return;
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [close, next, prev]);

  const achievement = step.done?.(live) ?? null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50" data-testid="first-steps-tour">
      {/* Fondo oscurecido con un "hueco" sobre el elemento resaltado. No bloquea clics. */}
      {target ? (
        <div
          className="absolute rounded-lg border-2 border-mantis-400 transition-all duration-300"
          style={{ ...target, boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.55)" }}
        />
      ) : (
        <div className="absolute inset-0 bg-black/55" />
      )}

      <div
        ref={cardRef}
        role="dialog"
        aria-modal="false"
        aria-labelledby="first-steps-title"
        tabIndex={-1}
        data-testid="first-steps-card"
        className={clsx(
          "pointer-events-auto absolute w-[min(380px,calc(100vw-24px))] rounded-lg border border-mantis-400 bg-stone-900 p-5 text-white shadow-2xl focus:outline-none",
          pos ? "animate-fade-in" : "invisible",
        )}
        style={pos ?? { top: 0, left: 0 }}
      >
        <button
          onClick={close}
          className="absolute right-2 top-2 rounded p-1 text-stone-400 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-mantis-400"
          aria-label="Cerrar guía"
          data-testid="first-steps-close"
        >
          <FontAwesomeIcon icon={faTimes} size="sm" />
        </button>

        <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-stone-700">
          <div
            className="h-full bg-mantis-500 transition-all duration-300"
            style={{ width: `${((index + 1) / steps.length) * 100}%` }}
          />
        </div>

        <h3 id="first-steps-title" className="mb-2 pr-6 text-lg font-semibold text-mantis-400">
          {step.title}
        </h3>
        <div className="space-y-2 text-sm leading-relaxed text-stone-300">{step.body(live)}</div>

        {(step.action || achievement) && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {step.action && !achievement && (
              <Button
                size="sm"
                variant="outline"
                onClick={step.action.run}
                leftIcon={<FontAwesomeIcon icon={faHandPointer} />}
                data-testid="first-steps-action"
              >
                {step.action.label}
              </Button>
            )}
            {achievement && (
              <span
                className="flex items-center gap-1.5 text-sm font-medium text-mantis-300"
                role="status"
              >
                <FontAwesomeIcon icon={faCheckCircle} />
                {achievement}
              </span>
            )}
          </div>
        )}

        <div className="mt-4 flex items-center justify-between gap-2">
          <span className="text-xs text-stone-500">
            Paso {index + 1} de {steps.length}
          </span>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={prev}
              disabled={isFirst}
              leftIcon={<FontAwesomeIcon icon={faChevronLeft} />}
              data-testid="first-steps-prev"
            >
              Anterior
            </Button>
            {isLast ? (
              <Button
                size="sm"
                onClick={close}
                className="bg-mantis-600 hover:bg-mantis-700"
                rightIcon={<FontAwesomeIcon icon={faCheckCircle} />}
                data-testid="first-steps-finish"
              >
                Terminar
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={next}
                className="bg-mantis-600 hover:bg-mantis-700"
                rightIcon={<FontAwesomeIcon icon={faChevronRight} />}
                data-testid="first-steps-next"
              >
                {isFirst ? "Empezar" : "Siguiente"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
