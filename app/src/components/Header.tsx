import clsx from "clsx";
import { useAtom } from "jotai";

import { Controls } from "@/components/Controls";
import { settingsOpenAtom } from "@/components/Settings";
import { useTranslate } from "@/lib/i18n";

export function Header() {
  const translate = useTranslate();
  const [settingsOpen, setSettingsOpen] = useAtom(settingsOpenAtom);

  return (
    <header className="relative p-2 text-sm text-white">
      <div className="flex items-center justify-between">
        {/* Logo y título */}
        <div className="flex select-none items-center justify-center">
          <img
            src={`${import.meta.env.BASE_URL}favicon.svg`}
            className="mr-2 size-10"
            style={{ filter: "none", opacity: 1 }}
            draggable={false}
          />
          <h1 className="text-xl font-bold max-sm:hidden">
            Von<span className="text-mantis-400">Sim</span>8
          </h1>
        </div>
        {/* Controles */}
        <Controls />
        {/* Botón de configuración */}
        <button
          className={clsx(
            "ml-4 size-min rounded-full p-2 transition-colors focus:outline-stone-400",
            settingsOpen
              ? "bg-stone-700 hover:bg-stone-600 focus:bg-stone-600"
              : "hover:bg-stone-800 focus:bg-stone-800",
          )}
          title={translate("settings.title")}
          onClick={() => setSettingsOpen(!settingsOpen)}
        >
          <span className="icon-[lucide--settings] block size-6" />
        </button>
      </div>
    </header>
  );
}
