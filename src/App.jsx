import React, { useState, useEffect, useRef } from 'react';
import ImageUploader from './components/ImageUploader';
import ImageList from './components/ImageList';
import AtlasSettings from './components/AtlasSettings';
import PreviewCanvas from './components/PreviewCanvas';
import AtlasPager from './components/AtlasPager';
import JSONPreview from './components/JSONPreview';
import ExportPanel from './components/ExportPanel';
import AtlasUploader from './components/AtlasUploader';
import AtlasPlacementList from './components/AtlasPlacementList';
import { packImages } from './utils/atlasPacker';
import { renderAllAtlases } from './utils/atlasRenderer';
import { applyTrimToImage, removeTrimFromImage } from './utils/imageLoader';

function App() {
  const [mode, setMode] = useState('create'); // 'create' or 'edit'
  const [images, setImages] = useState([]);
  const [settings, setSettings] = useState({ size: 1024, padding: 2, trim: false });
  const [atlases, setAtlases] = useState([]);
  const [activeAtlasIndex, setActiveAtlasIndex] = useState(0);
  const [errors, setErrors] = useState([]); // Array of error messages for persistence
  const [info, setInfo] = useState('');
  const [lastAddedNames, setLastAddedNames] = useState([]);
  const [existingAtlas, setExistingAtlas] = useState(null);
  const [selectedPlacement, setSelectedPlacement] = useState(null);
  const [leftTab, setLeftTab] = useState('images'); // images | settings | export
  const [prevTrim, setPrevTrim] = useState(false); // Track previous trim state

  // Edit-mode replacement UX (populated when user clicks Replace on a sprite)
  const [replaceTarget, setReplaceTarget] = useState(null); // { placement, atlasIndex, key }
  const [replacePreserveAspect, setReplacePreserveAspect] = useState(true);
  const [isReplaceDragging, setIsReplaceDragging] = useState(false);
  const replaceFileInputRef = useRef(null);

  // Helper to add error
  const addError = (message) => {
    setErrors((prev) => {
      // Avoid duplicates
      if (prev.includes(message)) return prev;
      return [...prev, message];
    });
  };

  // Helper to clear all errors
  const clearErrors = () => setErrors([]);

  // Helper to remove a specific error
  const removeError = (index) => {
    setErrors((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddImages = (loadedImages) => {
    // Append new images; avoid duplicates by name
    clearErrors();
    setInfo('');
    setImages((prev) => {
      const existingNames = new Set(prev.map((it) => it.name));
      const filtered = loadedImages.filter((it) => !existingNames.has(it.name));

      // Pre-check for oversized images and reject them up-front (no auto-resize)
      const rejected = filtered.filter(
        (it) => it.width + settings.padding > settings.size || it.height + settings.padding > settings.size
      );
      if (rejected.length) {
        rejected.forEach((r) => {
          addError(`Image "${r.name}" (${r.width}x${r.height}) is larger than atlas ${settings.size}×${settings.size}`);
        });
      }
      // Only keep images that fit
      const accepted = filtered.filter(
        (it) => it.width + settings.padding <= settings.size && it.height + settings.padding <= settings.size
      );
      if (accepted.length) {
        setLastAddedNames(accepted.map((it) => it.name));
        
        // Show trim info if enabled
        if (settings.trim) {
          const trimmedCount = accepted.filter(img => img.trimData?.trimmed).length;
          if (trimmedCount > 0) {
            setInfo(`✂️ Trimmed ${trimmedCount} image${trimmedCount > 1 ? 's' : ''} - removed transparent padding`);
            setTimeout(() => setInfo(''), 4000);
          }
        }
      }
      return [...prev, ...accepted];
    });
  };

  const handleRemoveImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAtlasLoad = (atlasData) => {
    setExistingAtlas({ ...atlasData, removedRegions: [] });
    setSettings((prev) => ({ ...prev, size: atlasData.atlasSize, padding: atlasData.padding }));
    setInfo(`Loaded existing atlas with ${atlasData.placements.length} sprites. Add new images to extend it.`);
    clearErrors();
  };

  const handleModeToggle = () => {
    const newMode = mode === 'create' ? 'edit' : 'create';
    setMode(newMode);
    setImages([]);
    setAtlases([]);
    setExistingAtlas(null);
    setSelectedPlacement(null);
    clearErrors();
    setInfo('');
    // Reset left tab to images when switching modes
    setLeftTab('images');
  };

  const handleSelectAtlasIndex = (idx) => {
    setActiveAtlasIndex(idx);
    setSelectedPlacement(null);
  };

  const handleSelectPlacement = (placement, atlasIndex, key) => {
    const targetAtlas = atlases[atlasIndex];
    if (!targetAtlas) return;
    setActiveAtlasIndex(atlasIndex);
    setSelectedPlacement({ ...placement, size: targetAtlas.size, key });
  };

  const handleDeletePlacement = (placement, atlasIndex, placementIndex) => {
    setSelectedPlacement(null);
    
    // If we are deleting the image currently being replaced, clear the replace target
    if (replaceTarget && replaceTarget.placement.x === placement.x && replaceTarget.placement.y === placement.y) {
      setReplaceTarget(null);
    }

    // If the placement is a newly added image (true for both create and edit modes), remove from images and repack
    // Note: Replaced sprites in edit mode also have placement.img, but they are part of existingAtlas.placements
    const isNewImage = placement.img && !existingAtlas?.placements.some(p => p.x === placement.x && p.y === placement.y);

    if (isNewImage) {
      setImages((prev) => {
        const filtered = prev.filter((img) => !(img.name === placement.name && img.width === placement.width && img.height === placement.height));
        try {
          const packed = packImages(filtered, settings.size, settings.padding, 4096, 0, mode === 'edit' ? existingAtlas : null);
          renderAllAtlases(packed);
          setAtlases(packed);
          setActiveAtlasIndex(0);
        } catch (err) {
          console.error('Repack after removing image failed', err);
        }
        return filtered;
      });
      return;
    }

    // Non-new placements (existing or replaced) can only be removed in edit mode against an existing atlas
    if (mode !== 'edit' || !existingAtlas) return;
    setExistingAtlas((prev) => {
      if (!prev) return prev;
      const updatedPlacements = prev.placements.filter((_, i) => i !== placementIndex);
      const removedRegions = [...(prev.removedRegions || []), { x: placement.x, y: placement.y, width: placement.width, height: placement.height }];
      const updated = { ...prev, placements: updatedPlacements, removedRegions };
      try {
        const packed = packImages(images, settings.size, settings.padding, 4096, 0, updated);
        renderAllAtlases(packed);
        setAtlases(packed);
        setActiveAtlasIndex(0);
      } catch (err) {
        console.error('Repack after deletion failed', err);
      }
      return updated;
    });
  };

  const handleReplacePlacement = (placement, atlasIndex, key) => {
    if (mode !== 'edit' || !existingAtlas) return;
    setReplaceTarget({ placement, atlasIndex, key });
    setReplacePreserveAspect(true);
    setIsReplaceDragging(false);
    setLeftTab('images');
  };

  const cancelReplace = () => {
    setReplaceTarget(null);
    setIsReplaceDragging(false);
  };

  const applyReplacementFile = async (file) => {
    if (!replaceTarget || !file) return;

    const { placement } = replaceTarget;

    try {
      const img = new Image();
      const reader = new FileReader();

      reader.onload = (ev) => {
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = placement.width;
          canvas.height = placement.height;
          const ctx = canvas.getContext('2d');
          ctx.imageSmoothingEnabled = true;
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          if (replacePreserveAspect) {
            const scaleDownOnly = Math.min(
              1,
              placement.width / img.naturalWidth,
              placement.height / img.naturalHeight
            );
            const drawW = Math.round(img.naturalWidth * scaleDownOnly);
            const drawH = Math.round(img.naturalHeight * scaleDownOnly);
            const dx = Math.round((placement.width - drawW) / 2);
            const dy = Math.round((placement.height - drawH) / 2);
            ctx.drawImage(img, dx, dy, drawW, drawH);
          } else {
            ctx.drawImage(img, 0, 0, placement.width, placement.height);
          }

          const newName = file.name.replace(/\.[^/.]+$/, '');

          setExistingAtlas((prev) => {
            if (!prev) return prev;

            const updatedPlacements = prev.placements.map((p) => {
              if (p.x === placement.x && p.y === placement.y && p.width === placement.width && p.height === placement.height) {
                return {
                  ...p,
                  name: newName,
                  img: canvas,
                };
              }
              return p;
            });

            const region = { x: placement.x, y: placement.y, width: placement.width, height: placement.height };
            const removedRegions = prev.removedRegions || [];
            const alreadyRemoved = removedRegions.some(
              (r) => r.x === region.x && r.y === region.y && r.width === region.width && r.height === region.height
            );

            return {
              ...prev,
              placements: updatedPlacements,
              removedRegions: alreadyRemoved ? removedRegions : [...removedRegions, region],
            };
          });

          setInfo(`✓ Replaced image with ${file.name}`);
          setTimeout(() => setInfo(''), 3000);
          cancelReplace();
        };
        img.src = ev.target.result;
      };

      reader.readAsDataURL(file);
    } catch (err) {
      addError(`Failed to load replacement image: ${err.message}`);
    }
  };

  const handlePack = () => {
    if (mode === 'edit' && !existingAtlas) {
      addError('Please load an existing atlas first.');
      return;
    }
    if (images.length === 0 && mode === 'create') {
      addError('Please upload images first.');
      return;
    }

    clearErrors();
    setSelectedPlacement(null);

    try {
      const packed = packImages(images, settings.size, settings.padding, 4096, 0, mode === 'edit' ? existingAtlas : null);
      renderAllAtlases(packed);
      setAtlases(packed);
      setActiveAtlasIndex(0);
    } catch (err) {
      console.error('Packing error:', err);
      addError(err.message);
      setAtlases([]);
    }
  };

  // Dynamic trim effect - apply/remove trim when toggle changes
  useEffect(() => {
    if (images.length === 0) {
      setPrevTrim(settings.trim);
      return;
    }
    
    if (settings.trim !== prevTrim) {
      const applyTrimChanges = async () => {
        try {
          let updatedImages;
          if (settings.trim) {
            // Apply trim to all images
            updatedImages = await Promise.all(images.map(applyTrimToImage));
            const trimmedCount = updatedImages.filter(img => img.trimData?.trimmed).length;
            if (trimmedCount > 0) {
              setInfo(`✂️ Trimmed ${trimmedCount} image${trimmedCount > 1 ? 's' : ''}`);
              setTimeout(() => setInfo(''), 3000);
            }
          } else {
            // Remove trim from all images
            updatedImages = images.map(removeTrimFromImage);
            setInfo('Trim removed - images restored to original size');
            setTimeout(() => setInfo(''), 3000);
          }
          
          // Check for oversized images after trim change
          const rejected = updatedImages.filter(
            (it) => it.width + settings.padding > settings.size || it.height + settings.padding > settings.size
          );
          if (rejected.length) {
            rejected.forEach((r) => {
              addError(`Image "${r.name}" (${r.width}x${r.height}) is now larger than atlas ${settings.size}×${settings.size}`);
            });
            // Filter out oversized images
            updatedImages = updatedImages.filter(
              (it) => it.width + settings.padding <= settings.size && it.height + settings.padding <= settings.size
            );
          }
          
          setImages(updatedImages);
        } catch (err) {
          console.error('Error applying trim changes:', err);
          addError('Failed to apply trim changes');
        }
      };
      
      applyTrimChanges();
      setPrevTrim(settings.trim);
    }
  }, [settings.trim]);

  // Auto-pack on images or settings change (debounced)
  const packTimer = useRef(null);
  const { size, padding, trim } = settings;
  useEffect(() => {
    if (packTimer.current) clearTimeout(packTimer.current);
    packTimer.current = setTimeout(() => {
      if (mode === 'edit' && !existingAtlas) {
        return; // Wait for atlas to be loaded
      }
      if (images.length === 0 && mode === 'create') {
        setAtlases([]);
        setActiveAtlasIndex(0);
        clearErrors();
        setSelectedPlacement(null);
        return;
      }
      if (images.length === 0 && mode === 'edit' && existingAtlas) {
        // In edit mode with no new images, just show the existing atlas
        try {
          const packed = packImages([], size, padding, 4096, 0, existingAtlas);
          renderAllAtlases(packed);
          setAtlases(packed);
          setActiveAtlasIndex(0);
          setSelectedPlacement(null);
        } catch (err) {
          console.error('Packing error:', err);
        }
        return;
      }
      try {
        const packed = packImages(images, size, padding, 4096, 0, mode === 'edit' ? existingAtlas : null);
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
        setSelectedPlacement(null);
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
        // Don't clear errors here - let them persist
      } catch (err) {
        console.error('Packing error:', err);
        addError(err.message);
        setAtlases([]);
      }
    }, 200);
    return () => clearTimeout(packTimer.current);
  }, [images, size, padding, trim, mode, existingAtlas]);

  const activeAtlas = atlases[activeAtlasIndex];

  return (
    <div className="app">
      <header className="app-header">
        <h1>Nutty Atlas Creator</h1>
        <div className="mode-toggle-container">
          <button
            className={`mode-option ${mode === 'create' ? 'active' : ''}`}
            onClick={() => mode !== 'create' && handleModeToggle()}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            <span>Create New</span>
          </button>
          <button
            className={`mode-option ${mode === 'edit' ? 'active' : ''}`}
            onClick={() => mode !== 'edit' && handleModeToggle()}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            <span>Edit Existing</span>
          </button>
          <div className={`mode-slider ${mode === 'edit' ? 'right' : ''}`}></div>
        </div>
      </header>

      <main className={`app-main ${activeAtlas ? 'has-atlas-panel' : ''}`}>
        <aside className="sidebar">
          <div className="left-tabs">
            <button
              className={`left-tab ${leftTab === 'images' ? 'active' : ''}`}
              onClick={() => setLeftTab('images')}
            >
              Images
            </button>
            <button
              className={`left-tab ${leftTab === 'settings' ? 'active' : ''}`}
              onClick={() => setLeftTab('settings')}
            >
              Settings
            </button>
            <button
              className={`left-tab ${leftTab === 'export' ? 'active' : ''}`}
              onClick={() => setLeftTab('export')}
            >
              Export
            </button>
            {/* Load is merged into Images tab in edit mode */}
          </div>
          {leftTab === 'load' && mode === 'edit' && (
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

          {leftTab === 'images' && (
            <>
              <section className="card">
                <h2>Images</h2>
                {mode === 'edit' && (
                  <div style={{ marginBottom: '0.75rem' }}>
                    <h4 style={{ marginBottom: '0.5rem' }}>Load Existing Atlas</h4>
                    <AtlasUploader onAtlasLoad={handleAtlasLoad} />
                    {existingAtlas && (
                      <div className="existing-atlas-info" style={{ marginTop: '0.5rem', padding: '0.4rem', background: '#f0f0f0', borderRadius: '4px', color: '#000' }}>
                        <strong>Loaded:</strong> {existingAtlas.placements.length} sprites, {existingAtlas.atlasSize}×{existingAtlas.atlasSize}
                      </div>
                    )}
                  </div>
                )}

                <ImageUploader onAddImages={handleAddImages} enableTrim={settings.trim} />
                <ImageList images={images} onRemoveImage={handleRemoveImage} />
              </section>

              {mode === 'edit' && replaceTarget && (
                <section className="card" style={{ marginTop: '0.75rem' }}>
                  <h2>Replace Image</h2>
                  <div className="target-capsule">
                    <span className="target-capsule-label">Target:</span>
                    <span className="target-capsule-name">{replaceTarget.placement.name}</span>
                    <span style={{ marginLeft: '0.5rem', opacity: 0.7, fontSize: '0.75rem' }}>
                      ({replaceTarget.placement.width}×{replaceTarget.placement.height})
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Preserve Aspect</span>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={replacePreserveAspect}
                        onChange={(e) => setReplacePreserveAspect(e.target.checked)}
                      />
                      <span className="slider"></span>
                    </label>
                  </div>

                  <input
                    ref={replaceFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => applyReplacementFile(e.target.files?.[0])}
                    style={{ display: 'none' }}
                  />

                  <div
                    className={`drop-zone ${isReplaceDragging ? 'dragging' : ''}`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsReplaceDragging(true);
                    }}
                    onDragLeave={() => setIsReplaceDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsReplaceDragging(false);
                      applyReplacementFile(e.dataTransfer.files?.[0]);
                    }}
                    onClick={() => replaceFileInputRef.current?.click()}
                    style={{ padding: '1.25rem' }}
                  >
                    <div className="drop-zone-content">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ opacity: 0.5, marginBottom: '0.25rem' }}>
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                      <p className="drop-zone-text" style={{ fontSize: '0.8rem' }}>
                        {isReplaceDragging ? 'Drop image' : 'Drag & drop or click'}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.75rem' }}>
                    <button type="button" className="zoom-btn" style={{ fontSize: '0.8rem', padding: '0.3rem 0.8rem' }} onClick={cancelReplace}>
                      Cancel
                    </button>
                  </div>
                </section>
              )}
            </>
          )}

          {leftTab === 'settings' && (
            <section className="card">
              <h2>Settings</h2>
              <AtlasSettings
                settings={settings}
                onSettingsChange={setSettings}
                disabled={mode === 'edit' && !existingAtlas}
              />
              {mode === 'edit' && existingAtlas && (
                <div className="info-message" style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
                  Note: Settings loaded from existing atlas. New sprites will use these settings.
                </div>
              )}
            </section>
          )}

          {leftTab === 'export' && (
            <section className="card">
              <h2>Export</h2>
              <ExportPanel atlases={atlases} disabled={atlases.length === 0} existingAtlas={existingAtlas} />
            </section>
          )}
        </aside>

        <section className="preview-section">
          <div className="card preview-card">
            <div className="preview-header">
              <h2>Preview</h2>
                <div className="preview-right">
                  {activeAtlas ? (
                    <div className="preview-meta">
                      <span className="preview-info">
                        Atlas {activeAtlasIndex + 1} / {atlases.length} — {activeAtlas.size}×{activeAtlas.size}
                      </span>
                      <span className="preview-divider">|</span>
                      <span className="preview-subinfo">Padding: {settings.padding}px</span>
                    </div>
                  ) : (
                    <div className="preview-meta">
                      <span className="preview-info">Canvas: {settings.size}×{settings.size}</span>
                      <span className="preview-divider">|</span>
                      <span className="preview-subinfo">Padding: {settings.padding}px</span>
                    </div>
                  )}
                  <AtlasPager
                    atlases={atlases}
                    activeIndex={activeAtlasIndex}
                    onSelectAtlas={handleSelectAtlasIndex}
                  />
                </div>
              {/* Static preview area — scale controls removed */}
            </div>

            {errors.length > 0 && (
              <div className="error-messages-container">
                <div className="error-messages-header">
                  <span>⚠️ Errors ({errors.length})</span>
                  <button className="clear-errors-btn" onClick={clearErrors} title="Clear all errors">
                    ✕ Clear All
                  </button>
                </div>
                <div className="error-messages-list">
                  {errors.map((err, index) => (
                    <div key={index} className="error-message-item">
                      <span>{err}</span>
                      <button 
                        className="dismiss-error-btn" 
                        onClick={() => removeError(index)}
                        title="Dismiss"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {info && <div className="info-message">{info}</div>}

            {/* pager moved into header */}
            <PreviewCanvas
              atlas={activeAtlas}
              canvasSize={settings.size}
              selection={selectedPlacement && activeAtlas ? { ...selectedPlacement, size: activeAtlas.size } : null}
            />
            {/* JSON preview sits in the atlas panel on the right now */}
          </div>
        </section>

        {activeAtlas && (
          <aside className="atlas-panel">
            <div className="card">
              <AtlasPlacementList
                atlas={activeAtlas}
                atlasIndex={activeAtlasIndex}
                onSelect={handleSelectPlacement}
                onDelete={handleDeletePlacement}
                onReplace={handleReplacePlacement}
                selected={selectedPlacement}
                mode={mode}
              />
            </div>
            <div className="card">
              <JSONPreview atlas={activeAtlas} atlasIndex={activeAtlasIndex} />
            </div>
          </aside>
        )}
      </main>
    </div>
  );
}

export default App;
