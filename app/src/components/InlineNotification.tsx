import { useEffect, useState } from "react";

export function InlineNotificationProvider() {
  const [notifications, setNotifications] = useState<
    {
      id: string;
      title: string;
      message: string;
      targetId: string;
    }[]
  >([]);

  useEffect(() => {
    const handleInlineNotification = (event: CustomEvent) => {
      const { title, message, targetId, duration } = event.detail;
      const id = Math.random().toString(36).substr(2, 9);

      setNotifications(prev => [...prev, { id, title, message, targetId }]);

      // Auto-remover después de la duración especificada
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }, duration || 3000);
    };

    window.addEventListener("showInlineNotification", handleInlineNotification as EventListener);

    return () => {
      window.removeEventListener(
        "showInlineNotification",
        handleInlineNotification as EventListener,
      );
    };
  }, []);

  return (
    <>
      {notifications.map(notification => (
        <InlineNotification
          key={notification.id}
          title={notification.title}
          message={notification.message}
          targetId={notification.targetId}
        />
      ))}
    </>
  );
}

function InlineNotification({
  title,
  message,
  targetId,
}: {
  title: string;
  message: string;
  targetId: string;
}) {
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    const targetElement = document.getElementById(targetId);
    if (targetElement) {
      const rect = targetElement.getBoundingClientRect();
      setPosition({
        top: rect.top,
        left: rect.right + 10, // 10px a la derecha del elemento
      });
    }
  }, [targetId]);

  if (!position) return null;

  return (
    <div
      className="pointer-events-none fixed z-50 duration-300 animate-in fade-in slide-in-from-left-2"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      <div className="max-w-[200px] rounded-lg bg-blue-500/95 px-3 py-2 text-xs text-white shadow-lg">
        <div className="mb-1 font-semibold">{title}</div>
        <div className="text-[10px] opacity-90">{message}</div>
      </div>
    </div>
  );
}
