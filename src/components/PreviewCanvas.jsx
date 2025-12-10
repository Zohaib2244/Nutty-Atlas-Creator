import React, { useEffect, useRef } from 'react';

export default function PreviewCanvas({ atlas }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!atlas || !atlas.canvas) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    canvas.width = atlas.size;
    canvas.height = atlas.size;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(atlas.canvas, 0, 0);
  }, [atlas]);

  if (!atlas) {
    return (
      <div className="preview-empty">
        <p>No preview available. Upload images and click "Pack & Preview".</p>
      </div>
    );
  }

  return (
    <div className="preview-container">
      <canvas ref={canvasRef} className="preview-canvas" />
    </div>
  );
}
