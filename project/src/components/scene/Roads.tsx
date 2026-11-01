import { Html } from '@react-three/drei';
import { useMemo } from 'react';
import { DoubleSide, type Texture } from 'three';
import { FOOTPATH_TOP, ROAD_TOP, SIDEWALK_TOP } from './cityLayout';
import { SATELLITE_HALF, STREET_LABELS, getRoadGeometries } from './mapData';

const ROAD_COLOR = '#334155';
const GROUND_COLOR = '#0a1322';
const DAY_GROUND_COLOR = '#8a9585';
const SIDEWALK_COLOR = '#475569';
const FOOTPATH_COLOR = '#64748b';
const DASH_COLOR = '#cbd5e1';

interface GroundProps {
  texture: Texture | null;
  night: boolean;
}

export function Ground({ texture, night }: GroundProps) {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[1200, 1200]} />
        <meshStandardMaterial color={night ? GROUND_COLOR : DAY_GROUND_COLOR} roughness={1} />
      </mesh>
      {texture && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
          <planeGeometry args={[SATELLITE_HALF * 2, SATELLITE_HALF * 2]} />
          <meshStandardMaterial map={texture} roughness={1} color={night ? '#a3b0d0' : '#c8c8c8'} />
        </mesh>
      )}
    </group>
  );
}

function StreetLabels() {
  return (
    <group>
      {STREET_LABELS.map((street) => (
        <Html
          key={street.name}
          position={[street.position[0], ROAD_TOP + 0.15, street.position[1]]}
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

interface RoadsProps {
  showRoads: boolean;
  showLabels: boolean;
}

export function Roads({ showRoads, showLabels }: RoadsProps) {
  const geometries = useMemo(
    () =>
      getRoadGeometries({
        sidewalk: SIDEWALK_TOP,
        road: ROAD_TOP,
        footpath: FOOTPATH_TOP,
        dashes: ROAD_TOP + 0.01,
      }),
    [],
  );

  return (
    <group>
      {showRoads && (
        <>
          <mesh geometry={geometries.sidewalk} receiveShadow>
            <meshStandardMaterial color={SIDEWALK_COLOR} roughness={0.92} side={DoubleSide} />
          </mesh>
          <mesh geometry={geometries.road} receiveShadow>
            <meshStandardMaterial color={ROAD_COLOR} roughness={0.9} side={DoubleSide} />
          </mesh>
          <mesh geometry={geometries.footpath} receiveShadow>
            <meshStandardMaterial color={FOOTPATH_COLOR} roughness={0.9} side={DoubleSide} />
          </mesh>
          <mesh geometry={geometries.dashes}>
            <meshBasicMaterial color={DASH_COLOR} side={DoubleSide} />
          </mesh>
        </>
      )}
      {showLabels && <StreetLabels />}
    </group>
  );
}
