import { trimImage } from './imageTrimmer';

/**
 * Load an image from a File object
 * @param {File} file
 * @param {boolean} enableTrim - Whether to trim transparent pixels
 * @returns {Promise<{name: string, img: HTMLImageElement, width: number, height: number, trimData: Object}>}
 */
export function loadImageFromFile(file, enableTrim = false) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = async () => {
        if (enableTrim) {
          try {
            const { img: trimmedImg, trimData } = await trimImage(img);
            resolve({
              name: file.name,
              img: trimmedImg,
              width: trimmedImg.naturalWidth,
              height: trimmedImg.naturalHeight,
              trimData,
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
