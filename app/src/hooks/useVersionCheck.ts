import { useCallback, useEffect, useState } from "react";

import { useNotifications } from "@/components/NotificationCenter";

// Declaración de la variable global definida por Vite
declare const __COMMIT_HASH__: string;

interface VersionInfo {
  currentHash: string;
  lastKnownHash: string | null;
  hasUpdate: boolean;
  lastCheck: Date | null;
}

const STORAGE_KEY = "vonsim8-commit-hash";
const VERSION_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutos

export const useVersionCheck = () => {
  const { addNotification } = useNotifications();
  const [versionInfo, setVersionInfo] = useState<VersionInfo>({
    currentHash: __COMMIT_HASH__,
    lastKnownHash: null,
    hasUpdate: false,
    lastCheck: null,
  });

  const checkForVersionUpdate = useCallback(() => {
    const lastHash = localStorage.getItem(STORAGE_KEY);
    const currentHash = __COMMIT_HASH__;
    
    setVersionInfo(prev => ({
      ...prev,
      currentHash,
      lastKnownHash: lastHash,
      lastCheck: new Date(),
    }));

    // Si hay un hash anterior y es diferente al actual, hay una actualización
    if (lastHash && lastHash !== currentHash) {
      setVersionInfo(prev => ({ ...prev, hasUpdate: true }));
      
      addNotification({
        type: "info",
        title: "Nueva versión detectada",
        message: `Se ha detectado una nueva versión de VonSim8 (${currentHash.substring(0, 7)}). Recarga la página para actualizar.`,
      });

      return true;
    }

    return false;
  }, [addNotification]);

  const updateToNewVersion = useCallback(() => {
    // Guardar el hash actual antes de recargar
    localStorage.setItem(STORAGE_KEY, __COMMIT_HASH__);
    
    // Recargar la página
    window.location.reload();
  }, []);

  const dismissUpdate = useCallback(() => {
    setVersionInfo(prev => ({ ...prev, hasUpdate: false }));
  }, []);

  // Verificación inicial al montar el componente
  useEffect(() => {
    checkForVersionUpdate();
  }, [checkForVersionUpdate]);

  // Verificación periódica
  useEffect(() => {
    const interval = setInterval(checkForVersionUpdate, VERSION_CHECK_INTERVAL);
    
    return () => clearInterval(interval);
  }, [checkForVersionUpdate]);

  // Verificar cuando la ventana vuelve a estar activa
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkForVersionUpdate();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [checkForVersionUpdate]);

  // Verificar cuando la conexión vuelve a estar online
  useEffect(() => {
    const handleOnline = () => {
      checkForVersionUpdate();
    };

    window.addEventListener("online", handleOnline);
    
    return () => {
      window.removeEventListener("online", handleOnline);
    };
  }, [checkForVersionUpdate]);

  return {
    versionInfo,
    checkForVersionUpdate,
    updateToNewVersion,
    dismissUpdate,
  };
}; 