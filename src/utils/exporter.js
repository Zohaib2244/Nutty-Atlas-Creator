import JSZip from 'jszip';

/**
 * Build JSON metadata for a single atlas
 * @param {Object} atlas
 * @param {number} index
 * @param {Object} existingJson - Optional existing JSON to merge with (for edit mode)
 * @returns {Object}
 */
export function buildAtlasJSON(atlas, index, existingJson = null) {
  // If editing and we have existing JSON, merge frames
  if (atlas.isEditing && existingJson) {
    const frames = { ...existingJson.frames };
    
    // Add new placements to frames (only those with img, meaning they're new)
    for (const p of atlas.placements) {
      if (p.img) {
        const trimData = p.trimData || {
          trimmed: false,
          sourceSize: { w: p.width, h: p.height },
          spriteSourceSize: { x: 0, y: 0, w: p.width, h: p.height },
        };
        
        frames[p.name] = {
          frame: { x: p.x, y: p.y, w: p.width, h: p.height },
          rotated: false,
          trimmed: trimData.trimmed,
          spriteSourceSize: trimData.spriteSourceSize,
          sourceSize: trimData.sourceSize,
        };
      }
    }
    
    return {
      frames,
      meta: {
        ...existingJson.meta,
        size: { w: atlas.size, h: atlas.size },
        padding: atlas.padding,
      },
    };
  }

  // Standard format for create mode
  const frames = {};
  for (const p of atlas.placements) {
    const trimData = p.trimData || {
      trimmed: false,
      sourceSize: { w: p.width, h: p.height },
      spriteSourceSize: { x: 0, y: 0, w: p.width, h: p.height },
    };
    
    frames[p.name] = {
      frame: { x: p.x, y: p.y, w: p.width, h: p.height },
      rotated: false,
      trimmed: trimData.trimmed,
      spriteSourceSize: trimData.spriteSourceSize,
      sourceSize: trimData.sourceSize,
    };
  }

  return {
    frames,
    meta: {
      app: 'Nutty Atlas Creator',
      version: '1.0',
      size: { w: atlas.size, h: atlas.size },
      padding: atlas.padding,
      format: 'RGBA8888',
    },
  };
}

/**
 * Convert canvas to Blob
 * @param {HTMLCanvasElement} canvas
 * @returns {Promise<Blob>}
 */
function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) reject(new Error('Canvas toBlob failed'));
        else resolve(blob);
      },
      'image/png'
    );
  });
}

/**
 * Export all atlases as a ZIP file
 * @param {Array} atlases
 * @param {Object} existingAtlas - Optional existing atlas data (for edit mode)
 * @returns {Promise<Blob>}
 */
export async function exportAtlasesAsZip(atlases, existingAtlas = null, customName = 'atlas') {
  const zip = new JSZip();
  const meta = { atlases: [] };

  const safeName = (customName || 'atlas').replace(/[^\w-]/g, '_');

  for (let i = 0; i < atlases.length; i++) {
    const atlas = atlases[i];
    const baseName = `AVN_${safeName}_${i + 1}`;

    // Pass existing JSON if editing
    const existingJson = (atlas.isEditing && existingAtlas) ? existingAtlas.originalJson : null;
    const json = buildAtlasJSON(atlas, i, existingJson);
    
    meta.atlases.push({
      name: baseName,
      size: atlas.size,
      padding: atlas.padding,
      spriteCount: Object.keys(json.frames || json.sprites || {}).length,
    });

    const pngBlob = await canvasToBlob(atlas.canvas);

    zip.file(`${baseName}.json`, JSON.stringify(json, null, 2));
    zip.file(`${baseName}.png`, pngBlob);
  }

  zip.file('pack_manifest.json', JSON.stringify(meta, null, 2));

  return zip.generateAsync({ type: 'blob' });
}

/**
 * Trigger browser download
 * @param {Blob} blob
 * @param {string} filename
 */
export function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
