import {
  faBell,
  faCheck,
  faExclamationTriangle,
  faInfo,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import clsx from "clsx";
import { createContext, memo, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/Button";

type NotificationType = "info" | "success" | "warning" | "error";

type Notification = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
};

// Contexto para las notificaciones
type NotificationContextType = {
  addNotification: (notification: Omit<Notification, "id" | "timestamp" | "read">) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearAll: () => void;
  notifications: Notification[];
};

const NotificationContext = createContext<NotificationContextType | null>(null);

// Hook para usar el contexto de notificaciones
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
};

// Hook personalizado para manejar las notificaciones
const useNotificationState = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // Cargar notificaciones al inicializar
  useEffect(() => {
    const savedNotifications = localStorage.getItem("vonsim8-notifications");
    if (savedNotifications) {
      try {
        const parsed = JSON.parse(savedNotifications) as any;
        if (Array.isArray(parsed)) {
          const validNotifications: Notification[] = parsed
            .filter(
              (item: any) =>
                item &&
                typeof item === "object" &&
                "id" in item &&
                "type" in item &&
                "title" in item &&
                "message" in item &&
                "timestamp" in item &&
                "read" in item,
            )
            .map((item: any) => ({
              id: String(item.id),
              type: item.type as Notification["type"],
              title: String(item.title),
              message: String(item.message),
              timestamp: new Date(item.timestamp),
              read: Boolean(item.read),
            }));
          setNotifications(validNotifications);
        }
      } catch {
        setNotifications([]);
      }
    }

    // Agregar notificación de bienvenida si es primera vez
    const hasSeenWelcome = localStorage.getItem("vonsim8-welcome-notification");
    if (!hasSeenWelcome) {
      const welcomeNotification: Notification = {
        id: "welcome",
        type: "info",
        title: "¡Bienvenido a VonSim8!",
        message:
          "Gracias por usar nuestro simulador. Aquí encontrarás notificaciones importantes sobre el funcionamiento de la aplicación.",
        timestamp: new Date(),
        read: false,
      };
      setNotifications(prev => [welcomeNotification, ...prev]);
      localStorage.setItem("vonsim8-welcome-notification", "true");
    }
  }, []);

  // Guardar notificaciones en localStorage cuando cambien
  useEffect(() => {
    localStorage.setItem("vonsim8-notifications", JSON.stringify(notifications));
  }, [notifications]);

  const addNotification = useCallback(
    (notification: Omit<Notification, "id" | "timestamp" | "read">) => {
      const newNotification: Notification = {
        ...notification,
        id: Date.now().toString(),
        timestamp: new Date(),
        read: false,
      };
      setNotifications(prev => [newNotification, ...prev]);
    },
    [],
  );

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(notif => (notif.id === id ? { ...notif, read: true } : notif)),
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
  }, []);

  const deleteNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    isOpen,
    setIsOpen,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  };
};

// Hook personalizado para calcular estadísticas
const useNotificationStats = (notifications: Notification[]) => {
  return useMemo(() => {
    const total = notifications.length;
    const unread = notifications.filter(n => !n.read).length;
    const byType = notifications.reduce(
      (acc, notif) => {
        acc[notif.type] = (acc[notif.type] || 0) + 1;
        return acc;
      },
      {} as Record<NotificationType, number>,
    );

    return { total, unread, byType };
  }, [notifications]);
};

// Componente de icono de notificación optimizado
const NotificationIcon = memo(({ type }: { type: NotificationType }) => {
  const iconConfig = useMemo(() => {
    switch (type) {
      case "info":
        return { icon: faInfo, className: "text-blue-400" };
      case "success":
        return { icon: faCheck, className: "text-green-400" };
      case "warning":
        return { icon: faExclamationTriangle, className: "text-yellow-400" };
      case "error":
        return { icon: faExclamationTriangle, className: "text-red-400" };
      default:
        return { icon: faInfo, className: "text-blue-400" };
    }
  }, [type]);

  return (
    <FontAwesomeIcon icon={iconConfig.icon} className={clsx("size-4", iconConfig.className)} />
  );
});

NotificationIcon.displayName = "NotificationIcon";

// Componente de notificación individual optimizado
const NotificationItem = memo(
  ({
    notification,
    onMarkAsRead,
    onDelete,
  }: {
    notification: Notification;
    onMarkAsRead: (id: string) => void;
    onDelete: (id: string) => void;
  }) => {
    const formatTime = useCallback((date: Date) => {
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);
      const days = Math.floor(diff / 86400000);

      if (days > 0) return `${days}d`;
      if (hours > 0) return `${hours}h`;
      if (minutes > 0) return `${minutes}m`;
      return "Ahora";
    }, []);

    return (
      <div
        className={clsx(
          "rounded-lg border p-3 transition-colors",
          notification.read ? "border-stone-600 bg-stone-800" : "border-mantis-500 bg-stone-800/80",
        )}
      >
        <div className="flex items-start gap-3">
          <NotificationIcon type={notification.type} />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between">
              <h4 className="font-medium text-white">{notification.title}</h4>
              <button
                onClick={() => onDelete(notification.id)}
                className="ml-2 rounded p-1 text-stone-400 transition-colors hover:text-white"
              >
                <FontAwesomeIcon icon={faTimes} size="sm" />
              </button>
            </div>
            <p className="mt-1 text-sm text-stone-300">{notification.message}</p>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-stone-500">{formatTime(notification.timestamp)}</span>
              {!notification.read && (
                <button
                  onClick={() => onMarkAsRead(notification.id)}
                  className="text-xs text-mantis-400 transition-colors hover:text-mantis-300"
                >
                  Marcar como leída
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  },
);

NotificationItem.displayName = "NotificationItem";

// Componente principal optimizado
export const NotificationCenter = memo(() => {
  const {
    notifications,
    isOpen,
    setIsOpen,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  } = useNotificationState();

  const { total, unread } = useNotificationStats(notifications);

  const toggleOpen = useCallback(() => {
    setIsOpen(prev => !prev);
  }, [setIsOpen]);

  // Memoizar las notificaciones no leídas
  const unreadNotifications = useMemo(() => notifications.filter(n => !n.read), [notifications]);

  // Memoizar las notificaciones leídas
  const readNotifications = useMemo(() => notifications.filter(n => n.read), [notifications]);

  if (!isOpen) {
    return (
      <button
        onClick={toggleOpen}
        className="relative rounded-full p-2 transition-colors hover:bg-stone-800 focus:outline-stone-400"
        title="Centro de notificaciones"
      >
        <FontAwesomeIcon icon={faBell} className="size-4" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={toggleOpen}
        className="relative rounded-full p-2 transition-colors hover:bg-stone-800 focus:outline-stone-400"
        title="Centro de notificaciones"
      >
        <FontAwesomeIcon icon={faBell} className="size-4" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-lg border border-stone-600 bg-stone-900 p-4 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Notificaciones ({total})</h3>
          <div className="flex gap-2">
            {unread > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="text-xs text-stone-400 hover:text-white"
              >
                Marcar todas
              </Button>
            )}
            {total > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAll}
                className="text-xs text-red-400 hover:text-red-300"
              >
                Limpiar
              </Button>
            )}
          </div>
        </div>

        <div className="max-h-96 space-y-3 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="text-center text-sm text-stone-500">No hay notificaciones</p>
          ) : (
            <>
              {unreadNotifications.length > 0 && (
                <div className="space-y-2">
                  {unreadNotifications.map(notification => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onMarkAsRead={markAsRead}
                      onDelete={deleteNotification}
                    />
                  ))}
                </div>
              )}

              {readNotifications.length > 0 && unreadNotifications.length > 0 && (
                <hr className="border-stone-600" />
              )}

              {readNotifications.length > 0 && (
                <div className="space-y-2">
                  {readNotifications.map(notification => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onMarkAsRead={markAsRead}
                      onDelete={deleteNotification}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
});

NotificationCenter.displayName = "NotificationCenter";

// Provider para el contexto de notificaciones
export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const notificationState = useNotificationState();

  const contextValue = useMemo(
    () => ({
      addNotification: notificationState.addNotification,
      markAsRead: notificationState.markAsRead,
      markAllAsRead: notificationState.markAllAsRead,
      deleteNotification: notificationState.deleteNotification,
      clearAll: notificationState.clearAll,
      notifications: notificationState.notifications,
    }),
    [notificationState],
  );

  return (
    <NotificationContext.Provider value={contextValue}>{children}</NotificationContext.Provider>
  );
};
