import { writeFileSync } from 'node:fs';

// Mesmo centro e recorte de scripts/fetchOsm.mjs
const CENTER = { lat: -20.31082, lon: -40.314452 };
const HALF = 450; // metros

const R = 6378137;
const dLat = (HALF / R) * (180 / Math.PI);
const dLon = dLat / Math.cos((CENTER.lat * Math.PI) / 180);
const viewbox = [CENTER.lon - dLon, CENTER.lat + dLat, CENTER.lon + dLon, CENTER.lat - dLat].join(',');

const mPerLat = (Math.PI / 180) * R;
const mPerLon = mPerLat * Math.cos((CENTER.lat * Math.PI) / 180);

// categoria -> termos de busca (o Nominatim não filtra por tag, só por texto)
const CATEGORIES = {
  bank: ['banco', 'Banestes', 'Santander', 'Bradesco', 'Itaú', 'Caixa Econômica', 'Sicoob'],
  supermarket: ['supermercado', 'mercado', 'hortifruti', 'atacadão'],
  health: ['hospital', 'farmácia', 'drogaria', 'clínica', 'laboratório', 'Unimed', 'pronto atendimento'],
  education: ['escola', 'colégio', 'faculdade', 'universidade', 'curso'],
  food: ['restaurante', 'padaria', 'lanchonete', 'café', 'pizzaria'],
  fuel: ['posto de combustível'],
};

// lugares que o OpenStreetMap não conhece, informados à mão (nome, categoria, latitude e longitude)
const EXTRA_PLACES = [
  { name: 'MedSênior Vitória', category: 'health', lat: -20.310244, lon: -40.314278 },
];

const places = new Map();

for (const [category, terms] of Object.entries(CATEGORIES)) {
  for (const term of terms) {
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(term)}&format=jsonv2&viewbox=${viewbox}&bounded=1&limit=20`;
      const res = await fetch(url, {
        signal: AbortSignal.timeout(20000),
        headers: { 'User-Agent': 'urbsys-hack/1.0 (projeto de faculdade)' },
      });
      for (const item of await res.json()) {
        const key = `${item.osm_type}${item.osm_id}`;
        if (places.has(key)) continue;
        const name = item.name || item.display_name.split(',')[0];
        // resultados sem nome próprio vêm só com o número da rua
        if (!name || /^\d+$/.test(name.trim())) continue;
        places.set(key, {
          name,
          category,
          x: +((item.lon - CENTER.lon) * mPerLon).toFixed(1),
          z: +(-(item.lat - CENTER.lat) * mPerLat).toFixed(1),
        });
      }
    } catch (e) {
      console.error(term, 'falhou:', e.message);
    }
    await new Promise((resolve) => setTimeout(resolve, 1100));
  }
}

for (const extra of EXTRA_PLACES) {
  places.set(`extra-${extra.name}`, {
    name: extra.name,
    category: extra.category,
    x: +((extra.lon - CENTER.lon) * mPerLon).toFixed(1),
    z: +(-(extra.lat - CENTER.lat) * mPerLat).toFixed(1),
  });
}

const list = [...places.values()].filter((p) => Math.abs(p.x) <= HALF && Math.abs(p.z) <= HALF);
writeFileSync(new URL('../src/data/places.json', import.meta.url), JSON.stringify(list, null, 1));
console.log(list.length, 'lugares');
for (const p of list) console.log(p.category.padEnd(11), p.name.slice(0, 40).padEnd(40), p.x, p.z);
