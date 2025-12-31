import React from 'react';

export default function InfoPage() {
  return (
    <div className="info-page">
      <section className="card info-card">
        <h2>How to Use Nutty Atlas Creator</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.75rem' }}>
          Create new sprite atlases, or load and edit existing atlases (PNG + JSON), then export everything as a ZIP.
        </p>

        <h3>Create New (Create Mode)</h3>
        <ol className="info-list">
          <li>
            <strong>Upload Images:</strong> Use the Images tab to add sprites. Oversized images (larger than the selected atlas size) are rejected.
          </li>
          <li>
            <strong>Choose Settings:</strong> In Settings, pick atlas size, padding, and optional Trim.
          </li>
          <li>
            <strong>Auto-Pack:</strong> Packing happens automatically when images/settings change. Multiple atlases are created when needed.
          </li>
          <li>
            <strong>Preview & Inspect:</strong> Use the preview to pan/zoom and click sprites to inspect placements.
          </li>
          <li>
            <strong>Export:</strong> Go to Export to download a ZIP containing all atlas PNGs and JSON metadata.
          </li>
        </ol>

        <h3>Edit Existing (Edit Mode)</h3>
        <ol className="info-list">
          <li>
            <strong>Load Existing Atlas:</strong> Drop/select the atlas PNG and its JSON, then click Load Atlas.
          </li>
          <li>
            <strong>Add New Sprites:</strong> Upload additional images to extend the atlas; they will be packed into available space or new pages.
          </li>
          <li>
            <strong>Delete Sprites:</strong> Use the placement list to remove sprites from the existing atlas.
          </li>
          <li>
            <strong>Replace Sprites:</strong> Choose Replace on a sprite to swap its content while keeping its placement region.
          </li>
          <li>
            <strong>Export Updated Atlases:</strong> Export produces updated PNGs/JSON and a manifest in a single ZIP.
          </li>
        </ol>

        <h3>Key Features</h3>
        <ul className="info-bullets">
          <li>
            <strong>Multiple Pages:</strong> When sprites don’t fit in one atlas, extra atlas pages are generated. Use the atlas pager to switch pages.
          </li>
          <li>
            <strong>Trim (Optional):</strong> Removes transparent padding from sprites so they pack tighter. Toggle in Settings.
          </li>
          <li>
            <strong>Selection & Inspection:</strong> Click a sprite in the preview or use the placement list to inspect where it sits on the atlas.
          </li>
          <li>
            <strong>Export ZIP:</strong> Includes per-atlas PNG + JSON and a pack manifest file.
          </li>
        </ul>

        <h3>Common Use Cases</h3>
        <ul className="info-bullets">
          <li>
            <strong>Build a new sprite sheet:</strong> Combine individual PNGs into a game-ready atlas with JSON frame data.
          </li>
          <li>
            <strong>Grow an existing atlas:</strong> Load your atlas and add new assets without starting over.
          </li>
          <li>
            <strong>Hot-swap a sprite:</strong> Replace a single sprite’s image while keeping its region size/position.
          </li>
          <li>
            <strong>Re-pack with different spacing:</strong> Adjust padding (and optional trim) to change packing density.
          </li>
        </ul>

        <h3>Export Naming</h3>
        <ul className="info-bullets">
          <li>
            <strong>Create Mode:</strong> Defaults to a generic name unless you type one.
          </li>
          <li>
            <strong>Edit Mode:</strong> The default export name comes from the uploaded PNG/JSON filename.
          </li>
        </ul>

        <h3>Replace Files (Edit Mode)</h3>
        <ul className="info-bullets">
          <li>
            <strong>Replace Files:</strong> Prompts you to pick the folder containing your original PNG/JSON and overwrites them with updated versions.
          </li>
          <li>
            <strong>Note:</strong> Direct overwriting requires a Chromium-based browser that supports the File System Access API; otherwise the app will download the updated files instead.
          </li>
        </ul>
      </section>
    </div>
  );
}
