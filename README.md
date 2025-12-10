# Nutty Atlas Creator

A React-based web tool to build sprite atlases from uploaded images. Images are packed into one or more square, power-of-two atlases with configurable padding, and exported together with JSON metadata.

## Features

- **Drag & drop** image upload (or click to browse)
- Upload any number of image files (PNG, JPG, etc.)
- Choose square atlas size from 128×128 up to 4096×4096
- Specify padding between sprites in pixels
- Automatically creates multiple atlases when images don't fit into a single sheet
- Preview each atlas with pager controls
- Live JSON metadata preview
- Auto-pack: the app automatically packs and previews the atlases when images are added, removed, or when atlas settings change (no need to click "Pack & Preview").
  - If an image requires a larger atlas, the app will create a dedicated atlas only if the "Allow dedicated atlas" checkbox is enabled in the Atlas Settings; otherwise you will get a packing error and the image will not be appended to the list. The generated atlas JSON may include a `note` property explaining a dedicated or fallback placement.
- Export all atlases and their JSON descriptors as a single ZIP pack
- Clean, modern UI built with React and custom CSS (no Bootstrap)

## Project Structure

```
src/
├── components/          # React components
│   ├── ImageUploader.jsx    # Drag-and-drop file upload
│   ├── ImageList.jsx         # Display loaded images
│   ├── AtlasSettings.jsx     # Size and padding controls
│   ├── PreviewCanvas.jsx     # Canvas display for atlas
│   ├── AtlasPager.jsx        # Atlas navigation buttons
│   ├── JSONPreview.jsx       # JSON metadata display
│   └── ExportPanel.jsx       # Export controls
├── utils/               # Business logic modules
│   ├── imageLoader.js        # Load images from files
│   ├── atlasPacker.js        # Binary tree packing algorithm
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
3. **Pack & Preview**: Click the button to pack images into atlases
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
