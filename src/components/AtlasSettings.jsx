import React from 'react';

const ATLAS_SIZES = [128, 256, 512, 1024, 2048, 4096];

export default function AtlasSettings({ settings, onSettingsChange, onPack, disabled }) {
  const handleSizeChange = (e) => {
    onSettingsChange({ ...settings, size: parseInt(e.target.value, 10) });
  };

  const handlePaddingChange = (e) => {
    const value = Math.max(0, parseInt(e.target.value || '0', 10));
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
      <button className="btn btn-primary" onClick={onPack} disabled={disabled}>
        Pack & Preview
      </button>
    </div>
  );
}
