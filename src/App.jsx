import React, { useState, useEffect, useRef, useCallback } from 'react';
import ImageUploader from './components/ImageUploader';
import ImageList from './components/ImageList';
import AtlasSettings from './components/AtlasSettings';
import PreviewCanvas from './components/PreviewCanvas';
import AtlasPager from './components/AtlasPager';
import JSONPreview from './components/JSONPreview';
import ExportPanel from './components/ExportPanel';
import AtlasUploader from './components/AtlasUploader';
import AtlasPlacementList from './components/AtlasPlacementList';
import InfoPage from './components/InfoPage';
import { packImages } from './utils/atlasPacker';
import { renderAllAtlases } from './utils/atlasRenderer';
import { applyTrimToImage, removeTrimFromImage } from './utils/imageLoader';

function App() {
  const [mode, setMode] = useState('create'); // 'create' or 'edit'
  const [images, setImages] = useState([]);
  const [settings, setSettings] = useState({ size: 2048, atlasWidth: 2048, atlasHeight: 2048, squareMode: true, padding: 20, trim: false, dynamicSizing: false });
  const [atlases, setAtlases] = useState([]);
  const [activeAtlasIndex, setActiveAtlasIndex] = useState(0);
  const [errors, setErrors] = useState([]); // Array of error messages for persistence
  const [info, setInfo] = useState('');
  const [lastAddedNames, setLastAddedNames] = useState([]);
  const [existingAtlas, setExistingAtlas] = useState(null);
  const [selectedPlacement, setSelectedPlacement] = useState(null);
  const [leftTab, setLeftTab] = useState('images'); // images | settings | export
  const [prevTrim, setPrevTrim] = useState(false); // Track previous trim state
  const [showInfo, setShowInfo] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);

  // Undo/redo history — each entry is a shallow snapshot of { images, existingAtlas }
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

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

  // Undo/redo helpers
  const pushSnapshot = useCallback(() => {
    setUndoStack((prev) => [...prev.slice(-29), { images, existingAtlas }]);
    setRedoStack([]);
  }, [images, existingAtlas]);

  const handleUndo = useCallback(() => {
    setUndoStack((prev) => {
      if (prev.length === 0) return prev;
      const snapshot = prev[prev.length - 1];
      setRedoStack((r) => [{ images, existingAtlas }, ...r.slice(0, 29)]);
      setImages(snapshot.images);
      setExistingAtlas(snapshot.existingAtlas);
      return prev.slice(0, -1);
    });
  }, [images, existingAtlas]);

  const handleRedo = useCallback(() => {
    setRedoStack((prev) => {
      if (prev.length === 0) return prev;
      const snapshot = prev[0];
      setUndoStack((u) => [...u.slice(-29), { images, existingAtlas }]);
      setImages(snapshot.images);
      setExistingAtlas(snapshot.existingAtlas);
      return prev.slice(1);
    });
  }, [images, existingAtlas]);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const onKeyDown = (e) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      if (e.key === 'z' && !e.shiftKey) { e.preventDefault(); handleUndo(); }
      else if ((e.key === 'z' && e.shiftKey) || e.key === 'y') { e.preventDefault(); handleRedo(); }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleUndo, handleRedo]);

  const handleAddImages = (loadedImages) => {
    pushSnapshot();
    clearErrors();
    setInfo('');

    const MAX_ATLAS_SIZE = 4096;
    const { padding, size, dynamicSizing: dynSizing, trim } = settings;

    // Duplicate detection against current images (safe: triggered by user interaction only)
    const existingNames = new Set(images.map((it) => it.name));
    const skipped = loadedImages.filter((it) => existingNames.has(it.name));
    const fresh = loadedImages.filter((it) => !existingNames.has(it.name));

    if (skipped.length > 0) {
      skipped.forEach((s) => addError(`"${s.name}" already exists — skipped`));
    }

    // Size check
    const sizeLimit = dynSizing ? MAX_ATLAS_SIZE : size;
    const oversized = fresh.filter(
      (it) => it.width + padding > sizeLimit || it.height + padding > sizeLimit
    );
    const accepted = fresh.filter(
      (it) => it.width + padding <= sizeLimit && it.height + padding <= sizeLimit
    );

    oversized.forEach((r) => {
      addError(`"${r.name}" (${r.width}×${r.height}) is larger than atlas ${sizeLimit}×${sizeLimit}`);
    });

    if (accepted.length > 0) {
      setLastAddedNames(accepted.map((it) => it.name));

      if (trim) {
        const trimmedCount = accepted.filter((img) => img.trimData?.trimmed).length;
        if (trimmedCount > 0) {
          setInfo(`✂️ Trimmed ${trimmedCount} image${trimmedCount > 1 ? 's' : ''} — removed transparent padding`);
          setTimeout(() => setInfo(''), 4000);
        }
      }
      if (dynSizing) {
        setInfo('Dynamic sizing enabled — atlas will grow up to 4096×4096 as needed');
        setTimeout(() => setInfo(''), 3000);
      }

      setImages((prev) => [...prev, ...accepted]);
    }
  };

  const handleRemoveImage = (index) => {
    pushSnapshot();
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Keep selectedImageIndex valid when images array changes
  useEffect(() => {
    if (selectedImageIndex != null && selectedImageIndex >= images.length) {
      setSelectedImageIndex(null);
    }
  }, [images, selectedImageIndex]);

  const handleAtlasLoad = (atlasData) => {
    pushSnapshot();
    setExistingAtlas({ ...atlasData, removedRegions: [] });
    setSettings((prev) => ({
      ...prev,
      size: atlasData.atlasSize,
      atlasWidth: atlasData.atlasWidth || atlasData.atlasSize,
      atlasHeight: atlasData.atlasHeight || atlasData.atlasSize,
      squareMode: (atlasData.atlasWidth || atlasData.atlasSize) === (atlasData.atlasHeight || atlasData.atlasSize),
      padding: atlasData.padding,
    }));
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
    setShowInfo(false);
  };

  const handleSelectAtlasIndex = (idx) => {
    setActiveAtlasIndex(idx);
    setSelectedPlacement(null);
  };

  const handleSelectPlacement = (placement, atlasIndex, key) => {
    const targetAtlas = atlases[atlasIndex];
    if (!targetAtlas) return;
    setActiveAtlasIndex(atlasIndex);
    setSelectedPlacement({ ...placement, size: targetAtlas.size, atlasWidth: targetAtlas.width || targetAtlas.size, atlasHeight: targetAtlas.height || targetAtlas.size, key });
  };

  const handleCanvasImageClick = (placement) => {
    // Always highlight in the placement list (right panel)
    const atlas = atlases[activeAtlasIndex];
    if (!atlas) return;
    const placementIdx = atlas.placements.findIndex(
      (p) => p.x === placement.x && p.y === placement.y && p.name === placement.name
    );
    if (placementIdx === -1) return;
    const key = `${placement.name}-${placement.x}-${placement.y}-${placement.width}-${placement.height}-${placementIdx}`;
    handleSelectPlacement(placement, activeAtlasIndex, key);
  };

  const handleDeletePlacement = (placement, atlasIndex, placementIndex) => {
    pushSnapshot();
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
          const packed = packImages(filtered, settings.atlasWidth || settings.size, settings.atlasHeight || settings.size, settings.padding, 4096, 0, mode === 'edit' ? existingAtlas : null, settings.dynamicSizing);
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
        const packed = packImages(images, settings.atlasWidth || settings.size, settings.atlasHeight || settings.size, settings.padding, 4096, 0, updated, settings.dynamicSizing);
        renderAllAtlases(packed);
        setAtlases(packed);
        setActiveAtlasIndex(0);
      } catch (err) {
        console.error('Repack after deletion failed', err);
      }
      return updated;
    });
  };

  const handleRenamePlacement = (placement, atlasIndex, newName) => {
    newName = newName.trim();
    if (!newName || newName === placement.name) return;

    // Reject if name is already used by another sprite in any atlas
    const taken = atlases.flatMap((a) => a.placements).some((p) => p.name === newName);
    if (taken) {
      addError(`Sprite name "${newName}" is already in use`);
      return;
    }

    pushSnapshot();

    // Update source: new sprites live in `images`; existing/replaced sprites live in existingAtlas
    const inImages = images.findIndex((img) => img.name === placement.name) !== -1;
    if (inImages) {
      setImages((prev) => prev.map((img) => img.name === placement.name ? { ...img, name: newName } : img));
    } else if (existingAtlas) {
      setExistingAtlas((prev) => ({
        ...prev,
        placements: prev.placements.map((p) =>
          p.x === placement.x && p.y === placement.y && p.name === placement.name
            ? { ...p, name: newName }
            : p,
        ),
      }));
    }
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
    pushSnapshot();

    const { placement } = replaceTarget;

    try {
      // Load the file as a data URL via a real promise chain
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (ev) => resolve(ev.target.result);
        reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
        reader.readAsDataURL(file);
      });

      const img = await new Promise((resolve, reject) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = () => reject(new Error(`Failed to decode image: ${file.name}`));
        el.src = dataUrl;
      });

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
            return { ...p, name: newName, img: canvas };
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
      const packed = packImages(images, settings.atlasWidth || settings.size, settings.atlasHeight || settings.size, settings.padding, 4096, 0, mode === 'edit' ? existingAtlas : null, settings.dynamicSizing);
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

    if (settings.trim === prevTrim) return;

    const currentImages = images;
    const { trim, padding, size, dynamicSizing: dynSizing } = settings;
    const MAX_ATLAS_SIZE = 4096;

    const applyTrimChanges = async () => {
      try {
        let updatedImages;
        if (trim) {
          updatedImages = await Promise.all(currentImages.map(applyTrimToImage));
          const trimmedCount = updatedImages.filter((img) => img.trimData?.trimmed).length;
          if (trimmedCount > 0) {
            setInfo(`✂️ Trimmed ${trimmedCount} image${trimmedCount > 1 ? 's' : ''}`);
            setTimeout(() => setInfo(''), 3000);
          }
        } else {
          updatedImages = currentImages.map(removeTrimFromImage);
          setInfo('Trim removed — images restored to original size');
          setTimeout(() => setInfo(''), 3000);
        }

        // Respect dynamicSizing when checking for oversized images
        const sizeLimit = dynSizing ? MAX_ATLAS_SIZE : size;
        const rejected = updatedImages.filter(
          (it) => it.width + padding > sizeLimit || it.height + padding > sizeLimit
        );
        if (rejected.length) {
          rejected.forEach((r) => {
            addError(`Image "${r.name}" (${r.width}x${r.height}) is now larger than atlas ${sizeLimit}×${sizeLimit}`);
          });
          updatedImages = updatedImages.filter(
            (it) => it.width + padding <= sizeLimit && it.height + padding <= sizeLimit
          );
        }

        setImages(updatedImages);
      } catch (err) {
        console.error('Error applying trim changes:', err);
        addError('Failed to apply trim changes');
      }
    };

    applyTrimChanges();
    setPrevTrim(trim);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.trim]);

  // Auto-pack on images or settings change (debounced)
  const packTimer = useRef(null);
  const { size, atlasWidth: sAW, atlasHeight: sAH, padding, trim, dynamicSizing } = settings;
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
          const packed = packImages([], sAW || size, sAH || size, padding, 4096, 0, existingAtlas, settings.dynamicSizing);
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
        const packed = packImages(images, sAW || size, sAH || size, padding, 4096, 0, mode === 'edit' ? existingAtlas : null, settings.dynamicSizing);
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
  }, [images, size, sAW, sAH, padding, trim, dynamicSizing, mode, existingAtlas]);

  const activeAtlas = atlases[activeAtlasIndex];

  return (
    <div className="app">
      <header className="app-header">
        <h1>Nutty Atlas Creator</h1>
        <div className="header-actions">
          <div className="mode-toggle-container">
            <button
              className={`mode-option ${mode === 'create' ? 'active' : ''}`}
              onClick={() => mode !== 'create' && handleModeToggle()}
              disabled={showInfo}
              title={showInfo ? 'Close Info to change mode' : undefined}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              <span>Create New</span>
            </button>
            <button
              className={`mode-option ${mode === 'edit' ? 'active' : ''}`}
              onClick={() => mode !== 'edit' && handleModeToggle()}
              disabled={showInfo}
              title={showInfo ? 'Close Info to change mode' : undefined}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              <span>Edit Existing</span>
            </button>
            <div className={`mode-slider ${mode === 'edit' ? 'right' : ''}`}></div>
          </div>

          <div className="undo-redo-group">
            <button
              className="zoom-btn"
              onClick={handleUndo}
              disabled={undoStack.length === 0}
              title="Undo (Ctrl+Z)"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/>
              </svg>
            </button>
            <button
              className="zoom-btn"
              onClick={handleRedo}
              disabled={redoStack.length === 0}
              title="Redo (Ctrl+Shift+Z)"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13"/>
              </svg>
            </button>
          </div>

          <button
            className={`btn ${showInfo ? 'btn-success' : 'btn-primary'}`}
            onClick={() => setShowInfo((v) => !v)}
            style={{ width: 'auto' }}
          >
            {showInfo ? 'Back to App' : 'Info'}
          </button>
        </div>
      </header>

      <main className={`app-main ${activeAtlas ? 'has-atlas-panel' : ''}`}>
        {showInfo ? (
          <InfoPage />
        ) : (
        <>
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
                <ImageList 
                  images={images} 
                  onRemoveImage={handleRemoveImage} 
                  selectedIndex={selectedImageIndex}
                  onSelectImage={setSelectedImageIndex}
                />
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
                  {activeAtlas ? (() => {
                    const atlasW = activeAtlas.width || activeAtlas.size;
                    const atlasH = activeAtlas.height || activeAtlas.size;
                    const usedArea = activeAtlas.placements.reduce((sum, p) => sum + p.width * p.height, 0);
                    const efficiency = Math.round((usedArea / (atlasW * atlasH)) * 100);
                    const effClass = efficiency >= 75 ? 'eff-good' : efficiency >= 45 ? 'eff-ok' : 'eff-low';
                    return (
                      <div className="preview-meta">
                        <span className="preview-info">
                          Atlas {activeAtlasIndex + 1} / {atlases.length} — {atlasW}×{atlasH}
                        </span>
                        <span className="preview-divider">|</span>
                        <span className="preview-subinfo">Padding: {settings.padding}px</span>
                        <span className="preview-divider">|</span>
                        <span className={`preview-efficiency ${effClass}`} title="Packed area ÷ total atlas area">
                          {efficiency}% packed
                        </span>
                      </div>
                    );
                  })() : (
                    <div className="preview-meta">
                      <span className="preview-info">Canvas: {settings.atlasWidth || settings.size}×{settings.atlasHeight || settings.size}</span>
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
              selection={selectedPlacement && activeAtlas ? { ...selectedPlacement, size: activeAtlas.size, atlasWidth: activeAtlas.width || activeAtlas.size, atlasHeight: activeAtlas.height || activeAtlas.size } : null}
              onImageClick={handleCanvasImageClick}
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
                onRename={handleRenamePlacement}
                selected={selectedPlacement}
                mode={mode}
              />
            </div>
            <div className="card">
              <JSONPreview atlas={activeAtlas} atlasIndex={activeAtlasIndex} />
            </div>
          </aside>
        )}
        </>
        )}
      </main>
    </div>
  );
}

export default App;
