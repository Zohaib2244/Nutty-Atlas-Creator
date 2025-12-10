import React from 'react';

const ATLAS_SIZES = [128, 256, 512, 1024, 2048, 4096];

export default function AtlasSettings({ settings, onSettingsChange, onPack, disabled }) {
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
      <h3>Atlas Settings</h3>
      <div className="setting-group">
        <label htmlFor="atlasSize">Atlas Size (square)</label>
        <select
          id="atlasSize"
          value={settings.size}
          onChange={handleSizeChange}
          disabled={disabled}
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
          disabled={disabled}
        />
      </div>
      <div className="setting-group">
        <label htmlFor="allowAutoResize">Allow dedicated atlas for too-large images</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input
            id="allowAutoResize"
            type="checkbox"
            checked={settings.allowAutoResize}
            onChange={(e) => onSettingsChange({ ...settings, allowAutoResize: e.target.checked })}
            disabled={false}
          />
          <span className="small text-secondary">When enabled, images larger than the selected atlas size will be placed into their own dedicated atlas (up to 4096×4096). When disabled, large images will cause an error and won't be packed.</span>
        </div>
      </div>
      <button className="btn btn-primary" onClick={onPack} disabled={disabled}>
        Pack & Preview
      </button>
      <p className="small text-secondary" style={{ marginTop: '0.5rem' }}>
        Note: When <strong>Allow dedicated atlas</strong> is enabled, an image larger than the selected size will be placed into a separate atlas (up to 4096×4096). When disabled, attempting to add such an image will produce an error.
      </p>
      <div className="current-settings small text-secondary" style={{ marginTop: '0.5rem' }}>
        Current: {settings.size} × {settings.size}, padding: {settings.padding}px
      </div>
    </div>
  );
}
