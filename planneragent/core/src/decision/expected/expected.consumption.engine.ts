//core/src/decision/expected/expected.consumption.engine.ts

// ======================================================
// PlannerAgent — Expected Consumption Engine V1
// ======================================================

type Order = {
  sku: string;
  qty: number;
  orderId?: string;
};

type BomLink = {
  parentSku: string;
  componentSku: string;
  qtyPer: number;
};

export type ExpectedConsumption = {
  sku: string;
  expectedQty: number;
  source: "ORDER_BOM";
};

export function computeExpectedConsumption(
  orders: Order[],
  bom: BomLink[]
): ExpectedConsumption[] {
  const map = new Map<string, number>();

  for (const order of orders) {
    const components = bom.filter(
      (b) => b.parentSku === order.sku
    );

    for (const comp of components) {
      const expected = order.qty * comp.qtyPer;

      const prev = map.get(comp.componentSku) ?? 0;
      map.set(comp.componentSku, prev + expected);
    }
  }

  return Array.from(map.entries()).map(([sku, qty]) => ({
    sku,
    expectedQty: qty,
    source: "ORDER_BOM",
  }));
}
