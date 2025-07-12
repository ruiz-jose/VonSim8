import { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { toast } from '@/lib/toast';
import { useTranslate } from '@/lib/i18n';

export function useUpdateNotification() {
  const translate = useTranslate();
  const [updateAvailable, setUpdateAvailable] = useState(false);
  
  const { updateServiceWorker, needRefresh, offlineReady } = useRegisterSW({
    onNeedRefresh() {
      setUpdateAvailable(true);
      toast({
        title: translate("update.update-available"),
        description: "Se ha detectado una nueva versión de VonSim8. Haz clic en 'Actualizar' para obtener las últimas mejoras.",
        action: (
          <button
            onClick={() => updateServiceWorker(true)}
            className="text-xs bg-mantis-500 hover:bg-mantis-600 text-white px-2 py-1 rounded transition-colors"
          >
            {translate("update.reload")}
          </button>
        ),
        duration: Infinity,
        variant: "default",
      });
    },
    onOfflineReady() {
      toast({
        title: "VonSim8 está listo para uso offline",
        description: "La aplicación se puede usar sin conexión a internet.",
        duration: 5000,
        variant: "default",
      });
    },
  });

  // Escuchar mensajes del Service Worker
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'NEW_VERSION_AVAILABLE') {
        setUpdateAvailable(true);
        toast({
          title: "Nueva versión detectada",
          description: "Se ha detectado una nueva versión de VonSim8 en el servidor.",
          duration: 10000,
          variant: "default",
        });
      }
    };

    navigator.serviceWorker?.addEventListener('message', handleMessage);
    
    return () => {
      navigator.serviceWorker?.removeEventListener('message', handleMessage);
    };
  }, []);

  // Verificar actualizaciones periódicamente
  useEffect(() => {
    const checkForUpdates = () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          registrations.forEach((registration) => {
            registration.update();
          });
        });
      }
    };

    // Verificar cada 5 minutos
    const interval = setInterval(checkForUpdates, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  return {
    updateServiceWorker,
    needRefresh: needRefresh || updateAvailable,
    offlineReady,
    updateAvailable,
  };
} 