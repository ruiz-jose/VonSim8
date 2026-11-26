import "./styles.css";

import { history, indentLess, indentMore } from "@codemirror/commands";
import { EditorSelection, EditorState } from "@codemirror/state";
import {
  drawSelection,
  EditorView,
  highlightActiveLine,
  highlightActiveLineGutter,
  highlightSpecialChars,
  keymap,
  lineNumbers,
} from "@codemirror/view";
import { vscodeKeymap } from "@replit/codemirror-vscode-keymap";
import clsx from "clsx";
import { useCallback, useEffect, useState } from "react";

import { useEditorFontSize } from "@/lib/settings";

import { getSavedProgram, syncStatePlugin } from "./files";
import { lineHighlightField, readOnly } from "./methods";
import { StatusBar } from "./StatusBar";
import { VonSim } from "./vonsim";

/**
 * CodeMirror editor
 *
 * I've chosen to use CodeMirror because it's a very powerful editor that
 * supports mobile devices.
 *
 * I save the editor instance in the window object so I can access it from
 * anywhere in the app. I don't save it in a React state because it's a
 * very heavy object and I don't want to re-render the app every time the
 * editor changes.
 */

export function Editor({ className }: { className?: string }) {
  const [element, setElement] = useState<HTMLElement>();
  const fontSize = useEditorFontSize();

  const ref = useCallback((node: HTMLElement | null) => {
    if (!node) return;

    setElement(node);
  }, []);

  useEffect(() => {
    if (!element) return;

    // Accesibilidad de teclado: Tab inserta espacios, pero si se presiona
    // Escape justo antes, Tab mueve el foco fuera del editor (evita la
    // "trampa de teclado", WCAG 2.1.2).
    let escapePressed = false;

    window.codemirror = new EditorView({
      state: EditorState.create({
        doc: getSavedProgram() || "",
        extensions: [
          EditorState.tabSize.of(2),
          readOnly.of(EditorState.readOnly.of(false)),

          syncStatePlugin,

          lineNumbers(),
          lineHighlightField,
          highlightActiveLineGutter(),
          highlightSpecialChars(),
          history(),
          drawSelection(),
          EditorView.contentAttributes.of({ "aria-label": "Editor de código assembly" }),
          EditorView.domEventHandlers({
            // Prevent dropping files into the editor, handled by the file handler
            drop: ev => ev.preventDefault(),
            keydown: ev => {
              if (ev.key !== "Escape" && ev.key !== "Tab") escapePressed = false;
              return false;
            },
          }),
          EditorState.allowMultipleSelections.of(true),
          highlightActiveLine(),
          EditorView.updateListener.of(update => {
            if (update.selectionSet) {
              // Bloque intencionalmente vacío
            }
          }),
          keymap.of([
            {
              key: "Escape",
              run: view => {
                escapePressed = true;
                view.dispatch({
                  selection: EditorSelection.create([view.state.selection.main], 0),
                });
                return true;
              },
            },
            {
              key: "Tab",
              run: view => {
                if (escapePressed) {
                  escapePressed = false;
                  return false; // Dejar que el navegador mueva el foco
                }
                if (view.state.selection.ranges.some(r => !r.empty)) return indentMore(view);
                view.dispatch(
                  view.state.update(view.state.replaceSelection(" ".repeat(view.state.tabSize)), {
                    scrollIntoView: true,
                    userEvent: "input",
                  }),
                );
                return true;
              },
              shift: view => {
                if (escapePressed) {
                  escapePressed = false;
                  return false; // Dejar que el navegador mueva el foco hacia atrás
                }
                return indentLess(view);
              },
            },
            // El Tab de vscodeKeymap siempre previene el comportamiento por
            // defecto; se reemplaza por el de arriba para poder salir del editor.
            ...vscodeKeymap.filter(binding => !(binding.key === "Tab" && binding.shift)),
          ]),
          VonSim(),
        ],
      }),
      parent: element,
    });

    return () => window.codemirror?.destroy();
  }, [element]);

  return (
    <div
      className={clsx(
        "flex flex-col rounded-lg border border-stone-700 bg-gradient-to-br from-stone-900 to-stone-800 shadow-xl",
        className,
      )}
    >
      <div
        ref={ref}
        className="grow overflow-auto rounded-t-lg font-mono"
        style={{
          fontSize: `${fontSize}px`,
          lineHeight: 1.25,
        }}
      />
      <StatusBar />
    </div>
  );
}
