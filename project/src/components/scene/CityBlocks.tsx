import { blockSpans, createRandom } from './cityLayout';

interface CityBlock {
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
  color: string;
  park: boolean;
}

const PALETTE = ['#94a3b8', '#64748b', '#cbd5e1', '#a8a29e', '#78716c', '#475569', '#7c8b99', '#b8c4cf', '#d6d3d1', '#4f7f7a'];
const PARK_COLOR = '#2f4a40';
const PARK_HEIGHT = 0.2;

function generateCityBlocks(): CityBlock[] {
  const random = createRandom(2026);
  const spans = blockSpans();
  const blocks: CityBlock[] = [];

  for (const xs of spans) {
    for (const zs of spans) {
      const cellW = xs.max - xs.min;
      const cellD = zs.max - zs.min;
      const cx = (xs.min + xs.max) / 2;
      const cz = (zs.min + zs.max) / 2;

      if (random() < 0.12) {
        blocks.push({ x: cx, z: cz, w: cellW, d: cellD, h: PARK_HEIGHT, color: PARK_COLOR, park: true });
        continue;
      }

      const w = cellW * (0.7 + random() * 0.2);
      const d = cellD * (0.7 + random() * 0.2);
      const h = random() < 0.2 ? 6 + random() * 5 : 1.2 + random() * 3.2;
      const color = PALETTE[Math.floor(random() * PALETTE.length)];
      blocks.push({
        x: cx + (random() - 0.5) * (cellW - w) * 0.5,
        z: cz + (random() - 0.5) * (cellD - d) * 0.5,
        w,
        d,
        h,
        color,
        park: false,
      });
    }
  }

  return blocks;
}

const CITY_BLOCKS = generateCityBlocks();

export function CityBlocks() {
  return (
    <group>
      {CITY_BLOCKS.map((block, index) =>
        block.park ? (
          <mesh key={index} position={[block.x, PARK_HEIGHT / 2, block.z]} receiveShadow>
            <boxGeometry args={[block.w, PARK_HEIGHT, block.d]} />
            <meshStandardMaterial color={block.color} roughness={1} />
          </mesh>
        ) : (
          <mesh key={index} position={[block.x, block.h / 2, block.z]} castShadow receiveShadow>
            <boxGeometry args={[block.w, block.h, block.d]} />
            <meshStandardMaterial color={block.color} flatShading roughness={0.75} metalness={0.05} />
          </mesh>
        ),
      )}
    </group>
  );
}
