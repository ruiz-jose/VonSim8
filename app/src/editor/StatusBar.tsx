import clsx from "clsx";
import { ejemplos } from "./examples/examples";
import { atom, useAtomValue, useSetAtom } from "jotai";
import { useCallback, useEffect } from "react";

import { Button } from "@/components/ui/Button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/Popover";
import { Slider } from "@/components/ui/Slider";
import { Tooltip } from "@/components/ui/Tooltip";
import { useSettings } from "@/lib/settings";
import { toast } from "@/lib/toast";

import { getSavedProgram } from "./files";

export const lintErrorsAtom = atom(0);

// Átomos para manejar el estado del archivo
const _fileHandleAtom = atom(null as any);
const fileHandleAtom = atom(
  get => get(_fileHandleAtom),
  (get, set, newValue: any) => {
    set(_fileHandleAtom, newValue);
  },
);
const lastSavedProgramAtom = atom("");
const programAtom = atom(() => {
  if (typeof window !== "undefined" && window.codemirror) {
    return window.codemirror.state.doc.toString();
  }
  return getSavedProgram() || "";
});
const dirtyAtom = atom(get => get(lastSavedProgramAtom) !== get(programAtom));

// Type declaration for File System Access API
declare global {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface FileSystemFileHandle {
    getFile(): Promise<File>;
    requestPermission(descriptor?: FileSystemHandlePermissionDescriptor): Promise<PermissionState>;
    name: string;
    createWritable(options?: any): Promise<any>;
  }
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface Window {
    showOpenFilePicker?(options?: any): Promise<FileSystemFileHandle[]>;
    showSaveFilePicker?(options?: any): Promise<FileSystemFileHandle>;
  }
}

const supportsNativeFileSystem = "showSaveFilePicker" in window;

export function StatusBar() {
  // Tamaño de fuente del editor
  const [settings, setSettings] = useSettings();
  const lintErrors = useAtomValue(lintErrorsAtom);
  const fileHandle = useAtomValue(fileHandleAtom);
  const setFileHandle = useSetAtom(fileHandleAtom);
  const setLastSavedProgram = useSetAtom(lastSavedProgramAtom);
  const dirty = useAtomValue(dirtyAtom);

  const unsavedChanges = fileHandle && dirty;



  // Sincronizar el estado del programa cuando cambie
  useEffect(() => {
    if (window.codemirror) {
      const updateListener = () => {
        // Actualizar el programAtom cuando cambie el contenido
        // Esto se maneja automáticamente por el syncStatePlugin
      };

      window.codemirror.dom.addEventListener("input", updateListener);
      return () => {
        window.codemirror.dom.removeEventListener("input", updateListener);
      };
    }
  }, []);


    // Abrir archivo desde la PC
    const openFileFromPC = useCallback(async () => {
      if (!supportsNativeFileSystem) {
        toast({ title: "editor.files.unsupported", variant: "error" });
        return;
      }
      if (unsavedChanges) {
        const discard = confirm("editor.files.unsaved");
        if (!discard) return;
      }
      try {
        const [fileHandle] = await window.showOpenFilePicker({
          multiple: false,
          excludeAcceptAllOption: true,
          types: [{ accept: { "text/plain": [".txt", ".asm", ".vonsim"] } }],
        });
        const status = await fileHandle.requestPermission({ mode: "readwrite" });
        if (status === "granted") {
          setFileHandle(fileHandle);
          const file = await fileHandle.getFile();
          const source = await file.text();
          setLastSavedProgram(source);
          window.codemirror!.dispatch({
            changes: { from: 0, to: window.codemirror!.state.doc.length, insert: source },
          });
        }
      } catch (error) {
        console.error(error);
        toast({ title: "editor.files.open-error", variant: "error" });
      }
    }, [unsavedChanges, setFileHandle, setLastSavedProgram]);

    // Abrir ejemplo
    const openExample = useCallback((ejemplo: typeof ejemplos[0]) => {
      if (unsavedChanges) {
        const discard = confirm("editor.files.unsaved");
        if (!discard) return;
      }
      setFileHandle(null);
      setLastSavedProgram(ejemplo.contenido);
      window.codemirror!.dispatch({
        changes: { from: 0, to: window.codemirror!.state.doc.length, insert: ejemplo.contenido },
      });
      toast({ title: `Ejemplo cargado: ${ejemplo.nombre}`, variant: "info" });
    }, [unsavedChanges, setFileHandle, setLastSavedProgram]);

  const saveFile = useCallback(async () => {
    if (!supportsNativeFileSystem) {
      toast({ title: "editor.files.unsupported", variant: "error" });
      return;
    }

    if (!fileHandle) {
      toast({ title: "No hay archivo abierto para guardar", variant: "error" });
      return;
    }

    if (!unsavedChanges) return;

    try {
      const source = window.codemirror!.state.doc.toString();
      const writable = await fileHandle.createWritable({ keepExistingData: false });
      await writable.write(source);
      await writable.close();
      setLastSavedProgram(source);
      toast({ title: "Archivo guardado", variant: "info" });
    } catch (error) {
      console.error(error);
      toast({ title: "editor.files.save-error", variant: "error" });
    }
  }, [fileHandle, unsavedChanges, setLastSavedProgram]);

  const saveFileAs = useCallback(async () => {
    const source = window.codemirror!.state.doc.toString();
    const filename = fileHandle?.name || `vonsim-${new Date().toISOString().slice(0, 10)}.asm`;

    if (supportsNativeFileSystem) {
      try {
        const fileHandle = await window.showSaveFilePicker({
          suggestedName: filename,
          excludeAcceptAllOption: true,
          types: [{ accept: { "text/plain": [".txt", ".asm", ".vonsim"] } }],
        });
        const status = await fileHandle.requestPermission({ mode: "readwrite" });
        if (status === "granted") {
          setFileHandle(fileHandle);
          const writable = await fileHandle.createWritable({ keepExistingData: false });
          await writable.write(source);
          await writable.close();
          setLastSavedProgram(source);
          toast({ title: "Archivo guardado", variant: "info" });
        }
      } catch (error) {
        console.error(error);
        toast({ title: "editor.files.save-error", variant: "error" });
      }
    } else {
      const blob = new Blob([source], { type: "text/plain" });
      const href = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.style.display = "none";
      a.href = href;
      a.download = filename;

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(href);
    }
  }, [fileHandle, setFileHandle, setLastSavedProgram]);

  return (
    <div
      data-testid="status-bar"
      className="flex items-center justify-between border-t border-stone-700 bg-gradient-to-r from-stone-800 to-stone-900 px-4 py-0.5 font-sans text-xs text-stone-300 shadow-inner"
    >
      {/* Sección izquierda - Nombre del archivo e iconos */}
      <div className="flex items-center gap-4">
        {/* Nombre del archivo */}
        {fileHandle && (
          <div className="flex items-center gap-2">
            <span className="font-medium text-white transition-colors">{fileHandle.name}</span>
            {unsavedChanges && <span className="size-2 rounded-full bg-orange-400" />}
          </div>
        )}

        {/* Separador */}
        {fileHandle && <div className="h-4 w-px bg-stone-600" />}

        {/* Iconos de archivo */}
            <div className="flex items-center gap-2">
              {/* Popover para abrir archivo o ejemplo */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hover-lift"
                    aria-label="editor.files.open"
                  >
                    <span className="icon-[lucide--folder-open] size-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-64 p-2">
                  <div className="flex flex-col gap-2 text-left">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={openFileFromPC}
                      className="justify-start w-full text-left px-3 hover:bg-mantis-900/30 text-mantis-400"
                    >
                      <span className="icon-[lucide--laptop] size-4 mr-2 text-mantis-400" />
                      <span className="text-left text-mantis-300">Abrir desde la PC</span>
                    </Button>
                    <div className="my-2 h-px w-full bg-stone-700/60" />
                    <div className="mb-1 text-xs text-stone-400 pl-1">Ejemplos:</div>
                    <div className="rounded-lg bg-stone-800/40 p-1">
                      {ejemplos.map(ejemplo => (
                        <Button
                          key={ejemplo.filename}
                          variant="ghost"
                          size="sm"
                          className="flex w-full items-center px-3 hover:bg-yellow-900/30 text-yellow-400"
                          onClick={() => openExample(ejemplo)}
                        >
                          <span className="icon-[lucide--file-text] size-4 mr-2 text-yellow-400" />
                          <span className="flex-1 text-left text-yellow-200 whitespace-normal">{ejemplo.nombre}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              <Tooltip content="editor.files.save" position="top">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={saveFile}
                  disabled={!fileHandle || !unsavedChanges}
                  className="hover-lift"
                  aria-label="editor.files.save"
                >
                  <span className="icon-[lucide--save] size-4" />
                </Button>
              </Tooltip>

              <Tooltip content="editor.files.save-as" position="top">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={saveFileAs}
                  className="hover-lift"
                  aria-label="editor.files.save-as"
                >
                  <span className="icon-[lucide--save-all] size-4" />
                </Button>
              </Tooltip>
            </div>
      </div>

      {/* Sección derecha - Tamaño de fuente y Errores */}
      <div className="flex items-center gap-6">
        {/* Tamaño de fuente del editor - rediseñado */}
        <Popover>
          <PopoverTrigger asChild>
            <button
              className="flex items-center justify-center rounded-lg p-1 text-stone-300 hover:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-mantis-500"
              aria-label="Ajustar tamaño de fuente del editor"
              title="Ajustar tamaño de fuente del editor"
              type="button"
            >
              <span className="icon-[lucide--pilcrow-square] size-5" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-56 p-4">
            <div className="mb-2 flex items-center gap-2">
              <span className="icon-[lucide--pilcrow-square] size-5 text-mantis-400" />
              <span className="text-sm font-medium text-white">Tamaño de fuente del editor</span>
              <span className="ml-auto text-xs text-stone-400">{settings.editorFontSize}px</span>
            </div>
            <Slider
              value={[settings.editorFontSize]}
              min={8}
              max={64}
              step={1}
              onValueChange={([value]) => setSettings(prev => ({ ...prev, editorFontSize: value }))}
              className="w-full"
            />
            <div className="mt-2 flex justify-between text-xs text-stone-500">
              <span>8</span>
              <span>64</span>
            </div>
          </PopoverContent>
        </Popover>
        {/* Indicador de errores */}
        <div
          className={clsx(
            "flex items-center gap-1.5 rounded-full px-2 py-0.5 font-medium transition-colors",
            lintErrors > 0
              ? "border border-red-500/30 bg-red-500/20 text-red-300"
              : "border border-green-500/30 bg-green-500/20 text-green-300",
          )}
        >
          <div
            className={clsx("size-2 rounded-full", lintErrors > 0 ? "bg-red-400" : "bg-green-400")}
          />
          <span className="font-mono">
            {lintErrors > 0 ? `${lintErrors} error${lintErrors > 1 ? "es" : ""}` : "Sin errores"}
          </span>
        </div>
      </div>
    </div>
  );
}
