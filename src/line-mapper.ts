export interface LineElementMapping {
  lineToElements: Map<number, Element[]>;
  elementToLine: Map<Element, number>;
  /** For a given line, find the element whose opening tag spans that line */
  getElementsForLine(line: number): Element[];
  getLineForElement(element: Element): number | undefined;
}

interface SourceTag {
  tagName: string;
  line: number;
  endLine: number;
}

/**
 * Scan the SVG source to find opening tags and their line positions.
 * Skips comments, CDATA, processing instructions, and DOCTYPE.
 */
function scanSourceTags(source: string): SourceTag[] {
  const tags: SourceTag[] = [];
  const lines = source.split("\n");

  // Build a character offset -> line number lookup
  const lineOffsets: number[] = [];
  let offset = 0;
  for (let i = 0; i < lines.length; i++) {
    lineOffsets.push(offset);
    offset += lines[i].length + 1; // +1 for \n
  }

  function getLineAt(charOffset: number): number {
    let lo = 0,
      hi = lineOffsets.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (lineOffsets[mid] <= charOffset) lo = mid;
      else hi = mid - 1;
    }
    return lo + 1; // 1-indexed
  }

  // Regex to match opening tags, comments, CDATA, PIs
  const tokenRegex =
    /<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>|<\?[\s\S]*?\?>|<!DOCTYPE[^>]*>|<\/?([a-zA-Z][\w.:-]*)/g;

  let match;
  while ((match = tokenRegex.exec(source)) !== null) {
    const fullMatch = match[0];

    // Skip comments, CDATA, PIs, DOCTYPE
    if (
      fullMatch.startsWith("<!--") ||
      fullMatch.startsWith("<![CDATA[") ||
      fullMatch.startsWith("<?") ||
      fullMatch.startsWith("<!DOCTYPE")
    ) {
      continue;
    }

    // Skip closing tags
    if (fullMatch.startsWith("</")) {
      continue;
    }

    const tagName = match[1];
    if (!tagName) continue;

    const startLine = getLineAt(match.index);

    // Find end of this opening tag (the > or />)
    let endPos = tokenRegex.lastIndex;
    let depth = 0;
    while (endPos < source.length) {
      const ch = source[endPos];
      if (ch === '"' || ch === "'") {
        // Skip attribute values
        const quote = ch;
        endPos++;
        while (endPos < source.length && source[endPos] !== quote) endPos++;
      } else if (ch === ">") {
        break;
      }
      endPos++;
    }
    const endLine = getLineAt(Math.min(endPos, source.length - 1));

    tags.push({ tagName: tagName.toLowerCase(), line: startLine, endLine });
  }

  return tags;
}

/**
 * Walk the SVG DOM in document order and collect all elements.
 */
function walkDomElements(root: Element): Element[] {
  const elements: Element[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
  let node: Node | null = walker.currentNode;
  // Include root itself
  elements.push(root);
  while ((node = walker.nextNode())) {
    elements.push(node as Element);
  }
  return elements;
}

/**
 * Build a bidirectional mapping between source line numbers and rendered SVG DOM elements.
 */
export function buildMapping(
  source: string,
  svgRoot: Element
): LineElementMapping {
  const sourceTags = scanSourceTags(source);
  const domElements = walkDomElements(svgRoot);

  const lineToElements = new Map<number, Element[]>();
  const elementToLine = new Map<Element, number>();

  // Build a map of tag-line ranges for "line within tag" lookups
  const lineRanges: Array<{
    startLine: number;
    endLine: number;
    element: Element;
  }> = [];

  const count = Math.min(sourceTags.length, domElements.length);
  for (let i = 0; i < count; i++) {
    const tag = sourceTags[i];
    const el = domElements[i];

    const line = tag.line;
    elementToLine.set(el, line);

    const arr = lineToElements.get(line) || [];
    arr.push(el);
    lineToElements.set(line, arr);

    lineRanges.push({
      startLine: tag.line,
      endLine: tag.endLine,
      element: el,
    });
  }

  return {
    lineToElements,
    elementToLine,
    getElementsForLine(line: number): Element[] {
      // Direct match first
      const direct = lineToElements.get(line);
      if (direct && direct.length > 0) return direct;

      // Check if the line falls within a multi-line tag
      for (let i = lineRanges.length - 1; i >= 0; i--) {
        const range = lineRanges[i];
        if (line >= range.startLine && line <= range.endLine) {
          return [range.element];
        }
      }

      return [];
    },
    getLineForElement(element: Element): number | undefined {
      return elementToLine.get(element);
    },
  };
}
