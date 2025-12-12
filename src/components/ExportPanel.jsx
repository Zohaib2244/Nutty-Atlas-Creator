import React, { useState } from 'react';
import { exportAtlasesAsZip, triggerDownload } from '../utils/exporter';

export default function ExportPanel({ atlases, disabled, existingAtlas }) {
  const [status, setStatus] = useState('');

  const handleExport = async () => {
    if (!atlases || atlases.length === 0) {
      setStatus('Nothing to export. Pack atlases first.');
      return;
    }

    setStatus('Preparing ZIP...');

    try {
      const zipBlob = await exportAtlasesAsZip(atlases, existingAtlas);
      triggerDownload(zipBlob, 'nutty_atlas_pack.zip');
      setStatus('Download started!');
      setTimeout(() => setStatus(''), 3000);
    } catch (error) {
      console.error('Export error:', error);
      setStatus('Export failed.');
    }
  };

  return (
    <div className="export-panel">
      <h3>Export</h3>
      <p className="export-description">
        Download all atlases and their JSON metadata as a single ZIP file.
      </p>
      <button className="btn btn-success" onClick={handleExport} disabled={disabled}>
        Export ZIP
      </button>
      {status && <div className="export-status">{status}</div>}
    </div>
  );
}
