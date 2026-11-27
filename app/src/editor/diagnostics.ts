import type { Diagnostic } from "@codemirror/lint";
import { forEachDiagnostic } from "@codemirror/lint";
import { type EditorState, RangeSetBuilder } from "@codemirror/state";
import {
  Decoration,
  type DecorationSet,
  EditorView,
  ViewPlugin,
  ViewUpdate,
} from "@codemirror/view";
import type { Language } from "@vonsim/common/i18n";

/**
 * Minimal shape of an assembler error needed to build a diagnostic.
 * Matches `AssemblerError` from `@vonsim/assembler`.
 */
export type LintableError = {
  position?: { start: number; end: number } | null;
  translate(lang: Language): string;
  hint?(lang: Language): string | null;
};

/** Diagnostic with the extra data the editor uses to show the error to students. */
export type VonSimDiagnostic = Diagnostic & {
  /** 1-based line number where the error starts. */
  line: number;
  hint: string | null;
};

const LABELS = {
  es: { line: "Línea", hint: "Pista" },
  en: { line: "Line", hint: "Hint" },
} satisfies Record<Language, { line: string; hint: string }>;

/** Returns the 1-based line number of a character offset in the source. */
export function lineOfOffset(source: string, offset: number): number {
  let line = 1;
  const end = Math.min(Math.max(offset, 0), source.length);
  for (let i = 0; i < end; i++) {
    if (source.charCodeAt(i) === 10) line++;
  }
  return line;
}

/**
 * Converts assembler errors into CodeMirror diagnostics, with the line number
 * and a correction hint (when there is one) for beginners.
 */
export function buildDiagnostics(
  errors: LintableError[],
  source: string,
  lang: Language,
): VonSimDiagnostic[] {
  const labels = LABELS[lang];

  return errors
    .map<VonSimDiagnostic>(error => {
      const from = Math.min(error.position?.start ?? 0, source.length);
      const to = Math.min(Math.max(error.position?.end ?? source.length, from), source.length);
      const line = lineOfOffset(source, from);
      const hint = typeof error.hint === "function" ? error.hint(lang) : null;
      const text = error.translate(lang);

      return {
        from,
        to,
        line,
        hint,
        severity: "error",
        source: `${labels.line} ${line}`,
        message: hint ? `${text}\n💡 ${labels.hint}: ${hint}` : text,
        renderMessage: () => renderMessage(text, hint, labels.hint),
      };
    })
    .sort((a, b) => a.from - b.from);
}

function renderMessage(text: string, hint: string | null, hintLabel: string): Node {
  const container = document.createElement("div");
  container.className = "cm-vonsim-diagnostic";

  const message = document.createElement("div");
  message.className = "cm-vonsim-diagnostic-message";
  message.textContent = text;
  container.appendChild(message);

  if (hint) {
    const hintEl = document.createElement("div");
    hintEl.className = "cm-vonsim-diagnostic-hint";
    hintEl.textContent = `💡 ${hintLabel}: ${hint}`;
    container.appendChild(hintEl);
  }

  return container;
}

// #=========================================================================#
// # Error line highlighting                                                 #
// #=========================================================================#

const errorLine = Decoration.line({ class: "cm-vonsim-error-line" });

function errorLineDecorations(state: EditorState): DecorationSet {
  const lines = new Set<number>();
  forEachDiagnostic(state, (diagnostic, from) => {
    if (diagnostic.severity === "error") lines.add(state.doc.lineAt(from).from);
  });

  const builder = new RangeSetBuilder<Decoration>();
  for (const from of [...lines].sort((a, b) => a - b)) builder.add(from, from, errorLine);
  return builder.finish();
}

/**
 * Highlights the whole line of every error, so students can spot it at a
 * glance (the lint underline alone is easy to miss).
 */
export const errorLineHighlighter = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = errorLineDecorations(view.state);
    }

    update(update: ViewUpdate) {
      this.decorations = errorLineDecorations(update.state);
    }
  },
  { decorations: v => v.decorations },
);

/** Moves the cursor to the first error and scrolls it into view. */
export function goToFirstError(view: EditorView): boolean {
  let first: number | null = null;
  forEachDiagnostic(view.state, (diagnostic, from) => {
    if (diagnostic.severity === "error" && (first === null || from < first)) first = from;
  });
  if (first === null) return false;

  view.dispatch({
    selection: { anchor: first },
    effects: EditorView.scrollIntoView(first, { y: "center" }),
  });
  view.focus();
  return true;
}
