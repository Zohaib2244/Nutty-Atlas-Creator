import React from 'react';

export default function ImageList({ images }) {
  if (!images || images.length === 0) {
    return null;
  }

  return (
    <div className="image-list">
      <h3>Loaded Images ({images.length})</h3>
      <div className="image-list-items">
        {images.map((img, idx) => (
          <div key={idx} className="image-list-item">
            <span className="image-list-number">{idx + 1}.</span>
            <span className="image-list-name">{img.name}</span>
            <span className="image-list-size">
              {img.width}×{img.height}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
