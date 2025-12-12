/**
 * Analyze image to find bounds of non-transparent pixels
 * @param {HTMLImageElement} img
 * @returns {Object} {x, y, width, height, isEmpty}
 */
export function getTrimBounds(img) {
  const canvas = document.createElement('canvas');
  canvas.width = img.width || img.naturalWidth;
  canvas.height = img.height || img.naturalHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  
  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data;
  
  let minX = canvas.width;
  let minY = canvas.height;
  let maxX = 0;
  let maxY = 0;
  let hasContent = false;
  
  // Scan for non-transparent pixels
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const i = (y * canvas.width + x) * 4;
      const alpha = pixels[i + 3];
      
      if (alpha > 0) {
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
    
    if (bounds.isEmpty || (bounds.x === 0 && bounds.y === 0 && bounds.width === img.naturalWidth && bounds.height === img.naturalHeight)) {
      // No trimming needed
      resolve({
        img,
        trimData: {
          trimmed: false,
          sourceSize: { w: img.naturalWidth, h: img.naturalHeight },
          spriteSourceSize: { x: 0, y: 0, w: img.naturalWidth, h: img.naturalHeight },
        },
      });
      return;
    }
    
    // Create trimmed canvas
    const canvas = document.createElement('canvas');
    canvas.width = bounds.width;
    canvas.height = bounds.height;
    const ctx = canvas.getContext('2d');
    
    ctx.drawImage(
      img,
      bounds.x, bounds.y, bounds.width, bounds.height,
      0, 0, bounds.width, bounds.height
    );
    
    // Convert canvas to image
    const trimmedImg = new Image();
    trimmedImg.onload = () => {
      resolve({
        img: trimmedImg,
        trimData: {
          trimmed: true,
          sourceSize: { w: img.naturalWidth, h: img.naturalHeight },
          spriteSourceSize: { x: bounds.x, y: bounds.y, w: bounds.width, h: bounds.height },
        },
      });
    };
    trimmedImg.onerror = () => reject(new Error('Failed to create trimmed image'));
    trimmedImg.src = canvas.toDataURL('image/png');
  });
}
