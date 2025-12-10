import JSZip from 'jszip';

/**
 * Build JSON metadata for a single atlas
 * @param {Object} atlas
 * @param {number} index
 * @returns {Object}
 */
export function buildAtlasJSON(atlas, index) {
  const base = {
    atlasIndex: index,
    size: atlas.size,
    padding: atlas.padding,
    sprites: atlas.placements.map((p) => ({
      name: p.name,
      x: p.x,
      y: p.y,
      width: p.width,
      height: p.height,
    })),
  };
  if (atlas.note) base.note = atlas.note;
  return base;
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
 * @returns {Promise<Blob>}
 */
export async function exportAtlasesAsZip(atlases) {
  const zip = new JSZip();
  const meta = { atlases: [] };

  for (let i = 0; i < atlases.length; i++) {
    const atlas = atlases[i];
    const baseName = `atlas_${i + 1}`;

    const json = buildAtlasJSON(atlas, i);
    meta.atlases.push({
      name: baseName,
      ...json,
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
