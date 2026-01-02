import fs from 'fs';
import { packImages } from '../src/utils/atlasPacker.js';

const path = '/Users/zohaib2469/Documents/Zohaib_Files/Unity Projects/Shiny Ride - F_HYP_WAS1/Assets/_GameData/Art/Atlas/Retro Store Atlasses/AT_RS1/AT_RS1_Gameboy_2.json';
const jsonText = fs.readFileSync(path, 'utf8');
const json = JSON.parse(jsonText);
const placements = [];
for (const [name, data] of Object.entries(json.frames)) {
  placements.push({ name, x: data.frame.x, y: data.frame.y, width: data.frame.w, height: data.frame.h, img: null });
}
const existingAtlas = {
  placements,
  atlasSize: json.meta.size.w,
  padding: json.meta.padding || 0,
  img: null,
  removedRegions: [],
};

console.log('Loaded JSON:', Object.keys(json.frames).length, 'frames, atlasSize=', existingAtlas.atlasSize, 'padding=', existingAtlas.padding);

try {
  const res = packImages([], existingAtlas.atlasSize, existingAtlas.padding, 4096, 0, existingAtlas);
  console.log('packImages returned', res.length, 'atlas(es)');
  res.forEach((a, i) => console.log(`atlas[${i}] placements=${a.placements.length}`));
} catch (e) {
  console.error('packImages threw:', e.message);
  console.error(e.stack);
  // If the packer throws, run a manual overlap check to report offending pairs
  const { default: assert } = await import('assert').catch(() => ({}));
  // import a copy of packer source to use its helper functions? Not exported. We'll implement a local overlap check.
  function rectsIntersect(a, b) {
    return !(b.x >= a.x + a.width || b.x + b.width <= a.x || b.y >= a.y + a.height || b.y + b.height <= a.y);
  }
  const n = existingAtlas.padding || 0;
  for (let i = 0; i < existingAtlas.placements.length; i++) {
    for (let j = i + 1; j < existingAtlas.placements.length; j++) {
      const p1 = existingAtlas.placements[i];
      const p2 = existingAtlas.placements[j];
      const r1 = { x: p1.x, y: p1.y, width: p1.width + n, height: p1.height + n };
      const r2 = { x: p2.x, y: p2.y, width: p2.width + n, height: p2.height + n };
      if (rectsIntersect(r1, r2)) {
        console.log('Overlap detected between', p1.name, '@', p1.x, p1.y, p1.width, 'and', p2.name, '@', p2.x, p2.y, p2.width);
      }
    }
  }
}
