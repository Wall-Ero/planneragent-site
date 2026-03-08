// src/decision/optimizer/materialDemand.v1.ts
// ======================================================
// PlannerAgent — Material Demand from Inferred BOM
// Canonical Snapshot
// Source of Truth
//
// Purpose
// Compute component demand using inferred BOM.
// Used by optimizer to detect material shortages.
// ======================================================

export type BomComponent = {
  parent: string;
  component: string;
  ratio: number;
};

export type OrderRow = {
  id?: string;
  sku?: string;
  qty?: number;
};

export type MaterialDemand = {
  sku: string;
  required: number;
};

export function computeMaterialDemand(
  orders: OrderRow[],
  bom: BomComponent[]
): MaterialDemand[] {

  const demandMap = new Map<string, number>();

  for (const order of orders) {

    const parent = order.sku;
    const qty = order.qty ?? 0;

    if (!parent || qty <= 0) continue;

    const components = bom.filter(b => b.parent === parent);

    for (const comp of components) {

      const required = qty * comp.ratio;

      const prev = demandMap.get(comp.component) ?? 0;

      demandMap.set(
        comp.component,
        prev + required
      );

    }

  }

  return Array.from(demandMap.entries()).map(([sku, required]) => ({
    sku,
    required
  }));

}
