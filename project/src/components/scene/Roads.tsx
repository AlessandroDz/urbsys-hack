import { useMemo } from 'react';
import {
  AVENUE_HALF_WIDTH,
  BANDS,
  BLOCK_MARGIN,
  LOOP_HALF_LENGTH,
  ROAD_LENGTH,
  ROAD_TOP,
  SIDEWALK_TOP,
  blockSpans,
  halfWidthOf,
} from './cityLayout';

const ROAD_COLOR = '#1e293b';
const GROUND_COLOR = '#0a1322';
const LINE_COLOR = '#cbd5e1';
const CURB_COLOR = '#64748b';
const SIDEWALK_COLOR = '#334155';
const DASH_SPACING = 3.2;
const DASH_CLEARANCE = AVENUE_HALF_WIDTH + 0.8;
const CROSSWALK_BANDS = [-18, -9, 0, 9, 18];
const STRIPE_OFFSETS = [-1.5, -0.9, -0.3, 0.3, 0.9, 1.5];

export function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
      <planeGeometry args={[240, 240]} />
      <meshStandardMaterial color={GROUND_COLOR} roughness={1} />
    </mesh>
  );
}

function AvenueDashes() {
  const offsets = useMemo(() => {
    const list: number[] = [];
    for (let p = -LOOP_HALF_LENGTH; p <= LOOP_HALF_LENGTH; p += DASH_SPACING) {
      if (Math.abs(p) > DASH_CLEARANCE) list.push(p);
    }
    return list;
  }, []);

  return (
    <group>
      {offsets.map((p) => (
        <mesh key={`x-${p}`} position={[p, ROAD_TOP + 0.01, 0]}>
          <boxGeometry args={[1.6, 0.02, 0.14]} />
          <meshBasicMaterial color={LINE_COLOR} />
        </mesh>
      ))}
      {offsets.map((p) => (
        <mesh key={`z-${p}`} position={[0, ROAD_TOP + 0.01, p]}>
          <boxGeometry args={[0.14, 0.02, 1.6]} />
          <meshBasicMaterial color={LINE_COLOR} />
        </mesh>
      ))}
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
      <AvenueDashes />
      <Crosswalks />
    </group>
  );
}
