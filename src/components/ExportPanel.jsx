import React, { useState, useEffect } from 'react';
import { exportAtlasAsPngJson, exportAtlasesAsZip, exportAtlasesAsZipEdit, triggerDownload, writeFileToDirectory } from '../utils/exporter';

export default function ExportPanel({ atlases, disabled, existingAtlas }) {
  const [status, setStatus] = useState('');
  const [customName, setCustomName] = useState('atlas');

  useEffect(() => {
    if (!existingAtlas) return;
    const derived = existingAtlas.sourceBaseName || null;
    if (derived) setCustomName(derived);
  }, [existingAtlas]);

  const isEdit = Boolean(existingAtlas);

  const handleReplaceFiles = async () => {
    if (!atlases || atlases.length === 0) {
      setStatus('Nothing to export. Pack atlases first.');
      return;
    }
    if (!existingAtlas) return;

    if (atlases.length !== 1) {
      setStatus('Replace Files requires a single atlas page. Use Export instead.');
      return;
    }

    const pngName = existingAtlas.sourcePngName;
    const jsonName = existingAtlas.sourceJsonName;
    if (!pngName || !jsonName) {
      setStatus('Missing original filenames. Please reload the atlas.');
      return;
    }

    setStatus('Preparing files...');

    try {
      const { pngBlob, json } = await exportAtlasAsPngJson(atlases[0], existingAtlas);
      const jsonBlob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });

      // True in-place replacement is only possible with the File System Access API
      if (typeof window !== 'undefined' && typeof window.showDirectoryPicker === 'function') {
        setStatus('Pick the folder containing your original files...');
        const dirHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
        setStatus('Replacing files...');
        await writeFileToDirectory(dirHandle, pngName, pngBlob);
        await writeFileToDirectory(dirHandle, jsonName, jsonBlob);
        setStatus('Replaced files in selected folder.');
      } else {
        // Fallback (cannot write to disk without user-granted directory handle)
        triggerDownload(pngBlob, pngName);
        triggerDownload(jsonBlob, jsonName);
        setStatus('Browser cannot replace files directly; downloaded instead.');
      }
      setTimeout(() => setStatus(''), 3000);
    } catch (error) {
      console.error('Replace export error:', error);
      if (error?.name === 'AbortError') {
        setStatus('Folder selection cancelled.');
      } else {
        setStatus('Replace failed.');
      }
    }
  };

  const handleExport = async () => {
    if (!atlases || atlases.length === 0) {
      setStatus('Nothing to export. Pack atlases first.');
      return;
    }

    setStatus('Preparing ZIP...');

    try {
      const sanitized = (customName || 'atlas').replace(/[^\w-]/g, '_');
      const zipBlob = isEdit
        ? await exportAtlasesAsZipEdit(atlases, existingAtlas, sanitized)
        : await exportAtlasesAsZip(atlases, existingAtlas, sanitized);
      const zipName = isEdit ? `${sanitized}.zip` : `AVN_${sanitized}_${atlases.length}.zip`;
      triggerDownload(zipBlob, zipName);
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
        {isEdit
          ? 'Edit mode: replace the original PNG/JSON files, or export a ZIP using the uploaded atlas name.'
          : 'Download all atlases and their JSON metadata as a single ZIP file.'}
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
      {isEdit ? (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className="btn btn-success"
            onClick={handleReplaceFiles}
            disabled={disabled || !existingAtlas || atlases?.length !== 1}
            style={{ width: '100%' }}
            title={atlases?.length !== 1 ? 'Replace requires a single atlas page' : undefined}
          >
            Replace Files
          </button>
          <button className="btn btn-primary" onClick={handleExport} disabled={disabled} style={{ width: '100%' }}>
            Export
          </button>
        </div>
      ) : (
        <button className="btn btn-success" onClick={handleExport} disabled={disabled}>
          Export ZIP
        </button>
      )}
      {status && <div className="export-status">{status}</div>}
    </div>
  );
}
