import { mkdirSync, writeFileSync } from 'node:fs';
import sharp from 'sharp';

// Mesmo centro de scripts/fetchOsm.mjs
const CENTER = { lat: -20.31082, lon: -40.314452 };
const HALF_M = 700; // metros de cada lado do centro cobertos pela imagem
const ZOOM = 18;
const TILE = 256;
const R = 6378137;
const URL_TEMPLATE = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

const worldPx = (lat, lon) => {
  const scale = TILE * 2 ** ZOOM;
  const sin = Math.sin((lat * Math.PI) / 180);
  return [((lon + 180) / 360) * scale, (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * scale];
};

// metros por pixel no solo, na latitude do centro
const metersPerPx = (2 * Math.PI * R * Math.cos((CENTER.lat * Math.PI) / 180)) / (TILE * 2 ** ZOOM);
const sizePx = Math.round((HALF_M * 2) / metersPerPx);

const [cx, cy] = worldPx(CENTER.lat, CENTER.lon);
const left = Math.round(cx - sizePx / 2);
const top = Math.round(cy - sizePx / 2);

const tx0 = Math.floor(left / TILE);
const ty0 = Math.floor(top / TILE);
const tx1 = Math.floor((left + sizePx - 1) / TILE);
const ty1 = Math.floor((top + sizePx - 1) / TILE);

const jobs = [];
for (let ty = ty0; ty <= ty1; ty++) {
  for (let tx = tx0; tx <= tx1; tx++) jobs.push({ tx, ty });
}
console.log(`${jobs.length} tiles, imagem final ${sizePx}px, ${metersPerPx.toFixed(3)} m/px`);

async function download({ tx, ty }) {
  const url = URL_TEMPLATE.replace('{z}', ZOOM).replace('{y}', ty).replace('{x}', tx);
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'urbsys-hack/1.0' } });
      if (!res.ok) throw new Error(res.status);
      return Buffer.from(await res.arrayBuffer());
    } catch (e) {
      if (attempt === 2) throw new Error(`${url}: ${e.message}`);
    }
  }
}

const buffers = [];
for (let i = 0; i < jobs.length; i += 8) {
  const batch = jobs.slice(i, i + 8);
  buffers.push(...(await Promise.all(batch.map(download))));
}

const cols = tx1 - tx0 + 1;
const rows = ty1 - ty0 + 1;
const mosaic = await sharp({
  create: { width: cols * TILE, height: rows * TILE, channels: 3, background: '#000000' },
})
  .composite(jobs.map((job, i) => ({ input: buffers[i], left: (job.tx - tx0) * TILE, top: (job.ty - ty0) * TILE })))
  .png()
  .toBuffer();

const outDir = new URL('../src/assets/', import.meta.url);
mkdirSync(outDir, { recursive: true });
await sharp(mosaic)
  .extract({ left: left - tx0 * TILE, top: top - ty0 * TILE, width: sizePx, height: sizePx })
  .jpeg({ quality: 82 })
  .toFile(new URL('satellite.jpg', outDir).pathname.replace(/^\/([A-Za-z]:)/, '$1'));

mkdirSync(new URL('../src/data/', import.meta.url), { recursive: true });
writeFileSync(new URL('../src/data/satellite.json', import.meta.url), JSON.stringify({ halfMeters: HALF_M, sizePx }));
console.log('ok');
