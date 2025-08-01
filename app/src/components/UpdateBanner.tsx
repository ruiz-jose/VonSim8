import {
  faCheckCircle,
  faDownload,
  faRocket,
  faSync,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import clsx from "clsx";
import { memo, useCallback, useState } from "react";

import { Button } from "@/components/ui/Button";
import { usePWAUpdate } from "@/hooks/usePWAUpdate";
import { useVersionCheck } from "@/hooks/useVersionCheck";

export const UpdateBanner = memo(() => {
  const { updateInfo, updateApp } = usePWAUpdate();
  const { versionInfo, updateToNewVersion } = useVersionCheck();
  const [isVisible, setIsVisible] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Determinar si hay una actualización disponible
  const hasUpdate = updateInfo.available || versionInfo.hasUpdate;

  const handleUpdate = useCallback(async () => {
    setIsUpdating(true);
    try {
      if (updateInfo.available) {
        // Usar actualización PWA si está disponible
        await updateApp();
      } else if (versionInfo.hasUpdate) {
        // Usar recarga de página para actualización de versión
        updateToNewVersion();
      }
      setIsVisible(false);
    } catch (error) {
      console.error("Error al actualizar:", error);
    } finally {
      setIsUpdating(false);
    }
  }, [updateApp, updateInfo.available, updateToNewVersion, versionInfo.hasUpdate]);

  const handleDismiss = useCallback(() => {
    setIsDismissed(true);
    // Animar la salida antes de ocultar completamente
    setTimeout(() => {
      setIsVisible(false);
    }, 300);
  }, []);

  // No mostrar si no hay actualización disponible o si el usuario la ocultó
  if (!hasUpdate || !isVisible) {
    return null;
  }

  return (
    <div
      className={clsx(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300 ease-out",
        isDismissed ? "-translate-y-full opacity-0" : "translate-y-0 opacity-100",
      )}
    >
      {/* Fondo con gradiente profesional y efecto glass */}
      <div className="border-b border-stone-700/50 bg-gradient-to-r from-stone-900/95 via-stone-800/95 to-stone-900/95 shadow-2xl backdrop-blur-md">
        <div className="mx-auto max-w-7xl p-4">
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            {/* Contenido principal */}
            <div className="flex items-center space-x-4">
              {/* Icono animado */}
              <div className="relative shrink-0">
                <div className="absolute inset-0 animate-ping rounded-full bg-mantis-500/20"></div>
                <div className="relative rounded-full bg-gradient-to-br from-mantis-500 to-mantis-600 p-2 shadow-lg sm:p-3">
                  <FontAwesomeIcon
                    icon={faRocket}
                    className="size-4 animate-bounce text-white sm:size-5"
                  />
                </div>
              </div>

              {/* Texto informativo */}
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-col space-y-1 sm:flex-row sm:items-center sm:space-x-2 sm:space-y-0">
                  <h3 className="text-base font-bold text-white sm:text-lg">
                    Nueva versión disponible
                  </h3>
                  <div className="flex w-fit items-center space-x-1 rounded-full bg-mantis-500/20 px-2 py-1">
                    <FontAwesomeIcon icon={faCheckCircle} className="size-3 text-mantis-400" />
                    <span className="text-xs font-medium text-mantis-300">Actualización</span>
                  </div>
                </div>
                <p className="text-xs leading-relaxed text-stone-300 sm:text-sm">
                  Hay una nueva versión de VonSim8 con mejoras y correcciones. Te recomendamos
                  actualizar para obtener la mejor experiencia.
                </p>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex items-center justify-end space-x-3">
              {/* Botón principal de actualización */}
              <Button
                onClick={handleUpdate}
                disabled={isUpdating}
                variant="primary"
                size="sm"
                className={clsx(
                  "relative overflow-hidden transition-all duration-300",
                  "bg-gradient-to-r from-mantis-600 to-mantis-700",
                  "hover:from-mantis-700 hover:to-mantis-800",
                  "shadow-lg hover:shadow-xl",
                  "border border-mantis-500/30",
                  "text-xs sm:text-sm",
                  isUpdating && "animate-pulse",
                )}
                leftIcon={
                  <FontAwesomeIcon
                    icon={isUpdating ? faSync : faDownload}
                    className={clsx(
                      "size-3 transition-transform duration-200 sm:size-4",
                      isUpdating && "animate-spin",
                    )}
                  />
                }
              >
                {isUpdating ? "Actualizando..." : "Actualizar ahora"}
              </Button>

              {/* Botón de cerrar */}
              <Button
                onClick={handleDismiss}
                variant="ghost"
                size="sm"
                className="shrink-0 text-stone-400 transition-all duration-200 hover:bg-stone-700/50 hover:text-white"
                aria-label="Cerrar banner de actualización"
              >
                <FontAwesomeIcon icon={faTimes} className="size-3 sm:size-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Indicador de progreso sutil */}
      {isUpdating && (
        <div className="h-1 animate-pulse bg-gradient-to-r from-mantis-500 to-mantis-600">
          <div className="animate-shimmer h-full bg-white/30"></div>
        </div>
      )}
    </div>
  );
});

UpdateBanner.displayName = "UpdateBanner";
