// core/src/decision/optimizer/seeds.ts
// ======================================================
// PlannerAgent — Optimizer v1 Deterministic Seeds
// Canonical Source of Truth
// ======================================================

/**
 * Simple deterministic PRNG (Mulberry32) seeded from requestId.
 * Determinism is required for auditability.
 */
export function seedFromRequestId(requestId: string): number {
  // FNV-1a 32-bit hash
  let h = 0x811c9dc5;
  for (let i = 0; i < requestId.length; i++) {
    h ^= requestId.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  // Ensure unsigned 32-bit
  return h >>> 0;
}

export function mulberry32(seed: number) {
  let t = seed >>> 0;
  return function next(): number {
    t += 0x6d2b79f5;
    let x = Math.imul(t ^ (t >>> 15), 1 | t);
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

export function pickInt(rng: () => number, min: number, max: number): number {
  if (max <= min) return min;
  const r = rng();
  return min + Math.floor(r * (max - min + 1));
}