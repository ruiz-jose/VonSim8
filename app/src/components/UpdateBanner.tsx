import { faDownload, faSync, faTimes } from "@fortawesome/free-solid-svg-icons";
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
    setIsVisible(false);
  }, []);

  // No mostrar si no hay actualización disponible o si el usuario la ocultó
  if (!hasUpdate || !isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 top-0 z-50 bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
      <div className="mx-auto max-w-7xl px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FontAwesomeIcon icon={faDownload} className="size-5 animate-pulse" />
            <div>
              <h3 className="font-semibold">Nueva versión disponible</h3>
              <p className="text-sm opacity-90">
                Hay una nueva versión de VonSim8 lista para instalar
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              onClick={handleUpdate}
              disabled={isUpdating}
              className="bg-white text-blue-600 hover:bg-gray-100 disabled:opacity-50"
              size="sm"
            >
              <FontAwesomeIcon
                icon={isUpdating ? faSync : faDownload}
                className={clsx("mr-2", isUpdating && "animate-spin")}
              />
              {isUpdating ? "Actualizando..." : "Actualizar ahora"}
            </Button>

            <Button
              onClick={handleDismiss}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/10"
            >
              <FontAwesomeIcon icon={faTimes} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
});

UpdateBanner.displayName = "UpdateBanner";
