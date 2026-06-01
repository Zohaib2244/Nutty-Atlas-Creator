import React from 'react';

export default function ImageList({ images, onRemoveImage, selectedIndex, onSelectImage }) {
  if (!images || images.length === 0) {
    return null;
  }

  return (
    <div className="image-list">
      <h3>Loaded Images ({images.length})</h3>
      <div className="image-list-items">
        {images.map((img, idx) => (
          <div
            key={img.name}
            className={`image-list-item ${selectedIndex === idx ? 'selected' : ''}`}
            onClick={() => onSelectImage && onSelectImage(idx)}
            style={{ cursor: onSelectImage ? 'pointer' : 'default' }}
          >
            <span className="image-list-number">{idx + 1}.</span>
            <span className="image-list-name">{img.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
