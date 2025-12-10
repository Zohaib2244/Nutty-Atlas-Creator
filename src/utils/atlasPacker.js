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
export function packImages(images, atlasSize, padding) {
  // Sort by max dimension descending for better packing
  const sorted = [...images].sort(
    (a, b) => Math.max(b.width, b.height) - Math.max(a.width, a.height)
  );

  const atlases = [];
  let current = createEmptyAtlas(atlasSize, padding, atlases.length);

  for (const img of sorted) {
    const requiredWidth = img.width + padding * 2;
    const requiredHeight = img.height + padding * 2;

    if (requiredWidth > atlasSize || requiredHeight > atlasSize) {
      throw new Error(
        `Image "${img.name}" (${img.width}x${img.height}) is too large for atlas size ${atlasSize}x${atlasSize} with padding ${padding}.`
      );
    }

    let node = insertRect(current.root, requiredWidth, requiredHeight);

    if (!node) {
      // Start new atlas
      atlases.push(current);
      current = createEmptyAtlas(atlasSize, padding, atlases.length);
      node = insertRect(current.root, requiredWidth, requiredHeight);

      if (!node) {
        throw new Error(`Failed to place image "${img.name}" in a fresh atlas.`);
      }
    }

    const x = node.x + padding;
    const y = node.y + padding;

    current.placements.push({
      name: img.name,
      x,
      y,
      width: img.width,
      height: img.height,
      img: img.img,
    });
  }

  atlases.push(current);
  return atlases;
}
