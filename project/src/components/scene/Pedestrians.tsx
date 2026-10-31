import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import type { Group, Mesh } from 'three';
import type { BlockLevel } from '@/lib/interventions';
import {
  BANDS,
  CORE_HALF_LENGTH,
  LOOP_HALF_LENGTH,
  ROAD_TOP,
  SIDEWALK_TOP,
  createRandom,
  halfWidthOf,
} from './cityLayout';

type Axis = 'x' | 'z';
type Side = 1 | -1;

interface Pedestrian {
  axis: Axis;
  band: number;
  side: Side;
  dir: Side;
  pos: number;
  lateral: number;
  speed: number;
  phase: number;
  shirtColor: string;
  pantsColor: string;
  skinColor: string;
}

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
const WALK_BANDS = [-18, -9, 0, 9, 18];

function isCrossingRoad(pos: number): boolean {
  for (const b of BANDS) {
    if (Math.abs(pos - b) < halfWidthOf(b)) {
      return true;
    }
  }
  return false;
}

function createPedestrians(): Pedestrian[] {
  const random = createRandom(31415);
  const list: Pedestrian[] = [];
  const axes: Axis[] = ['x', 'z'];
  const sides: Side[] = [-1, 1];

  for (const axis of axes) {
    for (const band of WALK_BANDS) {
      const countPerSide = band === 0 ? 5 : 2;
      for (const side of sides) {
        for (let i = 0; i < countPerSide; i++) {
          const dir: Side = random() < 0.5 ? 1 : -1;
          const sidewalkCenter = halfWidthOf(band) + 0.42;
          const jitter = (random() - 0.5) * 0.22;
          list.push({
            axis,
            band,
            side,
            dir,
            pos: (random() * 2 - 1) * (LOOP_HALF_LENGTH - 2),
            lateral: band + side * sidewalkCenter + jitter,
            speed: 1.05 + random() * 0.55,
            phase: random() * Math.PI * 2,
            shirtColor: SHIRT_COLORS[Math.floor(random() * SHIRT_COLORS.length)],
            pantsColor: PANTS_COLORS[Math.floor(random() * PANTS_COLORS.length)],
            skinColor: SKIN_COLORS[Math.floor(random() * SKIN_COLORS.length)],
          });
        }
      }
    }
  }

  return list;
}

interface PedestriansProps {
  active: boolean;
  level: BlockLevel;
}

export function Pedestrians({ active, level }: PedestriansProps) {
  const pedestrians = useMemo(createPedestrians, []);
  const groupRefs = useRef<(Group | null)[]>([]);
  const leftLegRefs = useRef<(Mesh | null)[]>([]);
  const rightLegRefs = useRef<(Mesh | null)[]>([]);

  useFrame(({ clock }, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = clock.elapsedTime;

    pedestrians.forEach((ped, index) => {
      const node = groupRefs.current[index];
      if (!node) return;

      const nearWork = active && ped.band === 0 && Math.abs(ped.pos) < CORE_HALF_LENGTH - 1.2;
      const blockedSide = level === 'total' || ped.side > 0;

      // Se a calçada estiver interditada pela obra central, o pedestre dá meia-volta na barreira
      if (nearWork && blockedSide) {
        const approachingCenter = (ped.pos > 0 && ped.dir < 0) || (ped.pos < 0 && ped.dir > 0);
        if (approachingCenter) {
          ped.dir = (ped.dir === 1 ? -1 : 1) as Side;
        }
      }

      const speedFactor = nearWork ? 0.65 : 1;
      ped.pos += ped.dir * ped.speed * speedFactor * dt;

      if (ped.pos > LOOP_HALF_LENGTH) ped.pos = -LOOP_HALF_LENGTH;
      if (ped.pos < -LOOP_HALF_LENGTH) ped.pos = LOOP_HALF_LENGTH;

      const strideAngle = t * ped.speed * 7.5 + ped.phase;
      const bounce = Math.abs(Math.sin(strideAngle)) * 0.035;
      const surfaceY = isCrossingRoad(ped.pos) ? ROAD_TOP : SIDEWALK_TOP;

      if (ped.axis === 'x') {
        node.position.set(ped.pos, surfaceY + bounce, ped.lateral);
        node.rotation.y = ped.dir === 1 ? Math.PI / 2 : -Math.PI / 2;
      } else {
        node.position.set(ped.lateral, surfaceY + bounce, ped.pos);
        node.rotation.y = ped.dir === 1 ? 0 : Math.PI;
      }

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

