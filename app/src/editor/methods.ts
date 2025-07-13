import { Compartment, EditorState, StateEffect, StateField } from "@codemirror/state";
import { Decoration, EditorView } from "@codemirror/view";

export const readOnly = new Compartment();

export function setReadOnly(value: boolean) {
  if (!window.codemirror) return;
  window.codemirror.dispatch({
    effects: readOnly.reconfigure(EditorState.readOnly.of(value)),
  });
}

const addLineHighlight = StateEffect.define<number | null>();
const addCurrentInstructionHighlight = StateEffect.define<number | null>();

export const lineHighlightField = StateField.define({
  create() {
    return Decoration.none;
  },
  update(oldLines, tr) {
    let lines = oldLines.map(tr.changes);
    for (const e of tr.effects) {
      if (e.is(addLineHighlight)) {
        lines = Decoration.none;
        if (e.value !== null) {
          lines = lines.update({ add: [lineHighlightMark.range(e.value)] });
        }
      }
      if (e.is(addCurrentInstructionHighlight)) {
        lines = Decoration.none;
        if (e.value !== null) {
          lines = lines.update({ add: [currentInstructionMark.range(e.value)] });
        }
      }
    }
    return lines;
  },
  provide: f => EditorView.decorations.from(f),
});

const lineHighlightMark = Decoration.line({
  class:
    "!bg-gradient-to-r !from-mantis-500/8 !via-mantis-500/5 !to-transparent !border-l-2 !border-mantis-400/40 !shadow-sm",
});

const currentInstructionMark = Decoration.line({
  class: "cm-current-instruction",
});

export function highlightLine(pos: number | null) {
  if (!window.codemirror) return;

  if (pos === null) {
    window.codemirror.dispatch({ effects: addLineHighlight.of(null) });
  } else {
    const docPosition = window.codemirror.state.doc.lineAt(pos).from;
    window.codemirror.dispatch({ effects: addLineHighlight.of(docPosition) });
  }
}

export function highlightCurrentInstruction(pos: number | null) {
  if (!window.codemirror) return;

  if (pos === null) {
    window.codemirror.dispatch({ effects: addCurrentInstructionHighlight.of(null) });
  } else {
    const docPosition = window.codemirror.state.doc.lineAt(pos).from;
    window.codemirror.dispatch({ effects: addCurrentInstructionHighlight.of(docPosition) });
  }
}
