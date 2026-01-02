import { packImages } from '../src/utils/atlasPacker.js';

// Construct an existing atlas with two frames that are exact duplicates
const existingAtlas = {
  atlasSize: 512,
  padding: 10,
  placements: [
    { name: 'spriteA', x: 0, y: 0, width: 100, height: 100, img: null },
    { name: 'spriteB', x: 0, y: 0, width: 100, height: 100, img: null }, // duplicate region
  ],
  img: null,
  removedRegions: [],
};

try {
  const res = packImages([], existingAtlas.atlasSize, existingAtlas.padding, 4096, 0, existingAtlas);
  if (!res || res.length === 0) throw new Error('No atlases returned');
  const notes = res.map(a => a.note).filter(Boolean);
  if (!notes.length) throw new Error('Expected duplicate note but none found');
  console.log('Test passed — duplicates accepted with note:\n', notes.join('\n'));
  process.exit(0);
} catch (e) {
  console.error('Test failed:', e.message);
  process.exit(1);
}
