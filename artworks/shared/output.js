const namespace = "http://www.w3.org/2000/svg";

// One SVG viewport is used for preview and downloads, including the zoom crop.
export function composeOutput(artwork, { outputWidth, outputHeight, outputScale }) {
  const svg = document.createElementNS(namespace, "svg");
  svg.setAttribute("xmlns", namespace);
  svg.setAttribute("width", outputWidth);
  svg.setAttribute("height", outputHeight);
  svg.setAttribute("viewBox", `0 0 ${outputWidth} ${outputHeight}`);
  const group = document.createElementNS(namespace, "g");
  group.setAttribute("transform", `translate(${outputWidth / 2} ${outputHeight / 2}) scale(${outputScale}) translate(${-outputWidth / 2} ${-outputHeight / 2})`);
  artwork.setAttribute("width", outputWidth);
  artwork.setAttribute("height", outputHeight);
  artwork.setAttribute("preserveAspectRatio", "xMidYMid meet");
  group.append(artwork);
  svg.append(group);
  return svg;
}

export async function downloadArtwork(svg, format, filename) {
  const source = new Blob([new XMLSerializer().serializeToString(svg)], { type: "image/svg+xml" });
  let blob = source;
  if (format === "png") {
    const url = URL.createObjectURL(source);
    try {
      const image = new Image();
      image.src = url;
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = Number(svg.getAttribute("width"));
      canvas.height = Number(svg.getAttribute("height"));
      canvas.getContext("2d").drawImage(image, 0, 0);
      blob = await new Promise(resolve => canvas.toBlob(resolve, "image/png"));
      if (!blob) throw new Error("PNG export failed");
    } finally { URL.revokeObjectURL(url); }
  }
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.${format}`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
