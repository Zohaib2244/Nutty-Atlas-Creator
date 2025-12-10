import React from 'react';
import { buildAtlasJSON } from '../utils/exporter';

export default function JSONPreview({ atlas, atlasIndex }) {
  if (!atlas) return null;

  const json = buildAtlasJSON(atlas, atlasIndex);

  return (
    <div className="json-preview">
      <h4>JSON Metadata</h4>
      <pre className="json-code">{JSON.stringify(json, null, 2)}</pre>
    </div>
  );
}
