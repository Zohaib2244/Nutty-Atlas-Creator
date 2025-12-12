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

  // If editing an existing atlas, draw the base image first
  if (atlas.isEditing && atlas.baseImage) {
    ctx.drawImage(atlas.baseImage, 0, 0, atlas.size, atlas.size);
  }

  // Clear any regions that were removed while editing
  if (atlas.removedRegions && atlas.removedRegions.length) {
    for (const region of atlas.removedRegions) {
      ctx.clearRect(region.x, region.y, region.width, region.height);
    }
  }

  // Draw placements (new images in edit mode, or all images in create mode)
  for (const placement of atlas.placements) {
    // Skip placements without img (existing placements from JSON)
    if (placement.img) {
      ctx.drawImage(
        placement.img,
        placement.x,
        placement.y,
        placement.width,
        placement.height
      );
    }
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
