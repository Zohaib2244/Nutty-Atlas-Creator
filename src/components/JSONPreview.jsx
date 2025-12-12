import React, { useState } from 'react';
import { buildAtlasJSON } from '../utils/exporter';

export default function JSONPreview({ atlas, atlasIndex }) {
  if (!atlas) return null;

  const json = buildAtlasJSON(atlas, atlasIndex);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(json, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  return (
    <div className="json-preview">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h4>JSON Metadata</h4>
        <button className="btn btn-primary" style={{ width: 'auto', padding: '0.4rem 0.75rem' }} onClick={handleCopy}>
          {copied ? 'Copied!' : 'Copy JSON'}
        </button>
      </div>
      <pre className="json-code">{JSON.stringify(json, null, 2)}</pre>
    </div>
  );
}
