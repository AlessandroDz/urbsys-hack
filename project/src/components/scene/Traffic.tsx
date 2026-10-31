import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import type { Group } from 'three';
import type { BlockLevel } from '@/lib/interventions';
import {
  CORE_HALF_LENGTH,
  DETOUR_OFFSET,
  LANE_OFFSET,
  LOOP_HALF_LENGTH,
  QUEUE_HALF_LENGTH,
  ROAD_TOP,
  createRandom,
} from './cityLayout';

type Axis = 'x' | 'z';
type Side = 1 | -1;

interface Vehicle {
  axis: Axis;
  side: Side;
  kind: 'car' | 'bus';
  color: string;
  pos: number;
  baseSpeed: number;
  speed: number;
  lateral: number;
}

const CAR_COLORS = ['#e2e8f0', '#60a5fa', '#34d399', '#f472b6', '#94a3b8', '#a78bfa', '#f1f5f9'];
const BUS_COLORS = ['#0d9488', '#0ea5e9'];
const SIZES = {
  car: { length: 1.5, width: 0.7, height: 0.6 },
  bus: { length: 2.8, width: 0.9, height: 1.0 },
};
const VEHICLES_PER_LANE: Record<Axis, number> = { x: 6, z: 4 };

function createVehicles(): Vehicle[] {
  const random = createRandom(99);
  const vehicles: Vehicle[] = [];
  const axes: Axis[] = ['x', 'z'];
  const sides: Side[] = [1, -1];

  for (const axis of axes) {
    for (const side of sides) {
      for (let i = 0; i < VEHICLES_PER_LANE[axis]; i++) {
        const isBus = random() < 0.12;
        const baseSpeed = isBus ? 2.2 + random() * 0.6 : 3 + random() * 1.4;
        vehicles.push({
          axis,
          side,
          kind: isBus ? 'bus' : 'car',
          color: isBus
            ? BUS_COLORS[Math.floor(random() * BUS_COLORS.length)]
            : CAR_COLORS[Math.floor(random() * CAR_COLORS.length)],
          pos: (random() * 2 - 1) * LOOP_HALF_LENGTH,
          baseSpeed,
          speed: baseSpeed,
          lateral: side * LANE_OFFSET,
        });
      }
    }
  }

  return vehicles;
}

interface TrafficProps {
  active: boolean;
  level: BlockLevel;
}

export function Traffic({ active, level }: TrafficProps) {
  const vehicles = useMemo(createVehicles, []);
  const nodes = useRef<(Group | null)[]>([]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const total = level === 'total';

    vehicles.forEach((vehicle, index) => {
      const node = nodes.current[index];
      if (!node) return;

      const distance = Math.abs(vehicle.pos);
      const inCore = active && distance < CORE_HALF_LENGTH;
      const inQueue = active && distance < QUEUE_HALF_LENGTH;
      const affected = active && (total || vehicle.side > 0);
      const detour = affected && inCore;

      let factor = 1;
      if (active) {
        factor = affected
          ? inCore ? 0.4 : inQueue ? 0.7 : 1
          : inCore ? 0.6 : 1;
      }

      vehicle.speed += (vehicle.baseSpeed * factor - vehicle.speed) * Math.min(1, dt * 1.6);
      const targetLateral = (detour ? DETOUR_OFFSET : LANE_OFFSET) * vehicle.side;
      vehicle.lateral += (targetLateral - vehicle.lateral) * Math.min(1, dt * 2.2);
      vehicle.pos += vehicle.side * vehicle.speed * dt;

      if (vehicle.pos > LOOP_HALF_LENGTH) vehicle.pos -= LOOP_HALF_LENGTH * 2;
      if (vehicle.pos < -LOOP_HALF_LENGTH) vehicle.pos += LOOP_HALF_LENGTH * 2;

      const height = SIZES[vehicle.kind].height;
      const y = ROAD_TOP + height / 2;
      if (vehicle.axis === 'x') {
        node.position.set(vehicle.pos, y, vehicle.lateral);
      } else {
        node.position.set(vehicle.lateral, y, vehicle.pos);
      }
    });
  });

  return (
    <group>
      {vehicles.map((vehicle, index) => {
        const size = SIZES[vehicle.kind];
        return (
          <group
            key={index}
            ref={(node) => {
              nodes.current[index] = node;
            }}
            rotation={[0, vehicle.axis === 'z' ? Math.PI / 2 : 0, 0]}
          >
            <mesh castShadow receiveShadow>
              <boxGeometry args={[size.length, size.height, size.width]} />
              <meshStandardMaterial color={vehicle.color} roughness={0.45} metalness={0.1} />
            </mesh>
            {vehicle.kind === 'car' ? (
              <mesh position={[0, size.height / 2 + 0.14, 0]}>
                <boxGeometry args={[size.length * 0.5, 0.28, size.width * 0.86]} />
                <meshStandardMaterial color="#0f172a" roughness={0.2} />
              </mesh>
            ) : (
              <mesh position={[0, size.height * 0.15, 0]}>
                <boxGeometry args={[size.length * 1.01, size.height * 0.28, size.width * 1.02]} />
                <meshStandardMaterial color="#0f172a" roughness={0.2} />
              </mesh>
            )}
          </group>
        );
      })}
    </group>
  );
}
