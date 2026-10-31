import { useMemo } from 'react';
import { AVENUE_HALF_WIDTH, BANDS, ROAD_LENGTH, ROAD_TOP, LOOP_HALF_LENGTH, halfWidthOf } from './cityLayout';

const ROAD_COLOR = '#1e293b';
const GROUND_COLOR = '#0a1322';
const LINE_COLOR = '#cbd5e1';
const DASH_SPACING = 3.2;
const DASH_CLEARANCE = AVENUE_HALF_WIDTH + 0.8;

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
      <AvenueDashes />
    </group>
  );
}
