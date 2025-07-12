import { faTimes } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { memo, useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/Button";

type Shortcut = {
  key: string;
  description: string;
  category: string;
};

// Memoizar los atajos de teclado para evitar recreaciones
const keyboardShortcuts: Shortcut[] = [
  // Controles de simulación
  { key: "F7", description: "Ejecutar un ciclo", category: "Simulación" },
  { key: "F8", description: "Ejecutar una instrucción completa", category: "Simulación" },
  { key: "F4", description: "Ejecución infinita", category: "Simulación" },
  { key: "F9", description: "Resetear simulación", category: "Simulación" },
  { key: "Espacio", description: "Pausar/Reanudar (cuando está ejecutando)", category: "Simulación" },
  
  // Editor
  { key: "Ctrl+S", description: "Guardar archivo", category: "Editor" },
  { key: "Ctrl+O", description: "Abrir archivo", category: "Editor" },
  { key: "Ctrl+N", description: "Nuevo archivo", category: "Editor" },
  { key: "Ctrl+Z", description: "Deshacer", category: "Editor" },
  { key: "Ctrl+Y", description: "Rehacer", category: "Editor" },
  { key: "Ctrl+F", description: "Buscar", category: "Editor" },
  { key: "Ctrl+H", description: "Reemplazar", category: "Editor" },
  { key: "Tab", description: "Indentar", category: "Editor" },
  { key: "Shift+Tab", description: "Desindentar", category: "Editor" },
  
  // Navegación
  { key: "F1", description: "Mostrar atajos de teclado", category: "Navegación" },
  { key: "F2", description: "Abrir configuración", category: "Navegación" },
  { key: "F3", description: "Buscar en el código", category: "Navegación" },
  { key: "F5", description: "Actualizar página", category: "Navegación" },
  { key: "F6", description: "Cambiar foco al editor", category: "Navegación" },
  
  // Interfaz
  { key: "Escape", description: "Cerrar diálogos", category: "Interfaz" },
  { key: "Ctrl+Shift+P", description: "Paleta de comandos", category: "Interfaz" },
  { key: "Ctrl+B", description: "Mostrar/ocultar barra lateral", category: "Interfaz" },
  { key: "Ctrl+J", description: "Mostrar/ocultar terminal", category: "Interfaz" },
  
  // Zoom y vista
  { key: "Ctrl++", description: "Zoom in", category: "Vista" },
  { key: "Ctrl+-", description: "Zoom out", category: "Vista" },
  { key: "Ctrl+0", description: "Resetear zoom", category: "Vista" },
  { key: "Ctrl+Shift+Z", description: "Zoom a la selección", category: "Vista" },
  
  // Desarrollo
  { key: "F12", description: "Herramientas de desarrollador", category: "Desarrollo" },
  { key: "Ctrl+Shift+I", description: "Inspeccionar elemento", category: "Desarrollo" },
  { key: "Ctrl+Shift+C", description: "Seleccionar elemento", category: "Desarrollo" },
  { key: "Ctrl+Shift+J", description: "Consola", category: "Desarrollo" },
  { key: "Ctrl+Shift+M", description: "Vista móvil", category: "Desarrollo" }
];

// Hook personalizado para manejar el estado del modal
const useKeyboardShortcutsModal = () => {
  const [isOpen, setIsOpen] = useState(false);

  const openModal = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Manejar tecla F1
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "F1") {
        event.preventDefault();
        openModal();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [openModal]);

  return { isOpen, openModal, closeModal };
};

// Hook personalizado para organizar atajos por categoría
const useShortcutsByCategory = () => {
  return useMemo(() => {
    const grouped = keyboardShortcuts.reduce((acc, shortcut) => {
      if (!acc[shortcut.category]) {
        acc[shortcut.category] = [];
      }
      acc[shortcut.category].push(shortcut);
      return acc;
    }, {} as Record<string, Shortcut[]>);

    return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));
  }, []);
};

// Componente de atajo individual optimizado
const ShortcutItem = memo(({ shortcut }: { shortcut: Shortcut }) => (
  <div className="flex items-center justify-between rounded-lg bg-stone-800 p-3 hover:bg-stone-700 transition-colors">
    <span className="text-sm text-stone-300">{shortcut.description}</span>
    <kbd className="rounded bg-stone-700 px-2 py-1 text-xs font-mono text-white border border-stone-600">
      {shortcut.key}
    </kbd>
  </div>
));

ShortcutItem.displayName = 'ShortcutItem';

// Componente de categoría optimizado
const ShortcutCategory = memo(({ 
  category, 
  shortcuts 
}: {
  category: string;
  shortcuts: Shortcut[];
}) => (
  <div className="space-y-2">
    <h3 className="text-lg font-semibold text-mantis-400 border-b border-stone-600 pb-2">
      {category}
    </h3>
    <div className="space-y-2">
      {shortcuts.map((shortcut, index) => (
        <ShortcutItem key={`${category}-${index}`} shortcut={shortcut} />
      ))}
    </div>
  </div>
));

ShortcutCategory.displayName = 'ShortcutCategory';

// Componente principal optimizado
export const KeyboardShortcuts = memo(() => {
  const { isOpen, closeModal } = useKeyboardShortcutsModal();
  const shortcutsByCategory = useShortcutsByCategory();

  const handleBackdropClick = useCallback((event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      closeModal();
    }
  }, [closeModal]);

  const handleEscapeKey = useCallback((event: KeyboardEvent) => {
    if (event.key === "Escape") {
      closeModal();
    }
  }, [closeModal]);

  // Manejar tecla Escape para cerrar
  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleEscapeKey);
      return () => document.removeEventListener("keydown", handleEscapeKey);
    }
  }, [isOpen, handleEscapeKey]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="w-full max-w-4xl max-h-[80vh] rounded-lg border border-stone-600 bg-stone-900 shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-600 p-4">
          <div className="flex items-center gap-3">
            <span className="icon-[lucide--keyboard] size-6 text-mantis-400" />
            <h2 className="text-xl font-semibold text-white">
              Atajos de Teclado
            </h2>
          </div>
          <button
            onClick={closeModal}
            className="rounded p-2 text-stone-400 hover:text-white transition-colors"
          >
            <FontAwesomeIcon icon={faTimes} size="lg" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(80vh-80px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {shortcutsByCategory.map(([category, shortcuts]) => (
              <ShortcutCategory 
                key={category} 
                category={category} 
                shortcuts={shortcuts} 
              />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-stone-600 p-4 bg-stone-800">
          <div className="flex items-center justify-between text-sm text-stone-400">
            <span>
              Presiona <kbd className="rounded bg-stone-700 px-1 py-0.5 text-xs font-mono border border-stone-600">F1</kbd> para abrir este diálogo
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={closeModal}
              className="text-stone-400 hover:text-white"
            >
              Cerrar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
});

KeyboardShortcuts.displayName = 'KeyboardShortcuts'; 