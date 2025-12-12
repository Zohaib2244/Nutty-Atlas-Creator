import React from 'react';

const ATLAS_SIZES = [128, 256, 512, 1024, 2048, 4096];
const PREVIEW_BACKGROUNDS = [
  { value: 'white', label: 'White' },
  { value: 'black', label: 'Black' },
  { value: 'transparent', label: 'Transparent' },
];

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

  const handlePreviewBgChange = (value) => {
    console.debug('Preview background change:', value);
    onSettingsChange({ ...settings, previewBg: value });
  };

  return (
    <div className="atlas-settings">
      <h3>Atlas Settings</h3>
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
      <div className="setting-group">
        <label>Preview Background</label>
        <div className="preview-bg-toggle" role="group" aria-label="Preview background options">
          {PREVIEW_BACKGROUNDS.map((bg) => (
            <button
              key={bg.value}
              type="button"
              className={`bg-chip ${settings.previewBg === bg.value ? 'active' : ''} bg-${bg.value}`}
              onClick={() => handlePreviewBgChange(bg.value)}
              disabled={disabled}
            >
              <span className="bg-chip-swatch" aria-hidden />
              <span>{bg.label}</span>
            </button>
          ))}
        </div>
        <p className="setting-description">Preview backdrop only — export stays transparent.</p>
      </div>
      {/* Auto-pack on change - no manual button needed */}
      <p className="small text-secondary" style={{ marginTop: '0.5rem' }}>
        Note: Images larger than the selected atlas size will be rejected and must be resized before uploading.
      </p>
      <div className="current-settings small text-secondary" style={{ marginTop: '0.5rem' }}>
        Current: {settings.size} × {settings.size}, padding: {settings.padding}px
      </div>
    </div>
  );
}
