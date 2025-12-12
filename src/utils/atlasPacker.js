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
export function packImages(images, atlasSize, padding, maxAtlasSize = 4096, attempt = 0) {
  const atlases = [];

  function createFreeRect() {
    return { x: 0, y: 0, width: atlasSize, height: atlasSize };
  }

  function rectsIntersect(a, b) {
    return !(b.x >= a.x + a.width || b.x + b.width <= a.x || b.y >= a.y + a.height || b.y + b.height <= a.y);
  }

  function tryPlaceInAtlas(atlas, img) {
    const requiredWidth = img.width + padding;
    const requiredHeight = img.height + padding;

    if (requiredWidth > atlasSize || requiredHeight > atlasSize) {
      throw new Error(`Image "${img.name}" (${img.width}x${img.height}) is too large for the selected atlas size ${atlasSize}x${atlasSize} with padding ${padding}.`);
    }

    // Find all candidate free rects and sort by: top-left preference (y, x), then best short side fit
    const candidates = [];
    for (let i = 0; i < atlas.freeRects.length; i++) {
      const r = atlas.freeRects[i];
      if (requiredWidth <= r.width && requiredHeight <= r.height) {
        const leftoverHoriz = r.width - requiredWidth;
        const leftoverVert = r.height - requiredHeight;
        const shortSideFit = Math.min(leftoverHoriz, leftoverVert);
        const longSideFit = Math.max(leftoverHoriz, leftoverVert);
        candidates.push({ i, r, y: r.y, x: r.x, shortSideFit, longSideFit });
      }
    }
    if (candidates.length === 0) return false;

    // Sort: prefer top-left, then best short side fit, then best long side fit
    candidates.sort((a, b) => {
      if (a.y !== b.y) return a.y - b.y;
      if (a.x !== b.x) return a.x - b.x;
      if (a.shortSideFit !== b.shortSideFit) return a.shortSideFit - b.shortSideFit;
      return a.longSideFit - b.longSideFit;
    });

    // Try the first candidate
    const chosen = candidates[0];
    const placedX = chosen.r.x;
    const placedY = chosen.r.y;
    const usedRect = { x: placedX, y: placedY, width: requiredWidth, height: requiredHeight };

    // Verify no overlap with existing placements (safety check)
    for (const p of atlas.placements) {
      const pUsed = { x: p.x, y: p.y, width: p.width + padding, height: p.height + padding };
      if (rectsIntersect(pUsed, usedRect)) {
        return false; // shouldn't happen if free rects are maintained correctly
      }
    }

    // Place the image
    atlas.placements.push({ name: img.name, x: placedX, y: placedY, width: img.width, height: img.height, img: img.img });

    // Update free rects: split all overlapping rects by the used rect
    const newFreeRects = [];
    for (const fr of atlas.freeRects) {
      if (rectsIntersect(fr, usedRect)) {
        // Split this free rect into up to 4 new free rects (left, right, top, bottom of the used rect)
        // Left
        if (fr.x < usedRect.x) {
          newFreeRects.push({ x: fr.x, y: fr.y, width: usedRect.x - fr.x, height: fr.height });
        }
        // Right
        if (fr.x + fr.width > usedRect.x + usedRect.width) {
          newFreeRects.push({ x: usedRect.x + usedRect.width, y: fr.y, width: (fr.x + fr.width) - (usedRect.x + usedRect.width), height: fr.height });
        }
        // Top
        if (fr.y < usedRect.y) {
          newFreeRects.push({ x: fr.x, y: fr.y, width: fr.width, height: usedRect.y - fr.y });
        }
        // Bottom
        if (fr.y + fr.height > usedRect.y + usedRect.height) {
          newFreeRects.push({ x: fr.x, y: usedRect.y + usedRect.height, width: fr.width, height: (fr.y + fr.height) - (usedRect.y + usedRect.height) });
        }
      } else {
        // No overlap - keep the free rect
        newFreeRects.push(fr);
      }
    }

    // Prune contained rects (remove any rect that is fully contained by another)
    atlas.freeRects = [];
    for (let i = 0; i < newFreeRects.length; i++) {
      const a = newFreeRects[i];
      let isContained = false;
      for (let j = 0; j < newFreeRects.length; j++) {
        if (i === j) continue;
        const b = newFreeRects[j];
        // Check if a is fully contained in b
        if (a.x >= b.x && a.y >= b.y && a.x + a.width <= b.x + b.width && a.y + a.height <= b.y + b.height) {
          isContained = true;
          break;
        }
      }
      if (!isContained) atlas.freeRects.push(a);
    }

    return true;
  }

  for (const img of images) {
    // Check if image is oversized vs atlasSize
    if (img.width + padding > atlasSize || img.height + padding > atlasSize) {
      throw new Error(`Image "${img.name}" (${img.width}x${img.height}) is too large for the selected atlas size ${atlasSize}x${atlasSize} with padding ${padding}.`);
    }

    // Try to place into existing atlases
    let placed = false;
    for (const atlas of atlases) {
      if (tryPlaceInAtlas(atlas, img)) {
        placed = true;
        break;
      }
    }

    if (!placed) {
      // Create a new atlas and place at 0,0
      const newAtlas = createEmptyAtlas(atlasSize, padding, atlases.length);
      newAtlas.freeRects = [createFreeRect()];
      newAtlas.placements = [];
      if (!tryPlaceInAtlas(newAtlas, img)) {
        // Shouldn't happen since we checked oversize earlier
        throw new Error(`Failed to place image '${img.name}' in a fresh atlas`);
      }
      atlases.push(newAtlas);
    }
  }

  // For backward compatibility keep root/canvas keys
  for (const a of atlases) {
    if (!a.freeRects) a.freeRects = [createFreeRect()];
    if (!a.placements) a.placements = [];
    a.root = null;
    a.canvas = null;
  }

  // Post-check: ensure no overlapping placements — if found, try a fallback repack (sort by area desc)
  function checkOverlaps(atlasesToCheck) {
    for (const a of atlasesToCheck) {
      for (let i = 0; i < a.placements.length; i++) {
        for (let j = i + 1; j < a.placements.length; j++) {
          const p1 = a.placements[i];
          const p2 = a.placements[j];
          const r1 = { x: p1.x, y: p1.y, width: p1.width + padding, height: p1.height + padding };
          const r2 = { x: p2.x, y: p2.y, width: p2.width + padding, height: p2.height + padding };
          if (rectsIntersect(r1, r2)) return true;
        }
      }
    }
    return false;
  }

  if (checkOverlaps(atlases)) {
    // Try fallback: pack larger sprites first (area desc) to reduce fragmentation
    const imagesSorted = [...images].sort((a, b) => b.width * b.height - a.width * a.height);
    if (imagesSorted.length !== images.length) return atlases; // should not happen
    if (attempt >= 1) {
      throw new Error('Packing failed: overlapping placements detected even after fallback sorting');
    }
    // Recreate atlas by calling packImages recursively with sorted images but avoid infinite recursion: only once
    return packImages(imagesSorted, atlasSize, padding, maxAtlasSize, attempt + 1);
  }

  return atlases;
}
