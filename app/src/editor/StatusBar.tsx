import clsx from "clsx";
import { atom, useAtomValue, useSetAtom } from "jotai";
import { useCallback, useEffect } from "react";

import { Button } from "@/components/ui/Button";
import { Tooltip } from "@/components/ui/Tooltip";
import { translate, useTranslate } from "@/lib/i18n";
import { toast } from "@/lib/toast";

import { getSavedProgram, syncStatePlugin } from "./files";



export const lintErrorsAtom = atom(0);

// Átomos para manejar el estado del archivo
const _fileHandleAtom = atom(null as any);
const fileHandleAtom = atom(
  (get) => get(_fileHandleAtom),
  (get, set, newValue: any) => {
    set(_fileHandleAtom, newValue);
  }
);
const lastSavedProgramAtom = atom("");
const programAtom = atom(() => {
  if (typeof window !== 'undefined' && window.codemirror) {
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
  const translate = useTranslate();
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
        const currentProgram = window.codemirror!.state.doc.toString();
        // Actualizar el programAtom cuando cambie el contenido
        // Esto se maneja automáticamente por el syncStatePlugin
      };
      
      window.codemirror.dom.addEventListener('input', updateListener);
      return () => {
        window.codemirror.dom.removeEventListener('input', updateListener);
      };
    }
  }, []);

  const openFile = useCallback(async () => {
    if (!supportsNativeFileSystem) {
      toast({ title: translate("editor.files.unsupported"), variant: "error" });
      return;
    }

    if (unsavedChanges) {
      const discard = confirm(translate("editor.files.unsaved"));
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
      toast({ title: translate("editor.files.open-error"), variant: "error" });
    }
  }, [translate, unsavedChanges, setFileHandle, setLastSavedProgram]);

  const saveFile = useCallback(async () => {
    if (!supportsNativeFileSystem) {
      toast({ title: translate("editor.files.unsupported"), variant: "error" });
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
      toast({ title: translate("editor.files.save-error"), variant: "error" });
    }
  }, [translate, fileHandle, unsavedChanges, setLastSavedProgram]);

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
        toast({ title: translate("editor.files.save-error"), variant: "error" });
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
  }, [translate, fileHandle, setFileHandle, setLastSavedProgram]);

  return (
    <div data-testid="status-bar" className="flex items-center justify-between border-t border-stone-700 bg-gradient-to-r from-stone-800 to-stone-900 px-4 py-0.5 font-sans text-xs text-stone-300 shadow-inner">
      {/* Sección izquierda - Nombre del archivo e iconos */}
      <div className="flex items-center gap-4">
        {/* Nombre del archivo */}
        {fileHandle && (
          <div className="flex items-center gap-2">
            <span className="font-medium text-white transition-colors">
              {fileHandle.name}
            </span>
            {unsavedChanges && <span className="size-2 rounded-full bg-orange-400" />}
          </div>
        )}
        
        {/* Separador */}
        {fileHandle && <div className="h-4 w-px bg-stone-600" />}
        
        {/* Iconos de archivo */}
        <div className="flex items-center gap-2">
          <Tooltip content={translate("editor.files.open")} position="top">
            <Button
              variant="ghost"
              size="sm"
              onClick={openFile}
              className="hover-lift"
              aria-label={translate("editor.files.open")}
            >
              <span className="icon-[lucide--folder-open] size-4" />
            </Button>
          </Tooltip>
          
          <Tooltip content={translate("editor.files.save")} position="top">
            <Button
              variant="ghost"
              size="sm"
              onClick={saveFile}
              disabled={!fileHandle || !unsavedChanges}
              className="hover-lift"
              aria-label={translate("editor.files.save")}
            >
              <span className="icon-[lucide--save] size-4" />
            </Button>
          </Tooltip>
          
          <Tooltip content={translate("editor.files.save-as")} position="top">
            <Button
              variant="ghost"
              size="sm"
              onClick={saveFileAs}
              className="hover-lift"
              aria-label={translate("editor.files.save-as")}
            >
              <span className="icon-[lucide--save-all] size-4" />
            </Button>
          </Tooltip>
        </div>
      </div>

      {/* Sección derecha - Errores */}
      <div className="flex items-center gap-3">
        {/* Indicador de errores */}
        <div className={clsx(
          "flex items-center gap-1.5 rounded-full px-2 py-0.5 font-medium transition-colors",
          lintErrors > 0 
            ? "bg-red-500/20 text-red-300 border border-red-500/30"
            : "bg-green-500/20 text-green-300 border border-green-500/30"
        )}>
          <div className={clsx(
            "size-2 rounded-full",
            lintErrors > 0 ? "bg-red-400" : "bg-green-400"
          )} />
          <span className="font-mono">
            {lintErrors > 0 ? `${lintErrors} error${lintErrors > 1 ? 'es' : ''}` : "Sin errores"}
          </span>
        </div>
      </div>
    </div>
  );
}
