function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Save SVG source code as .svg file */
export function saveSvgCode(svgSource: string) {
  const blob = new Blob([svgSource], { type: "image/svg+xml;charset=utf-8" });
  download(blob, "image.svg");
}

/** Parse width/height from SVG source (viewBox or width/height attributes) */
function parseSvgDimensions(svgSource: string): {
  width: number;
  height: number;
} {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgSource, "image/svg+xml");
  const svg = doc.documentElement;

  const viewBox = svg.getAttribute("viewBox");
  if (viewBox) {
    const parts = viewBox.split(/[\s,]+/).map(Number);
    if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
      return { width: parts[2], height: parts[3] };
    }
  }

  const w = parseFloat(svg.getAttribute("width") || "");
  const h = parseFloat(svg.getAttribute("height") || "");
  if (w > 0 && h > 0) {
    return { width: w, height: h };
  }

  return { width: 800, height: 600 };
}

/** Rasterize SVG to canvas, then export as Blob */
function rasterize(
  svgSource: string,
  mimeType: "image/png" | "image/jpeg",
  quality?: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const { width, height } = parseSvgDimensions(svgSource);
    const scale = 2; // 2x for high-DPI
    const canvas = document.createElement("canvas");
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      reject(new Error("Failed to get canvas context"));
      return;
    }
    ctx.scale(scale, scale);

    // For JPEG, fill white background (transparent becomes black otherwise)
    if (mimeType === "image/jpeg") {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
    }

    const blob = new Blob([svgSource], {
      type: "image/svg+xml;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const img = new Image();

    img.onload = () => {
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      canvas.toBlob(
        (result) => {
          if (result) resolve(result);
          else reject(new Error("Canvas toBlob failed"));
        },
        mimeType,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load SVG as image"));
    };

    img.src = url;
  });
}

export async function exportPng(svgSource: string) {
  const blob = await rasterize(svgSource, "image/png");
  download(blob, "image.png");
}

export async function exportJpeg(svgSource: string) {
  const blob = await rasterize(svgSource, "image/jpeg", 0.95);
  download(blob, "image.jpg");
}

export function exportSvg(svgSource: string) {
  saveSvgCode(svgSource);
}
