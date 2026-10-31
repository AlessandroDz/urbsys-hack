export const ROAD_TOP = 0.1;
export const SIDEWALK_TOP = 0.16;
export const AVENUE_HALF_WIDTH = 2.2;
export const STREET_HALF_WIDTH = 1.4;
export const LANE_OFFSET = 1.1;
export const DETOUR_OFFSET = 8.5;
export const CORE_HALF_LENGTH = 9.5;
export const QUEUE_HALF_LENGTH = 15;
export const LOOP_HALF_LENGTH = 33;
export const ROAD_LENGTH = 90;
export const BLOCK_MARGIN = 0.8;
export const BANDS = [-36, -27, -18, -9, 0, 9, 18, 27, 36];

export const halfWidthOf = (band: number) => (band === 0 ? AVENUE_HALF_WIDTH : STREET_HALF_WIDTH);

export interface Span {
  min: number;
  max: number;
}

export function blockSpans(): Span[] {
  const spans: Span[] = [];
  for (let i = 0; i < BANDS.length - 1; i++) {
    const from = BANDS[i];
    const to = BANDS[i + 1];
    spans.push({
      min: from + halfWidthOf(from) + BLOCK_MARGIN,
      max: to - halfWidthOf(to) - BLOCK_MARGIN,
    });
  }
  return spans;
}

export function createRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
