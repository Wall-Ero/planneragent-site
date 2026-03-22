// core/datasets/dlci/adapters/orders.adapter.ts
// ======================================================
// PlannerAgent — Orders Dataset Adapter
// Canonical Source of Truth
//
// Normalizes incoming orders dataset
// into canonical optimizer structure.
// ======================================================

export type OrderRow = {
  orderId: string;
  sku: string;
  qty: number;
  dueDate?: string;
};

function num(x: unknown): number {
  const n = typeof x === "number" ? x : Number(x);
  return Number.isFinite(n) ? n : 0;
}

export function normalizeOrders(input: unknown[]): OrderRow[] {

  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .map((r: any): OrderRow => {

      const orderId =
        String(
          r?.orderId ??
          r?.order_id ??
          r?.id ??
          ""
        ).trim();

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

      const dueDate =
        r?.dueDate ??
        r?.due_date ??
        r?.deliveryDate ??
        undefined;

      return {
        orderId,
        sku,
        qty,
        dueDate,
      };

    })
    .filter((r) =>
  r.sku &&
  Number.isFinite(r.qty) &&
  r.qty !== 0
);
}