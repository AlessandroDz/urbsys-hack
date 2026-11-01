import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import type { Group, Mesh } from 'three';
import type { BlockLevel } from '@/lib/interventions';
import { FOOTPATH_TOP, createRandom } from './cityLayout';
import { CLOSURE_RADIUS, WALK_PATHS, sampleAt, type Sample, type WalkPath, type WorkSiteFrame } from './mapData';

type Dir = 1 | -1;

interface Pedestrian {
  path: WalkPath;
  dir: Dir;
  pos: number;
  speed: number;
  phase: number;
  shirtColor: string;
  pantsColor: string;
  skinColor: string;
}

const PEDESTRIAN_COUNT = 70;
const WORK_AVOID_RADIUS = CLOSURE_RADIUS * 1.2;

const SHIRT_COLORS = [
  '#38bdf8',
  '#fbbf24',
  '#34d399',
  '#f472b6',
  '#a78bfa',
  '#fb7185',
  '#f8fafc',
  '#fb923c',
  '#2dd4bf',
];
const PANTS_COLORS = ['#1e293b', '#334155', '#1e3a8a', '#3f3f46', '#0f172a'];
const SKIN_COLORS = ['#fde68a', '#fed7aa', '#f59e0b', '#d97706', '#92400e'];

function createPedestrians(): Pedestrian[] {
  const random = createRandom(31415);
  const list: Pedestrian[] = [];
  const totalLength = WALK_PATHS.reduce((sum, p) => sum + p.length, 0);

  for (let i = 0; i < PEDESTRIAN_COUNT; i++) {
    // sorteio proporcional ao comprimento: ruas longas têm mais gente
    let pick = random() * totalLength;
    let path = WALK_PATHS[0];
    for (const candidate of WALK_PATHS) {
      pick -= candidate.length;
      if (pick <= 0) {
        path = candidate;
        break;
      }
    }

    list.push({
      path,
      dir: random() < 0.5 ? 1 : -1,
      pos: random() * path.length,
      speed: 1.05 + random() * 0.55,
      phase: random() * Math.PI * 2,
      shirtColor: SHIRT_COLORS[Math.floor(random() * SHIRT_COLORS.length)],
      pantsColor: PANTS_COLORS[Math.floor(random() * PANTS_COLORS.length)],
      skinColor: SKIN_COLORS[Math.floor(random() * SKIN_COLORS.length)],
    });
  }

  return list;
}

interface PedestriansProps {
  active: boolean;
  level: BlockLevel;
  site: WorkSiteFrame;
}

export function Pedestrians({ active, site }: PedestriansProps) {
  const pedestrians = useMemo(createPedestrians, []);
  const groupRefs = useRef<(Group | null)[]>([]);
  const leftLegRefs = useRef<(Mesh | null)[]>([]);
  const rightLegRefs = useRef<(Mesh | null)[]>([]);
  const sample = useRef<Sample>({ x: 0, z: 0, dx: 0, dz: 0 });

  useFrame(({ clock }, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = clock.elapsedTime;
    const [cx, cz] = site.center;

    pedestrians.forEach((ped, index) => {
      const node = groupRefs.current[index];
      if (!node) return;

      const { path } = ped;
      sampleAt(path.pts, path.cum, ped.pos, sample.current);
      const nearWork = active && Math.hypot(sample.current.x - cx, sample.current.z - cz) < WORK_AVOID_RADIUS;

      // A calçada ao lado da obra está interditada: o pedestre dá meia-volta na barreira
      if (nearWork) {
        const toCenterX = cx - sample.current.x;
        const toCenterZ = cz - sample.current.z;
        const heading = (sample.current.dx * toCenterX + sample.current.dz * toCenterZ) * ped.dir;
        if (heading > 0) ped.dir = (ped.dir === 1 ? -1 : 1) as Dir;
      }

      ped.pos += ped.dir * ped.speed * (nearWork ? 0.65 : 1) * dt;
      if (ped.pos >= path.length) {
        ped.pos = path.length;
        ped.dir = -1;
      } else if (ped.pos <= 0) {
        ped.pos = 0;
        ped.dir = 1;
      }

      sampleAt(path.pts, path.cum, ped.pos, sample.current);
      const strideAngle = t * ped.speed * 7.5 + ped.phase;
      const bounce = Math.abs(Math.sin(strideAngle)) * 0.035;

      node.position.set(sample.current.x, FOOTPATH_TOP + bounce, sample.current.z);
      node.rotation.y = Math.atan2(sample.current.dx * ped.dir, sample.current.dz * ped.dir);

      const legSwing = Math.sin(strideAngle) * 0.5;
      const leftLeg = leftLegRefs.current[index];
      const rightLeg = rightLegRefs.current[index];
      if (leftLeg) leftLeg.rotation.x = legSwing;
      if (rightLeg) rightLeg.rotation.x = -legSwing;
    });
  });

  return (
    <group>
      {pedestrians.map((ped, index) => (
        <group
          key={index}
          ref={(node) => {
            groupRefs.current[index] = node;
          }}
        >
          {/* Perna esquerda */}
          <mesh
            ref={(mesh) => {
              leftLegRefs.current[index] = mesh;
            }}
            position={[-0.055, 0.12, 0]}
            castShadow
          >
            <boxGeometry args={[0.07, 0.22, 0.07]} />
            <meshStandardMaterial color={ped.pantsColor} roughness={0.8} />
          </mesh>

          {/* Perna direita */}
          <mesh
            ref={(mesh) => {
              rightLegRefs.current[index] = mesh;
            }}
            position={[0.055, 0.12, 0]}
            castShadow
          >
            <boxGeometry args={[0.07, 0.22, 0.07]} />
            <meshStandardMaterial color={ped.pantsColor} roughness={0.8} />
          </mesh>

          {/* Tronco / Roupa */}
          <mesh position={[0, 0.34, 0]} castShadow>
            <boxGeometry args={[0.2, 0.26, 0.13]} />
            <meshStandardMaterial color={ped.shirtColor} roughness={0.6} />
          </mesh>

          {/* Cabeça */}
          <mesh position={[0, 0.56, 0]} castShadow>
            <sphereGeometry args={[0.095, 10, 10]} />
            <meshStandardMaterial color={ped.skinColor} roughness={0.55} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

