# Nutty Atlas Creator

A React-based web tool to build sprite atlases from uploaded images. Images are packed into one or more square, power-of-two atlases with configurable padding, and exported together with JSON metadata.

## Features

- **Drag & drop** image upload (or click to browse)
- Upload any number of image files (PNG, JPG, etc.)
- Choose square atlas size from 128×128 up to 4096×4096
- Specify padding between sprites in pixels
- **Trim Mode**: Automatically remove transparent padding from sprites for tighter packing
  - Preserves original dimensions and sprite source bounds in JSON metadata
  - Toggle on/off per project
- **Edit Atlas Mode**: Load existing atlas + JSON to add new sprites
  - Packs new sprites into remaining free space
  - Merges old and new sprites in exported JSON
- Automatically creates multiple atlases when images don't fit into a single sheet
- Preview each atlas with pager controls
- Live JSON metadata preview
- Auto-pack: the app automatically packs and previews the atlases when images are added, removed, or when atlas settings change
  - If an image is larger than the selected atlas size, the image will be rejected and you will see an error. Pick a larger atlas size from the drop-down if you need more space.
- Export all atlases and their JSON descriptors as a single ZIP pack
- Clean, modern UI with animated mode toggle and smooth transitions

## Project Structure

```
src/
├── components/          # React components
│   ├── ImageUploader.jsx    # Drag-and-drop file upload
│   ├── ImageList.jsx         # Display loaded images
│   ├── AtlasSettings.jsx     # Size, padding, and trim controls
│   ├── AtlasUploader.jsx     # Load existing atlas for editing
│   ├── PreviewCanvas.jsx     # Canvas display for atlas
│   ├── AtlasPager.jsx        # Atlas navigation buttons
│   ├── JSONPreview.jsx       # JSON metadata display
│   └── ExportPanel.jsx       # Export controls
├── utils/               # Business logic modules
│   ├── imageLoader.js        # Load images from files
│   ├── imageTrimmer.js       # Trim transparent pixels
│   ├── atlasPacker.js        # MaxRects packing algorithm
│   ├── atlasRenderer.js      # Render atlases to canvas
│   └── exporter.js           # ZIP generation and download
├── styles/
│   └── index.css            # All styles (dark theme)
├── App.jsx                  # Main app component
└── main.jsx                 # React entry point
```

## Prerequisites

- **Node.js** (v18 or later) and npm

If Node.js is not installed:

**macOS (Homebrew):**
```bash
brew install node
```


## Building a macOS app (DMG)

You can package the app as a macOS DMG using Electron and electron-builder. This creates a distributable DMG file you can send to non-technical peers.

1. Install dependencies (Electron and electron-builder are required):

```bash
npm install
```

1. Build the renderer and package app:

```bash
npm run build   # produce production build into dist/
npm run build:app   # run electron-builder to create macOS DMG
```

1. The DMG output will be under `dist/` (or `dist/mac` depending on electron-builder), and you'll find `Nutty Atlas Creator.dmg`.

Notes:

1. If you want to test the Electron app locally during development, run the dev server and then start Electron:

```bash
npm run dev
npm run electron:dev
```

1. Code signing is required for notarization on macOS; if you don't have a developer ID, you'll still be able to build a DMG, but macOS will show warnings when users run it.

1. Add an icon at `assets/icon.icns` if you'd like a custom app icon.



**macOS (official installer):**
Download from [nodejs.org](https://nodejs.org/)

**Windows:**
Download from [nodejs.org](https://nodejs.org/) or use `winget install OpenJS.NodeJS`

**Linux:**
```bash
# Ubuntu/Debian
sudo apt install nodejs npm

# Fedora
sudo dnf install nodejs npm
```

## Installation

```bash
cd "Nutty Atlas Creator"
npm install
```

## Running the Dev Server

```bash
npm run dev
```

Then open `http://localhost:3000` in your browser.

## Building for Production

```bash
npm run build
```

The production build will be in the `dist/` folder. You can serve it with any static file server.

## How to Use

1. **Upload Images**: Drag and drop images onto the upload zone, or click to browse
2. **Configure Settings**: Select atlas size (128–4096) and padding in pixels
3. **Pack & Preview**: Click the button to pack images into atlases (or the app will auto-pack when you add/remove images or change settings).
   - If images don't fit in one atlas, multiple atlases are created automatically
   - Use the pager buttons to switch between atlases
   - View JSON metadata for the current atlas
4. **Export**: Click "Export ZIP" to download:
   - `atlas_1.png`, `atlas_1.json`
   - `atlas_2.png`, `atlas_2.json` (if multiple atlases)
   - `pack_manifest.json` (overall metadata)

## Output Format

For each atlas `atlas_N.png`, there is a matching `atlas_N.json`:

```json
{
  "atlasIndex": 0,
  "size": 1024,
  "padding": 2,
  "sprites": [
    {
      "name": "button.png",
      "x": 2,
      "y": 2,
      "width": 64,
      "height": 64
    }
  ]
}
```

Additionally, `pack_manifest.json` lists all atlases:

```json
{
  "atlases": [
    {
      "name": "atlas_1",
      "atlasIndex": 0,
      "size": 1024,
      "padding": 2,
      "sprites": [...]
    }
  ]
}
```

## Notes

- All processing happens client-side; images are never uploaded to a server
- If an image (plus padding) is larger than the selected atlas size, packing will fail with an error
- The binary tree packing algorithm sorts images by max dimension for optimal space usage
- Atlas sizes are restricted to powers of 2 for better GPU compatibility

## Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **JSZip** - Client-side ZIP generation
- **Canvas API** - Atlas rendering
