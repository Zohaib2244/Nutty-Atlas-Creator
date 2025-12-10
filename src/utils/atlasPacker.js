/**
 * Simple binary tree rectangle packing algorithm
 */

class Node {
  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.used = false;
    this.right = null;
    this.down = null;
  }
}

function insertRect(node, w, h) {
  if (node.used) {
    return insertRect(node.right, w, h) || insertRect(node.down, w, h);
  }

  if (w > node.w || h > node.h) {
    return null;
  }

  if (w === node.w && h === node.h) {
    node.used = true;
    return node;
  }

  node.used = true;

  const dw = node.w - w;
  const dh = node.h - h;

  if (dw > dh) {
    node.right = new Node(node.x + w, node.y, dw, h);
    node.down = new Node(node.x, node.y + h, node.w, dh);
    
  } else {
    node.right = new Node(node.x + w, node.y, dw, node.h);
    node.down = new Node(node.x, node.y + h, w, dh);
    
  }

  return insertRect(node, w, h);
}

function createEmptyAtlas(size, padding, index) {
  return {
    index,
    size,
    padding,
    placements: [],
    root: new Node(0, 0, size, size),
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
function nextPowerOfTwo(x) {
  if (x <= 0) return 1;
  return 1 << Math.ceil(Math.log2(x));
}

/**
 * Pack images into one or more atlases
 * If an image is larger than the base atlasSize, create a dedicated atlas using the
 * next power-of-two size up to a max size (default 4096).
 */
export function packImages(images, atlasSize, padding, maxAtlasSize = 4096, allowAutoResize = false) {
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
      if (!allowAutoResize) {
        throw new Error(`Image "${img.name}" (${img.width}x${img.height}) is too large for the selected atlas size ${atlasSize}x${atlasSize} with padding ${padding}.`);
      }

      // Create a dedicated atlas with nearest power of two up to maxAtlasSize
      const newAtlasSize = Math.min(nextPowerOfTwo(Math.max(requiredWidth, requiredHeight)), maxAtlasSize);
      if (newAtlasSize < Math.max(requiredWidth, requiredHeight)) {
        throw new Error(`Image "${img.name}" (${img.width}x${img.height}) too large for max atlas size.`);
      }
      const bigAtlas = createEmptyAtlas(newAtlasSize, padding, atlases.length);
      bigAtlas.placements.push({ name: img.name, x: 0, y: 0, width: img.width, height: img.height, img: img.img });
      bigAtlas.note = `Placed ${img.name} in dedicated ${bigAtlas.size} atlas.`;
      atlases.push(bigAtlas);
      continue;
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
