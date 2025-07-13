import { EditorView, ViewPlugin, ViewUpdate } from "@codemirror/view";
import clsx from "clsx";
import { atom, useAtomValue, useSetAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { useCallback } from "react";
import { useEvent, useKey } from "react-use";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { translate, useTranslate } from "@/lib/i18n";
import { store } from "@/lib/jotai";
import { getSettings } from "@/lib/settings";
import { toast } from "@/lib/toast";

import { programModifiedAtom } from "./state";

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

// Sync program with CodeMirror
const programAtom = atomWithStorage(
  "vonsim-program",
  translate(getSettings().language, "editor.example"),
  undefined,
  { getOnInit: true },
);

export const useSavedProgram = () => useAtomValue(programAtom);
export const getSavedProgram = () => {
  const result = store.get(programAtom);
  return typeof result === "string" ? result : "";
};

export const syncStatePlugin = ViewPlugin.fromClass(
  class {
    constructor(readonly view: EditorView) {}
    update(update: ViewUpdate) {
      if (update.docChanged) {
        store.set(programAtom, this.view.state.doc.toString());
        store.set(programModifiedAtom, true); // Marca el programa como modificado
      }
    }
  },
);

// Save program to file
const supportsNativeFileSystem = "showSaveFilePicker" in window;

const _fileHandleAtom = atom(null as any);
const fileHandleAtom = atom(
  get => get(_fileHandleAtom),
  (get, set, newValue: any) => {
    set(_fileHandleAtom, newValue);
  },
);
const lastSavedProgramAtom = atom("");
const dirtyAtom = atom(get => get(lastSavedProgramAtom) !== get(programAtom));

export function FileHandler() {
  const translate = useTranslate();

  const fileHandle = useAtomValue(fileHandleAtom);
  const setFileHandle = useSetAtom(fileHandleAtom);
  const dirty = useAtomValue(dirtyAtom);
  const setLastSavedProgram = useSetAtom(lastSavedProgramAtom);

  const unsavedChanges = fileHandle && dirty;

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
      if (status === "granted") setFileHandle(fileHandle);
      const file = await fileHandle.getFile();
      const source = await file.text();
      setLastSavedProgram(source);
      window.codemirror!.dispatch({
        changes: { from: 0, to: window.codemirror!.state.doc.length, insert: source },
      });
    } catch (error) {
      console.error(error);
      toast({ title: translate("editor.files.open-error"), variant: "error" });
    }
  }, [translate, unsavedChanges, setFileHandle, setLastSavedProgram]);

  // Open file with Ctrl+O
  useKey(
    ev => ev.ctrlKey && ev.key === "o",
    ev => {
      ev.preventDefault();
      openFile();
    },
    undefined,
    [openFile],
  );

  // Drop file to open
  const dropFile = useCallback(
    async (ev: DragEvent) => {
      ev.stopPropagation();
      ev.preventDefault();

      if (!supportsNativeFileSystem) {
        toast({ title: translate("editor.files.unsupported"), variant: "error" });
        return;
      }
      const item = ev.dataTransfer?.items?.[0];
      if (!item || item.kind !== "file") return;

      if (unsavedChanges) {
        const discard = confirm(translate("editor.files.unsaved"));
        if (!discard) return;
      }

      try {
        const fileHandle = (await item.getAsFileSystemHandle()) as FileSystemFileHandle | null;
        if (!fileHandle) throw new Error("File handle not found");
        const status = await fileHandle.requestPermission({ mode: "readwrite" });
        if (status === "granted") setFileHandle(fileHandle);
        const file = await fileHandle.getFile();
        const source = await file.text();
        setLastSavedProgram(source);
        window.codemirror!.dispatch({
          changes: { from: 0, to: window.codemirror!.state.doc.length, insert: source },
        });
      } catch (error) {
        console.error(error);
        toast({ title: translate("editor.files.open-error"), variant: "error" });
      }
    },
    [setFileHandle, setLastSavedProgram, translate, unsavedChanges],
  );
  useEvent("drop", dropFile as (ev: Event) => Promise<void>, window);
  // Prevent navigating away from the page when dropping a file
  useEvent(
    "dragover",
    ev => {
      ev.preventDefault();
      ev.stopPropagation();
    },
    window,
  );

  const saveFile = useCallback(async () => {
    if (!supportsNativeFileSystem) {
      toast({ title: translate("editor.files.unsupported"), variant: "error" });
      return;
    }

    if (!unsavedChanges) return;

    try {
      const source = window.codemirror!.state.doc.toString();
      const writable = await fileHandle.createWritable({ keepExistingData: false });
      await writable.write(source);
      await writable.close();
      setLastSavedProgram(source);
    } catch (error) {
      console.error(error);
      toast({ title: translate("editor.files.save-error"), variant: "error" });
    }
  }, [translate, unsavedChanges, fileHandle, setLastSavedProgram]);

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
        if (status !== "granted") throw new Error(`Permission denied: ${status}`);
        setFileHandle(fileHandle);
        const writable = await fileHandle.createWritable({ keepExistingData: false });
        await writable.write(source);
        await writable.close();
        setLastSavedProgram(source);
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

  // ONLY IF the browser supports native file system
  // If a file is open, save it with Ctrl+S
  // If no file is open, save as with Ctrl+S
  useKey(
    ev => ev.ctrlKey && ev.key === "s",
    ev => {
      ev.preventDefault();
      if (supportsNativeFileSystem) {
        if (fileHandle) saveFile();
        else saveFileAs();
      }
    },
    undefined,
    [fileHandle, saveFile, saveFileAs],
  );

  // Save file as with Ctrl+Shift+S
  useKey(
    ev => ev.ctrlKey && ev.shiftKey && ev.key === "S",
    ev => {
      ev.preventDefault();
      saveFileAs();
    },
    undefined,
    [saveFileAs],
  );

  // Prevent user from exiting the page with unsaved changes
  const beforeunload = useCallback(
    (ev: BeforeUnloadEvent) => {
      if (unsavedChanges) {
        ev.preventDefault();
        ev.returnValue = translate("editor.files.unsaved");
      }
    },
    [translate, unsavedChanges],
  );
  useEvent("beforeunload", beforeunload, window);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={clsx(
            "flex items-center transition-colors hover:text-white",
            fileHandle && "text-white",
          )}
          data-testid="new-button"
        >
          {fileHandle ? fileHandle.name : translate("editor.files.no-file")}
          {unsavedChanges && <span className="ml-1 size-2 rounded-full bg-current" />}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="start">
        <DropdownMenuItem onClick={openFile} data-testid="open-button">
          <span className="icon-[lucide--file-search-2] mr-2 size-4" />
          {translate("editor.files.open")}
          <div className="grow" />
          <kbd className="text-stone-600">Ctrl+O</kbd>
        </DropdownMenuItem>
        <DropdownMenuItem disabled={!unsavedChanges} onClick={saveFile} data-testid="save-button">
          <span className="icon-[lucide--save] mr-2 size-4" />
          {translate("editor.files.save")}
          <div className="grow" />
          <kbd className="text-stone-600">Ctrl+S</kbd>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={saveFileAs} data-testid="save-as-button">
          <span className="icon-[lucide--save-all] mr-2 size-4" />
          {translate("editor.files.save-as")}
          <div className="grow" />
          <kbd className="text-stone-600">Ctrl+Shift+S</kbd>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
