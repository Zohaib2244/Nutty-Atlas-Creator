import React, { useState, useEffect } from 'react';
import { exportAtlasesAsZip, triggerDownload } from '../utils/exporter';

export default function ExportPanel({ atlases, disabled, existingAtlas }) {
  const [status, setStatus] = useState('');
  const [customName, setCustomName] = useState('atlas');

  // Derive a reasonable default name from an existing atlas JSON when editing
  const deriveNameFromJson = (existing) => {
    try {
      const json = existing?.originalJson;
      if (!json) return null;
      // Prefer meta.image (texture file) or meta.name if present
      let candidate = json.meta?.image || json.meta?.name || null;
      if (!candidate) return null;
      // Strip extension if present
      candidate = String(candidate).replace(/\.[^/.]+$/, '');
      // Remove leading AVN or AVN_
      candidate = candidate.replace(/^AVN_?/, '');
      // Remove trailing _<number> e.g. _1
      candidate = candidate.replace(/_[0-9]+$/, '');
      // Sanitise to safe characters (underscores for anything else)
      candidate = candidate.replace(/[^\w-]/g, '_');
      return candidate || null;
    } catch (e) {
      return null;
    }
  };

  useEffect(() => {
    if (existingAtlas) {
      const derived = deriveNameFromJson(existingAtlas);
      if (derived) setCustomName(derived);
    }
  }, [existingAtlas]);

  const handleExport = async () => {
    if (!atlases || atlases.length === 0) {
      setStatus('Nothing to export. Pack atlases first.');
      return;
    }

    setStatus('Preparing ZIP...');

    try {
      const sanitized = (customName || 'atlas').replace(/[^\w-]/g, '_');
      const zipBlob = await exportAtlasesAsZip(atlases, existingAtlas, sanitized);
      triggerDownload(zipBlob, `AVN_${sanitized}_${atlases.length}.zip`);
      setStatus('Download started!');
      setTimeout(() => setStatus(''), 3000);
    } catch (error) {
      console.error('Export error:', error);
      setStatus('Export failed.');
    }
  };

  return (
    <div className="export-panel">
      <p className="export-description">
        Download all atlases and their JSON metadata as a single ZIP file.
      </p>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.6rem' }}>
        <label style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>File Name:</label>
        <input
          type="text"
          value={customName}
          onChange={(e) => setCustomName(e.target.value)}
          style={{ padding: '0.4rem 0.6rem', borderRadius: '0.4rem', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
        />
      </div>
      <button className="btn btn-success" onClick={handleExport} disabled={disabled}>
        Export ZIP
      </button>
      {status && <div className="export-status">{status}</div>}
    </div>
  );
}
