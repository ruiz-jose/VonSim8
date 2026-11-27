import { Tabs, TabsContent, TabsList, TabsTrigger } from "@radix-ui/react-tabs";
import { useAtom, useAtomValue } from "jotai";
import { memo, useCallback, useMemo, useState } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { useMedia } from "react-use";

import { FirstStepsTour } from "@/components/FirstStepsTour";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { InlineNotificationProvider } from "@/components/InlineNotification";
import { KeyboardInputNotification } from "@/components/KeyboardInputNotification";
import { KeyboardShortcuts } from "@/components/KeyboardShortcuts";
import { Settings, settingsOpenAtom } from "@/components/Settings";
import { UpdateBanner } from "@/components/UpdateBanner";
import { WelcomeTour } from "@/components/WelcomeTour";
import { ComputerContainer } from "@/computer";
import { cycleAtom } from "@/computer/cpu/state";
import { Editor } from "@/editor";
import { usePWAUpdate } from "@/hooks/usePWAUpdate";
import { useVersionCheck } from "@/hooks/useVersionCheck";
import { useTranslate } from "@/lib/i18n";
import { useLanguage } from "@/lib/settings";

// Componente principal optimizado con memo
const App = memo(() => {
  const lang = useLanguage();
  const isMobile = useMedia("(max-width: 640px)");

  // Inicializar los hooks de actualización
  usePWAUpdate();
  useVersionCheck();

  // Memoizar el estilo para evitar re-renders innecesarios
  const containerStyle = useMemo(() => ({}), []);

  return (
    <div
      data-testid="app-container"
      className="flex h-screen w-screen flex-col bg-black text-white"
      lang={lang}
      style={containerStyle}
    >
      <UpdateBanner />
      <Header data-testid="header" />

      {isMobile ? <MobileLayout /> : <DesktopLayout />}

      <Footer data-testid="footer" />

      <WelcomeTour />
      <FirstStepsTour />
      <KeyboardShortcuts />
      <InlineNotificationProvider />
      <KeyboardInputNotification />
    </div>
  );
});

App.displayName = "App";

// Layout de escritorio optimizado
const DesktopLayout = memo(() => {
  const [settingsOpen] = useAtom(settingsOpenAtom);

  return (
    <PanelGroup
      autoSaveId="layout"
      direction="horizontal"
      tagName="main"
      className="overflow-auto px-2"
    >
      <Panel
        id="panel-editor"
        order={1}
        minSize={25}
        defaultSize={40}
        tagName="section"
        aria-label="Editor"
        className="rounded-lg border border-stone-600 bg-black"
        data-testid="panel-editor"
      >
        <Editor className="size-full" />
      </Panel>
      <PanelResizeHandle
        className="group flex w-2 items-center justify-center rounded"
        aria-label="Redimensionar paneles"
      >
        <span className="h-10 w-1 rounded-full bg-stone-700 transition-colors group-hover:bg-mantis-500 group-data-[resize-handle-active]:bg-mantis-400" />
      </PanelResizeHandle>
      <Panel
        id="panel-computer"
        order={2}
        minSize={20}
        defaultSize={60}
        tagName="section"
        aria-label="Computadora"
        className="computer-background rounded-lg border border-stone-600"
        data-testid="panel-computer"
      >
        <ComputerContainer />
      </Panel>
      {settingsOpen && (
        <>
          <PanelResizeHandle
            className="group flex w-2 items-center justify-center rounded"
            aria-label="Redimensionar paneles"
          >
            <span className="h-10 w-1 rounded-full bg-stone-700 transition-colors group-hover:bg-mantis-500 group-data-[resize-handle-active]:bg-mantis-400" />
          </PanelResizeHandle>
          <Panel
            id="panel-settings"
            order={3}
            minSize={30}
            defaultSize={30}
            tagName="section"
            className="rounded-lg border border-stone-600 bg-stone-800"
            data-testid="panel-settings"
          >
            <Settings className="size-full" />
          </Panel>
        </>
      )}
    </PanelGroup>
  );
});

DesktopLayout.displayName = "DesktopLayout";

// Layout móvil optimizado
const MobileLayout = memo(() => {
  const translate = useTranslate();
  const [selectedTab, setSelectedTab] = useState<"editor" | "computer">("editor");
  const [settingsOpen, setSettingsOpen] = useAtom(settingsOpenAtom);
  const cycle = useAtomValue(cycleAtom);

  // Memoizar la instrucción actual para evitar recálculos
  const currentInstruction = useMemo(() => {
    if ("metadata" in cycle && cycle.metadata) {
      return `${cycle.metadata.name}${cycle.metadata.operands.length ? " " + cycle.metadata.operands.join(", ") : ""}`;
    }
    return "";
  }, [cycle]);

  // Memoizar el tab actual
  const tab = useMemo(() => (settingsOpen ? "settings" : selectedTab), [settingsOpen, selectedTab]);

  // Callback optimizado para cambiar tab
  const setTab = useCallback(
    (newTab: string) => {
      if (settingsOpen) setSettingsOpen(false);
      setSelectedTab(newTab as typeof selectedTab);
    },
    [settingsOpen, setSettingsOpen],
  );

  return (
    <Tabs value={tab} onValueChange={setTab} asChild>
      <>
        {/* Instrucción actual (solo en la pestaña Computadora: la pestaña activa ya se ve abajo) */}
        {tab === "computer" && (
          <div
            className="sticky top-0 z-30 flex w-full items-center justify-center gap-2 border-b border-stone-700 bg-stone-900 px-4 py-1.5"
            aria-live="polite"
          >
            <span className="text-xs text-stone-300">Instrucción actual:</span>
            <span className="font-mono text-sm font-bold text-mantis-300">
              {currentInstruction || <span className="font-normal italic text-stone-300">—</span>}
            </span>
          </div>
        )}

        <TabsContent value="editor" asChild>
          <section
            className="mx-2 grow overflow-hidden rounded-lg border border-stone-600 bg-black data-[state=inactive]:hidden"
            data-testid="panel-editor"
          >
            <Editor className="size-full" />
          </section>
        </TabsContent>
        <TabsContent value="computer" asChild>
          <section
            className="computer-background mx-2 grow overflow-hidden rounded-lg border border-stone-600 bg-stone-800 data-[state=inactive]:hidden"
            data-testid="panel-computer"
          >
            <ComputerContainer />
          </section>
        </TabsContent>
        <TabsContent value="settings" asChild>
          <section
            className="mx-2 grow overflow-hidden rounded-lg border border-stone-600 bg-stone-800 data-[state=inactive]:hidden"
            data-testid="panel-settings"
          >
            <Settings className="size-full" />
          </section>
        </TabsContent>

        {/* Barra de navegación mejorada */}
        <div className="border-t border-stone-700 bg-stone-900 p-2">
          <TabsList className="grid grid-cols-3 gap-2">
            <TabsTrigger
              value="editor"
              className="inline-flex min-h-12 flex-col items-center justify-center rounded-lg py-2 text-xs font-medium text-stone-300 transition-colors hover:bg-stone-800 hover:text-white data-[state=active]:bg-mantis-700 data-[state=active]:text-white"
            >
              <span className="icon-[lucide--file-terminal] mb-1 size-5" />
              {translate("control.tabs.editor")}
            </TabsTrigger>
            <TabsTrigger
              value="computer"
              className="inline-flex min-h-12 flex-col items-center justify-center rounded-lg py-2 text-xs font-medium text-stone-300 transition-colors hover:bg-stone-800 hover:text-white data-[state=active]:bg-mantis-700 data-[state=active]:text-white"
            >
              <span className="icon-[lucide--computer] mb-1 size-5" />
              {translate("control.tabs.computer")}
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="inline-flex min-h-12 flex-col items-center justify-center rounded-lg py-2 text-xs font-medium text-stone-300 transition-colors hover:bg-stone-800 hover:text-white data-[state=active]:bg-mantis-700 data-[state=active]:text-white"
            >
              <span className="icon-[lucide--settings] mb-1 size-5" />
              Configuración
            </TabsTrigger>
          </TabsList>
        </div>
      </>
    </Tabs>
  );
});

MobileLayout.displayName = "MobileLayout";

export default App;
