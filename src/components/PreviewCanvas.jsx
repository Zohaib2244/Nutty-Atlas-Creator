import React, { useEffect, useRef } from 'react';

export default function PreviewCanvas({ atlas, canvasSize, previewBg = 'white', selection, previewScale = 1 }) {
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

  const size = atlas && atlas.size ? atlas.size : canvasSize || 1024;
  const scale = previewScale || 1;
  const displaySize = size * scale;
  
  // Normalize to fit viewport: calculate max safe display size
  // Assuming viewport height ~100vh, header ~70px, padding ~50px = ~calc(100vh - 250px) available
  // Use 55vh as safe max to ensure pager stays visible
  const maxDisplaySize = Math.min(displaySize, window.innerHeight * 0.55);

  return (
    <div className="preview-container">
      <div className={`preview-stage preview-bg-${previewBg}`}>
        <div className="preview-stage-visual" aria-hidden />
        <div className="preview-stage-inner">
          <div
            className="preview-canvas-wrapper"
            style={{ maxWidth: `${maxDisplaySize}px`, maxHeight: `${maxDisplaySize}px` }}
          >
            <canvas
              ref={canvasRef}
              className="preview-canvas"
              style={{ width: '100%', height: '100%' }}
            />
            {selection && selection.size ? (
              <div className="preview-overlay" aria-hidden>
                <div
                  className="preview-selection"
                  style={{
                    left: `${(selection.x / selection.size) * 100}%`,
                    top: `${(selection.y / selection.size) * 100}%`,
                    width: `${(selection.width / selection.size) * 100}%`,
                    height: `${(selection.height / selection.size) * 100}%`,
                  }}
                />
              </div>
            ) : null}
          </div>
        </div>
      </div>
      {!atlas && (
        <div className="preview-empty" style={{ marginTop: '0.75rem' }}>
          <p>No preview available yet. The canvas reflects the selected atlas size.</p>
        </div>
      )}
    </div>
  );
}
