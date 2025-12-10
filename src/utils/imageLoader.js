/**
 * Load an image from a File object
 * @param {File} file
 * @returns {Promise<{name: string, img: HTMLImageElement, width: number, height: number}>}
 */
export function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        resolve({
          name: file.name,
          img,
          width: img.naturalWidth,
          height: img.naturalHeight,
        });
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
 * @returns {Promise<Array>}
 */
export async function loadImagesFromFiles(files) {
  const promises = files.map((file) => loadImageFromFile(file));
  return Promise.all(promises);
}
