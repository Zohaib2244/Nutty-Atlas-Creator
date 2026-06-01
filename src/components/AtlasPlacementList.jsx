import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

function placementKey(p, idx) {
  return `${p.name}-${p.x}-${p.y}-${p.width}-${p.height}-${idx}`;
}

function SpriteTooltip({ placement, atlas, anchorEl }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !atlas?.canvas) return;
    const MAX = 120;
    const scale = Math.min(1, MAX / placement.width, MAX / placement.height);
    const w = Math.max(1, Math.round(placement.width * scale));
    const h = Math.max(1, Math.round(placement.height * scale));
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(atlas.canvas, placement.x, placement.y, placement.width, placement.height, 0, 0, w, h);
  }, [placement, atlas]);

  const rect = anchorEl?.getBoundingClientRect?.();
  if (!rect) return null;

  return createPortal(
    <div
      className="sprite-tooltip"
      style={{
        position: 'fixed',
        top: `${rect.top + rect.height / 2}px`,
        left: `${rect.left - 8}px`,
        transform: 'translateY(-50%) translateX(-100%)',
      }}
    >
      <canvas ref={canvasRef} className="sprite-tooltip-canvas" />
      <div className="sprite-tooltip-info">{placement.width}×{placement.height}</div>
    </div>,
    document.body,
  );
}

export default function AtlasPlacementList({ atlas, atlasIndex = 0, onSelect, onDelete, onReplace, onRename, selected, mode }) {
  const [query, setQuery] = useState('');
  const [hovered, setHovered] = useState(null); // { p, el }
  const [editingKey, setEditingKey] = useState(null);
  const [editingName, setEditingName] = useState('');
  const selectedRowRef = useRef(null);

  // Auto-scroll selected row into view when selection changes
  useEffect(() => {
    if (selected && selectedRowRef.current) {
      selectedRowRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [selected?.key]);

  if (!atlas || !atlas.placements || atlas.placements.length === 0) return null;

  const lc = query.toLowerCase();
  const filtered = atlas.placements
    .map((p, idx) => ({ p, idx, key: placementKey(p, idx) }))
    .filter(({ p }) => !lc || p.name.toLowerCase().includes(lc));

  const startEditing = (p, key, e) => {
    e.stopPropagation();
    setEditingKey(key);
    setEditingName(p.name);
  };

  const confirmRename = (p) => {
    const newName = editingName.trim();
    if (newName && newName !== p.name) {
      onRename && onRename(p, atlasIndex, newName);
    }
    setEditingKey(null);
  };

  return (
    <div className="atlas-placement-list">
      <div className="list-header">
        <h3>Atlas Images ({atlas.placements.length})</h3>
        <span className="list-sub">Click to select{mode === 'edit' ? ', replace or delete' : ' or delete'}.</span>
      </div>

      <div className="placement-search">
        <input
          type="text"
          placeholder="Filter by name…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="placement-search-input"
        />
        {query && (
          <button className="placement-search-clear" onClick={() => setQuery('')} title="Clear">✕</button>
        )}
      </div>

      {filtered.length === 0 && (
        <div className="placement-empty">No sprites match "{query}"</div>
      )}

      <div className="placement-items">
        {filtered.map(({ p, idx, key }) => {
          const isSelected = selected && selected.key === key;
          const isEditing = editingKey === key;

          return (
            <div
              key={key}
              ref={isSelected ? selectedRowRef : null}
              className={`placement-row ${isSelected ? 'active' : ''}`}
              onClick={() => !isEditing && onSelect && onSelect(p, atlasIndex, key)}
              onMouseEnter={(e) => !isEditing && setHovered({ p, el: e.currentTarget })}
              onMouseLeave={() => setHovered(null)}
            >
              <div className="placement-main">
                <div className="placement-name-row">
                  {isEditing ? (
                    <input
                      className="placement-rename-input"
                      value={editingName}
                      autoFocus
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') { e.preventDefault(); confirmRename(p); }
                        if (e.key === 'Escape') setEditingKey(null);
                        e.stopPropagation();
                      }}
                      onBlur={() => confirmRename(p)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <>
                      <div className="placement-name" title={p.name}>{p.name}</div>
                      <button
                        type="button"
                        className="rename-image-btn"
                        onClick={(e) => startEditing(p, key, e)}
                        title="Rename sprite"
                      >
                        ✎
                      </button>
                    </>
                  )}
                </div>
                <div className="placement-size">{p.width}×{p.height} @ ({p.x}, {p.y})</div>
              </div>
              <div className="placement-actions">
                <span className={`placement-badge ${p.img ? 'badge-new' : 'badge-existing'}`}>
                  {p.img ? 'New' : 'Existing'}
                </span>
                {mode === 'edit' && (
                  <button
                    type="button"
                    className="replace-image-btn"
                    onClick={(e) => { e.stopPropagation(); onReplace && onReplace(p, atlasIndex, key); }}
                    title="Replace image"
                  >
                    ⟳
                  </button>
                )}
                <button
                  type="button"
                  className="remove-image-btn"
                  onClick={(e) => { e.stopPropagation(); onDelete && onDelete(p, atlasIndex, idx); }}
                  title="Delete from atlas"
                >
                  ✕
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {hovered && atlas.canvas && (
        <SpriteTooltip placement={hovered.p} atlas={atlas} anchorEl={hovered.el} />
      )}
    </div>
  );
}
