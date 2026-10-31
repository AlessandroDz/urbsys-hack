import { Line } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import type { Group } from 'three';
import type { Line2 } from 'three-stdlib';
import type { BlockLevel } from '@/lib/interventions';
import {
  DETOUR_OFFSET,
  LANE_OFFSET,
  LOOP_HALF_LENGTH,
  QUEUE_HALF_LENGTH,
  ROAD_TOP,
  createRandom,
} from './cityLayout';

type Axis = 'x' | 'z';
type Side = 1 | -1;
type Vec3 = [number, number, number];

const CROSS_STREET_POS = 9.0;
const CORNER_RADIUS = 1.4;
const TURN_ENTRY_U = -CROSS_STREET_POS - CORNER_RADIUS; // -10.4
const TURN_EXIT_U = CROSS_STREET_POS + CORNER_RADIUS; // +10.4
const ROUTE_LEAD_U = 14.5;

const ARC_LEN = CORNER_RADIUS * (Math.PI / 2);
const CROSS_LEN = DETOUR_OFFSET - LANE_OFFSET - 2 * CORNER_RADIUS;
const PARALLEL_LEN = 2 * (CROSS_STREET_POS - CORNER_RADIUS);
const TOTAL_DETOUR_LEN = 4 * ARC_LEN + 2 * CROSS_LEN + PARALLEL_LEN;

interface PathSample {
  u: number;
  w: number;
  du: number;
  dw: number;
}

function sampleDetourPath(s: number, entryU: number): PathSample {
  const clamped = Math.max(0, Math.min(TOTAL_DETOUR_LEN, s));
  let rem = clamped;

  // 1. Curva 90° saindo da avenida principal para a rua transversal (-9)
  if (rem <= ARC_LEN) {
    const alpha = rem / CORNER_RADIUS;
    return {
      u: entryU + CORNER_RADIUS * Math.sin(alpha),
      w: LANE_OFFSET + CORNER_RADIUS * (1 - Math.cos(alpha)),
      du: Math.cos(alpha),
      dw: Math.sin(alpha),
    };
  }
  rem -= ARC_LEN;

  const cross1U = entryU + CORNER_RADIUS;

  // 2. Trecho reto na rua transversal de desvio
  if (rem <= CROSS_LEN) {
    return {
      u: cross1U,
      w: LANE_OFFSET + CORNER_RADIUS + rem,
      du: 0,
      dw: 1,
    };
  }
  rem -= CROSS_LEN;

  // 3. Curva 90° entrando na via paralela (±9)
  if (rem <= ARC_LEN) {
    const alpha = rem / CORNER_RADIUS;
    return {
      u: cross1U + CORNER_RADIUS * (1 - Math.cos(alpha)),
      w: DETOUR_OFFSET - CORNER_RADIUS + CORNER_RADIUS * Math.sin(alpha),
      du: Math.sin(alpha),
      dw: Math.cos(alpha),
    };
  }
  rem -= ARC_LEN;

  // 4. Trecho reto na via paralela contornando a obra
  const parallelStartU = cross1U + CORNER_RADIUS;
  const effectiveParallelLen = CROSS_STREET_POS - CORNER_RADIUS - parallelStartU;
  if (rem <= PARALLEL_LEN) {
    const t = rem / PARALLEL_LEN;
    return {
      u: parallelStartU + t * effectiveParallelLen,
      w: DETOUR_OFFSET,
      du: 1,
      dw: 0,
    };
  }
  rem -= PARALLEL_LEN;

  // 5. Curva 90° saindo da via paralela para a segunda rua transversal (+9)
  if (rem <= ARC_LEN) {
    const alpha = rem / CORNER_RADIUS;
    return {
      u: CROSS_STREET_POS - CORNER_RADIUS + CORNER_RADIUS * Math.sin(alpha),
      w: DETOUR_OFFSET - CORNER_RADIUS * (1 - Math.cos(alpha)),
      du: Math.cos(alpha),
      dw: -Math.sin(alpha),
    };
  }
  rem -= ARC_LEN;

  // 6. Trecho reto voltando pela rua transversal (+9) até a avenida principal
  if (rem <= CROSS_LEN) {
    return {
      u: CROSS_STREET_POS,
      w: DETOUR_OFFSET - CORNER_RADIUS - rem,
      du: 0,
      dw: -1,
    };
  }
  rem -= CROSS_LEN;

  // 7. Curva 90° final reentrando na avenida principal
  const alpha = Math.min(Math.PI / 2, rem / CORNER_RADIUS);
  return {
    u: CROSS_STREET_POS + CORNER_RADIUS * (1 - Math.cos(alpha)),
    w: LANE_OFFSET + CORNER_RADIUS * (1 - Math.sin(alpha)),
    du: Math.sin(alpha),
    dw: -Math.cos(alpha),
  };
}

function toWorldPoint(axis: Axis, side: Side, u: number, w: number, y: number): Vec3 {
  const x = axis === 'x' ? side * u : side * w;
  const z = axis === 'x' ? side * w : side * u;
  return [x, y, z];
}

function buildDetourRoutePoints(axis: Axis, side: Side): Vec3[] {
  const y = ROAD_TOP + 0.03;
  const points: Vec3[] = [toWorldPoint(axis, side, -ROUTE_LEAD_U, LANE_OFFSET, y)];
  const steps = 64;

  for (let i = 0; i <= steps; i++) {
    const s = (i / steps) * TOTAL_DETOUR_LEN;
    const sample = sampleDetourPath(s, TURN_ENTRY_U);
    points.push(toWorldPoint(axis, side, sample.u, sample.w, y));
  }

  points.push(toWorldPoint(axis, side, ROUTE_LEAD_U, LANE_OFFSET, y));
  return points;
}

function DetourRouteLine({ axis, side }: { axis: Axis; side: Side }) {
  const dashedLineRef = useRef<Line2>(null);
  const points = useMemo(() => buildDetourRoutePoints(axis, side), [axis, side]);
  const entryPoint = useMemo(() => toWorldPoint(axis, side, TURN_ENTRY_U, LANE_OFFSET, ROAD_TOP + 0.032), [axis, side]);
  const exitPoint = useMemo(() => toWorldPoint(axis, side, TURN_EXIT_U, LANE_OFFSET, ROAD_TOP + 0.032), [axis, side]);

  useFrame((_, delta) => {
    if (dashedLineRef.current?.material) {
      dashedLineRef.current.material.dashOffset -= delta * 3.2;
    }
  });

  return (
    <group>
      {/* Trilha base luminosa do desvio */}
      <Line points={points} color="#0ea5e9" lineWidth={6} transparent opacity={0.28} />
      {/* Linha tracejada animada indicando o sentido do fluxo */}
      <Line
        ref={dashedLineRef}
        points={points}
        color="#38bdf8"
        lineWidth={2.6}
        dashed
        dashScale={1}
        dashSize={0.85}
        gapSize={0.55}
      />
      {/* Marcadores de início e retorno do desvio */}
      {[entryPoint, exitPoint].map((pt, idx) => (
        <mesh key={idx} position={pt} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.18, 0.34, 20]} />
          <meshBasicMaterial color="#38bdf8" />
        </mesh>
      ))}
    </group>
  );
}

function DetourRoutes({ level }: { level: BlockLevel }) {
  const sides: Side[] = level === 'total' ? [1, -1] : [1];
  const axes: Axis[] = ['x', 'z'];

  return (
    <group>
      {axes.map((axis) =>
        sides.map((side) => <DetourRouteLine key={`${axis}-${side}`} axis={axis} side={side} />),
      )}
    </group>
  );
}

function lerpAngle(current: number, target: number, t: number): number {
  let diff = ((target - current + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (diff < -Math.PI) diff += Math.PI * 2;
  return current + diff * t;
}

interface Vehicle {
  axis: Axis;
  side: Side;
  kind: 'car' | 'bus';
  color: string;
  u: number;
  w: number;
  baseSpeed: number;
  speed: number;
  onDetour: boolean;
  detourDist: number;
  detourEntryU: number;
  heading: number;
}

const CAR_COLORS = ['#e2e8f0', '#60a5fa', '#34d399', '#f472b6', '#94a3b8', '#a78bfa', '#f1f5f9'];
const BUS_COLORS = ['#0d9488', '#0ea5e9'];
const SIZES = {
  car: { length: 1.5, width: 0.7, height: 0.6 },
  bus: { length: 2.8, width: 0.9, height: 1.0 },
};
const VEHICLES_PER_LANE: Record<Axis, number> = { x: 6, z: 4 };

function initialHeading(axis: Axis, side: Side): number {
  const dx = axis === 'x' ? side : 0;
  const dz = axis === 'z' ? side : 0;
  return Math.atan2(-dz, dx);
}

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
          u: (random() * 2 - 1) * LOOP_HALF_LENGTH,
          w: LANE_OFFSET,
          baseSpeed,
          speed: baseSpeed,
          onDetour: false,
          detourDist: 0,
          detourEntryU: TURN_ENTRY_U,
          heading: initialHeading(axis, side),
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

      const laneBlocked = active && (total || vehicle.side > 0);
      const distance = Math.abs(vehicle.u);
      const inQueue = active && distance < QUEUE_HALF_LENGTH;

      let speedFactor = 1;
      if (vehicle.onDetour) {
        speedFactor = 0.62;
      } else if (active) {
        speedFactor = laneBlocked ? (inQueue ? 0.68 : 1) : distance < 9.5 ? 0.72 : 1;
      }

      vehicle.speed += (vehicle.baseSpeed * speedFactor - vehicle.speed) * Math.min(1, dt * 2.5);

      let du = 1;
      let dw = 0;

      if (!vehicle.onDetour) {
        const prevU = vehicle.u;
        vehicle.u += vehicle.speed * dt;
        vehicle.w += (LANE_OFFSET - vehicle.w) * Math.min(1, dt * 4);

        // Inicia o desvio suavemente ao chegar no cruzamento anterior (-9)
        const reachedTurnPoint =
          laneBlocked &&
          ((prevU <= TURN_ENTRY_U && vehicle.u >= TURN_ENTRY_U) ||
            (vehicle.u >= TURN_ENTRY_U && vehicle.u <= -CROSS_STREET_POS + 0.4));

        if (reachedTurnPoint) {
          vehicle.onDetour = true;
          vehicle.detourEntryU = Math.min(-CROSS_STREET_POS + 0.2, Math.max(TURN_ENTRY_U, vehicle.u));
          vehicle.detourDist = Math.max(0, vehicle.u - vehicle.detourEntryU);
        }

        if (vehicle.u > LOOP_HALF_LENGTH) {
          vehicle.u -= LOOP_HALF_LENGTH * 2;
        }
      }

      if (vehicle.onDetour) {
        vehicle.detourDist += vehicle.speed * dt;
        if (vehicle.detourDist >= TOTAL_DETOUR_LEN) {
          vehicle.onDetour = false;
          vehicle.u = TURN_EXIT_U + (vehicle.detourDist - TOTAL_DETOUR_LEN);
          vehicle.w = LANE_OFFSET;
          du = 1;
          dw = 0;
        } else {
          const sample = sampleDetourPath(vehicle.detourDist, vehicle.detourEntryU);
          vehicle.u = sample.u;
          vehicle.w = sample.w;
          du = sample.du;
          dw = sample.dw;
        }
      }

      const worldX = vehicle.axis === 'x' ? vehicle.side * vehicle.u : vehicle.side * vehicle.w;
      const worldZ = vehicle.axis === 'x' ? vehicle.side * vehicle.w : vehicle.side * vehicle.u;
      const dx = vehicle.axis === 'x' ? vehicle.side * du : vehicle.side * dw;
      const dz = vehicle.axis === 'x' ? vehicle.side * dw : vehicle.side * du;

      const targetHeading = Math.atan2(-dz, dx);
      vehicle.heading = lerpAngle(vehicle.heading, targetHeading, Math.min(1, dt * 12));

      const height = SIZES[vehicle.kind].height;
      const y = ROAD_TOP + height / 2;
      node.position.set(worldX, y, worldZ);
      node.rotation.set(0, vehicle.heading, 0);
    });
  });

  return (
    <group>
      {active && <DetourRoutes level={level} />}
      {vehicles.map((vehicle, index) => {
        const size = SIZES[vehicle.kind];
        return (
          <group
            key={index}
            ref={(node) => {
              nodes.current[index] = node;
            }}
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
