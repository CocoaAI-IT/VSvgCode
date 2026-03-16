const HIGHLIGHT_CLASS = "vsvg-highlight";

export interface PreviewCallbacks {
  onElementHover: (element: Element | null) => void;
  onElementClick?: (element: Element) => void;
}

export class SvgPreview {
  private container: HTMLElement;
  private callbacks: PreviewCallbacks;
  private currentSvg: SVGSVGElement | null = null;
  private highlightedElement: Element | null = null;

  constructor(container: HTMLElement, callbacks: PreviewCallbacks) {
    this.container = container;
    this.callbacks = callbacks;

    this.container.addEventListener("mouseover", (e) => {
      const target = (e.target as Element).closest(
        "svg *:not(svg)"
      );
      if (target && target !== this.container) {
        this.callbacks.onElementHover(target);
      }
    });

    this.container.addEventListener("click", (e) => {
      const target = (e.target as Element).closest(
        "svg *:not(svg)"
      );
      if (target && target !== this.container) {
        this.callbacks.onElementClick?.(target);
      }
    });

    this.container.addEventListener("mouseout", (e) => {
      const related = (e as MouseEvent).relatedTarget as Element | null;
      if (!related || !this.container.contains(related)) {
        this.callbacks.onElementHover(null);
      }
    });
  }

  render(svgSource: string): SVGSVGElement | null {
    this.clearHighlight();

    const parser = new DOMParser();
    const doc = parser.parseFromString(svgSource, "image/svg+xml");

    const parseError = doc.querySelector("parsererror");
    if (parseError) {
      this.container.innerHTML = "";
      const errorDiv = document.createElement("div");
      errorDiv.className = "parse-error";
      errorDiv.textContent = parseError.textContent || "SVG parse error";
      this.container.appendChild(errorDiv);
      this.currentSvg = null;
      return null;
    }

    const svgEl = doc.documentElement as unknown as SVGSVGElement;
    const imported = document.importNode(svgEl, true) as SVGSVGElement;

    // Fit preview
    if (!imported.getAttribute("width") && !imported.hasAttribute("viewBox")) {
      imported.setAttribute("width", "100%");
    }
    imported.style.maxWidth = "100%";
    imported.style.maxHeight = "100%";

    this.container.innerHTML = "";
    this.container.appendChild(imported);
    this.currentSvg = imported;
    return imported;
  }

  highlightElement(element: Element) {
    this.clearHighlight();
    element.classList.add(HIGHLIGHT_CLASS);
    this.highlightedElement = element;
  }

  clearHighlight() {
    if (this.highlightedElement) {
      this.highlightedElement.classList.remove(HIGHLIGHT_CLASS);
      this.highlightedElement = null;
    }
  }

  getSvgElement(): SVGSVGElement | null {
    return this.currentSvg;
  }
}
