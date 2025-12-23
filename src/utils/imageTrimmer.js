/**
 * Analyze image to find bounds of non-transparent pixels
 * @param {HTMLImageElement} img
 * @returns {Object} {x, y, width, height, isEmpty}
 */
export function getTrimBounds(img) {
  const canvas = document.createElement('canvas');
  // Always use intrinsic dimensions to avoid CSS-scaled sizes affecting trimming.
  // Some images may briefly report 0 naturalWidth/Height before load.
  const width = img.naturalWidth || img.width;
  const height = img.naturalHeight || img.height;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  
  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data;
  
  let minX = canvas.width;
  let minY = canvas.height;
  let maxX = 0;
  let maxY = 0;
  let hasContent = false;
  
  // Treat very faint alpha as transparent to improve trimming when sprites have
  // anti-aliased/glow edges or compression noise. You can tune this if needed.
  const alphaThreshold = 8;

  // Scan for non-transparent pixels
  const w = canvas.width;
  const h = canvas.height;
  for (let y = 0; y < h; y++) {
    const rowOffset = y * w * 4;
    for (let x = 0; x < w; x++) {
      const alpha = pixels[rowOffset + x * 4 + 3];

      if (alpha > alphaThreshold) {
        hasContent = true;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  
  if (!hasContent) {
    return { x: 0, y: 0, width: canvas.width, height: canvas.height, isEmpty: true };
  }
  
  return {
    x: minX,
    y: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
    isEmpty: false,
  };
}

/**
 * Trim transparent pixels from an image
 * @param {HTMLImageElement} img
 * @returns {Promise<{img: HTMLImageElement, trimData: Object}>}
 */
export function trimImage(img) {
  return new Promise((resolve, reject) => {
    const bounds = getTrimBounds(img);
    
    const sourceWidth = img.naturalWidth || img.width;
    const sourceHeight = img.naturalHeight || img.height;

    if (bounds.isEmpty || (bounds.x === 0 && bounds.y === 0 && bounds.width === sourceWidth && bounds.height === sourceHeight)) {
      // No trimming needed
      resolve({
        img,
        trimData: {
          trimmed: false,
          sourceSize: { w: sourceWidth, h: sourceHeight },
          spriteSourceSize: { x: 0, y: 0, w: sourceWidth, h: sourceHeight },
        },
      });
      return;
    }
    
    // Create trimmed canvas
    const canvas = document.createElement('canvas');
    canvas.width = bounds.width;
    canvas.height = bounds.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    
    ctx.drawImage(
      img,
      bounds.x, bounds.y, bounds.width, bounds.height,
      0, 0, bounds.width, bounds.height
    );
    
    // Convert canvas to image
    // Use toBlob for large sprites (more reliable + avoids huge base64 strings).
    const trimmedImg = new Image();
    const finish = (loadedImg) => {
      resolve({
        img: loadedImg,
        trimData: {
          trimmed: true,
          sourceSize: { w: sourceWidth, h: sourceHeight },
          spriteSourceSize: { x: bounds.x, y: bounds.y, w: bounds.width, h: bounds.height },
        },
      });
    };

    trimmedImg.onerror = () => reject(new Error('Failed to create trimmed image'));
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          // Fallback for older browsers or unexpected failures.
          trimmedImg.onload = () => finish(trimmedImg);
          trimmedImg.src = canvas.toDataURL('image/png');
          return;
        }

        const url = URL.createObjectURL(blob);
        trimmedImg.onload = () => {
          URL.revokeObjectURL(url);
          finish(trimmedImg);
        };
        trimmedImg.src = url;
      },
      'image/png'
    );
  });
}
