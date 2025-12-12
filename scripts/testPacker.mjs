import { packImages } from '../src/utils/atlasPacker.js';

function makeMock(name, w, h) {
  return { name, width: w, height: h, img: null };
}

function test(atlasSize, padding) {
  const images = [makeMock('img1', 50, 50), makeMock('img2', 50, 50), makeMock('img3', 120, 120)];
  const atlases = packImages(images, atlasSize, padding, 4096);
  console.log('Atlas count:', atlases.length);
  atlases.forEach((a, idx) => {
    console.log(`Atlas ${idx} size=${a.size} placements=${a.placements.length}`);
    a.placements.forEach((p) => console.log('  ', p.name, p.x, p.y, p.width, p.height));
  });
  // Validate no overlaps
  for (const a of atlases) {
    for (let i = 0; i < a.placements.length; i++) {
      for (let j = i + 1; j < a.placements.length; j++) {
        const p1 = a.placements[i];
        const p2 = a.placements[j];
        const overlap = !(p2.x >= p1.x + p1.width || p2.x + p2.width <= p1.x || p2.y >= p1.y + p1.height || p2.y + p2.height <= p1.y);
        if (overlap) console.error(`Overlap detected in atlas ${a.index} between ${p1.name} and ${p2.name}`);
      }
    }
  }
}

console.log('Test with atlas 1024 padding 2');
try { test(1024, 2); } catch (e) { console.error(e.message); }

console.log('\nTest with atlas 128 padding 2');
try { test(128, 2); } catch (e) { console.error(e.message); }

console.log('\nTest with atlas 64 padding 2');
try { test(64, 2); } catch (e) { console.error(e.message); }
console.log('\nCustom gap-fill test (128 atlas)');
try {
  // padding 0 so 128-high sprite fits exactly in a 128 atlas
  const images = [makeMock('A', 64, 128), makeMock('B', 64, 64), makeMock('C', 64, 64)];
  const atlases = packImages(images, 128, 0, 4096);
  console.log('Atlas count:', atlases.length);
  atlases.forEach((a, idx) => {
    console.log(`Atlas ${idx} size=${a.size} placements=${a.placements.length}`);
    a.placements.forEach((p) => console.log('  ', p.name, p.x, p.y, p.width, p.height));
  });
} catch (e) { console.error(e.message); }

console.log('\nChallenging deterministic test');
try {
  const images = [
    makeMock('L1', 300, 50),
    makeMock('L2', 50, 300),
    makeMock('S1', 150, 150),
    makeMock('S2', 80, 180),
    makeMock('S3', 180, 80),
    makeMock('T1', 100, 260),
    makeMock('T2', 260, 100),
    makeMock('X1', 60, 60),
    makeMock('X2', 60, 60),
    makeMock('X3', 60, 60),
    makeMock('X4', 60, 60),
    makeMock('X5', 60, 60),
  ];
  const atlases = packImages(images, 512, 2, 4096);
  console.log('Atlas count:', atlases.length);
  atlases.forEach((a, idx) => {
    console.log(`Atlas ${idx} size=${a.size} placements=${a.placements.length}`);
    a.placements.forEach((p) => console.log('  ', p.name, p.x, p.y, p.width, p.height));
  });
  for (const a of atlases) {
    for (let i = 0; i < a.placements.length; i++) {
      for (let j = i + 1; j < a.placements.length; j++) {
        const p1 = a.placements[i];
        const p2 = a.placements[j];
        const overlap = !(p2.x >= p1.x + p1.width || p2.x + p2.width <= p1.x || p2.y >= p1.y + p1.height || p2.y + p2.height <= p1.y);
        if (overlap) console.error(`Overlap detected in atlas ${a.index} between ${p1.name} and ${p2.name}`);
      }
    }
  }
} catch (e) { console.error(e.message); }

console.log('\n10 items test (1024 atlas)');
try {
  const images = [
    makeMock('item1', 200, 200),
    makeMock('item2', 150, 150),
    makeMock('item3', 100, 100),
    makeMock('item4', 180, 120),
    makeMock('item5', 120, 180),
    makeMock('item6', 90, 90),
    makeMock('item7', 110, 110),
    makeMock('item8', 80, 140),
    makeMock('item9', 140, 80),
    makeMock('item10', 95, 95),
  ];
  const atlases = packImages(images, 1024, 2, 4096);
  console.log('Atlas count:', atlases.length);
  atlases.forEach((a, idx) => {
    console.log(`Atlas ${idx} size=${a.size} placements=${a.placements.length}`);
    a.placements.forEach((p) => console.log('  ', p.name, `${p.x},${p.y}`, `${p.width}x${p.height}`));
  });
  const totalImageArea = images.reduce((sum, img) => sum + img.width * img.height, 0);
  const totalAtlasArea = atlases.length * 1024 * 1024;
  console.log(`Total image area: ${totalImageArea}, Total atlas area: ${totalAtlasArea}, Utilization: ${(totalImageArea / totalAtlasArea * 100).toFixed(1)}%`);
  for (const a of atlases) {
    for (let i = 0; i < a.placements.length; i++) {
      for (let j = i + 1; j < a.placements.length; j++) {
        const p1 = a.placements[i];
        const p2 = a.placements[j];
        const overlap = !(p2.x >= p1.x + p1.width || p2.x + p2.width <= p1.x || p2.y >= p1.y + p1.height || p2.y + p2.height <= p1.y);
        if (overlap) console.error(`Overlap detected in atlas ${a.index} between ${p1.name} and ${p2.name}`);
      }
    }
  }
} catch (e) { console.error(e.message); }

console.log('\nRandomized packing test (1024 atlas, 50 items)');
try {
  const randomImages = [];
  for (let i = 0; i < 50; i++) {
    const w = Math.floor(Math.random() * 128) + 8; // 8 - 135 px
    const h = Math.floor(Math.random() * 128) + 8;
    randomImages.push(makeMock(`r${i}`, w, h));
  }
  const atlases = packImages(randomImages, 1024, 2, 4096);
  console.log('Atlas count:', atlases.length);
  // Validate overlaps
  for (const a of atlases) {
    for (let i = 0; i < a.placements.length; i++) {
      for (let j = i + 1; j < a.placements.length; j++) {
        const p1 = a.placements[i];
        const p2 = a.placements[j];
        const overlap = !(p2.x >= p1.x + p1.width || p2.x + p2.width <= p1.x || p2.y >= p1.y + p1.height || p2.y + p2.height <= p1.y);
        if (overlap) console.error(`Overlap detected in atlas ${a.index} between ${p1.name} and ${p2.name}`);
      }
    }
  }
} catch (e) { console.error(e.message); }

