import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Group, MeshBasicMaterial, MeshStandardMaterial } from 'three';
import type { BlockLevel, WorkId } from '@/lib/interventions';
import { ROAD_TOP } from './cityLayout';
import { CLOSURE_RADIUS, WORK_FRAME } from './mapData';

const CLOSURE_COLOR = '#ef4444';
const BARRIER_COLOR = '#f59e0b';
const CLOSURE_LENGTH = CLOSURE_RADIUS * 2;
const BARRIER_OFFSET = CLOSURE_RADIUS;
const LANE_Z = WORK_FRAME.laneHalf;
const AVENUE_WIDTH = WORK_FRAME.width;
const CARRIAGE_WIDTH = WORK_FRAME.carriage;
const HALF_WIDTH = AVENUE_WIDTH / 2;

type Vec3 = [number, number, number];

function PulsingPlane({ args, position, rotation }: { args: [number, number]; position: Vec3; rotation: Vec3 }) {
  const materialRef = useRef<MeshBasicMaterial>(null);

  useFrame(({ clock }) => {
    if (!materialRef.current) return;
    materialRef.current.opacity = 0.2 + 0.25 * (0.5 + 0.5 * Math.sin(clock.elapsedTime * 4));
  });

  return (
    <mesh position={position} rotation={rotation}>
      <planeGeometry args={args} />
      <meshBasicMaterial ref={materialRef} color={CLOSURE_COLOR} transparent depthWrite={false} />
    </mesh>
  );
}

function ClosureOverlay({ level }: { level: BlockLevel }) {
  const flat: Vec3 = [-Math.PI / 2, 0, 0];
  const y = ROAD_TOP + 0.02;
  return (
    <group>
      {level === 'total' ? (
        <PulsingPlane args={[CLOSURE_LENGTH, AVENUE_WIDTH]} position={[0, y, 0]} rotation={flat} />
      ) : (
        <PulsingPlane args={[CLOSURE_LENGTH, CARRIAGE_WIDTH]} position={[0, y, LANE_Z]} rotation={flat} />
      )}
    </group>
  );
}

function Barriers({ level }: { level: BlockLevel }) {
  const y = ROAD_TOP + 0.35;
  const total = level === 'total';
  const z = total ? 0 : LANE_Z;
  const width = total ? AVENUE_WIDTH : CARRIAGE_WIDTH;
  const barriers: Array<{ position: Vec3; size: Vec3 }> = [
    { position: [-BARRIER_OFFSET, y, z], size: [0.4, 0.7, width] },
    { position: [BARRIER_OFFSET, y, z], size: [0.4, 0.7, width] },
  ];

  return (
    <group>
      {barriers.map((barrier, index) => (
        <mesh key={index} position={barrier.position} castShadow receiveShadow>
          <boxGeometry args={barrier.size} />
          <meshStandardMaterial color={BARRIER_COLOR} roughness={0.6} />
        </mesh>
      ))}
    </group>
  );
}

function Beacon({ position }: { position: Vec3 }) {
  const materialRef = useRef<MeshStandardMaterial>(null);

  useFrame(({ clock }) => {
    if (!materialRef.current) return;
    materialRef.current.emissiveIntensity = 0.4 + 2.2 * (0.5 + 0.5 * Math.sin(clock.elapsedTime * 6));
  });

  return (
    <mesh position={position}>
      <sphereGeometry args={[0.12, 12, 12]} />
      <meshStandardMaterial ref={materialRef} color="#fb923c" emissive="#f97316" emissiveIntensity={1} />
    </mesh>
  );
}

interface MachineProps {
  kind: 'tractor' | 'roller';
  z: number;
  phase: number;
  range: number;
}

function Machine({ kind, z, phase, range }: MachineProps) {
  const ref = useRef<Group>(null);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.position.x = Math.sin(clock.elapsedTime * 0.5 + phase) * range;
  });

  return (
    <group ref={ref} position={[0, ROAD_TOP, z]}>
      {kind === 'tractor' ? (
        <>
          <mesh position={[0, 0.3, 0]} castShadow>
            <boxGeometry args={[1.3, 0.6, 0.8]} />
            <meshStandardMaterial color={BARRIER_COLOR} roughness={0.5} />
          </mesh>
          <mesh position={[-0.3, 0.85, 0]} castShadow>
            <boxGeometry args={[0.5, 0.5, 0.7]} />
            <meshStandardMaterial color="#ea580c" roughness={0.5} />
          </mesh>
          <Beacon position={[-0.3, 1.2, 0]} />
        </>
      ) : (
        <>
          <mesh position={[0, 0.25, 0]} castShadow>
            <boxGeometry args={[1.6, 0.5, 1.0]} />
            <meshStandardMaterial color="#ea580c" roughness={0.5} />
          </mesh>
          <mesh position={[0.6, 0.45, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.45, 0.45, 1.0, 16]} />
            <meshStandardMaterial color="#facc15" roughness={0.4} />
          </mesh>
          <mesh position={[-0.5, 0.75, 0]} castShadow>
            <boxGeometry args={[0.6, 0.5, 0.8]} />
            <meshStandardMaterial color={BARRIER_COLOR} roughness={0.5} />
          </mesh>
          <Beacon position={[-0.5, 1.0, 0]} />
        </>
      )}
    </group>
  );
}

function UnderpassSite() {
  const crane = useRef<Group>(null);

  useFrame(({ clock }) => {
    if (crane.current) crane.current.rotation.y = Math.sin(clock.elapsedTime * 0.3) * 0.25;
  });

  return (
    <group>
      <mesh position={[0, ROAD_TOP + 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[12, AVENUE_WIDTH - 0.4]} />
        <meshBasicMaterial color="#020617" />
      </mesh>
      <group ref={crane} position={[-5.5, ROAD_TOP, HALF_WIDTH + 0.5]}>
        <mesh position={[0, 3, 0]} castShadow>
          <boxGeometry args={[0.4, 6, 0.4]} />
          <meshStandardMaterial color="#facc15" roughness={0.5} />
        </mesh>
        <mesh position={[2.5, 6, 0]} castShadow>
          <boxGeometry args={[10, 0.3, 0.3]} />
          <meshStandardMaterial color="#facc15" roughness={0.5} />
        </mesh>
        <mesh position={[-2, 6, 0]} castShadow>
          <boxGeometry args={[3, 0.3, 0.3]} />
          <meshStandardMaterial color="#facc15" roughness={0.5} />
        </mesh>
        <mesh position={[6, 4.5, 0]}>
          <boxGeometry args={[0.04, 3, 0.04]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
        <Beacon position={[0, 6.4, 0]} />
      </group>
      <Machine kind="tractor" z={-LANE_Z} phase={0} range={4} />
      <Machine kind="tractor" z={LANE_Z} phase={Math.PI} range={4} />
    </group>
  );
}

function ViaductSite() {
  const pillarPositions: Vec3[] = [
    [-6, 1.7, -HALF_WIDTH],
    [-6, 1.7, HALF_WIDTH],
    [6, 1.7, -HALF_WIDTH],
    [6, 1.7, HALF_WIDTH],
  ];

  return (
    <group>
      {pillarPositions.map((position, index) => (
        <mesh key={index} position={position} castShadow receiveShadow>
          <boxGeometry args={[0.5, 3.2, 0.5]} />
          <meshStandardMaterial color="#cbd5e1" roughness={0.9} />
        </mesh>
      ))}
      <mesh position={[0, 3.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[14, 0.5, AVENUE_WIDTH + 0.4]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.85} />
      </mesh>
      <Beacon position={[6, 3.9, HALF_WIDTH]} />
      <Beacon position={[-6, 3.9, -HALF_WIDTH]} />
      <Machine kind="tractor" z={-LANE_Z} phase={0} range={3} />
    </group>
  );
}

function ResurfacingSite() {
  return (
    <group>
      <mesh position={[0, ROAD_TOP + 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[12, AVENUE_WIDTH - 0.4]} />
        <meshStandardMaterial color="#475569" roughness={1} />
      </mesh>
      <Machine kind="roller" z={-LANE_Z} phase={0} range={4.5} />
      <Machine kind="roller" z={LANE_Z} phase={Math.PI} range={4.5} />
    </group>
  );
}

function BikeLaneSite() {
  const lanes = [-1, 1];
  return (
    <group>
      {lanes.map((side) => (
        <group key={side}>
          <mesh position={[0, ROAD_TOP + 0.012, side * (HALF_WIDTH + 0.35)]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[24, 0.6]} />
            <meshStandardMaterial color="#059669" roughness={0.8} />
          </mesh>
          {[-10, -5, 0, 5, 10].map((x) => (
            <mesh key={x} position={[x, ROAD_TOP + 0.25, side * (HALF_WIDTH + 0.65)]} castShadow>
              <cylinderGeometry args={[0.08, 0.08, 0.5, 8]} />
              <meshStandardMaterial color="#f8fafc" />
            </mesh>
          ))}
        </group>
      ))}
      <Machine kind="tractor" z={HALF_WIDTH + 0.35} phase={Math.PI / 2} range={8} />
    </group>
  );
}

const SITE_BY_WORK: Record<WorkId, () => JSX.Element> = {
  underpass: UnderpassSite,
  viaduct: ViaductSite,
  resurfacing: ResurfacingSite,
  bikeLane: BikeLaneSite,
};

interface WorkSiteProps {
  workId: WorkId;
  level: BlockLevel;
}

export function WorkSite({ workId, level }: WorkSiteProps) {
  const Site = SITE_BY_WORK[workId];
  return (
    <group position={[WORK_FRAME.center[0], 0, WORK_FRAME.center[1]]} rotation={[0, WORK_FRAME.angle, 0]}>
      <ClosureOverlay level={level} />
      <Barriers level={level} />
      <Site />
    </group>
  );
}
