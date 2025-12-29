import React, { useEffect, useRef, useState } from 'react';

export default function PreviewCanvas({ atlas, canvasSize, selection }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [viewport, setViewport] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [zoom, setZoom] = useState(1);

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

  // Handle mouse wheel zoom
  const handleWheel = (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoom((prev) => Math.min(4, Math.max(0.25, prev + delta)));
    }
  };

  const size = atlas && atlas.size ? atlas.size : canvasSize || 1024;
  // Static display size (px). This is a fixed square preview area.
  const STATIC_DISPLAY_SIZE = 800;
  // Normalize to fit viewport safely (ensure it doesn't overflow pager area)
  const maxDisplaySize = Math.min(
    STATIC_DISPLAY_SIZE,
    Math.floor(viewport.height * 0.9),
    Math.floor(viewport.width * 0.9)
  );

  // Determine if canvas is "big" and needs scrolling (larger than display area)
  const needsScrolling = size > maxDisplaySize || zoom > 1;
  const displayWidth = Math.max(size * zoom, maxDisplaySize);
  const displayHeight = Math.max(size * zoom, maxDisplaySize);

  return (
    <div className="preview-container">
      <div className={`preview-stage preview-bg-transparent ${needsScrolling ? 'scrollable' : ''}`}>
        <div className="preview-stage-visual" aria-hidden />
        <div 
          className="preview-stage-inner"
          ref={containerRef}
          onWheel={handleWheel}
        >
          <div
            className="preview-canvas-wrapper"
            style={{ 
              width: needsScrolling ? `${size * zoom}px` : '100%',
              height: needsScrolling ? `${size * zoom}px` : '100%',
              maxWidth: needsScrolling ? 'none' : `${maxDisplaySize}px`, 
              maxHeight: needsScrolling ? 'none' : `${maxDisplaySize}px`,
              flexShrink: needsScrolling ? 0 : 1,
            }}
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
      <div className="preview-zoom-controls">
        <button 
          className="zoom-btn" 
          onClick={() => setZoom((z) => Math.max(0.25, z - 0.25))}
          title="Zoom Out"
        >
          −
        </button>
        <span className="zoom-level">{Math.round(zoom * 100)}%</span>
        <button 
          className="zoom-btn" 
          onClick={() => setZoom((z) => Math.min(4, z + 0.25))}
          title="Zoom In"
        >
          +
        </button>
        <button 
          className="zoom-btn zoom-reset" 
          onClick={() => setZoom(1)}
          title="Reset Zoom"
        >
          Reset
        </button>
      </div>
      {!atlas && (
        <div className="preview-empty" style={{ marginTop: '0.75rem' }}>
          <p>No preview available yet. The canvas reflects the selected atlas size.</p>
        </div>
      )}
    </div>
  );
}
