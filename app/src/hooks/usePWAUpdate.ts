import { useEffect, useMemo, useRef, useState } from "react";
import { registerSW } from "virtual:pwa-register";

import { useNotifications } from "@/components/NotificationCenter";

type UpdateInfo = {
  available: boolean;
  updating: boolean;
  lastUpdate: Date | null;
};

export const usePWAUpdate = () => {
  const notifications = useNotifications();
  const addNotification = useMemo(() => {
    return (
      notifications?.addNotification ||
      (() => {
        // Función vacía para evitar errores cuando no hay provider
      })
    );
  }, [notifications?.addNotification]);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo>({
    available: false,
    updating: false,
    lastUpdate: null,
  });
  const updateSWRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const updateSW = registerSW({
      onNeedRefresh() {
        setUpdateInfo(prev => ({ ...prev, available: true }));

        // Agregar notificación de actualización disponible
        addNotification({
          type: "info",
          title: "Nueva versión disponible",
          message:
            "Hay una nueva versión de VonSim8 disponible. Haz clic en 'Actualizar' para aplicar los cambios.",
        });

        // Opcional: Mostrar toast adicional
        if (typeof window !== "undefined" && (window as any).VonSimAddNotification) {
          (window as any).VonSimAddNotification({
            type: "info",
            title: "Actualización disponible",
            message: "Una nueva versión está lista para instalar.",
          });
        }
      },
      onOfflineReady() {
        // Agregar notificación de modo offline
        addNotification({
          type: "success",
          title: "Modo offline disponible",
          message: "VonSim8 ahora está disponible para uso offline.",
        });
      },
      onRegistered(swRegistration) {
        console.log("Service Worker registrado:", swRegistration);

        // Verificar si hay actualizaciones pendientes
        if (swRegistration.waiting) {
          setUpdateInfo(prev => ({ ...prev, available: true }));
        }
      },
      onRegisterError(error) {
        console.error("Error al registrar Service Worker:", error);
        // Agregar notificación de error
        addNotification({
          type: "error",
          title: "Error de actualización",
          message:
            "No se pudo configurar la actualización automática. Algunas funciones pueden no estar disponibles.",
        });
      },
    });

    updateSWRef.current = updateSW;

    // Función para actualizar manualmente
    const handleUpdate = async () => {
      if (updateSWRef.current) {
        setUpdateInfo(prev => ({ ...prev, updating: true }));

        try {
          updateSWRef.current();
          setUpdateInfo(prev => ({
            ...prev,
            available: false,
            updating: false,
            lastUpdate: new Date(),
          }));

          // Notificar actualización exitosa
          addNotification({
            type: "success",
            title: "Actualización aplicada",
            message: "La nueva versión se ha aplicado correctamente.",
          });
        } catch (error) {
          console.error("Error al actualizar:", error);
          setUpdateInfo(prev => ({ ...prev, updating: false }));

          addNotification({
            type: "error",
            title: "Error al actualizar",
            message: "No se pudo aplicar la actualización. Inténtalo de nuevo.",
          });
        }
      }
    };

    // Exponer la función de actualización globalmente
    (window as any).updateVonSim8 = handleUpdate;

    // Función para verificar actualizaciones manualmente
    const checkForUpdates = () => {
      if (updateSWRef.current) {
        updateSWRef.current();
      }
    };

    // Exponer función de verificación manual
    (window as any).checkVonSim8Updates = checkForUpdates;

    // Verificar actualizaciones cada 5 minutos
    const interval = setInterval(checkForUpdates, 5 * 60 * 1000);

    return () => {
      // Limpiar la función global al desmontar
      delete (window as any).updateVonSim8;
      delete (window as any).checkVonSim8Updates;
      clearInterval(interval);
    };
  }, [addNotification]);

  return {
    updateInfo,
    updateApp: () => {
      if (updateSWRef.current) {
        updateSWRef.current();
      }
    },
    checkForUpdates: () => {
      if (updateSWRef.current) {
        updateSWRef.current();
      }
    },
  };
};
