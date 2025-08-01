import { faDownload, faSync, faTimes, faRocket, faCheckCircle } from "@fortawesome/free-solid-svg-icons";
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
        isDismissed 
          ? "transform -translate-y-full opacity-0" 
          : "transform translate-y-0 opacity-100"
      )}
    >
      {/* Fondo con gradiente profesional y efecto glass */}
      <div className="bg-gradient-to-r from-stone-900/95 via-stone-800/95 to-stone-900/95 backdrop-blur-md border-b border-stone-700/50 shadow-2xl">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            {/* Contenido principal */}
            <div className="flex items-center space-x-4">
              {/* Icono animado */}
              <div className="relative flex-shrink-0">
                <div className="absolute inset-0 bg-mantis-500/20 rounded-full animate-ping"></div>
                <div className="relative bg-gradient-to-br from-mantis-500 to-mantis-600 p-2 sm:p-3 rounded-full shadow-lg">
                  <FontAwesomeIcon 
                    icon={faRocket} 
                    className="size-4 sm:size-5 text-white animate-bounce" 
                  />
                </div>
              </div>

              {/* Texto informativo */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2 mb-1">
                  <h3 className="font-bold text-base sm:text-lg text-white">
                    Nueva versión disponible
                  </h3>
                  <div className="flex items-center space-x-1 bg-mantis-500/20 px-2 py-1 rounded-full w-fit">
                    <FontAwesomeIcon icon={faCheckCircle} className="size-3 text-mantis-400" />
                    <span className="text-xs font-medium text-mantis-300">Actualización</span>
                  </div>
                </div>
                <p className="text-stone-300 text-xs sm:text-sm leading-relaxed">
                  Hay una nueva versión de VonSim8 con mejoras y correcciones. 
                  Te recomendamos actualizar para obtener la mejor experiencia.
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
                  isUpdating && "animate-pulse"
                )}
                leftIcon={
                  <FontAwesomeIcon
                    icon={isUpdating ? faSync : faDownload}
                    className={clsx(
                      "transition-transform duration-200 size-3 sm:size-4",
                      isUpdating && "animate-spin"
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
                className="text-stone-400 hover:text-white hover:bg-stone-700/50 transition-all duration-200 flex-shrink-0"
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
        <div className="h-1 bg-gradient-to-r from-mantis-500 to-mantis-600 animate-pulse">
          <div className="h-full bg-white/30 animate-shimmer"></div>
        </div>
      )}
    </div>
  );
});

UpdateBanner.displayName = "UpdateBanner";
