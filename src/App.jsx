import React, { useState } from 'react';
import ImageUploader from './components/ImageUploader';
import ImageList from './components/ImageList';
import AtlasSettings from './components/AtlasSettings';
import PreviewCanvas from './components/PreviewCanvas';
import AtlasPager from './components/AtlasPager';
import JSONPreview from './components/JSONPreview';
import ExportPanel from './components/ExportPanel';
import { packImages } from './utils/atlasPacker';
import { renderAllAtlases } from './utils/atlasRenderer';

function App() {
  const [images, setImages] = useState([]);
  const [settings, setSettings] = useState({ size: 1024, padding: 2 });
  const [atlases, setAtlases] = useState([]);
  const [activeAtlasIndex, setActiveAtlasIndex] = useState(0);
  const [error, setError] = useState('');

  const handleImagesLoaded = (loadedImages) => {
    setImages(loadedImages);
    setAtlases([]);
    setActiveAtlasIndex(0);
    setError('');
  };

  const handlePack = () => {
    if (images.length === 0) {
      setError('Please upload images first.');
      return;
    }

    setError('');

    try {
      const packed = packImages(images, settings.size, settings.padding);
      renderAllAtlases(packed);
      setAtlases(packed);
      setActiveAtlasIndex(0);
    } catch (err) {
      console.error('Packing error:', err);
      setError(err.message);
      setAtlases([]);
    }
  };

  const activeAtlas = atlases[activeAtlasIndex];

  return (
    <div className="app">
      <header className="app-header">
        <h1>Nutty Atlas Creator</h1>
      </header>

      <main className="app-main">
        <aside className="sidebar">
          <section className="card">
            <h2>1. Images</h2>
            <ImageUploader onImagesLoaded={handleImagesLoaded} />
            <ImageList images={images} />
          </section>

          <section className="card">
            <h2>2. Settings</h2>
            <AtlasSettings
              settings={settings}
              onSettingsChange={setSettings}
              onPack={handlePack}
              disabled={images.length === 0}
            />
          </section>

          <section className="card">
            <h2>3. Export</h2>
            <ExportPanel atlases={atlases} disabled={atlases.length === 0} />
          </section>
        </aside>

        <section className="preview-section">
          <div className="card preview-card">
            <div className="preview-header">
              <h2>Preview</h2>
              {activeAtlas && (
                <span className="preview-info">
                  Atlas {activeAtlasIndex + 1} / {atlases.length} — {activeAtlas.size}×
                  {activeAtlas.size}
                </span>
              )}
            </div>

            {error && <div className="error-message">{error}</div>}

            <PreviewCanvas atlas={activeAtlas} />
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
