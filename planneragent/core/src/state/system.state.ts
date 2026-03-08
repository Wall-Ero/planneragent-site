// core/src/state/system.state.ts
// ======================================================
// PlannerAgent — System State Engine
// Canonical Source of Truth
// ======================================================

export interface SystemState {

  timestamp: string;

  inventory: Map<string, number>;

  openOrders: Map<string, number>;

  supplyOrders: Map<string, number>;

}

export function buildSystemState(params: {

  inventory?: any[]
  orders?: any[]

}): SystemState {

  const inventory = new Map<string, number>();
  const openOrders = new Map<string, number>();

  for (const i of params.inventory ?? []) {

    const sku = String(i?.sku ?? i?.item ?? "");
    const qty = Number(i?.onHand ?? i?.qty ?? 0);

    inventory.set(sku, qty);

  }

  for (const o of params.orders ?? []) {

    const sku = String(o?.sku ?? "");
    const qty = Number(o?.qty ?? 0);

    openOrders.set(sku, (openOrders.get(sku) ?? 0) + qty);

  }

  return {

    timestamp: new Date().toISOString(),
    inventory,
    openOrders,
    supplyOrders: new Map(),

  };

}
