import React, { useEffect, useRef, useState } from 'react';

export default function PreviewCanvas({ atlas, canvasSize, selection }) {
  const canvasRef = useRef(null);
  const [viewport, setViewport] = useState({ width: window.innerWidth, height: window.innerHeight });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const size = atlas && atlas.size ? atlas.size : canvasSize || 1024;
    canvas.width = size;
    canvas.height = size;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (atlas && atlas.canvas) ctx.drawImage(atlas.canvas, 0, 0);
  }, [atlas, canvasSize]);

  useEffect(() => {
    const handler = () => setViewport({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const size = atlas && atlas.size ? atlas.size : canvasSize || 1024;
  // Static display size (px). This is a fixed square preview area.
  const STATIC_DISPLAY_SIZE = 800;
  // Normalize to fit viewport safely (ensure it doesn't overflow pager area)
  const maxDisplaySize = Math.min(
    STATIC_DISPLAY_SIZE,
    Math.floor(viewport.height * 0.9),
    Math.floor(viewport.width * 0.9)
  );

  return (
    <div className="preview-container">
      <div className={`preview-stage preview-bg-transparent`}>
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
