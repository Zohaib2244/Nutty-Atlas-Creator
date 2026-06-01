function createEmptyAtlas(width, height, padding, index) {
  return {
    index,
    width,
    height,
    size: Math.max(width, height), // backward-compat shorthand
    padding,
    placements: [],
    freeRects: [],
    root: null,
    canvas: null,
  };
}

/**
 * Pack images into one or more atlases.
 *
 * Dynamic sizing (when enabled, non-edit only):
 *   Each atlas grows independently (base → 2x → 4x … up to maxAtlasSize)
 *   before a new atlas page is created. New pages start at base size again.
 *
 * @param {Array}   images        [{name, img, width, height, trimData?}]
 * @param {number}  atlasWidth    base atlas width
 * @param {number}  atlasHeight   base atlas height
 * @param {number}  padding       per-sprite padding (px)
 * @param {number}  maxAtlasSize  maximum dimension allowed with dynamic sizing
 * @param {number}  attempt       internal recursion guard (overlap retry)
 * @param {Object}  existingAtlas optional — existing atlas to append to (edit mode)
 * @param {boolean} dynamicSizing grow each atlas before creating a new page
 * @returns {Array} packed atlases
 */
export function packImages(
  images,
  atlasWidth,
  atlasHeight,
  padding,
  maxAtlasSize = 4096,
  attempt = 0,
  existingAtlas = null,
  dynamicSizing = false,
) {
  const atlases = [];
  const isEditMode = existingAtlas !== null;
  const allowDynamic = dynamicSizing && !isEditMode;

  // ─── geometry helpers ────────────────────────────────────────────────────────

  function rectsIntersect(a, b) {
    return !(
      b.x >= a.x + a.width ||
      b.x + b.width <= a.x ||
      b.y >= a.y + a.height ||
      b.y + b.height <= a.y
    );
  }

  function pruneContained(rects) {
    return rects.filter(
      (a, i) =>
        !rects.some(
          (b, j) =>
            i !== j &&
            a.x >= b.x &&
            a.y >= b.y &&
            a.x + a.width <= b.x + b.width &&
            a.y + a.height <= b.y + b.height,
        ),
    );
  }

  function splitFreeRects(freeRects, usedRect) {
    const next = [];
    for (const fr of freeRects) {
      if (rectsIntersect(fr, usedRect)) {
        if (fr.x < usedRect.x)
          next.push({ x: fr.x, y: fr.y, width: usedRect.x - fr.x, height: fr.height });
        if (fr.x + fr.width > usedRect.x + usedRect.width)
          next.push({ x: usedRect.x + usedRect.width, y: fr.y, width: fr.x + fr.width - (usedRect.x + usedRect.width), height: fr.height });
        if (fr.y < usedRect.y)
          next.push({ x: fr.x, y: fr.y, width: fr.width, height: usedRect.y - fr.y });
        if (fr.y + fr.height > usedRect.y + usedRect.height)
          next.push({ x: fr.x, y: usedRect.y + usedRect.height, width: fr.width, height: fr.y + fr.height - (usedRect.y + usedRect.height) });
      } else {
        next.push(fr);
      }
    }
    return pruneContained(next);
  }

  // Rebuild free rects from scratch given a list of already-placed sprites.
  function computeFreeRectsFromPlacements(placements, w, h) {
    let freeRects = [{ x: 0, y: 0, width: w, height: h }];
    for (const p of placements) {
      const used = { x: p.x, y: p.y, width: p.width + padding, height: p.height + padding };
      freeRects = splitFreeRects(freeRects, used);
    }
    return freeRects;
  }

  // ─── placement ───────────────────────────────────────────────────────────────

  // Returns true and mutates atlas on success; returns false if no room.
  function tryPlaceInAtlas(atlas, img) {
    const reqW = img.width + padding;
    const reqH = img.height + padding;
    if (reqW > atlas.width || reqH > atlas.height) return false;

    const candidates = [];
    for (const r of atlas.freeRects) {
      if (reqW <= r.width && reqH <= r.height) {
        candidates.push({
          r, x: r.x, y: r.y,
          shortSideFit: Math.min(r.width - reqW, r.height - reqH),
          longSideFit:  Math.max(r.width - reqW, r.height - reqH),
        });
      }
    }
    if (candidates.length === 0) return false;

    candidates.sort((a, b) => {
      if (a.y !== b.y) return a.y - b.y;
      if (a.x !== b.x) return a.x - b.x;
      if (a.shortSideFit !== b.shortSideFit) return a.shortSideFit - b.shortSideFit;
      return a.longSideFit - b.longSideFit;
    });

    const { x: px, y: py } = candidates[0];
    const used = { x: px, y: py, width: reqW, height: reqH };

    // Safety overlap check
    for (const p of atlas.placements) {
      if (rectsIntersect({ x: p.x, y: p.y, width: p.width + padding, height: p.height + padding }, used))
        return false;
    }

    atlas.placements.push({
      name: img.name,
      x: px, y: py,
      width: img.width, height: img.height,
      img: img.img,
      trimData: img.trimData || null,
    });
    atlas.freeRects = splitFreeRects(atlas.freeRects, used);
    return true;
  }

  // ─── dynamic growing ─────────────────────────────────────────────────────────

  // Create a new atlas object with larger dimensions, recomputing free rects from existing placements.
  function growAtlasTo(atlas, newW, newH) {
    const grown = createEmptyAtlas(newW, newH, padding, atlas.index);
    grown.placements = [...atlas.placements];
    grown.freeRects = computeFreeRectsFromPlacements(atlas.placements, newW, newH);
    if (atlas.isEditing) {
      grown.isEditing = true;
      grown.baseImage = atlas.baseImage;
      grown.removedRegions = [...(atlas.removedRegions || [])];
    }
    return grown;
  }

  // Grow atlas at atlases[idx] step-by-step (doubling) until img fits or maxAtlasSize is reached.
  // Restores the original atlas if no size could accommodate the image.
  function tryGrowAndPlace(atlasesArr, idx, img) {
    const original = atlasesArr[idx];
    let curW = original.width;
    let curH = original.height;

    while (curW < maxAtlasSize || curH < maxAtlasSize) {
      const newW = Math.min(curW * 2, maxAtlasSize);
      const newH = Math.min(curH * 2, maxAtlasSize);
      atlasesArr[idx] = growAtlasTo(atlasesArr[idx], newW, newH);
      if (tryPlaceInAtlas(atlasesArr[idx], img)) return true;
      curW = newW;
      curH = newH;
    }

    // Growing to max didn't help — restore and let caller create a new atlas
    atlasesArr[idx] = original;
    return false;
  }

  // ─── edit mode init ──────────────────────────────────────────────────────────

  if (existingAtlas) {
    const editAtlas = createEmptyAtlas(atlasWidth, atlasHeight, padding, 0);
    editAtlas.placements = [...existingAtlas.placements];
    editAtlas.freeRects = computeFreeRectsFromPlacements(existingAtlas.placements, atlasWidth, atlasHeight);
    editAtlas.isEditing = true;
    editAtlas.baseImage = existingAtlas.img;
    editAtlas.removedRegions = existingAtlas.removedRegions ? [...existingAtlas.removedRegions] : [];
    atlases.push(editAtlas);
  }

  // ─── main packing loop ───────────────────────────────────────────────────────

  for (const img of images) {
    const reqW = img.width + padding;
    const reqH = img.height + padding;

    // Hard reject: too large even for the maximum possible atlas
    const limitW = allowDynamic ? maxAtlasSize : atlasWidth;
    const limitH = allowDynamic ? maxAtlasSize : atlasHeight;
    if (reqW > limitW || reqH > limitH) {
      throw new Error(
        `Image "${img.name}" (${img.width}×${img.height}) is too large for atlas ${limitW}×${limitH} with padding ${padding}.`,
      );
    }

    let placed = false;

    // 1. Try every existing atlas at its current size (no growth yet)
    for (let ai = 0; ai < atlases.length && !placed; ai++) {
      if (tryPlaceInAtlas(atlases[ai], img)) placed = true;
    }

    // 2. If still unplaced, try growing existing atlases (most-recent first)
    //    — only in non-edit mode with dynamic sizing on
    if (!placed && allowDynamic) {
      for (let ai = atlases.length - 1; ai >= 0 && !placed; ai--) {
        if (atlases[ai].width < maxAtlasSize || atlases[ai].height < maxAtlasSize) {
          if (tryGrowAndPlace(atlases, ai, img)) placed = true;
        }
      }
    }

    // 3. Create a new atlas page at base size (scaled up if needed to fit this image)
    if (!placed) {
      let startW = atlasWidth;
      let startH = atlasHeight;
      if (allowDynamic) {
        while (startW < reqW && startW < maxAtlasSize) startW = Math.min(startW * 2, maxAtlasSize);
        while (startH < reqH && startH < maxAtlasSize) startH = Math.min(startH * 2, maxAtlasSize);
      }
      const newAtlas = createEmptyAtlas(startW, startH, padding, atlases.length);
      newAtlas.freeRects = [{ x: 0, y: 0, width: startW, height: startH }];
      atlases.push(newAtlas);
      if (!tryPlaceInAtlas(atlases[atlases.length - 1], img)) {
        atlases.pop();
        throw new Error(`Failed to place image '${img.name}' in a fresh ${startW}×${startH} atlas`);
      }
    }
  }

  // ─── finalise ────────────────────────────────────────────────────────────────

  for (const a of atlases) {
    a.root = null;
    a.canvas = null;
  }

  // Overlap post-check — if overlaps detected, retry with area-sorted input
  function checkOverlaps() {
    for (const a of atlases) {
      for (let i = 0; i < a.placements.length; i++) {
        for (let j = i + 1; j < a.placements.length; j++) {
          const p1 = a.placements[i];
          const p2 = a.placements[j];
          if (
            p1.x === p2.x && p1.y === p2.y &&
            p1.width === p2.width && p1.height === p2.height
          ) {
            a.note = (a.note || '') + `Duplicate frames: "${p1.name}" & "${p2.name}" at (${p1.x},${p1.y}).\n`;
            continue;
          }
          const r1 = { x: p1.x, y: p1.y, width: p1.width + padding, height: p1.height + padding };
          const r2 = { x: p2.x, y: p2.y, width: p2.width + padding, height: p2.height + padding };
          if (rectsIntersect(r1, r2)) return true;
        }
      }
    }
    return false;
  }

  if (checkOverlaps() && attempt < 2) {
    const sorted = [...images].sort((a, b) => b.width * b.height - a.width * a.height);
    return packImages(sorted, atlasWidth, atlasHeight, padding, maxAtlasSize, attempt + 1, existingAtlas, dynamicSizing);
  }

  return atlases;
}
