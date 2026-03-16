import type { EditorView } from "@codemirror/view";
import { highlightEditorLine, clearEditorHighlight, focusEditorLine } from "./editor";
import type { SvgPreview } from "./preview";
import type { LineElementMapping } from "./line-mapper";

export class Highlighter {
  private editorView: EditorView;
  private preview: SvgPreview;
  private mapping: LineElementMapping | null = null;

  constructor(editorView: EditorView, preview: SvgPreview) {
    this.editorView = editorView;
    this.preview = preview;
  }

  setMapping(mapping: LineElementMapping) {
    this.mapping = mapping;
  }

  /** Called when cursor line changes in editor */
  onCursorLineChange(lineNumber: number) {
    if (!this.mapping) return;

    this.preview.clearHighlight();
    const elements = this.mapping.getElementsForLine(lineNumber);
    if (elements.length > 0) {
      // Highlight the most specific (last) element on this line
      this.preview.highlightElement(elements[elements.length - 1]);
    }
  }

  /** Called when hovering over an SVG element in preview */
  onPreviewElementHover(element: Element | null) {
    if (!element || !this.mapping) {
      clearEditorHighlight(this.editorView);
      return;
    }

    // Walk up from the hovered element to find one that has a mapping
    let current: Element | null = element;
    while (current) {
      const line = this.mapping.getLineForElement(current);
      if (line !== undefined) {
        highlightEditorLine(this.editorView, line);
        return;
      }
      current = current.parentElement;
    }

    clearEditorHighlight(this.editorView);
  }

  /** Called when clicking on an SVG element in preview */
  onPreviewElementClick(element: Element) {
    if (!this.mapping) return;

    let current: Element | null = element;
    while (current) {
      const line = this.mapping.getLineForElement(current);
      if (line !== undefined) {
        focusEditorLine(this.editorView, line);
        return;
      }
      current = current.parentElement;
    }
  }
}
