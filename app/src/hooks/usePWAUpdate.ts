import { useEffect } from "react";
import { registerSW } from "virtual:pwa-register";

import { useNotifications } from "@/components/NotificationCenter";

export const usePWAUpdate = () => {
  const { addNotification } = useNotifications();

  useEffect(() => {
    const updateSW = registerSW({
      onNeedRefresh() {
        // Agregar notificación de actualización disponible
        addNotification({
          type: "info",
          title: "Nueva versión disponible",
          message: "Hay una nueva versión de VonSim8 disponible. Haz clic en 'Actualizar' para aplicar los cambios.",
        });
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
      },
      onRegisterError(error) {
        console.error("Error al registrar Service Worker:", error);
        // Agregar notificación de error
        addNotification({
          type: "error",
          title: "Error de actualización",
          message: "No se pudo configurar la actualización automática. Algunas funciones pueden no estar disponibles.",
        });
      },
    });

    // Función para actualizar manualmente
    const handleUpdate = () => {
      updateSW();
    };

    // Exponer la función de actualización globalmente
    (window as any).updateVonSim8 = handleUpdate;

    return () => {
      // Limpiar la función global al desmontar
      delete (window as any).updateVonSim8;
    };
  }, [addNotification]);
}; 