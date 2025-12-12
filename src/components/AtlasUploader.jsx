import React, { useState } from 'react';

export default function AtlasUploader({ onAtlasLoad }) {
  const [pngFile, setPngFile] = useState(null);
  const [jsonFile, setJsonFile] = useState(null);
  const [error, setError] = useState('');

  const handlePngChange = (e) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setPngFile(file);
      setError('');
    } else {
      setError('Please select a valid PNG file');
    }
  };

  const handleJsonChange = (e) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/json') {
      setJsonFile(file);
      setError('');
    } else {
      setError('Please select a valid JSON file');
    }
  };

  const handleLoad = async () => {
    if (!pngFile || !jsonFile) {
      setError('Please select both PNG and JSON files');
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

  return (
    <div className="atlas-uploader">
      <h3>Upload Existing Atlas</h3>
      <div className="upload-group">
        <label htmlFor="atlasPng">Atlas PNG:</label>
        <input
          id="atlasPng"
          type="file"
          accept="image/png"
          onChange={handlePngChange}
        />
        {pngFile && <span className="file-name">{pngFile.name}</span>}
      </div>
      <div className="upload-group" style={{ marginTop: '0.5rem' }}>
        <label htmlFor="atlasJson">Atlas JSON:</label>
        <input
          id="atlasJson"
          type="file"
          accept="application/json"
          onChange={handleJsonChange}
        />
        {jsonFile && <span className="file-name">{jsonFile.name}</span>}
      </div>
      {error && <div className="error-message" style={{ marginTop: '0.5rem' }}>{error}</div>}
      <button
        className="btn btn-primary"
        onClick={handleLoad}
        disabled={!pngFile || !jsonFile}
        style={{ marginTop: '1rem' }}
      >
        Load Atlas
      </button>
    </div>
  );
}
