// core/datasets/dlci/adapters/movmag.adapter.ts
// ======================================================
// PlannerAgent — Warehouse Movements Adapter
// Canonical Source of Truth
// ======================================================

export type MovMagRow = {
  orderId?: string;
  sku: string;
  qty: number;
  causale?: string;
};

function num(x: unknown): number {
  const n = typeof x === "number" ? x : Number(x);
  return Number.isFinite(n) ? n : 0;
}

export function normalizeMovMag(input: unknown[]): MovMagRow[] {

  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .map((r: any): MovMagRow => {

      const orderId =
        r?.order ??
        r?.orderId ??
        undefined;

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

      const causale =
        r?.causale ??
        r?.reason ??
        undefined;

      return {
        orderId,
        sku,
        qty,
        causale,
      };

    })
    .filter((r) =>
      r.sku &&
      Number.isFinite(r.qty)
    );
}