// core/datasets/dlci/adapters/inventory.adapter.ts
// ======================================================
// PlannerAgent — Inventory Dataset Adapter
// Canonical Source of Truth
//
// Normalizes inventory dataset
// for optimizer consumption.
// ======================================================

export type InventoryRow = {
  sku: string;
  qty: number;
};

function num(x: unknown): number {
  const n = typeof x === "number" ? x : Number(x);
  return Number.isFinite(n) ? n : 0;
}

export function normalizeInventory(input: unknown[]): InventoryRow[] {

  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .map((r: any): InventoryRow => {

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
          r?.stock ??
          r?.onHand ??
          0
        );

      return {
        sku,
        qty,
      };

    })
    .filter((r) =>
      r.sku &&
      Number.isFinite(r.qty)
    );
}