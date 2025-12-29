import { trimImage } from './imageTrimmer';

/**
 * Load an image from a File object
 * @param {File} file
 * @param {boolean} enableTrim - Whether to trim transparent pixels
 * @returns {Promise<{name: string, img: HTMLImageElement, width: number, height: number, trimData: Object, originalImg: HTMLImageElement}>}
 */
export function loadImageFromFile(file, enableTrim = false) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = async () => {
        // Always store the original image for dynamic trim toggling
        const originalImg = img;
        const originalWidth = img.naturalWidth;
        const originalHeight = img.naturalHeight;
        
        if (enableTrim) {
          try {
            const { img: trimmedImg, trimData } = await trimImage(img);
            resolve({
              name: file.name,
              img: trimmedImg,
              width: trimmedImg.naturalWidth,
              height: trimmedImg.naturalHeight,
              trimData,
              originalImg,
              originalWidth,
              originalHeight,
            });
          } catch (err) {
            reject(err);
          }
        } else {
          resolve({
            name: file.name,
            img,
            width: img.naturalWidth,
            height: img.naturalHeight,
            trimData: {
              trimmed: false,
              sourceSize: { w: img.naturalWidth, h: img.naturalHeight },
              spriteSourceSize: { x: 0, y: 0, w: img.naturalWidth, h: img.naturalHeight },
            },
            originalImg,
            originalWidth,
            originalHeight,
          });
        }
      };
      img.onerror = () => reject(new Error(`Failed to load image: ${file.name}`));
      img.src = reader.result;
    };
    reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
    reader.readAsDataURL(file);
  });
}

/**
 * Load multiple images from an array of Files
 * @param {File[]} files
 * @param {boolean} enableTrim - Whether to trim transparent pixels
 * @returns {Promise<Array>}
 */
export async function loadImagesFromFiles(files, enableTrim = false) {
  const promises = files.map((file) => loadImageFromFile(file, enableTrim));
  return Promise.all(promises);
}

/**
 * Apply trim to an already loaded image
 * @param {Object} imageData - Image data object with originalImg
 * @returns {Promise<Object>} Updated image data with trimmed dimensions
 */
export async function applyTrimToImage(imageData) {
  const sourceImg = imageData.originalImg || imageData.img;
  
  try {
    const { img: trimmedImg, trimData } = await trimImage(sourceImg);
    return {
      ...imageData,
      img: trimmedImg,
      width: trimmedImg.naturalWidth,
      height: trimmedImg.naturalHeight,
      trimData,
    };
  } catch (err) {
    console.error('Error trimming image:', err);
    return imageData;
  }
}

/**
 * Remove trim from an image, restoring original dimensions
 * @param {Object} imageData - Image data object with originalImg
 * @returns {Object} Updated image data with original dimensions
 */
export function removeTrimFromImage(imageData) {
  const originalImg = imageData.originalImg || imageData.img;
  const originalWidth = imageData.originalWidth || originalImg.naturalWidth;
  const originalHeight = imageData.originalHeight || originalImg.naturalHeight;
  
  return {
    ...imageData,
    img: originalImg,
    width: originalWidth,
    height: originalHeight,
    trimData: {
      trimmed: false,
      sourceSize: { w: originalWidth, h: originalHeight },
      spriteSourceSize: { x: 0, y: 0, w: originalWidth, h: originalHeight },
    },
  };
}
