// core/datasets/dlci/adapters/movord.adapter.ts
// ======================================================
// PlannerAgent — Production Orders Adapter
// Canonical Source of Truth
// ======================================================

export type MovOrdRow = {
  orderId: string;
  sku: string;
  qty: number;
};

function num(x: unknown): number {
  const n = typeof x === "number" ? x : Number(x);
  return Number.isFinite(n) ? n : 0;
}

export function normalizeMovOrd(input: unknown[]): MovOrdRow[] {

  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .map((r: any): MovOrdRow => {

      const orderId =
        String(
          r?.order ??
          r?.orderId ??
          r?.id ??
          ""
        ).trim();

      const sku =
        String(
          r?.sku ??
          r?.article ??
          r?.item ??
          ""
        ).trim();

      const qty =
        num(
          r?.qty ??
          r?.quantity ??
          0
        );

      return {
        orderId,
        sku,
        qty,
      };

    })
    .filter((r) =>
      r.orderId &&
      r.sku &&
      r.qty !== 0
    );
}