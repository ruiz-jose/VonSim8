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
      <Controls className=" absolute inset-0" />

      <div className="flex items-center justify-between">
        <div className="flex select-none items-center justify-center">
          <img src={`${import.meta.env.BASE_URL}favicon.svg`} className="mr-2 h-10 w-10" />
          <h1 className="text-xl font-bold max-sm:hidden">
            Von<span className="text-green-400">Sim</span>8
          </h1>
        </div>

        <button
          className={clsx(
            "h-min w-min rounded-full p-2 transition-colors focus:outline-stone-400",
            settingsOpen
              ? "bg-stone-700 hover:bg-stone-600 focus:bg-stone-600"
              : "hover:bg-stone-800 focus:bg-stone-800",
          )}
          title={translate("settings.title")}
          onClick={() => setSettingsOpen(!settingsOpen)}
        >
          <span className="block h-6 w-6">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-full w-full">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2h-1.5a2 2 0 0 1-2-2v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2v-1.5a2 2 0 0 1 2-2h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.09a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2h1.5a2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.09a1.65 1.65 0 0 0 1.51 1h.09a2 2 0 0 1 2 2v1.5a2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
          </span>
        </button>
      </div>
    </header>
  );
}
