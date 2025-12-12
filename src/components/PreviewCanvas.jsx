import React, { useEffect, useRef } from 'react';

export default function PreviewCanvas({ atlas, canvasSize }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const size = atlas && atlas.size ? atlas.size : canvasSize || 1024;
    canvas.width = size;
    canvas.height = size;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (atlas && atlas.canvas) ctx.drawImage(atlas.canvas, 0, 0);
  }, [atlas, canvasSize]);

  return (
    <div className="preview-container">
      <canvas ref={canvasRef} className="preview-canvas" />
      {!atlas && (
        <div className="preview-empty" style={{ marginTop: '0.75rem' }}>
          <p>No preview available yet. The canvas reflects the selected atlas size.</p>
        </div>
      )}
    </div>
  );
}
