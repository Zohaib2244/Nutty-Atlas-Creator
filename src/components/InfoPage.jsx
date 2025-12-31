import React from 'react';

export default function InfoPage() {
  return (
    <div className="info-page">
      <section className="card info-card">
        <header className="info-hero">
          <p className="info-kicker">Info</p>
          <h2 className="info-title">Nutty Atlas Creator</h2>
          <p className="info-subtitle">
            A focused tool for building sprite atlases fast—create new packs, extend existing atlases, and export game-ready PNG/JSON.
          </p>
        </header>

        <div className="info-sections">
          <section className="info-section" style={{ animationDelay: '40ms' }}>
            <h3>What This App Is For</h3>
            <ul className="info-bullets">
              <li>
                <strong>Artists:</strong> batch-pack sprites into consistent pages with predictable spacing.
              </li>
              <li>
                <strong>Developers:</strong> export JSON frame data alongside atlas PNGs.
              </li>
              <li>
                <strong>Teams:</strong> load an existing atlas and evolve it without starting over.
              </li>
            </ul>
          </section>

          <section className="info-section" style={{ animationDelay: '90ms' }}>
            <h3>Create New (Create Mode)</h3>
            <ol className="info-list">
              <li>
                <strong>Upload images:</strong> Add sprites from the Images tab. Oversized images are rejected.
              </li>
              <li>
                <strong>Set packing rules:</strong> Choose atlas size, padding, and optional Trim.
              </li>
              <li>
                <strong>Auto-pack:</strong> Repacking happens automatically when images or settings change.
              </li>
              <li>
                <strong>Preview:</strong> Pan/zoom the atlas and click sprites to inspect placements.
              </li>
              <li>
                <strong>Export:</strong> Download a ZIP with atlas PNGs and JSON metadata.
              </li>
            </ol>
          </section>

          <section className="info-section" style={{ animationDelay: '140ms' }}>
            <h3>Edit Existing (Edit Mode)</h3>
            <ol className="info-list">
              <li>
                <strong>Load your atlas:</strong> Select the atlas PNG and its matching JSON, then click Load Atlas.
              </li>
              <li>
                <strong>Add sprites:</strong> Upload additional images to extend the atlas (or create extra pages if needed).
              </li>
              <li>
                <strong>Delete or replace:</strong> Remove sprites or swap a sprite’s content while keeping its region.
              </li>
              <li>
                <strong>Export changes:</strong> Export a ZIP or replace the original PNG/JSON.
              </li>
            </ol>
          </section>

          <section className="info-section" style={{ animationDelay: '190ms' }}>
            <h3>Key Features</h3>
            <div className="info-grid">
              <div className="info-tile">
                <h4>Multiple Pages</h4>
                <p>When sprites don’t fit, extra atlas pages are generated. Use the atlas pager to switch pages.</p>
              </div>
              <div className="info-tile">
                <h4>Trim (Optional)</h4>
                <p>Remove transparent padding from sprites to pack tighter. Toggle Trim in Settings.</p>
              </div>
              <div className="info-tile">
                <h4>Inspect & Iterate</h4>
                <p>Click sprites in the preview or use the placement list to inspect positions and sizes.</p>
              </div>
              <div className="info-tile">
                <h4>Export</h4>
                <p>Export PNG/JSON for each page plus a manifest, all in one ZIP.</p>
              </div>
            </div>
          </section>

          <section className="info-section" style={{ animationDelay: '240ms' }}>
            <h3>Common Use Cases</h3>
            <ul className="info-bullets">
              <li>
                <strong>Build a new sprite sheet:</strong> Combine individual PNGs into a consistent atlas with frame metadata.
              </li>
              <li>
                <strong>Grow an existing atlas:</strong> Load your atlas and add new assets without starting over.
              </li>
              <li>
                <strong>Swap a sprite quickly:</strong> Replace a sprite’s image while keeping its region.
              </li>
              <li>
                <strong>Adjust density:</strong> Tune padding and Trim to balance quality vs. packing tightness.
              </li>
            </ul>
          </section>

          <section className="info-section" style={{ animationDelay: '290ms' }}>
            <h3>Export Naming</h3>
            <ul className="info-bullets">
              <li>
                <strong>Create Mode:</strong> Defaults to a generic name unless you type one.
              </li>
              <li>
                <strong>Edit Mode:</strong> Uses the uploaded PNG/JSON filename as the base name.
              </li>
            </ul>
          </section>

          <section className="info-section" style={{ animationDelay: '340ms' }}>
            <h3>Replace Files (Edit Mode)</h3>
            <ul className="info-bullets">
              <li>
                <strong>Replace Files:</strong> Pick the folder containing your original PNG/JSON and the tool overwrites them.
              </li>
              <li>
                <strong>Browser note:</strong> Direct overwriting requires a Chromium-based browser with the File System Access API.
              </li>
            </ul>
          </section>
        </div>
      </section>
    </div>
  );
}
