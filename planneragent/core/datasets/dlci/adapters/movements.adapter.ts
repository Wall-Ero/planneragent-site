// core/datasets/dlci/adapters/movements.adapter.ts
// ======================================================
// PlannerAgent — Movements Dataset Adapter
// Canonical Source of Truth
//
// Normalizes stock movement dataset.
// ======================================================

export type MovementRow = {
  sku: string;
  qty: number;
  type?: string;
  lead_time?: number;
};

function num(x: unknown): number {
  const n = typeof x === "number" ? x : Number(x);
  return Number.isFinite(n) ? n : 0;
}

export function normalizeMovements(input: unknown[]): MovementRow[] {

  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .map((r: any): MovementRow => {

      const sku =
        String(
          r?.sku ??
          r?.article ??
          r?.item ??
          r?.code ??
          ""
        ).trim();

      const qty =
        num(
          r?.qty ??
          r?.quantity ??
          r?.amount ??
          0
        );

      const type =
        r?.type ??
        r?.movement_type ??
        undefined;

      const lead_time =
        num(
          r?.lead_time ??
          r?.leadTime ??
          0
        );

      return {
        sku,
        qty,
        type,
        lead_time,
      };

    })
    .filter((r) =>
      r.sku &&
      Number.isFinite(r.qty) &&
      r.qty !== 0
    );
}