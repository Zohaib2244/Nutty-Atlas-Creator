/**
 * Render an atlas to a canvas element
 * @param {Object} atlas
 * @returns {HTMLCanvasElement}
 */
export function renderAtlasToCanvas(atlas) {
  const canvas = document.createElement('canvas');
  canvas.width = atlas.size;
  canvas.height = atlas.size;
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (const placement of atlas.placements) {
    ctx.drawImage(
      placement.img,
      placement.x,
      placement.y,
      placement.width,
      placement.height
    );
  }

  atlas.canvas = canvas;
  return canvas;
}

/**
 * Render all atlases to canvases
 * @param {Array} atlases
 */
export function renderAllAtlases(atlases) {
  atlases.forEach((atlas) => renderAtlasToCanvas(atlas));
}
