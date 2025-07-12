import { Tabs, TabsContent, TabsList, TabsTrigger } from "@radix-ui/react-tabs";
import { useAtom, useAtomValue } from "jotai";
import { memo, useCallback, useMemo, useState } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { useMedia } from "react-use";
import { useRegisterSW } from "virtual:pwa-register/react";

import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { KeyboardShortcuts } from "@/components/KeyboardShortcuts";
import { Settings, settingsOpenAtom } from "@/components/Settings";
import { WelcomeTour } from "@/components/WelcomeTour";
import { toast } from "@/lib/toast";

import { ComputerContainer } from "@/computer";
import { cycleAtom } from "@/computer/cpu/state";
import { Editor } from "@/editor";
import { useTranslate } from "@/lib/i18n";
import { useFilters, useLanguage } from "@/lib/settings";

// Componente principal optimizado con memo
const App = memo(() => {
  const lang = useLanguage();
  const filter = useFilters();
  const isMobile = useMedia("(max-width: 640px)");
  const translate = useTranslate();

  // Memoizar el estilo para evitar re-renders innecesarios
  const containerStyle = useMemo(() => ({ filter }), [filter]);

  // Configurar notificaciones de actualización PWA
  const { updateServiceWorker } = useRegisterSW({
    onNeedRefresh() {
      toast({
        title: translate("update.update-available"),
        action: (
          <button
            onClick={() => updateServiceWorker(true)}
            className="text-xs bg-mantis-500 hover:bg-mantis-600 text-white px-2 py-1 rounded transition-colors"
          >
            {translate("update.reload")}
          </button>
        ),
        duration: Infinity,
      });
    },
  });

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

App.displayName = 'App';

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
        minSize={30}
        tagName="section"
        className="rounded-lg border border-stone-600 bg-black"
        data-testid="panel-editor"
      >
        <Editor className="size-full" />
      </Panel>
      <PanelResizeHandle className="w-2" />
      <Panel
        id="panel-computer"
        order={2}
        minSize={20}
        tagName="section"
        className="computer-background rounded-lg border border-stone-600"
        data-testid="panel-computer"
      >
        <ComputerContainer />
      </Panel>
      {settingsOpen && (
        <>
          <PanelResizeHandle className="w-2" />
          <Panel
            id="panel-settings"
            order={3}
            minSize={30}
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

DesktopLayout.displayName = 'DesktopLayout';

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
  const tab = useMemo(() => settingsOpen ? "settings" : selectedTab, [settingsOpen, selectedTab]);

  // Callback optimizado para cambiar tab
  const setTab = useCallback((newTab: string) => {
    if (settingsOpen) setSettingsOpen(false);
    setSelectedTab(newTab as typeof selectedTab);
  }, [settingsOpen, setSettingsOpen]);

  // Memoizar el texto del tab actual
  const tabText = useMemo(() => {
    switch (tab) {
      case "editor": return "Editor";
      case "computer": return "Computadora";
      case "settings": return "Configuración";
      default: return "";
    }
  }, [tab]);

  return (
    <Tabs value={tab} onValueChange={setTab} asChild>
      <>
        {/* Barra de estado mejorada */}
        <div className="sticky top-0 z-30 w-full border-b border-stone-700 bg-stone-900 px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-stone-500">Pestaña:</span>
              <span className="text-sm font-medium text-white">
                {tabText}
              </span>
            </div>
            {tab === "computer" && (
              <div className="text-center">
                <div className="text-xs text-stone-500">Instrucción actual:</div>
                <div className="font-mono text-sm text-mantis-400">
                  {currentInstruction || <span className="italic text-stone-400">Sin instrucción</span>}
                </div>
              </div>
            )}
          </div>
        </div>

        <TabsContent value="editor" asChild>
          <section className="mx-2 grow overflow-hidden rounded-lg border border-stone-600 bg-black data-[state=inactive]:hidden" data-testid="panel-editor">
            <Editor className="size-full" />
          </section>
        </TabsContent>
        <TabsContent value="computer" asChild>
          <section className="computer-background mx-2 grow overflow-hidden rounded-lg border border-stone-600 bg-stone-800 data-[state=inactive]:hidden" data-testid="panel-computer">
            <ComputerContainer />
          </section>
        </TabsContent>
        <TabsContent value="settings" asChild>
          <section className="mx-2 grow overflow-hidden rounded-lg border border-stone-600 bg-stone-800 data-[state=inactive]:hidden" data-testid="panel-settings">
            <Settings className="size-full" />
          </section>
        </TabsContent>

        {/* Barra de navegación mejorada */}
        <div className="border-t border-stone-700 bg-stone-900 p-2">
          <TabsList className="grid grid-cols-3 gap-2">
            <TabsTrigger
              value="editor"
              className="inline-flex flex-col items-center justify-center rounded-lg py-2 text-xs font-medium text-stone-400 transition-colors hover:bg-stone-800 hover:text-white data-[state=active]:bg-mantis-600 data-[state=active]:text-white"
            >
              <span className="icon-[lucide--file-terminal] mb-1 size-5" />
              {translate("control.tabs.editor")}
            </TabsTrigger>
            <TabsTrigger
              value="computer"
              className="inline-flex flex-col items-center justify-center rounded-lg py-2 text-xs font-medium text-stone-400 transition-colors hover:bg-stone-800 hover:text-white data-[state=active]:bg-mantis-600 data-[state=active]:text-white"
            >
              <span className="icon-[lucide--computer] mb-1 size-5" />
              {translate("control.tabs.computer")}
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="inline-flex flex-col items-center justify-center rounded-lg py-2 text-xs font-medium text-stone-400 transition-colors hover:bg-stone-800 hover:text-white data-[state=active]:bg-mantis-600 data-[state=active]:text-white"
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

MobileLayout.displayName = 'MobileLayout';

export default App;
