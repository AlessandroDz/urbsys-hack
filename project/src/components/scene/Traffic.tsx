import { Line } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import type { Group } from 'three';
import type { Line2 } from 'three-stdlib';
import type { BlockLevel } from '@/lib/interventions';
import { ROAD_TOP, createRandom } from './cityLayout';
import {
  CLOSURE_RADIUS,
  GRAPH,
  WORK_FRAME,
  blockedEdges,
  detourPaths,
  sampleAt,
  type Edge,
  type Sample,
} from './mapData';

const QUEUE_RADIUS = CLOSURE_RADIUS * 2.2;
const LANE_SHIFT = 0.4;
const VEHICLE_COUNT = 90;
const NO_EDGES: ReadonlySet<number> = new Set();

type Vec3 = [number, number, number];

function DetourRouteLine({ points }: { points: Vec3[] }) {
  const dashedLineRef = useRef<Line2>(null);

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
      {[points[0], points[points.length - 1]].map((pt, idx) => (
        <mesh key={idx} position={pt} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.18, 0.34, 20]} />
          <meshBasicMaterial color="#38bdf8" />
        </mesh>
      ))}
    </group>
  );
}

function DetourRoutes({ level }: { level: BlockLevel }) {
  const paths = useMemo(
    () => detourPaths(level).map((path) => path.map(([x, z]) => [x, ROAD_TOP + 0.03, z] as Vec3)),
    [level],
  );

  return (
    <group>
      {paths.map((points, index) => (
        <DetourRouteLine key={`${level}-${index}`} points={points} />
      ))}
    </group>
  );
}

function lerpAngle(current: number, target: number, t: number): number {
  let diff = ((target - current + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (diff < -Math.PI) diff += Math.PI * 2;
  return current + diff * t;
}

interface Vehicle {
  kind: 'car' | 'bus';
  color: string;
  edge: Edge;
  s: number;
  baseSpeed: number;
  speed: number;
  heading: number;
}

const CAR_COLORS = ['#e2e8f0', '#60a5fa', '#34d399', '#f472b6', '#94a3b8', '#a78bfa', '#f1f5f9'];
const BUS_COLORS = ['#0d9488', '#0ea5e9'];
const SIZES = {
  car: { length: 1.5, width: 0.7, height: 0.6 },
  bus: { length: 2.8, width: 0.9, height: 1.0 },
};

const KIND_WEIGHT: Record<string, number> = { primary: 4, tertiary: 2.5, primary_link: 1, unclassified: 1, residential: 1 };

function createSpawner(random: () => number) {
  const weights = GRAPH.edges.map((e) => e.length * (KIND_WEIGHT[e.kind] ?? 1));

  return (blocked: ReadonlySet<number>): Edge => {
    let total = 0;
    for (let i = 0; i < weights.length; i++) if (!blocked.has(i)) total += weights[i];
    let pick = random() * total;
    for (let i = 0; i < weights.length; i++) {
      if (blocked.has(i)) continue;
      pick -= weights[i];
      if (pick <= 0) return GRAPH.edges[i];
    }
    return GRAPH.edges[0];
  };
}

function endDirection(edge: Edge): [number, number] {
  const a = edge.pts[edge.pts.length - 2];
  const b = edge.pts[edge.pts.length - 1];
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  return [(b[0] - a[0]) / len, (b[1] - a[1]) / len];
}

function startDirection(edge: Edge): [number, number] {
  const a = edge.pts[0];
  const b = edge.pts[1];
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  return [(b[0] - a[0]) / len, (b[1] - a[1]) / len];
}

function chooseNext(edge: Edge, blocked: ReadonlySet<number>, random: () => number): Edge | null {
  const options = GRAPH.outgoing[edge.to].filter((id) => !blocked.has(id));
  const forward = options.filter((id) => GRAPH.edges[id].to !== edge.from);
  const pool = forward.length ? forward : options;
  if (!pool.length) return null;

  const heading = endDirection(edge);
  const weights = pool.map((id) => {
    const next = GRAPH.edges[id];
    const dir = startDirection(next);
    const dot = heading[0] * dir[0] + heading[1] * dir[1];
    return 0.1 + Math.max(0, dot) ** 2 * 3 + (next.kind === 'primary' ? 1.5 : 0);
  });
  let pick = random() * weights.reduce((sum, w) => sum + w, 0);
  for (let i = 0; i < pool.length; i++) {
    pick -= weights[i];
    if (pick <= 0) return GRAPH.edges[pool[i]];
  }
  return GRAPH.edges[pool[pool.length - 1]];
}

function createVehicles(spawn: (blocked: ReadonlySet<number>) => Edge, random: () => number): Vehicle[] {
  const vehicles: Vehicle[] = [];

  for (let i = 0; i < VEHICLE_COUNT; i++) {
    const isBus = random() < 0.12;
    const baseSpeed = isBus ? 2.2 + random() * 0.6 : 3 + random() * 1.4;
    const edge = spawn(NO_EDGES);
    vehicles.push({
      kind: isBus ? 'bus' : 'car',
      color: isBus
        ? BUS_COLORS[Math.floor(random() * BUS_COLORS.length)]
        : CAR_COLORS[Math.floor(random() * CAR_COLORS.length)],
      edge,
      s: random() * edge.length,
      baseSpeed,
      speed: baseSpeed,
      heading: Math.atan2(-edge.dir[1], edge.dir[0]),
    });
  }

  return vehicles;
}

interface TrafficProps {
  active: boolean;
  level: BlockLevel;
}

export function Traffic({ active, level }: TrafficProps) {
  const random = useMemo(() => createRandom(99), []);
  const spawn = useMemo(() => createSpawner(random), [random]);
  const vehicles = useMemo(() => createVehicles(spawn, random), [spawn, random]);
  const nodes = useRef<(Group | null)[]>([]);
  const sample = useRef<Sample>({ x: 0, z: 0, dx: 0, dz: 0 });

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const blocked = active ? blockedEdges(level) : NO_EDGES;
    const [cx, cz] = WORK_FRAME.center;

    vehicles.forEach((vehicle, index) => {
      const node = nodes.current[index];
      if (!node) return;

      // O trecho onde o carro está foi fechado pela obra: ele reaparece em outra via
      if (blocked.has(vehicle.edge.id)) {
        vehicle.edge = spawn(blocked);
        vehicle.s = random() * vehicle.edge.length;
      }

      const [mx, mz] = vehicle.edge.mid;
      const nearWork = active && Math.hypot(mx - cx, mz - cz) < QUEUE_RADIUS;
      const speedFactor = nearWork ? 0.7 : 1;
      vehicle.speed += (vehicle.baseSpeed * speedFactor - vehicle.speed) * Math.min(1, dt * 2.5);

      vehicle.s += vehicle.speed * dt;
      while (vehicle.s >= vehicle.edge.length) {
        const next = chooseNext(vehicle.edge, blocked, random);
        vehicle.s -= vehicle.edge.length;
        if (next) {
          vehicle.edge = next;
        } else {
          vehicle.edge = spawn(blocked);
          vehicle.s = 0;
        }
      }

      const { edge } = vehicle;
      sampleAt(edge.pts, edge.cum, vehicle.s, sample.current);
      const { dx, dz } = sample.current;
      const shift = edge.twoWay ? LANE_SHIFT : 0;
      const worldX = sample.current.x - dz * shift;
      const worldZ = sample.current.z + dx * shift;
      sample.current.x = worldX;
      sample.current.z = worldZ;

      const targetHeading = Math.atan2(-dz, dx);
      vehicle.heading = lerpAngle(vehicle.heading, targetHeading, Math.min(1, dt * 12));

      const height = SIZES[vehicle.kind].height;
      node.position.set(worldX, ROAD_TOP + height / 2, worldZ);
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
