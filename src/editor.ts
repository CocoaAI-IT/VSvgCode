import {
  EditorView,
  Decoration,
  type DecorationSet,
  lineNumbers,
} from "@codemirror/view";
import {
  type Extension,
  EditorState,
  StateField,
  StateEffect,
  Compartment,
} from "@codemirror/state";
import { basicSetup } from "codemirror";
import { xml } from "@codemirror/lang-xml";
import { oneDark } from "@codemirror/theme-one-dark";
import { vim } from "@replit/codemirror-vim";

// Effect to set the highlighted line (1-indexed, 0 = clear)
export const setHighlightedLine = StateEffect.define<number>();

const highlightedLineField = StateField.define<DecorationSet>({
  create() {
    return Decoration.none;
  },
  update(decorations, tr) {
    for (const effect of tr.effects) {
      if (effect.is(setHighlightedLine)) {
        if (effect.value <= 0) {
          return Decoration.none;
        }
        const lineNum = effect.value;
        if (lineNum > tr.state.doc.lines) return Decoration.none;
        const line = tr.state.doc.line(lineNum);
        return Decoration.set([
          Decoration.line({ class: "cm-highlighted-line" }).range(line.from),
        ]);
      }
    }
    return decorations.map(tr.changes);
  },
  provide: (f) => EditorView.decorations.from(f),
});

export interface EditorCallbacks {
  onCursorLineChange: (lineNumber: number) => void;
  onDocChange: (content: string) => void;
}

// Compartments for toggling vim mode and relative line numbers
const vimCompartment = new Compartment();
const lineNumberCompartment = new Compartment();
let vimEnabled = false;

function vimExtension(enabled: boolean): Extension {
  return enabled ? vim() : [];
}

function relativeLineNumbers(): Extension {
  return lineNumbers({
    formatNumber(lineNo: number, state) {
      const cursorLine = state.doc.lineAt(
        state.selection.main.head
      ).number;
      if (lineNo === cursorLine) return String(lineNo);
      return String(Math.abs(lineNo - cursorLine));
    },
  });
}

export function createEditor(
  parent: HTMLElement,
  initialDoc: string,
  callbacks: EditorCallbacks,
  options: { vimMode?: boolean; onVimToggle?: (enabled: boolean) => void } = {}
): EditorView {
  let lastLine = -1;
  vimEnabled = options.vimMode ?? false;

  const updateListener = EditorView.updateListener.of((update) => {
    if (update.docChanged) {
      callbacks.onDocChange(update.state.doc.toString());
    }

    if (update.selectionSet || update.docChanged) {
      const pos = update.state.selection.main.head;
      const line = update.state.doc.lineAt(pos).number;
      if (line !== lastLine) {
        lastLine = line;
        callbacks.onCursorLineChange(line);
      }
    }
  });

  const vimToggleKeybind = EditorView.domEventHandlers({
    keydown(event) {
      if (event.ctrlKey && event.shiftKey && event.key === "V") {
        event.preventDefault();
        vimEnabled = !vimEnabled;
        setVimMode(view, vimEnabled);
        options.onVimToggle?.(vimEnabled);
        return true;
      }
      return false;
    },
  });

  const view = new EditorView({
    state: EditorState.create({
      doc: initialDoc,
      extensions: [
        vimCompartment.of(vimExtension(vimEnabled)),
        basicSetup,
        lineNumberCompartment.of([]),
        xml(),
        oneDark,
        EditorView.lineWrapping,
        highlightedLineField,
        updateListener,
        vimToggleKeybind,
      ],
    }),
    parent,
  });

  // If vim starts enabled, set relative line numbers now
  if (vimEnabled) {
    view.dispatch({
      effects: lineNumberCompartment.reconfigure(relativeLineNumbers()),
    });
  }

  return view;
}

export function setVimMode(view: EditorView, enabled: boolean) {
  vimEnabled = enabled;
  view.dispatch({
    effects: [
      vimCompartment.reconfigure(vimExtension(enabled)),
      lineNumberCompartment.reconfigure(
        enabled ? relativeLineNumbers() : []
      ),
    ],
  });
}

export function isVimEnabled(): boolean {
  return vimEnabled;
}

export function highlightEditorLine(view: EditorView, lineNumber: number) {
  view.dispatch({ effects: setHighlightedLine.of(lineNumber) });
}

export function clearEditorHighlight(view: EditorView) {
  view.dispatch({ effects: setHighlightedLine.of(0) });
}

export function setEditorContent(view: EditorView, content: string) {
  view.dispatch({
    changes: { from: 0, to: view.state.doc.length, insert: content },
  });
}

export function focusEditorLine(view: EditorView, lineNumber: number) {
  if (lineNumber < 1 || lineNumber > view.state.doc.lines) return;
  const line = view.state.doc.line(lineNumber);
  view.dispatch({
    selection: { anchor: line.from },
    scrollIntoView: true,
  });
  view.focus();
}
