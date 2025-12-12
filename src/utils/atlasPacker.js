/**
 * Simple binary tree rectangle packing algorithm
 */

// Node and insertRect were used by the older binary-tree packer.
// The current implementation uses a shelf-based packing algorithm, so they
// are no longer necessary and have been removed.

function createEmptyAtlas(size, padding, index) {
  return {
    index,
    size,
    padding,
    placements: [],
    // root kept for backward compatibility; not used by current packer
    root: null,
    canvas: null,
  };
}

/**
 * Pack images into one or more atlases
 * @param {Array} images - [{name, img, width, height}]
 * @param {number} atlasSize
 * @param {number} padding
 * @returns {Array} atlases - [{index, size, padding, placements, root, canvas}]
 */
/**
 * Pack images into one or more atlases
 */
export function packImages(images, atlasSize, padding, maxAtlasSize = 4096) {
  // Simple shelf packing: place images left-to-right then top-to-bottom
  const sorted = [...images].sort((a, b) => Math.max(b.height, b.width) - Math.max(a.height, a.width));

  const atlases = [];
  let current = createEmptyAtlas(atlasSize, padding, 0);
  let x = 0;
  let y = 0;
  let rowHeight = 0;

  for (const img of sorted) {
    const requiredWidth = img.width + padding;
    const requiredHeight = img.height + padding;

    // Oversize check
    if (requiredWidth > atlasSize || requiredHeight > atlasSize) {
      throw new Error(`Image "${img.name}" (${img.width}x${img.height}) is too large for the selected atlas size ${atlasSize}x${atlasSize} with padding ${padding}.`);
    }

    // New row if not fit horizontally
    if (x + requiredWidth > atlasSize) {
      x = 0;
      y += rowHeight;
      rowHeight = 0;
    }

    // Need a new atlas if not fit vertically
    if (y + requiredHeight > atlasSize) {
      if (current.placements.length > 0) {
        atlases.push(current);
      }
      current = createEmptyAtlas(atlasSize, padding, atlases.length);
      x = 0;
      y = 0;
      rowHeight = 0;
    }

    current.placements.push({ name: img.name, x, y, width: img.width, height: img.height, img: img.img });
    x += requiredWidth;
    rowHeight = Math.max(rowHeight, requiredHeight);
  }

  if (current.placements.length > 0) atlases.push(current);
  return atlases;
}
