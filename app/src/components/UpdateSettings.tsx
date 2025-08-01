import { faCog, faDownload, faBell } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { memo, useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import { usePWAUpdate } from "@/hooks/usePWAUpdate";
import { useVersionCheck } from "@/hooks/useVersionCheck";

interface UpdateSettings {
  autoCheck: boolean;
  showBanner: boolean;
  showNotifications: boolean;
  checkInterval: number; // en minutos
}

const DEFAULT_SETTINGS: UpdateSettings = {
  autoCheck: true,
  showBanner: true,
  showNotifications: true,
  checkInterval: 30,
};

const STORAGE_KEY = "vonsim8-update-settings";

export const UpdateSettings = memo(() => {
  const [settings, setSettings] = useState<UpdateSettings>(DEFAULT_SETTINGS);
  const [isOpen, setIsOpen] = useState(false);
  const { updateInfo, checkForUpdates } = usePWAUpdate();
  const { versionInfo, checkForVersionUpdate } = useVersionCheck();

  // Cargar configuración al inicializar
  useEffect(() => {
    const savedSettings = localStorage.getItem(STORAGE_KEY);
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      } catch {
        setSettings(DEFAULT_SETTINGS);
      }
    }
  }, []);

  // Guardar configuración cuando cambie
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const updateSetting = useCallback((key: keyof UpdateSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleManualCheck = useCallback(() => {
    checkForUpdates();
    checkForVersionUpdate();
  }, [checkForUpdates, checkForVersionUpdate]);

  const toggleOpen = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  if (!isOpen) {
    return (
      <Button
        onClick={toggleOpen}
        variant="ghost"
        size="sm"
        className="text-stone-400 hover:text-white"
        title="Configuración de actualizaciones"
      >
        <FontAwesomeIcon icon={faCog} className="size-4" />
      </Button>
    );
  }

  return (
    <div className="relative">
      <Button
        onClick={toggleOpen}
        variant="ghost"
        size="sm"
        className="text-stone-400 hover:text-white"
        title="Configuración de actualizaciones"
      >
        <FontAwesomeIcon icon={faCog} className="size-4" />
      </Button>

      <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-lg border border-stone-600 bg-stone-900 p-4 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Configuración de actualizaciones</h3>
          <Button
            onClick={toggleOpen}
            variant="ghost"
            size="sm"
            className="text-stone-400 hover:text-white"
          >
            ×
          </Button>
        </div>

        <div className="space-y-4">
          {/* Estado actual */}
          <div className="rounded-lg border border-stone-600 p-3">
            <h4 className="mb-2 font-medium text-white">Estado actual</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-stone-400">PWA Update:</span>
                <span className={updateInfo.available ? "text-green-400" : "text-stone-500"}>
                  {updateInfo.available ? "Disponible" : "Actualizado"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">Versión:</span>
                <span className={versionInfo.hasUpdate ? "text-green-400" : "text-stone-500"}>
                  {versionInfo.hasUpdate ? "Nueva disponible" : "Actualizada"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">Última verificación:</span>
                <span className="text-stone-500">
                  {versionInfo.lastCheck 
                    ? new Date(versionInfo.lastCheck).toLocaleTimeString()
                    : "Nunca"
                  }
                </span>
              </div>
            </div>
          </div>

          {/* Verificación manual */}
          <div className="flex justify-center">
            <Button
              onClick={handleManualCheck}
              disabled={updateInfo.updating}
              className="bg-mantis-600 hover:bg-mantis-500"
              size="sm"
            >
              <FontAwesomeIcon icon={faDownload} className="mr-2" />
              Verificar actualizaciones
            </Button>
          </div>

          {/* Configuraciones */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FontAwesomeIcon icon={faDownload} className="size-4 text-stone-400" />
                <span className="text-sm text-white">Verificación automática</span>
              </div>
              <input
                type="checkbox"
                checked={settings.autoCheck}
                onChange={(e) => updateSetting("autoCheck", e.target.checked)}
                className="rounded border-stone-600 bg-stone-800 text-mantis-500 focus:ring-mantis-500"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FontAwesomeIcon icon={faBell} className="size-4 text-stone-400" />
                <span className="text-sm text-white">Mostrar banner</span>
              </div>
              <input
                type="checkbox"
                checked={settings.showBanner}
                onChange={(e) => updateSetting("showBanner", e.target.checked)}
                className="rounded border-stone-600 bg-stone-800 text-mantis-500 focus:ring-mantis-500"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FontAwesomeIcon icon={faBell} className="size-4 text-stone-400" />
                <span className="text-sm text-white">Notificaciones</span>
              </div>
              <input
                type="checkbox"
                checked={settings.showNotifications}
                onChange={(e) => updateSetting("showNotifications", e.target.checked)}
                className="rounded border-stone-600 bg-stone-800 text-mantis-500 focus:ring-mantis-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-white">
                Intervalo de verificación (minutos)
              </label>
              <select
                value={settings.checkInterval}
                onChange={(e) => updateSetting("checkInterval", parseInt(e.target.value))}
                className="w-full rounded border border-stone-600 bg-stone-800 px-3 py-1 text-white focus:border-mantis-500 focus:outline-none"
              >
                <option value={5}>5 minutos</option>
                <option value={15}>15 minutos</option>
                <option value={30}>30 minutos</option>
                <option value={60}>1 hora</option>
                <option value={120}>2 horas</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

UpdateSettings.displayName = "UpdateSettings"; 