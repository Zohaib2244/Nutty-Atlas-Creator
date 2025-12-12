import React from 'react';

const ATLAS_SIZES = [128, 256, 512, 1024, 2048, 4096];

export default function AtlasSettings({ settings, onSettingsChange, disabled }) {
  const handleSizeChange = (e) => {
    const newSize = parseInt(e.target.value, 10);
    console.debug('Atlas size change:', newSize);
    onSettingsChange({ ...settings, size: newSize });
  };

  const handlePaddingChange = (e) => {
    const value = Math.max(0, parseInt(e.target.value || '0', 10));
    console.debug('Padding change:', value);
    onSettingsChange({ ...settings, padding: value });
  };

  return (
    <div className="atlas-settings">
      <div className="setting-group">
        <label htmlFor="atlasSize">Atlas Size (square)</label>
        <select
          id="atlasSize"
          value={settings.size}
          onChange={handleSizeChange}
          onMouseDown={(e) => {
            // Prevent parent handlers (e.g., drag/drop areas) from stealing clicks
            e.stopPropagation();
            console.debug('Atlas size select mouseDown');
          }}
          onFocus={() => console.debug('Atlas size select focused')}
          disabled={disabled}
          style={{ pointerEvents: 'auto', zIndex: 2 }}
        >
          {ATLAS_SIZES.map((size) => (
            <option key={size} value={size}>
              {size} × {size}
            </option>
          ))}
        </select>
      </div>
      <div className="setting-group">
        <label htmlFor="padding">Padding (px)</label>
        <input
          id="padding"
          type="number"
          min="0"
          value={settings.padding}
          onChange={handlePaddingChange}
          onMouseDown={(e) => {
            e.stopPropagation();
            console.debug('Atlas padding input mouseDown');
          }}
          onFocus={() => console.debug('Atlas padding input focused')}
          disabled={disabled}
          style={{ pointerEvents: 'auto', zIndex: 2 }}
        />
      </div>
      <div className="setting-group">
        <label className="toggle-label">
          <input
            type="checkbox"
            checked={settings.trim || false}
            onChange={(e) => {
              console.debug('Trim mode change:', e.target.checked);
              onSettingsChange({ ...settings, trim: e.target.checked });
            }}
            disabled={disabled}
            style={{ marginRight: '0.5rem' }}
          />
          <span>Trim transparent pixels</span>
        </label>
        <p className="setting-description">Remove transparent areas to pack sprites tighter</p>
      </div>
      {/* Auto-pack on change - no manual button needed */}
    </div>
  );
}
