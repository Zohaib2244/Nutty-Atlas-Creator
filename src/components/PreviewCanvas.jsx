import React, { useEffect, useRef, useState } from 'react';

export default function PreviewCanvas({ atlas, canvasSize, selection, onImageClick }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [zoom, setZoom] = useState(0.95);
  const MIN_ZOOM = 0.05;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const w = (atlas && (atlas.width || atlas.size)) || canvasSize || 1024;
    const h = (atlas && (atlas.height || atlas.size)) || canvasSize || 1024;
    canvas.width = w;
    canvas.height = h;

    ctx.clearRect(0, 0, w, h);
    if (atlas && atlas.canvas) ctx.drawImage(atlas.canvas, 0, 0);

    // Reset pan when atlas changes
    setPan({ x: 0, y: 0 });
  }, [atlas, canvasSize]);

  // Attach a non-passive wheel listener directly to the container to ensure preventDefault works
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const wheelFn = (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        e.stopPropagation();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setZoom((prev) => Math.min(4, Math.max(MIN_ZOOM, prev + delta)));
      }
    };
    el.addEventListener('wheel', wheelFn, { passive: false });
    return () => el.removeEventListener('wheel', wheelFn);
  }, []);

  // Panning with Right-click
  const [isPanning, setIsPanning] = useState(false);
  const isPanningRef = useRef(false);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const panRef = useRef({ startX: 0, startY: 0, startPanX: 0, startPanY: 0, currentX: 0, currentY: 0 });

  // Keep ref in sync with state for use in listeners without re-binding
  useEffect(() => {
    panRef.current.currentX = pan.x;
    panRef.current.currentY = pan.y;
  }, [pan.x, pan.y]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onMouseDown = (e) => {
      // Right mouse button (2) to start panning
      if (e.button === 2) {
        e.preventDefault();
        e.stopPropagation();
        isPanningRef.current = true;
        setIsPanning(true);
        panRef.current.startX = e.clientX;
        panRef.current.startY = e.clientY;
        panRef.current.startPanX = panRef.current.currentX;
        panRef.current.startPanY = panRef.current.currentY;
        document.body.classList.add('no-select');
      }
      // Left mouse button (0) to select image
      else if (e.button === 0 && onImageClick && atlas) {
        const canvasEl = canvasRef.current;
        const rect = canvasEl.getBoundingClientRect();
        // Point relative to element's top-left in CSS pixels
        let x = e.clientX - rect.left;
        let y = e.clientY - rect.top;

        // The visible transform (pan + scale) is applied to .preview-zoom-layer;
        // invert its transform matrix to map screen point back to untransformed coords.
        const zoomLayer = containerRef.current && containerRef.current.querySelector('.preview-zoom-layer');
        if (zoomLayer) {
          const style = window.getComputedStyle(zoomLayer);
          const transform = style.transform;
          try {
            if (transform && transform !== 'none') {
              const m = new DOMMatrix(transform);
              const inv = m.inverse();
              const p = new DOMPoint(x, y).matrixTransform(inv);
              x = p.x;
              y = p.y;
            }
          } catch (err) {
            // Fall back to basic mapping if matrix inversion fails
          }
        }

        // Convert from CSS pixels to canvas pixels (account for CSS scaling)
        const scaleX = canvasEl.width / rect.width;
        const scaleY = canvasEl.height / rect.height;
        const canvasX = x * scaleX;
        const canvasY = y * scaleY;

        // Check if click is within any placement
        if (atlas.placements) {
          for (const placement of atlas.placements) {
            if (canvasX >= placement.x && canvasX <= placement.x + placement.width &&
                canvasY >= placement.y && canvasY <= placement.y + placement.height) {
              onImageClick(placement);
              break;
            }
          }
        }
      }
    };

    const onMouseMove = (e) => {
      if (!isPanningRef.current) return;
      e.preventDefault();
      const dx = e.clientX - panRef.current.startX;
      const dy = e.clientY - panRef.current.startY;
      
      setPan({
        x: panRef.current.startPanX + dx,
        y: panRef.current.startPanY + dy,
      });
    };

    const onMouseUp = () => {
      if (isPanningRef.current) {
        isPanningRef.current = false;
        setIsPanning(false);
        document.body.classList.remove('no-select');
      }
    };

    const onContextMenu = (e) => {
      // Prevent the context menu when using right-click to pan
      e.preventDefault();
    };

    el.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove, { passive: false });
    window.addEventListener('mouseup', onMouseUp);
    el.addEventListener('contextmenu', onContextMenu);

    return () => {
      el.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      el.removeEventListener('contextmenu', onContextMenu);
      document.body.classList.remove('no-select');
    };
  }, []); // No dependencies, listeners are stable

  const size = atlas && atlas.size ? atlas.size : canvasSize || 1024;

  return (
    <div className="preview-container">
      <div className={`preview-stage preview-bg-transparent ${isPanning ? 'panning' : ''}`}>
        <div className="preview-stage-visual" aria-hidden />
        <div 
          className="preview-stage-inner"
          ref={containerRef}
        >
          <div
            className="preview-canvas-wrapper"
            style={{ 
              width: '100%',
              height: '100%',
              flexShrink: 0,
            }}
          >
            <div
              className="preview-zoom-layer"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: 'center center',
                transition: isPanning ? 'none' : 'transform 0.1s ease-out',
              }}
            >
              <canvas
                ref={canvasRef}
                className="preview-canvas"
                style={{ width: '100%', height: '100%' }}
              />
              {selection && (selection.atlasWidth || selection.size) ? (() => {
                const aw = selection.atlasWidth || selection.size;
                const ah = selection.atlasHeight || selection.size;
                return (
                  <div className="preview-overlay" aria-hidden>
                    <div
                      className="preview-selection"
                      style={{
                        left: `${(selection.x / aw) * 100}%`,
                        top: `${(selection.y / ah) * 100}%`,
                        width: `${(selection.width / aw) * 100}%`,
                        height: `${(selection.height / ah) * 100}%`,
                      }}
                    />
                  </div>
                );
              })() : null}
            </div>
          </div>
        </div>
      </div>
      <div className="preview-zoom-controls">
        <button 
          className="zoom-btn" 
          onClick={() => setZoom((z) => Math.max(MIN_ZOOM, z - 0.25))}
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
          onClick={() => {
            setZoom(1);
            setPan({ x: 0, y: 0 });
          }}
          title="Reset Zoom & Pan"
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
