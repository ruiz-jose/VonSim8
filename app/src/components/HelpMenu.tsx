import { faQuestionCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { memo } from "react";

import { IconButton } from "@/components/ui/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { Tooltip } from "@/components/ui/Tooltip";

/** Botón de ayuda (?) del encabezado: abre la guía de primeros pasos o el recorrido. */
export const HelpMenu = memo(
  ({
    onShowFirstSteps,
    onShowTour,
    compact = false,
  }: {
    onShowFirstSteps: () => void;
    onShowTour: () => void;
    /** Versión más chica para pantallas angostas */
    compact?: boolean;
  }) => (
    <DropdownMenu>
      <Tooltip content="Ayuda" position="bottom" disabled={compact}>
        <DropdownMenuTrigger asChild>
          <IconButton
            icon={<FontAwesomeIcon icon={faQuestionCircle} className="size-4" />}
            variant="ghost"
            size={compact ? "sm" : "md"}
            aria-label="Ayuda"
            className="hover-lift"
            data-testid="help-button"
          />
        </DropdownMenuTrigger>
      </Tooltip>
      <DropdownMenuContent className="w-72 max-w-[calc(100vw-16px)]" align="end">
        <DropdownMenuLabel>Ayuda</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onShowFirstSteps} data-testid="help-first-steps">
          <span className="icon-[lucide--rocket] mr-2 size-4 shrink-0" />
          <div className="flex flex-col">
            <span>Primeros pasos</span>
            <span className="text-xs text-stone-400">Tu primer programa, paso a paso</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onShowTour} data-testid="help-interface-tour">
          <span className="icon-[lucide--map] mr-2 size-4 shrink-0" />
          <div className="flex flex-col">
            <span>Recorrido por la interfaz</span>
            <span className="text-xs text-stone-400">Para qué sirve cada parte</span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
);

HelpMenu.displayName = "HelpMenu";
