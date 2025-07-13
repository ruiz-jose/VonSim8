import { memo, useEffect, useMemo } from "react";
import { useMedia } from "react-use";

import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { KeyboardShortcuts } from "@/components/KeyboardShortcuts";
import { NotificationProvider, useNotifications } from "@/components/NotificationCenter";
import { WelcomeTour } from "@/components/WelcomeTour";
import { ComputerContainer } from "@/computer";
import { useFilters, useLanguage } from "@/lib/settings";

// Declaración de la variable global definida por Vite
// eslint-disable-next-line no-var
declare const __COMMIT_HASH__: string;

// Componente interno que usa las notificaciones
const AppContent = memo(() => {
  const lang = useLanguage();
  const filter = useFilters();
  const isMobile = useMedia("(max-width: 640px)");
  const { addNotification } = useNotifications();

  // Memoizar el estilo para evitar re-renders innecesarios
  const containerStyle = useMemo(() => ({ filter }), [filter]);

  // Aviso de nueva versión disponible
  useEffect(() => {
    const STORAGE_KEY = "vonsim8-commit-hash";
    const lastHash = localStorage.getItem(STORAGE_KEY);

    // Función para verificar si hay una nueva versión disponible
    const checkForUpdates = async () => {
      try {
        // Verificar si hay una nueva versión en el repositorio remoto
        const response = await fetch("https://api.github.com/repos/ruiz-jose/VonSim8/commits/main");
        if (response.ok) {
          const data = (await response.json()) as { sha: string };
          const latestHash = data.sha.substring(0, 7); // Hash corto del último commit

          // Si el hash actual es diferente al último commit, mostrar notificación
          if (__COMMIT_HASH__ !== latestHash) {
            addNotification({
              type: "info",
              title: "¡Hay una nueva versión disponible!",
              message:
                "Hay una nueva versión disponible en el repositorio. Recarga la página para actualizar.",
            });
            return;
          }
        }
      } catch (error) {
        console.warn("No se pudo verificar actualizaciones:", error);
      }

      // Verificar cambio local de versión (código original)
      if (lastHash && lastHash !== __COMMIT_HASH__) {
        addNotification({
          type: "info",
          title: "¡Hay una nueva versión disponible!",
          message: "Se ha detectado una nueva versión local. Recarga la página para actualizar.",
        });
      }
    };

    // Verificar actualizaciones al cargar la app
    checkForUpdates();

    // Guardar el hash actual
    localStorage.setItem(STORAGE_KEY, __COMMIT_HASH__);
  }, [addNotification]);

  return (
    <div
      data-testid="app-container"
      className="flex h-screen w-screen flex-col bg-black text-white"
      lang={lang}
      style={containerStyle}
    >
      <Header data-testid="header" />

      {isMobile ? <MobileLayout /> : <DesktopLayout />}

      <Footer data-testid="footer" />

      <WelcomeTour />
      <KeyboardShortcuts />
    </div>
  );
});

AppContent.displayName = "AppContent";

// Layout de escritorio optimizado
const DesktopLayout = memo(() => {
  return (
    <main className="overflow-auto px-2">
      <div className="grid h-full grid-cols-2 gap-4">
        <section className="rounded-lg border border-stone-600 bg-black" data-testid="panel-editor">
          {/* Editor placeholder */}
          <div className="p-4 text-white">Editor</div>
        </section>
        <section
          className="computer-background rounded-lg border border-stone-600"
          data-testid="panel-computer"
        >
          <ComputerContainer />
        </section>
      </div>
    </main>
  );
});

DesktopLayout.displayName = "DesktopLayout";

// Layout móvil optimizado
const MobileLayout = memo(() => {
  return (
    <main className="overflow-auto px-2">
      <section
        className="computer-background rounded-lg border border-stone-600 bg-stone-800"
        data-testid="panel-computer"
      >
        <ComputerContainer />
      </section>
    </main>
  );
});

MobileLayout.displayName = "MobileLayout";

// Componente principal que envuelve con el provider
const App = memo(() => {
  return (
    <NotificationProvider>
      <AppContent />
    </NotificationProvider>
  );
});

App.displayName = "App";

export default App;
