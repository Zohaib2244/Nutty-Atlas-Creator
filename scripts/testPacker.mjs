import { packImages } from '../src/utils/atlasPacker.js';

function makeMock(name, w, h) {
  return { name, width: w, height: h, img: null };
}

function test(atlasSize, padding) {
  const images = [makeMock('img1', 50, 50), makeMock('img2', 50, 50), makeMock('img3', 120, 120)];
  const atlases = packImages(images, atlasSize, padding, 4096, false);
  console.log('Atlas count:', atlases.length);
  atlases.forEach((a, idx) => {
    console.log(`Atlas ${idx} size=${a.size} placements=${a.placements.length}`);
    a.placements.forEach((p) => console.log('  ', p.name, p.x, p.y, p.width, p.height));
  });
}

console.log('Test with atlas 1024 padding 2');
try { test(1024, 2); } catch (e) { console.error(e.message); }

console.log('\nTest with atlas 128 padding 2');
try { test(128, 2); } catch (e) { console.error(e.message); }

console.log('\nTest with atlas 64 padding 2');
try { test(64, 2); } catch (e) { console.error(e.message); }
