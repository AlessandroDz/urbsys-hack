import { Html, Line } from '@react-three/drei';
import { GraduationCap } from 'lucide-react';
import { useMemo } from 'react';
import { Shape, Vector2 } from 'three';
import { CAMPUS_LABEL, CAMPUS_OUTLINE, CAMPUS_WALKWAY } from './mapData';

const PAD_Y = 0.03;
const ACCENT = '#38bdf8';
const WALKWAY_HEIGHT = 1.7;
const WALKWAY_WIDTH = 0.55;

function Walkway() {
  const { from, to } = CAMPUS_WALKWAY;
  const length = Math.hypot(to[0] - from[0], to[1] - from[1]);
  const angle = Math.atan2(-(to[1] - from[1]), to[0] - from[0]);
  const center: [number, number] = [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2];

  return (
    <group position={[center[0], 0, center[1]]} rotation={[0, angle, 0]}>
      {/* laje e cobertura azul da passarela */}
      <mesh position={[0, WALKWAY_HEIGHT, 0]} castShadow receiveShadow>
        <boxGeometry args={[length, 0.14, WALKWAY_WIDTH]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.7} />
      </mesh>
      <mesh position={[0, WALKWAY_HEIGHT + 0.36, 0]} castShadow>
        <boxGeometry args={[length, 0.1, WALKWAY_WIDTH + 0.2]} />
        <meshStandardMaterial color="#0284c7" roughness={0.5} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[0, WALKWAY_HEIGHT + 0.17, side * (WALKWAY_WIDTH / 2)]}>
          <boxGeometry args={[length, 0.4, 0.04]} />
          <meshStandardMaterial color="#38bdf8" transparent opacity={0.45} roughness={0.2} />
        </mesh>
      ))}
      {[-0.35, 0.35].map((t) => (
        <mesh key={t} position={[length * t, WALKWAY_HEIGHT / 2, 0]} castShadow>
          <boxGeometry args={[0.16, WALKWAY_HEIGHT, 0.16]} />
          <meshStandardMaterial color="#cbd5e1" roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

/** Marca o terreno do campus da FAESA no mapa e rotula a torre principal. */
export function Campus() {
  const shape = useMemo(() => new Shape(CAMPUS_OUTLINE.map(([x, z]) => new Vector2(x, -z))), []);
  const outline = useMemo(
    () => [...CAMPUS_OUTLINE, CAMPUS_OUTLINE[0]].map(([x, z]) => [x, PAD_Y + 0.02, z] as [number, number, number]),
    [],
  );

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, PAD_Y, 0]}>
        <shapeGeometry args={[shape]} />
        <meshBasicMaterial color={ACCENT} transparent opacity={0.2} depthWrite={false} />
      </mesh>
      <Line points={outline} color={ACCENT} lineWidth={2.5} />
      <Walkway />
      <Html
        position={[CAMPUS_LABEL.position[0], CAMPUS_LABEL.heightM * (1 / 3) + 1.2, CAMPUS_LABEL.position[1]]}
        center
        zIndexRange={[4, 0]}
        wrapperClass="pointer-events-none select-none"
        style={{ pointerEvents: 'none' }}
      >
        <span className="flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-sky-300/60 bg-sky-500/30 px-2.5 py-1 text-[11px] font-semibold text-sky-100 shadow-lg backdrop-blur-sm">
          <GraduationCap size={13} />
          FAESA · Campus Vitória
        </span>
      </Html>
    </group>
  );
}
