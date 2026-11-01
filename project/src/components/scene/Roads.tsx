import { Html } from '@react-three/drei';
import { useMemo } from 'react';
import {
  BANDS,
  BLOCK_MARGIN,
  ROAD_LENGTH,
  ROAD_TOP,
  SIDEWALK_TOP,
  blockSpans,
  halfWidthOf,
} from './cityLayout';

const ROAD_COLOR = '#1e293b';
const GROUND_COLOR = '#0a1322';
const AVENUE_LINE_COLOR = '#e2e8f0';
const STREET_LINE_COLOR = '#94a3b8';
const CURB_COLOR = '#64748b';
const SIDEWALK_COLOR = '#334155';
const CROSSWALK_BANDS = [-18, -9, 0, 9, 18];
const STRIPE_OFFSETS = [-1.5, -0.9, -0.3, 0.3, 0.9, 1.5];

interface StreetLabelSpec {
  name: string;
  position: [number, number, number];
  primary?: boolean;
}

const STREET_LABELS: StreetLabelSpec[] = [
  { name: 'Av. Vitória', position: [-14, ROAD_TOP + 0.15, 0], primary: true },
  { name: 'Av. Vitória', position: [14, ROAD_TOP + 0.15, 0], primary: true },
  { name: 'Av. Mal. Campos', position: [0, ROAD_TOP + 0.15, -14], primary: true },
  { name: 'R. Anselmo Serrate', position: [0, ROAD_TOP + 0.15, 13.5] },
  { name: 'R. Camilo Gianordoli', position: [13.5, ROAD_TOP + 0.15, -9] },
  { name: 'R. Aluysio Simões', position: [13.5, ROAD_TOP + 0.15, 9] },
  { name: 'R. Gilberto Paixão', position: [-9, ROAD_TOP + 0.15, -13.5] },
  { name: 'R. João Vieira', position: [9, ROAD_TOP + 0.15, 13.5] },
];

export function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
      <planeGeometry args={[240, 240]} />
      <meshStandardMaterial color={GROUND_COLOR} roughness={1} />
    </mesh>
  );
}

function StreetLabels() {
  return (
    <group>
      {STREET_LABELS.map((street, index) => (
        <Html
          key={index}
          position={street.position}
          center
          zIndexRange={[3, 0]}
          wrapperClass="pointer-events-none select-none"
          style={{ pointerEvents: 'none' }}
        >
          <span
            className={`whitespace-nowrap rounded-md border px-2 py-0.5 text-[10px] font-semibold tracking-wide backdrop-blur-sm ${
              street.primary
                ? 'border-sky-400/40 bg-slate-900/85 text-sky-200 shadow-sm'
                : 'border-white/10 bg-slate-900/70 text-slate-300'
            }`}
          >
            {street.name}
          </span>
        </Html>
      ))}
    </group>
  );
}

function computeDashPositions(): number[] {
  const positions: number[] = [];
  const halfRoad = ROAD_LENGTH / 2 - 1.2;
  const stops = [-halfRoad, ...BANDS, halfRoad];

  for (let i = 0; i < stops.length - 1; i++) {
    const a = stops[i];
    const b = stops[i + 1];
    const padA = i === 0 ? 0.5 : halfWidthOf(a) + 0.85;
    const padB = i === stops.length - 2 ? 0.5 : halfWidthOf(b) + 0.85;
    const start = a + padA;
    const end = b - padB;
    const segLen = end - start;
    if (segLen <= 0.8) continue;

    const count = Math.max(1, Math.round(segLen / 2.2));
    const step = segLen / count;
    for (let j = 0; j < count; j++) {
      positions.push(start + (j + 0.5) * step);
    }
  }

  return positions;
}

function RoadDashes() {
  const dashPositions = useMemo(computeDashPositions, []);
  const y = ROAD_TOP + 0.01;

  return (
    <group>
      {BANDS.map((band) => {
        const isMainAvenue = band === 0;
        const dashLen = isMainAvenue ? 1.35 : 1.1;
        const dashWidth = isMainAvenue ? 0.14 : 0.11;
        const color = isMainAvenue ? AVENUE_LINE_COLOR : STREET_LINE_COLOR;

        return (
          <group key={band}>
            {dashPositions.map((p) => (
              <group key={p}>
                {/* Faixa da via no sentido X */}
                <mesh position={[p, y, band]}>
                  <boxGeometry args={[dashLen, 0.016, dashWidth]} />
                  <meshBasicMaterial color={color} />
                </mesh>
                {/* Faixa da via no sentido Z */}
                <mesh position={[band, y, p]}>
                  <boxGeometry args={[dashWidth, 0.016, dashLen]} />
                  <meshBasicMaterial color={color} />
                </mesh>
              </group>
            ))}
          </group>
        );
      })}
    </group>
  );
}

function Crosswalks() {
  const y = ROAD_TOP + 0.012;

  return (
    <group>
      {CROSSWALK_BANDS.map((band) => {
        const edge = halfWidthOf(band) + 0.42;
        return (
          <group key={band}>
            {[-1, 1].map((dir) => (
              <group key={dir}>
                {STRIPE_OFFSETS.map((stripe) => (
                  <group key={stripe}>
                    {/* Faixa atravessando a avenida X */}
                    <mesh position={[band + dir * edge, y, stripe]}>
                      <boxGeometry args={[0.55, 0.015, 0.28]} />
                      <meshBasicMaterial color="#e2e8f0" />
                    </mesh>
                    {/* Faixa atravessando a avenida Z */}
                    <mesh position={[stripe, y, band + dir * edge]}>
                      <boxGeometry args={[0.28, 0.015, 0.55]} />
                      <meshBasicMaterial color="#e2e8f0" />
                    </mesh>
                  </group>
                ))}
              </group>
            ))}
          </group>
        );
      })}
    </group>
  );
}

function Sidewalks() {
  const cells = useMemo(() => {
    const spans = blockSpans();
    const list: Array<{ x: number; z: number; w: number; d: number; innerW: number; innerD: number }> = [];
    for (const xs of spans) {
      for (const zs of spans) {
        const innerW = xs.max - xs.min;
        const innerD = zs.max - zs.min;
        const w = innerW + BLOCK_MARGIN * 2;
        const d = innerD + BLOCK_MARGIN * 2;
        const x = (xs.min + xs.max) / 2;
        const z = (zs.min + zs.max) / 2;
        list.push({ x, z, w, d, innerW, innerD });
      }
    }
    return list;
  }, []);

  return (
    <group>
      {cells.map((cell, index) => (
        <group key={index} position={[cell.x, 0, cell.z]}>
          {/* Meio-fio / Base da calçada */}
          <mesh position={[0, SIDEWALK_TOP / 2, 0]} receiveShadow>
            <boxGeometry args={[cell.w, SIDEWALK_TOP, cell.d]} />
            <meshStandardMaterial color={CURB_COLOR} roughness={0.85} />
          </mesh>
          {/* Piso interno da calçada */}
          <mesh position={[0, SIDEWALK_TOP + 0.004, 0]} receiveShadow>
            <boxGeometry args={[cell.w - 0.16, 0.008, cell.d - 0.16]} />
            <meshStandardMaterial color={SIDEWALK_COLOR} roughness={0.92} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export function Roads() {
  return (
    <group>
      {BANDS.map((band) => {
        const width = halfWidthOf(band) * 2;
        return (
          <group key={band}>
            <mesh position={[0, ROAD_TOP / 2, band]} receiveShadow>
              <boxGeometry args={[ROAD_LENGTH, ROAD_TOP, width]} />
              <meshStandardMaterial color={ROAD_COLOR} roughness={0.9} />
            </mesh>
            <mesh position={[band, ROAD_TOP / 2, 0]} receiveShadow>
              <boxGeometry args={[width, ROAD_TOP, ROAD_LENGTH]} />
              <meshStandardMaterial color={ROAD_COLOR} roughness={0.9} />
            </mesh>
          </group>
        );
      })}
      <Sidewalks />
      <RoadDashes />
      <Crosswalks />
      <StreetLabels />
    </group>
  );
}
