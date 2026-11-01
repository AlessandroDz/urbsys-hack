import {
  BufferAttribute,
  BufferGeometry,
  ExtrudeGeometry,
  Shape,
  Vector2,
} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import rawMap from '@/data/vitoria.json';
import placesData from '@/data/places.json';
import satelliteMeta from '@/data/satellite.json';
import type { BlockLevel } from '@/lib/interventions';
import { createRandom } from './cityLayout';

export type Vec2 = [number, number];

interface RawRoad {
  name: string | null;
  kind: string;
  oneway: boolean;
  pts: Vec2[];
}

interface RawBuilding {
  h: number | null;
  pts: Vec2[];
}

const data = rawMap as unknown as { half: number; roads: RawRoad[]; buildings: RawBuilding[] };

/** 1 unidade da cena = 3 m reais, mantendo o tamanho dos carros e pedestres do modelo anterior. */
export const MAP_SCALE = 1 / 3;
export const MAP_HALF = data.half * MAP_SCALE;
/** Metade do lado da imagem de satélite, em unidades da cena. */
export const SATELLITE_HALF = satelliteMeta.halfMeters * MAP_SCALE;
const M = MAP_SCALE;

const CHUNK_LENGTH = 6;
export const CLOSURE_RADIUS = 7.5;
export const IMPACT_RADIUS = 22;

const DRIVABLE_WIDTH_M: Record<string, number> = {
  primary: 10,
  primary_link: 6,
  tertiary: 8,
  unclassified: 6,
  residential: 6.5,
  service: 4,
};
const GRAPH_KINDS = new Set(['primary', 'primary_link', 'tertiary', 'unclassified', 'residential']);
const WALKABLE_WIDTH_M: Record<string, number> = {
  footway: 2,
  path: 1.8,
  pedestrian: 4,
  steps: 1.8,
  cycleway: 2.2,
};

/* ---------- utilidades de polilinha ---------- */

function cumulative(pts: Vec2[]): number[] {
  const cum = [0];
  for (let i = 1; i < pts.length; i++) {
    cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  }
  return cum;
}

export interface Sample {
  x: number;
  z: number;
  dx: number;
  dz: number;
}

export function sampleAt(pts: Vec2[], cum: number[], s: number, out: Sample): Sample {
  const total = cum[cum.length - 1];
  const clamped = Math.max(0, Math.min(total, s));
  let i = 1;
  while (i < cum.length - 1 && cum[i] < clamped) i++;
  const segLen = cum[i] - cum[i - 1] || 1;
  const t = (clamped - cum[i - 1]) / segLen;
  const [ax, az] = pts[i - 1];
  const [bx, bz] = pts[i];
  out.x = ax + (bx - ax) * t;
  out.z = az + (bz - az) * t;
  out.dx = (bx - ax) / segLen;
  out.dz = (bz - az) / segLen;
  return out;
}

function pointAt(pts: Vec2[], cum: number[], s: number): Vec2 {
  const sample = sampleAt(pts, cum, s, { x: 0, z: 0, dx: 0, dz: 0 });
  return [sample.x, sample.z];
}

/** Normal (esquerda) por vértice com junta em mitra, para desenhar faixas e deslocar calçadas. */
function vertexNormals(pts: Vec2[]): Array<{ nx: number; nz: number; scale: number }> {
  const segNormals = pts.slice(1).map((p, i) => {
    const dx = p[0] - pts[i][0];
    const dz = p[1] - pts[i][1];
    const len = Math.hypot(dx, dz) || 1;
    return [-dz / len, dx / len] as Vec2;
  });

  return pts.map((_, i) => {
    const a = segNormals[Math.max(0, i - 1)];
    const b = segNormals[Math.min(segNormals.length - 1, i)];
    let nx = a[0] + b[0];
    let nz = a[1] + b[1];
    const len = Math.hypot(nx, nz);
    if (len < 1e-6) return { nx: a[0], nz: a[1], scale: 1 };
    nx /= len;
    nz /= len;
    const cos = nx * a[0] + nz * a[1];
    return { nx, nz, scale: 1 / Math.max(0.5, cos) };
  });
}

function offsetPolyline(pts: Vec2[], distance: number): Vec2[] {
  const normals = vertexNormals(pts);
  return pts.map(([x, z], i) => [
    x + normals[i].nx * distance * normals[i].scale,
    z + normals[i].nz * distance * normals[i].scale,
  ]);
}

/* ---------- vias renderizáveis ---------- */

interface RoadRibbon {
  pts: Vec2[];
  width: number;
}

interface RoadSet {
  name: string | null;
  kind: string;
  oneway: boolean;
  pts: Vec2[];
  width: number;
}

const scaled = (pts: Vec2[]): Vec2[] => pts.map(([x, z]) => [x * M, z * M]);

const DRIVABLE_ROADS: RoadSet[] = data.roads
  .filter((r) => r.kind in DRIVABLE_WIDTH_M)
  .map((r) => ({ ...r, pts: scaled(r.pts), width: DRIVABLE_WIDTH_M[r.kind] * M }));

const WALKABLE_ROADS: RoadSet[] = data.roads
  .filter((r) => r.kind in WALKABLE_WIDTH_M)
  .map((r) => ({ ...r, pts: scaled(r.pts), width: WALKABLE_WIDTH_M[r.kind] * M }));

function ribbonGeometry(items: RoadRibbon[], y: number): BufferGeometry {
  const positions: number[] = [];

  for (const { pts, width } of items) {
    if (pts.length < 2) continue;
    const normals = vertexNormals(pts);
    const half = width / 2;
    const left = pts.map(([x, z], i) => [x + normals[i].nx * half * normals[i].scale, z + normals[i].nz * half * normals[i].scale]);
    const right = pts.map(([x, z], i) => [x - normals[i].nx * half * normals[i].scale, z - normals[i].nz * half * normals[i].scale]);

    for (let i = 0; i < pts.length - 1; i++) {
      const [l0x, l0z] = left[i];
      const [r0x, r0z] = right[i];
      const [l1x, l1z] = left[i + 1];
      const [r1x, r1z] = right[i + 1];
      positions.push(l0x, y, l0z, r0x, y, r0z, l1x, y, l1z);
      positions.push(r0x, y, r0z, r1x, y, r1z, l1x, y, l1z);
    }
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3));
  const normalsAttr = new Float32Array(positions.length);
  for (let i = 1; i < normalsAttr.length; i += 3) normalsAttr[i] = 1;
  geometry.setAttribute('normal', new BufferAttribute(normalsAttr, 3));
  return geometry;
}

function dashGeometry(roads: RoadSet[], y: number): BufferGeometry {
  const positions: number[] = [];
  const spacing = 1;
  const dashLength = 0.45;
  const halfWidth = 0.035;
  const sample: Sample = { x: 0, z: 0, dx: 0, dz: 0 };

  for (const road of roads) {
    if (road.kind !== 'primary' && road.kind !== 'tertiary') continue;
    const cum = cumulative(road.pts);
    const total = cum[cum.length - 1];
    for (let s = 1.5; s < total - 1.5; s += spacing) {
      sampleAt(road.pts, cum, s, sample);
      const nx = -sample.dz;
      const nz = sample.dx;
      const hx = (sample.dx * dashLength) / 2;
      const hz = (sample.dz * dashLength) / 2;
      const ax = sample.x - hx + nx * halfWidth;
      const az = sample.z - hz + nz * halfWidth;
      const bx = sample.x - hx - nx * halfWidth;
      const bz = sample.z - hz - nz * halfWidth;
      const cx = sample.x + hx + nx * halfWidth;
      const cz = sample.z + hz + nz * halfWidth;
      const dx = sample.x + hx - nx * halfWidth;
      const dz = sample.z + hz - nz * halfWidth;
      positions.push(ax, y, az, bx, y, bz, cx, y, cz, bx, y, bz, dx, y, dz, cx, y, cz);
    }
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3));
  const normalsAttr = new Float32Array(positions.length);
  for (let i = 1; i < normalsAttr.length; i += 3) normalsAttr[i] = 1;
  geometry.setAttribute('normal', new BufferAttribute(normalsAttr, 3));
  return geometry;
}

export interface RoadGeometries {
  sidewalk: BufferGeometry;
  road: BufferGeometry;
  footpath: BufferGeometry;
  dashes: BufferGeometry;
}

let roadGeometries: RoadGeometries | null = null;

export function getRoadGeometries(y: { sidewalk: number; road: number; footpath: number; dashes: number }): RoadGeometries {
  if (roadGeometries) return roadGeometries;

  const sidewalkItems = DRIVABLE_ROADS.filter((r) => r.kind !== 'service').map((r) => ({
    pts: r.pts,
    width: r.width + 4 * M,
  }));

  roadGeometries = {
    sidewalk: ribbonGeometry(sidewalkItems, y.sidewalk),
    road: ribbonGeometry(DRIVABLE_ROADS, y.road),
    footpath: ribbonGeometry(WALKABLE_ROADS, y.footpath),
    dashes: dashGeometry(DRIVABLE_ROADS, y.dashes),
  };
  return roadGeometries;
}

/* ---------- grafo de vias para o tráfego ---------- */

export interface Edge {
  id: number;
  from: number;
  to: number;
  pts: Vec2[];
  cum: number[];
  length: number;
  name: string | null;
  kind: string;
  twoWay: boolean;
  mid: Vec2;
  /** direção média do trecho (unitária) */
  dir: Vec2;
}

const nodeKey = (p: Vec2) => `${p[0].toFixed(2)},${p[1].toFixed(2)}`;

function buildGraph() {
  const nodeIds = new Map<string, number>();
  const nodes: Vec2[] = [];
  const getNode = (p: Vec2) => {
    const key = nodeKey(p);
    let id = nodeIds.get(key);
    if (id === undefined) {
      id = nodes.length;
      nodes.push(p);
      nodeIds.set(key, id);
    }
    return id;
  };

  const roads = DRIVABLE_ROADS.filter((r) => GRAPH_KINDS.has(r.kind));

  // vértices compartilhados entre vias viram cruzamentos
  const usage = new Map<string, number>();
  for (const road of roads) {
    for (const p of road.pts) usage.set(nodeKey(p), (usage.get(nodeKey(p)) ?? 0) + 1);
  }

  const edges: Edge[] = [];
  const outgoing: number[][] = [];

  const addEdge = (from: number, to: number, pts: Vec2[], road: RoadSet, twoWay: boolean) => {
    const cum = cumulative(pts);
    const length = cum[cum.length - 1];
    if (length < 1e-3) return;
    const first = pts[0];
    const last = pts[pts.length - 1];
    const edge: Edge = {
      id: edges.length,
      from,
      to,
      pts,
      cum,
      length,
      name: road.name,
      kind: road.kind,
      twoWay,
      mid: pointAt(pts, cum, length / 2),
      dir: [(last[0] - first[0]) / length, (last[1] - first[1]) / length],
    };
    edges.push(edge);
    while (outgoing.length <= Math.max(from, to)) outgoing.push([]);
    outgoing[from].push(edge.id);
  };

  for (const road of roads) {
    // 1. quebra a via em trechos entre cruzamentos
    const pieces: Vec2[][] = [];
    let current: Vec2[] = [road.pts[0]];
    for (let i = 1; i < road.pts.length; i++) {
      current.push(road.pts[i]);
      const isJunction = (usage.get(nodeKey(road.pts[i])) ?? 0) >= 2;
      if (isJunction && i < road.pts.length - 1) {
        pieces.push(current);
        current = [road.pts[i]];
      }
    }
    if (current.length > 1) pieces.push(current);

    // 2. fatia cada trecho em pedaços curtos para poder bloquear só a área da obra
    for (const piece of pieces) {
      const cum = cumulative(piece);
      const total = cum[cum.length - 1];
      const count = Math.max(1, Math.round(total / CHUNK_LENGTH));

      for (let c = 0; c < count; c++) {
        const s0 = (total * c) / count;
        const s1 = (total * (c + 1)) / count;
        const sub: Vec2[] = [c === 0 ? piece[0] : pointAt(piece, cum, s0)];
        for (let i = 1; i < piece.length - 1; i++) {
          if (cum[i] > s0 && cum[i] < s1) sub.push(piece[i]);
        }
        sub.push(c === count - 1 ? piece[piece.length - 1] : pointAt(piece, cum, s1));

        const from = getNode(sub[0]);
        const to = getNode(sub[sub.length - 1]);
        addEdge(from, to, sub, road, !road.oneway);
        if (!road.oneway) addEdge(to, from, [...sub].reverse(), road, true);
      }
    }
  }

  while (outgoing.length < nodes.length) outgoing.push([]);
  return { nodes, edges, outgoing };
}

export const GRAPH = buildGraph();

/* ---------- obra: posição, orientação e trechos bloqueados ---------- */

function nearestOnEdge(edge: Edge, p: Vec2) {
  let best = Infinity;
  let point: Vec2 = edge.pts[0];
  for (let i = 0; i < edge.pts.length - 1; i++) {
    const [ax, az] = edge.pts[i];
    const [bx, bz] = edge.pts[i + 1];
    const dx = bx - ax;
    const dz = bz - az;
    const len2 = dx * dx + dz * dz || 1;
    const t = Math.max(0, Math.min(1, ((p[0] - ax) * dx + (p[1] - az) * dz) / len2));
    const x = ax + dx * t;
    const z = az + dz * t;
    const d = Math.hypot(p[0] - x, p[1] - z);
    if (d < best) {
      best = d;
      point = [x, z];
    }
  }
  return { distance: best, point };
}

/** Distância máxima entre pistas para tratá-las como a mesma avenida (ex.: Av. Vitória, 12 m). */
const DUAL_CARRIAGEWAY_MAX = 6;

export interface WorkSiteFrame {
  center: Vec2;
  /** rotação em Y que alinha o eixo X local com a via */
  angle: number;
  /** distância do eixo central até o centro de cada pista */
  laneHalf: number;
  /** largura total da via (todas as pistas) */
  width: number;
  /** largura de uma pista */
  carriage: number;
  streetName: string | null;
  blocked: Record<BlockLevel, Set<number>>;
  detourCache: Map<BlockLevel, Vec2[][]>;
}

/** Encaixa a obra na via mais próxima do ponto e calcula tudo o que depende do lugar. */
export function createSite(point: Vec2): WorkSiteFrame {
  let nearest: { edge: Edge; point: Vec2; distance: number } | null = null;
  for (const edge of GRAPH.edges) {
    const hit = nearestOnEdge(edge, point);
    if (!nearest || hit.distance < nearest.distance) nearest = { edge, point: hit.point, distance: hit.distance };
  }
  if (!nearest) throw new Error('mapa sem vias');

  const { edge: reference } = nearest;
  const roadWidth = (DRIVABLE_WIDTH_M[reference.kind] ?? 6) * M;
  const direction = reference.dir;

  // pista oposta: pode ser a própria via de mão dupla (distância 0) ou a outra pista de uma avenida dividida
  let opposite: { point: Vec2; distance: number } | null = null;
  for (const edge of GRAPH.edges) {
    if (edge.dir[0] * direction[0] + edge.dir[1] * direction[1] > -0.5) continue;
    const hit = nearestOnEdge(edge, nearest.point);
    if (hit.distance <= DUAL_CARRIAGEWAY_MAX && (!opposite || hit.distance < opposite.distance)) opposite = hit;
  }

  let center: Vec2 = nearest.point;
  let laneHalf = 0;
  let carriage = roadWidth;
  let width = roadWidth;

  if (opposite && opposite.distance < 0.3) {
    // via de mão dupla: uma pista para cada lado do eixo
    laneHalf = roadWidth / 4;
    carriage = roadWidth / 2;
  } else if (opposite) {
    center = [(nearest.point[0] + opposite.point[0]) / 2, (nearest.point[1] + opposite.point[1]) / 2];
    laneHalf = Math.max(0.5, opposite.distance / 2);
    width = laneHalf * 2 + carriage;
  }

  const normal: Vec2 = [-direction[1], direction[0]];
  const side = (nearest.point[0] - center[0]) * normal[0] + (nearest.point[1] - center[1]) * normal[1];
  const dir: Vec2 = side >= 0 ? direction : [-direction[0], -direction[1]];
  const axisNormal: Vec2 = [-dir[1], dir[0]];

  const compute = (level: BlockLevel) => {
    const blocked = new Set<number>();
    for (const edge of GRAPH.edges) {
      const along = edge.dir[0] * direction[0] + edge.dir[1] * direction[1];
      if (Math.abs(along) < 0.8) continue;
      const dx = edge.mid[0] - center[0];
      const dz = edge.mid[1] - center[1];
      if (Math.hypot(dx, dz) > CLOSURE_RADIUS) continue;
      if (Math.abs(dx * axisNormal[0] + dz * axisNormal[1]) > width / 2 + 0.8) continue;
      if (level === 'total' || along > 0) blocked.add(edge.id);
    }
    return blocked;
  };

  return {
    center,
    angle: Math.atan2(-dir[1], dir[0]),
    laneHalf,
    width,
    carriage,
    streetName: reference.name,
    blocked: { partial: compute('partial'), total: compute('total') },
    detourCache: new Map(),
  };
}

function dijkstra(start: number, blocked: Set<number>) {
  const dist = new Array<number>(GRAPH.nodes.length).fill(Infinity);
  const via = new Array<number>(GRAPH.nodes.length).fill(-1);
  const done = new Array<boolean>(GRAPH.nodes.length).fill(false);
  dist[start] = 0;

  for (;;) {
    let u = -1;
    for (let i = 0; i < dist.length; i++) {
      if (!done[i] && dist[i] < Infinity && (u === -1 || dist[i] < dist[u])) u = i;
    }
    if (u === -1) break;
    done[u] = true;
    for (const id of GRAPH.outgoing[u]) {
      if (blocked.has(id)) continue;
      const edge = GRAPH.edges[id];
      if (dist[u] + edge.length < dist[edge.to]) {
        dist[edge.to] = dist[u] + edge.length;
        via[edge.to] = id;
      }
    }
  }

  return { dist, via };
}

function pathEdges(via: number[], start: number, goal: number): Edge[] {
  const chain: Edge[] = [];
  for (let node = goal; node !== start; ) {
    const edge = GRAPH.edges[via[node]];
    chain.unshift(edge);
    node = edge.from;
  }
  return chain;
}

const MAX_APPROACH_HOPS = 20;

const joinPts = (edges: Edge[]): Vec2[] => {
  const pts: Vec2[] = [];
  edges.forEach((edge, i) => pts.push(...(i === 0 ? edge.pts : edge.pts.slice(1))));
  return pts;
};

/**
 * Rota alternativa (uma por pista bloqueada). Os trechos fechados ficam no meio da via,
 * então a rota começa no último cruzamento antes da obra e volta à via no primeiro nó
 * depois dela que ainda seja alcançável pelas ruas abertas.
 */
export function detourPaths(site: WorkSiteFrame, level: BlockLevel): Vec2[][] {
  const cached = site.detourCache.get(level);
  if (cached) return cached;

  const blocked = site.blocked[level];
  const closed = [...blocked].map((id) => GRAPH.edges[id]);
  const paths: Vec2[][] = [];

  for (const head of closed) {
    if (closed.some((e) => e.to === head.from && e.from !== head.to)) continue;
    let tail = head;
    for (let next = closed.find((e) => e.from === tail.to && e.to !== tail.from); next; next = closed.find((e) => e.from === tail.to && e.to !== tail.from)) {
      tail = next;
    }

    // sequência de nós antes da obra (de trás para frente) e depois dela
    const upstream: Array<{ node: number; edges: Edge[] }> = [{ node: head.from, edges: [] }];
    for (let hop = 0; hop < MAX_APPROACH_HOPS; hop++) {
      const last = upstream[upstream.length - 1];
      const back = GRAPH.edges.find((e) => e.to === last.node && !blocked.has(e.id) && e.name === head.name);
      if (!back) break;
      upstream.push({ node: back.from, edges: [back, ...last.edges] });
    }

    const downstream: Array<{ node: number; edges: Edge[] }> = [{ node: tail.to, edges: [] }];
    for (let hop = 0; hop < MAX_APPROACH_HOPS; hop++) {
      const last = downstream[downstream.length - 1];
      const forward = GRAPH.outgoing[last.node]
        .map((id) => GRAPH.edges[id])
        .find((e) => !blocked.has(e.id) && e.name === head.name);
      if (!forward) break;
      downstream.push({ node: forward.to, edges: [...last.edges, forward] });
    }

    // menor saída a montante que consiga voltar à via a jusante sem passar pela obra
    for (const from of upstream) {
      const { dist, via } = dijkstra(from.node, blocked);
      const to = downstream.find((d) => dist[d.node] < Infinity);
      if (!to) continue;
      const middle = pathEdges(via, from.node, to.node);
      paths.push(joinPts([...from.edges, ...middle, ...to.edges]));
      break;
    }
  }

  site.detourCache.set(level, paths);
  return paths;
}

/* ---------- pedestres ---------- */

export interface WalkPath {
  pts: Vec2[];
  cum: number[];
  length: number;
}

function buildWalkPaths(): WalkPath[] {
  const random = createRandom(2718);
  const paths: WalkPath[] = [];

  const push = (pts: Vec2[]) => {
    const cum = cumulative(pts);
    const length = cum[cum.length - 1];
    if (length >= 8) paths.push({ pts, cum, length });
  };

  for (const road of DRIVABLE_ROADS) {
    if (road.kind === 'service' || road.kind === 'primary_link') continue;
    const side = random() < 0.5 ? 1 : -1;
    push(offsetPolyline(road.pts, side * (road.width / 2 + 0.55 * M * 3)));
  }
  for (const road of WALKABLE_ROADS) {
    if (road.kind === 'steps') continue;
    push(road.pts);
  }

  return paths;
}

export const WALK_PATHS = buildWalkPaths();

/* ---------- nomes das ruas ---------- */

export interface StreetLabelSpec {
  name: string;
  position: [number, number];
  primary: boolean;
}

function abbreviate(name: string) {
  return name
    .replace(/^Avenida /, 'Av. ')
    .replace(/^Rua /, 'R. ')
    .replace(/^Travessa /, 'Tv. ')
    .replace(/^Marechal /, 'Mal. ')
    .replace('Marechal ', 'Mal. ')
    .replace(/^Doutor /, 'Dr. ')
    .replace(/^Professor /, 'Prof. ');
}

function buildStreetLabels(): StreetLabelSpec[] {
  const byName = new Map<string, { kind: string; total: number; best: RoadSet; bestLength: number }>();
  for (const road of DRIVABLE_ROADS) {
    if (!road.name || road.kind === 'service') continue;
    const length = cumulative(road.pts).slice(-1)[0];
    const entry = byName.get(road.name);
    if (!entry) {
      byName.set(road.name, { kind: road.kind, total: length, best: road, bestLength: length });
    } else {
      entry.total += length;
      if (length > entry.bestLength) {
        entry.best = road;
        entry.bestLength = length;
      }
    }
  }

  const entries = [...byName.entries()];
  const major = entries.filter(([, e]) => e.kind === 'primary' || e.kind === 'tertiary');
  const minor = entries
    .filter(([, e]) => e.kind !== 'primary' && e.kind !== 'tertiary')
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 10);

  const out: StreetLabelSpec[] = [];
  for (const [name, entry] of [...major, ...minor]) {
    const cum = cumulative(entry.best.pts);
    const [x, z] = pointAt(entry.best.pts, cum, cum[cum.length - 1] / 2);
    out.push({ name: abbreviate(name), position: [x, z], primary: major.some(([n]) => n === name) });
  }
  return out;
}

export const STREET_LABELS = buildStreetLabels();

/* ---------- prédios ---------- */

/** Fachadas em tons de prédio brasileiro: branco, bege, pastel e alguns cinzas. */
const FACADES = ['#ece6da', '#ddd3c1', '#cfc4b0', '#f2ede3', '#c4baa8', '#d9cdb9', '#aab6bf', '#e6d9c4', '#cdbfa8', '#f4efe6'];

const hexToRgb = (hex: string): [number, number, number] => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};

/* ---------- lugares de interesse ---------- */

export type PlaceCategory = 'bank' | 'supermarket' | 'health' | 'education' | 'food' | 'fuel';

export interface Place {
  name: string;
  category: PlaceCategory;
  /** posição em unidades da cena */
  x: number;
  z: number;
}

export const PLACE_COLORS: Record<PlaceCategory, string> = {
  bank: '#f59e0b',
  supermarket: '#22c55e',
  health: '#ef4444',
  education: '#38bdf8',
  food: '#fb923c',
  fuel: '#a78bfa',
};

export const PLACES: Place[] = (placesData as Array<{ name: string; category: PlaceCategory; x: number; z: number }>).map(
  (place) => ({ ...place, x: place.x * M, z: place.z * M }),
);

/** Distância (m) de um ponto ao polígono; 0 se estiver dentro. */
function distanceToPolygon(x: number, z: number, poly: Vec2[]) {
  let inside = false;
  let best = Infinity;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, zi] = poly[i];
    const [xj, zj] = poly[j];
    if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside;
    const dx = xj - xi;
    const dz = zj - zi;
    const t = Math.max(0, Math.min(1, ((x - xi) * dx + (z - zi) * dz) / (dx * dx + dz * dz || 1)));
    best = Math.min(best, Math.hypot(x - (xi + dx * t), z - (zi + dz * t)));
  }
  return inside ? 0 : best;
}

/** Prédio mais próximo de cada lugar (até 12 m), em índice de data.buildings. */
function matchPlaceBuildings(): Map<number, Place> {
  const matches = new Map<number, Place>();
  for (const place of PLACES) {
    let bestIndex = -1;
    let bestDistance = 12;
    data.buildings.forEach((building, index) => {
      const pts = closedFootprint(building);
      if (!pts) return;
      const distance = distanceToPolygon(place.x / M, place.z / M, pts);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = index;
      }
    });
    if (bestIndex >= 0) matches.set(bestIndex, place);
  }
  return matches;
}

/* ---------- campus da FAESA ---------- */

interface CampusBuilding {
  /** centro da planta, em metros (como no OSM, para sobreviver a um novo download) */
  at: Vec2;
  heightM?: number;
}

/** Prédios do campus Vitória (Av. Vitória, 2220), identificados sobre a imagem de satélite. */
const CAMPUS_BUILDINGS: CampusBuilding[] = [
  { at: [-5, 29], heightM: 25.6 }, // torre principal, 8 pavimentos
  { at: [-21, 19] },
  { at: [-28, 39] },
  { at: [-35, 46] },
  { at: [-38, 31] },
  { at: [-43, 27] },
  { at: [8, 76] },
  { at: [33, 110] },
  { at: [-25, 73] },
  { at: [-33, 88] },
  { at: [-49, 86] },
  { at: [-40, 71] },
  { at: [-66, 52] },
];

const CAMPUS_FACADE: [number, number, number] = hexToRgb('#f3f1ec');

/** Contorno aproximado do terreno do campus (prédios, estacionamento e pátio), em unidades da cena. */
export const CAMPUS_OUTLINE: Vec2[] = (
  [
    [-71.5, 57],
    [-64.1, 47],
    [-41.4, 17.5],
    [-39.7, 16.5],
    [-8.6, 7.6],
    [6.2, 5.3],
    [33.7, 75.9],
    [47.3, 122.9],
    [25.4, 125.7],
    [-51.2, 91.9],
    [-55.3, 88.3],
  ] as Vec2[]
).map(([x, z]) => [x * M, z * M]);

/** Onde fica o letreiro: sobre a torre principal. */
export const CAMPUS_LABEL: { position: Vec2; heightM: number } = { position: [-5 * M, 29 * M], heightM: 25.6 };

/** Passarela coberta que liga os blocos do campus. */
export const CAMPUS_WALKWAY: { from: Vec2; to: Vec2 } = {
  from: [-20.4 * M, 51.1 * M],
  to: [0.9 * M, 79.9 * M],
};

/** Devolve a cor (0–1) da imagem de satélite no ponto (x, z) da cena, ou null se estiver fora dela. */
export type RoofSampler = (x: number, z: number) => [number, number, number] | null;

function polygonArea(pts: Vec2[]) {
  let area = 0;
  for (let i = 0; i < pts.length; i++) {
    const [ax, az] = pts[i];
    const [bx, bz] = pts[(i + 1) % pts.length];
    area += ax * bz - bx * az;
  }
  return Math.abs(area) / 2;
}

function closedFootprint(building: RawBuilding): Vec2[] | null {
  const pts = [...building.pts];
  if (pts.length > 1 && pts[0][0] === pts[pts.length - 1][0] && pts[0][1] === pts[pts.length - 1][1]) pts.pop();
  return pts.length >= 3 ? pts : null;
}

export function getBuildingGeometry(sampleRoof?: RoofSampler, highlightPlaces = false): BufferGeometry | null {
  const random = createRandom(777);
  const geometries: BufferGeometry[] = [];
  const facades = FACADES.map(hexToRgb);
  const placeBuildings = highlightPlaces ? matchPlaceBuildings() : new Map<number, Place>();

  for (const [buildingIndex, building] of data.buildings.entries()) {
    const pts = closedFootprint(building);
    if (!pts) continue;

    const area = polygonArea(pts);
    if (area < 8) continue;

    // sem altura no OSM: estima pela área da planta (torres residenciais costumam ter plantas grandes)
    let heightM = building.h ?? 6 + random() * 10;
    if (building.h === null && area > 250) heightM *= 1 + random() * 1.6;
    heightM = Math.min(heightM, 80);

    let cx = 0;
    let cz = 0;
    for (const [x, z] of pts) {
      cx += x * M;
      cz += z * M;
    }
    cx /= pts.length;
    cz /= pts.length;

    // prédios do campus da FAESA: volumetria mínima de prédio universitário e fachada clara
    const campus = CAMPUS_BUILDINGS.find((b) => Math.hypot(b.at[0] * M - cx, b.at[1] * M - cz) < 1);
    if (campus) heightM = campus.heightM ?? Math.max(heightM, 10);

    let geometry: BufferGeometry;
    try {
      const shape = new Shape(pts.map(([x, z]) => new Vector2(x * M, -z * M)));
      geometry = new ExtrudeGeometry(shape, { depth: heightM * M, bevelEnabled: false });
    } catch {
      continue;
    }
    geometry.rotateX(-Math.PI / 2);
    geometry.deleteAttribute('uv');

    const [fr, fg, fb] = facades[Math.floor(random() * facades.length)];
    const wallShade = 0.68 + random() * 0.12;
    let [wr, wg, wb] = campus ? CAMPUS_FACADE : [fr, fg, fb];

    // telhado com a cor real vista do alto; sem satélite, um cinza de laje
    const sampled = sampleRoof?.(cx, cz);
    let roof = sampled ? sampled.map((c) => c * 0.8) : [0.45, 0.45, 0.47];

    // prédio de um lugar de interesse: fachada e telhado na cor da categoria
    const place = placeBuildings.get(buildingIndex);
    if (place) {
      const accent = hexToRgb(PLACE_COLORS[place.category]);
      const base = [wr, wg, wb];
      [wr, wg, wb] = [0, 1, 2].map((k) => base[k] * 0.35 + (accent[k] * 0.65) / wallShade) as [number, number, number];
      roof = accent.map((c) => c * 0.9);
    }

    const position = geometry.getAttribute('position');
    const normal = geometry.getAttribute('normal');
    const colorData = new Float32Array(position.count * 3);
    for (let i = 0; i < position.count; i++) {
      const isRoof = normal.getY(i) > 0.5;
      colorData[i * 3] = isRoof ? roof[0] : Math.min(1, wr * wallShade);
      colorData[i * 3 + 1] = isRoof ? roof[1] : Math.min(1, wg * wallShade);
      colorData[i * 3 + 2] = isRoof ? roof[2] : Math.min(1, wb * wallShade);
    }
    geometry.setAttribute('color', new BufferAttribute(colorData, 3));

    geometries.push(geometry);
  }

  const merged = geometries.length ? mergeGeometries(geometries, false) : null;
  geometries.forEach((g) => g.dispose());
  return merged;
}

/* ---------- árvores ---------- */

export interface TreeSpot {
  x: number;
  z: number;
  scale: number;
  tint: number;
}

function insidePolygon(x: number, z: number, poly: Vec2[]) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, zi] = poly[i];
    const [xj, zj] = poly[j];
    if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside;
  }
  return inside;
}

let treeSpots: TreeSpot[] | null = null;

/** Arborização das calçadas: uma árvore a cada poucos metros, fora da planta dos prédios. */
export function getTrees(): TreeSpot[] {
  if (treeSpots) return treeSpots;

  const random = createRandom(4242);
  const footprints = data.buildings
    .map(closedFootprint)
    .filter((pts): pts is Vec2[] => pts !== null)
    .map((pts) => {
      const poly = pts.map(([x, z]) => [x * M, z * M] as Vec2);
      const xs = poly.map((p) => p[0]);
      const zs = poly.map((p) => p[1]);
      return { poly, minX: Math.min(...xs), maxX: Math.max(...xs), minZ: Math.min(...zs), maxZ: Math.max(...zs) };
    });

  const blocked = (x: number, z: number) =>
    footprints.some((f) => x >= f.minX && x <= f.maxX && z >= f.minZ && z <= f.maxZ && insidePolygon(x, z, f.poly));

  const spots: TreeSpot[] = [];
  const sample: Sample = { x: 0, z: 0, dx: 0, dz: 0 };

  for (const road of DRIVABLE_ROADS) {
    if (road.kind === 'service' || road.kind === 'primary_link') continue;
    const cum = cumulative(road.pts);
    const total = cum[cum.length - 1];
    const chance = road.kind === 'primary' ? 0.4 : 0.6;

    for (let s = 2 + random() * 2; s < total - 2; s += 3 + random() * 1.5) {
      if (random() > chance) continue;
      sampleAt(road.pts, cum, s, sample);
      const side = random() < 0.5 ? 1 : -1;
      const offset = road.width / 2 + 0.55;
      const x = sample.x - sample.dz * side * offset;
      const z = sample.z + sample.dx * side * offset;
      if (blocked(x, z)) continue;
      spots.push({ x, z, scale: 0.8 + random() * 0.7, tint: random() });
    }
  }

  treeSpots = spots;
  return spots;
}
