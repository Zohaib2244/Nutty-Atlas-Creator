import React, { useState, useEffect, useRef } from 'react';
import ImageUploader from './components/ImageUploader';
import ImageList from './components/ImageList';
import AtlasSettings from './components/AtlasSettings';
import PreviewCanvas from './components/PreviewCanvas';
import AtlasPager from './components/AtlasPager';
import JSONPreview from './components/JSONPreview';
import ExportPanel from './components/ExportPanel';
import AtlasUploader from './components/AtlasUploader';
import { packImages } from './utils/atlasPacker';
import { renderAllAtlases } from './utils/atlasRenderer';

function App() {
  const [mode, setMode] = useState('create'); // 'create' or 'edit'
  const [images, setImages] = useState([]);
  const [settings, setSettings] = useState({ size: 1024, padding: 2 });
  const [atlases, setAtlases] = useState([]);
  const [activeAtlasIndex, setActiveAtlasIndex] = useState(0);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [lastAddedNames, setLastAddedNames] = useState([]);
  const [existingAtlas, setExistingAtlas] = useState(null);

  const handleAddImages = (loadedImages) => {
    // Append new images; avoid duplicates by name
    setError('');
    setInfo('');
    setImages((prev) => {
      const existingNames = new Set(prev.map((it) => it.name));
      const filtered = loadedImages.filter((it) => !existingNames.has(it.name));

      // Pre-check for oversized images and reject them up-front (no auto-resize)
      const rejected = filtered.filter(
        (it) => it.width + settings.padding > settings.size || it.height + settings.padding > settings.size
      );
      if (rejected.length) {
        setError(
          `The following image(s) are larger than selected atlas ${settings.size}×${settings.size}: ${rejected
            .map((r) => r.name)
            .join(', ')}`
        );
      }
      // Only keep images that fit
      const accepted = filtered.filter(
        (it) => it.width + settings.padding <= settings.size && it.height + settings.padding <= settings.size
      );
      if (accepted.length) setLastAddedNames(accepted.map((it) => it.name));
      return [...prev, ...accepted];
    });
  };

  const handleRemoveImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAtlasLoad = (atlasData) => {
    setExistingAtlas(atlasData);
    setSettings({ size: atlasData.atlasSize, padding: atlasData.padding });
    setInfo(`Loaded existing atlas with ${atlasData.placements.length} sprites. Add new images to extend it.`);
    setError('');
  };

  const handleModeToggle = () => {
    const newMode = mode === 'create' ? 'edit' : 'create';
    setMode(newMode);
    setImages([]);
    setAtlases([]);
    setExistingAtlas(null);
    setError('');
    setInfo('');
  };

  const handlePack = () => {
    if (mode === 'edit' && !existingAtlas) {
      setError('Please load an existing atlas first.');
      return;
    }
    if (images.length === 0 && mode === 'create') {
      setError('Please upload images first.');
      return;
    }

    setError('');

    try {
      const packed = packImages(images, settings.size, settings.padding, 4096, 0, mode === 'edit' ? existingAtlas : null);
      renderAllAtlases(packed);
      setAtlases(packed);
      setActiveAtlasIndex(0);
    } catch (err) {
      console.error('Packing error:', err);
      setError(err.message);
      setAtlases([]);
    }
  };

  // Auto-pack on images or settings change (debounced)
  const packTimer = useRef(null);
  useEffect(() => {
    if (packTimer.current) clearTimeout(packTimer.current);
    packTimer.current = setTimeout(() => {
      if (mode === 'edit' && !existingAtlas) {
        return; // Wait for atlas to be loaded
      }
      if (images.length === 0 && mode === 'create') {
        setAtlases([]);
        setActiveAtlasIndex(0);
        setError('');
        return;
      }
      if (images.length === 0 && mode === 'edit' && existingAtlas) {
        // In edit mode with no new images, just show the existing atlas
        try {
          const packed = packImages([], settings.size, settings.padding, 4096, 0, existingAtlas);
          renderAllAtlases(packed);
          setAtlases(packed);
          setActiveAtlasIndex(0);
        } catch (err) {
          console.error('Packing error:', err);
        }
        return;
      }
      try {
        const packed = packImages(images, settings.size, settings.padding, 4096, 0, mode === 'edit' ? existingAtlas : null);
        renderAllAtlases(packed);
        setAtlases(packed);
        // If we recently added images, try to show the atlas that contains the
        // last added image so users see it immediately.
        let newIndex = 0;
        if (lastAddedNames && lastAddedNames.length) {
          const lastName = lastAddedNames[lastAddedNames.length - 1];
          for (let i = 0; i < packed.length; i++) {
            if (packed[i].placements.some((p) => p.name === lastName)) {
              newIndex = i;
              break;
            }
          }
        }
        setActiveAtlasIndex(newIndex);
        setLastAddedNames([]);
        // Show any notes from the packing result (informational messages)
        const notes = packed
          .map((a) => a.note)
          .filter(Boolean);
        if (notes.length) {
          setInfo(notes.join('\n'));
          setTimeout(() => setInfo(''), 5000);
        } else {
          setInfo('');
        }
        setError('');
      } catch (err) {
        console.error('Packing error:', err);
        setError(err.message);
        setAtlases([]);
      }
    }, 200);
    return () => clearTimeout(packTimer.current);
  }, [images, settings, mode, existingAtlas]);

  const activeAtlas = atlases[activeAtlasIndex];

  return (
    <div className="app">
      <header className="app-header">
        <h1>Nutty Atlas Creator</h1>
        <div className="mode-toggle" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '0.9rem', color: mode === 'create' ? '#4a90e2' : '#888' }}>Create</span>
          <button
            className="btn btn-secondary"
            onClick={handleModeToggle}
            style={{ padding: '0.5rem 1rem' }}
          >
            {mode === 'create' ? 'Switch to Edit Mode' : 'Switch to Create Mode'}
          </button>
          <span style={{ fontSize: '0.9rem', color: mode === 'edit' ? '#4a90e2' : '#888' }}>Edit</span>
        </div>
      </header>

      <main className="app-main">
        <aside className="sidebar">
          {mode === 'edit' && (
            <section className="card">
              <h2>1. Load Existing Atlas</h2>
              <AtlasUploader onAtlasLoad={handleAtlasLoad} />
              {existingAtlas && (
                <div className="existing-atlas-info" style={{ marginTop: '1rem', padding: '0.5rem', background: '#f0f0f0', borderRadius: '4px' }}>
                  <strong>Loaded:</strong> {existingAtlas.placements.length} sprites, {existingAtlas.atlasSize}×{existingAtlas.atlasSize}
                </div>
              )}
            </section>
          )}

          <section className="card">
            <h2>{mode === 'edit' ? '2' : '1'}. Images</h2>
            <ImageUploader onAddImages={handleAddImages} />
            <ImageList images={images} onRemoveImage={handleRemoveImage} />
          </section>

          <section className="card">
            <h2>{mode === 'edit' ? '3' : '2'}. Settings</h2>
            <AtlasSettings
              settings={settings}
              onSettingsChange={setSettings}
              onPack={handlePack}
              disabled={mode === 'edit' && !existingAtlas}
            />
            {mode === 'edit' && existingAtlas && (
              <div className="info-message" style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
                Note: Settings loaded from existing atlas. New sprites will use these settings.
              </div>
            )}
          </section>

          <section className="card">
            <h2>{mode === 'edit' ? '4' : '3'}. Export</h2>
            <ExportPanel atlases={atlases} disabled={atlases.length === 0} existingAtlas={existingAtlas} />
          </section>
        </aside>

        <section className="preview-section">
          <div className="card preview-card">
            <div className="preview-header">
              <h2>Preview</h2>
              {activeAtlas ? (
                <span className="preview-info">
                  Atlas {activeAtlasIndex + 1} / {atlases.length} — {activeAtlas.size}×{activeAtlas.size}
                </span>
              ) : (
                <span className="preview-info">Canvas: {settings.size}×{settings.size}</span>
              )}
            </div>

            {error && <div className="error-message">{error}</div>}
            {info && <div className="info-message">{info}</div>}

            <PreviewCanvas atlas={activeAtlas} canvasSize={settings.size} />
            <AtlasPager
              atlases={atlases}
              activeIndex={activeAtlasIndex}
              onSelectAtlas={setActiveAtlasIndex}
            />
            <JSONPreview atlas={activeAtlas} atlasIndex={activeAtlasIndex} />
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
