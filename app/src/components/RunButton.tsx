import type { IconDefinition } from "@fortawesome/free-solid-svg-icons";
import { faPause } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import clsx from "clsx";

type RunButtonProps = {
  testId: string;
  icon: IconDefinition;
  label: string;
  /** Texto del tooltip; por defecto, el mismo que la etiqueta. */
  title?: string;
  shortcut: string;
  /** Este modo es el que está corriendo: el botón pasa a ser "Pausar". */
  isActive: boolean;
  disabled: boolean;
  compact: boolean;
  showText: boolean;
  showShortcuts: boolean;
  pauseLabel: string;
  onRun: () => void;
  onPause: () => void;
};

/**
 * Botón de ejecución de la barra de controles (Ciclo, Fase, Instrucción,
 * Final). Mientras su modo está corriendo se convierte en "Pausar".
 */
export function RunButton(props: RunButtonProps) {
  const { isActive, compact, showText, showShortcuts } = props;
  return (
    <button
      data-testid={props.testId}
      disabled={!isActive && props.disabled}
      onClick={isActive ? props.onPause : props.onRun}
      title={isActive ? props.pauseLabel : (props.title ?? props.label)}
      className={clsx(
        "group relative flex flex-col items-center rounded-lg transition focus-visible:outline focus-visible:outline-2",
        isActive
          ? "hover:bg-orange-600/20 focus-visible:outline-orange-300"
          : "hover:bg-mantis-600/20 focus-visible:outline-mantis-300 disabled:opacity-50",
        compact ? "px-1 py-0.5" : "px-1.5 py-0.5",
      )}
    >
      <span className="flex items-center justify-center">
        <FontAwesomeIcon
          icon={isActive ? faPause : props.icon}
          size="lg"
          className={clsx(
            "transition group-hover:scale-110",
            isActive ? "text-orange-400" : "text-mantis-400",
          )}
        />
        {showShortcuts && (
          <span className="pointer-events-none ml-1 font-mono text-[10px] text-stone-300">
            {isActive ? "Space" : props.shortcut}
          </span>
        )}
      </span>
      {showText && (
        <span className="mt-0.5 text-xs">{isActive ? props.pauseLabel : props.label}</span>
      )}
    </button>
  );
}
