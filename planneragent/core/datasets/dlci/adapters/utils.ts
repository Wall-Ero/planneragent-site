// datasets/dlci/adapters/utils.ts

export type Row = Record<string, unknown>;

export function num(x: unknown, fallback = 0): number {
  const n = typeof x === "number" ? x : Number(x);
  return Number.isFinite(n) ? n : fallback;
}

export function str(x: unknown): string {
  return String(x ?? "").trim();
}

export function pick(row: Row, keys: string[]): unknown {
  for (const k of keys) {
    if (k in row && row[k] !== undefined && row[k] !== null) {
      return row[k];
    }
  }
  return undefined;
}