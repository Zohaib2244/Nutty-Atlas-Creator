import React, { useState, useRef } from 'react';

export default function AtlasUploader({ onAtlasLoad }) {
  const [pngFile, setPngFile] = useState(null);
  const [jsonFile, setJsonFile] = useState(null);
  const [error, setError] = useState('');
  const [isDraggingPng, setIsDraggingPng] = useState(false);
  const [isDraggingJson, setIsDraggingJson] = useState(false);
  const pngInputRef = useRef(null);
  const jsonInputRef = useRef(null);

  const handlePngDrop = (e) => {
    e.preventDefault();
    setIsDraggingPng(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setPngFile(file);
      setError('');
    } else if (file) {
      setError('Please drop a valid image file (PNG)');
    }
  };

  const handleJsonDrop = (e) => {
    e.preventDefault();
    setIsDraggingJson(false);
    const file = e.dataTransfer.files?.[0];
    if (file && (file.type === 'application/json' || file.name.endsWith('.json'))) {
      setJsonFile(file);
      setError('');
    } else if (file) {
      setError('Please drop a valid JSON file');
    }
  };

  const handlePngChange = (e) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setPngFile(file);
      setError('');
    } else if (file) {
      setError('Please select a valid PNG file');
    }
  };

  const handleJsonChange = (e) => {
    const file = e.target.files?.[0];
    if (file && (file.type === 'application/json' || file.name.endsWith('.json'))) {
      setJsonFile(file);
      setError('');
    } else if (file) {
      setError('Please select a valid JSON file');
    }
  };

  const handleLoad = async () => {
    if (!pngFile || !jsonFile) {
      setError('Please provide both PNG and JSON files');
      return;
    }

    try {
      // Load PNG image
      const pngUrl = URL.createObjectURL(pngFile);
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = () => reject(new Error('Failed to load PNG'));
        img.src = pngUrl;
      });

      // Parse JSON
      const jsonText = await jsonFile.text();
      const jsonData = JSON.parse(jsonText);

      // Validate JSON structure
      if (!jsonData.frames || typeof jsonData.frames !== 'object') {
        throw new Error('Invalid atlas JSON format: missing "frames" object');
      }

      // Extract placements from JSON
      const placements = [];
      for (const [name, data] of Object.entries(jsonData.frames)) {
        if (data.frame) {
          placements.push({
            name,
            x: data.frame.x,
            y: data.frame.y,
            width: data.frame.w,
            height: data.frame.h,
            img: null, // no image needed for existing placements
          });
        }
      }

      // Determine atlas size from meta or image dimensions
      let atlasSize = img.width;
      if (jsonData.meta?.size) {
        atlasSize = jsonData.meta.size.w;
      }

      onAtlasLoad({
        img,
        imgUrl: pngUrl,
        placements,
        atlasSize,
        padding: jsonData.meta?.padding || 0,
        originalJson: jsonData,
      });

      setError('');
    } catch (err) {
      setError(`Failed to load atlas: ${err.message}`);
      console.error('Atlas load error:', err);
    }
  };

  const clearPng = (e) => {
    e.stopPropagation();
    setPngFile(null);
    if (pngInputRef.current) pngInputRef.current.value = '';
  };

  const clearJson = (e) => {
    e.stopPropagation();
    setJsonFile(null);
    if (jsonInputRef.current) jsonInputRef.current.value = '';
  };

  return (
    <div className="atlas-uploader">
      <div className="atlas-drop-zones">
        {/* PNG Drop Zone */}
        <div
          className={`atlas-drop-zone ${isDraggingPng ? 'dragging' : ''} ${pngFile ? 'has-file' : ''}`}
          onDrop={handlePngDrop}
          onDragOver={(e) => { e.preventDefault(); setIsDraggingPng(true); }}
          onDragLeave={() => setIsDraggingPng(false)}
          onClick={() => pngInputRef.current?.click()}
        >
          <input
            ref={pngInputRef}
            type="file"
            accept="image/png,image/*"
            onChange={handlePngChange}
            style={{ display: 'none' }}
          />
          {pngFile ? (
            <div className="atlas-file-info">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
              <span className="file-name" title={pngFile.name}>{pngFile.name}</span>
              <button className="clear-file-btn" onClick={clearPng} title="Remove">✕</button>
            </div>
          ) : (
            <div className="atlas-drop-content">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
              <span>Drop Atlas PNG</span>
              <small>or click to browse</small>
            </div>
          )}
        </div>

        {/* JSON Drop Zone */}
        <div
          className={`atlas-drop-zone ${isDraggingJson ? 'dragging' : ''} ${jsonFile ? 'has-file' : ''}`}
          onDrop={handleJsonDrop}
          onDragOver={(e) => { e.preventDefault(); setIsDraggingJson(true); }}
          onDragLeave={() => setIsDraggingJson(false)}
          onClick={() => jsonInputRef.current?.click()}
        >
          <input
            ref={jsonInputRef}
            type="file"
            accept="application/json,.json"
            onChange={handleJsonChange}
            style={{ display: 'none' }}
          />
          {jsonFile ? (
            <div className="atlas-file-info">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
              <span className="file-name" title={jsonFile.name}>{jsonFile.name}</span>
              <button className="clear-file-btn" onClick={clearJson} title="Remove">✕</button>
            </div>
          ) : (
            <div className="atlas-drop-content">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
              <span>Drop Atlas JSON</span>
              <small>or click to browse</small>
            </div>
          )}
        </div>
      </div>

      {error && <div className="error-message" style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}>{error}</div>}
      
      <button
        className="btn btn-primary"
        onClick={handleLoad}
        disabled={!pngFile || !jsonFile}
        style={{ marginTop: '0.75rem' }}
      >
        Load Atlas
      </button>
    </div>
  );
}
