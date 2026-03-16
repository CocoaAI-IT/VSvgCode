import "./styles.css";
import { createEditor, setVimMode } from "./editor";
import { SvgPreview } from "./preview";
import { buildMapping } from "./line-mapper";
import { Highlighter } from "./highlighter";
import { saveSvgCode, exportPng, exportJpeg } from "./export";

const DEFAULT_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
  <!-- Background -->
  <rect width="400" height="300" fill="#e8f4f8" />

  <!-- Sun -->
  <circle cx="320" cy="60" r="40" fill="#FFD700" />

  <!-- Mountains -->
  <polygon points="0,250 100,120 200,250" fill="#6B8E23" />
  <polygon points="120,250 220,100 320,250" fill="#556B2F" />

  <!-- House body -->
  <rect x="60" y="180" width="100" height="70" fill="#CD853F" />

  <!-- Roof -->
  <polygon points="50,180 110,130 170,180" fill="#8B0000" />

  <!-- Door -->
  <rect x="95" y="210" width="30" height="40" fill="#654321" />

  <!-- Window -->
  <rect x="70" y="195" width="20" height="20"
    fill="#87CEEB" stroke="#654321" stroke-width="2" />

  <!-- Tree trunk -->
  <rect x="280" y="180" width="15" height="70" fill="#8B4513" />

  <!-- Tree leaves -->
  <circle cx="287" cy="160" r="35" fill="#228B22" />

  <!-- Ground -->
  <rect x="0" y="250" width="400" height="50" fill="#90EE90" />

  <!-- Path -->
  <path d="M110 250 Q110 270 130 280 Q150 290 200 295 L200 300 L90 300 L90 250 Z"
    fill="#D2B48C" />

  <!-- Cloud -->
  <g transform="translate(80, 40)">
    <circle cx="0" cy="0" r="20" fill="white" />
    <circle cx="20" cy="-5" r="25" fill="white" />
    <circle cx="45" cy="0" r="20" fill="white" />
  </g>

  <!-- Text -->
  <text x="200" y="25" text-anchor="middle"
    font-family="sans-serif" font-size="16" fill="#333">
    SVG Code Editor
  </text>
</svg>`;

function debounce(fn: (content: string) => void, ms: number) {
  let timer: ReturnType<typeof setTimeout>;
  return (content: string) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(content), ms);
  };
}

function getEditorContent(editorView: { state: { doc: { toString(): string } } }): string {
  return editorView.state.doc.toString();
}

function init() {
  const editorPane = document.getElementById("editor-pane")!;
  const previewContainer = document.getElementById("preview-container")!;
  const vimToggle = document.getElementById("vim-toggle") as HTMLInputElement;

  // Create preview
  let highlighter: Highlighter;

  const preview = new SvgPreview(previewContainer, {
    onElementHover(element) {
      highlighter.onPreviewElementHover(element);
    },
    onElementClick(element) {
      highlighter.onPreviewElementClick(element);
    },
  });

  // Create editor with Vim toggle callback
  const editorView = createEditor(editorPane, DEFAULT_SVG, {
    onCursorLineChange(line) {
      highlighter.onCursorLineChange(line);
    },
    onDocChange: debounce((content: string) => {
      updatePreview(content);
    }, 300),
  }, {
    onVimToggle(enabled) {
      vimToggle.checked = enabled;
    },
  });

  // Create highlighter
  highlighter = new Highlighter(editorView, preview);

  function updatePreview(source: string) {
    const svgRoot = preview.render(source);
    if (svgRoot) {
      const mapping = buildMapping(source, svgRoot);
      highlighter.setMapping(mapping);
    }
  }

  // Vim mode toggle (checkbox)
  vimToggle.addEventListener("change", () => {
    setVimMode(editorView, vimToggle.checked);
  });

  // Save/Export buttons
  document.getElementById("save-svg-code")!.addEventListener("click", () => {
    saveSvgCode(getEditorContent(editorView));
  });

  document.getElementById("export-png")!.addEventListener("click", () => {
    exportPng(getEditorContent(editorView));
  });

  document.getElementById("export-jpeg")!.addEventListener("click", () => {
    exportJpeg(getEditorContent(editorView));
  });

  // Ctrl+S to save SVG code
  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && !e.shiftKey && e.key === "s") {
      e.preventDefault();
      saveSvgCode(getEditorContent(editorView));
    }
  });

  // Initial render
  updatePreview(DEFAULT_SVG);
}

init();
