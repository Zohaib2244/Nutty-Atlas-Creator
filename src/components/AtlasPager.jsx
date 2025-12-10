import React from 'react';

export default function AtlasPager({ atlases, activeIndex, onSelectAtlas }) {
  if (!atlases || atlases.length <= 1) return null;

  return (
    <div className="atlas-pager">
      <span className="pager-label">Atlases:</span>
      {atlases.map((atlas, idx) => (
        <button
          key={idx}
          className={`pager-btn ${idx === activeIndex ? 'active' : ''}`}
          onClick={() => onSelectAtlas(idx)}
        >
          {idx + 1}
        </button>
      ))}
    </div>
  );
}
