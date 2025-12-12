import React from 'react';

function placementKey(p, idx) {
  return `${p.name}-${p.x}-${p.y}-${p.width}-${p.height}-${idx}`;
}

export default function AtlasPlacementList({ atlas, atlasIndex = 0, onSelect, onDelete, onReplace, selected, mode }) {
  if (!atlas || !atlas.placements || atlas.placements.length === 0) return null;

  return (
    <div className="atlas-placement-list">
      <div className="list-header">
        <h3>Atlas Images ({atlas.placements.length})</h3>
        <span className="list-sub">Tap to preview{mode === 'edit' ? ', replace or delete' : ', delete to remove'}.</span>
      </div>
      <div className="placement-items">
        {atlas.placements.map((p, idx) => {
          const key = placementKey(p, idx);
          const isSelected = selected && selected.key === key;
          return (
            <div
              key={key}
              className={`placement-row ${isSelected ? 'active' : ''}`}
              onClick={() => onSelect && onSelect(p, atlasIndex, key)}
            >
              <div className="placement-main">
                <div className="placement-name" title={p.name}>{p.name}</div>
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
                    onClick={(e) => {
                      e.stopPropagation();
                      onReplace && onReplace(p, atlasIndex, key);
                    }}
                    title="Replace image"
                  >
                    ⟳
                  </button>
                )}
                <button
                  type="button"
                  className="remove-image-btn"
                  onClick={(e) => {
                      e.stopPropagation();
                      onDelete && onDelete(p, atlasIndex, idx);
                  }}
                  title="Delete from atlas"
                >
                  ✕
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
