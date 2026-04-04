// core/src/decision/allocation/computeAllocation.v2.ts
// ======================================================
// PlannerAgent — Allocation Engine V2
// Canonical Source of Truth
// ======================================================

export type AllocationOrder = {
  orderId: string;
  sku: string;
  qty: number;
  dueDate?: string;
  priority?: number;
};

export type AllocationInventory = {
  sku: string;
  qty: number;
};

export type AllocationResult = {
  allocationLog: Array<{
    orderId: string;
    sku: string;
    demand: number;
    available: number;
    allocated: number;
    shortage: number;
    remaining: number;
  }>;
  shortageMap: Record<string, number>;
  remainingInventory: Record<string, number>;
};

// ------------------------------------------------------
// HELPERS
// ------------------------------------------------------

function num(v: unknown): number {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

// ------------------------------------------------------
// MAIN
// ------------------------------------------------------

export function computeAllocationV2(
  orders: AllocationOrder[],
  inventory: AllocationInventory[]
): AllocationResult {

  // --------------------------------------------------
  // INIT INVENTORY MAP
  // --------------------------------------------------

  const inventoryMap = new Map<string, number>();

  for (const inv of inventory ?? []) {
    const sku = inv.sku;
    const qty = num(inv.qty);

    if (!sku) continue;

    inventoryMap.set(sku, qty);
  }

  // --------------------------------------------------
  // SORT ORDERS (future-proof: priority / dueDate)
  // --------------------------------------------------

  const sortedOrders = [...(orders ?? [])].sort((a, b) => {
    const pA = a.priority ?? 0;
    const pB = b.priority ?? 0;

    if (pA !== pB) return pB - pA;

    if (a.dueDate && b.dueDate) {
      return a.dueDate.localeCompare(b.dueDate);
    }

    return 0;
  });

  const allocationLog: AllocationResult["allocationLog"] = [];
  const shortageMap: Record<string, number> = {};

  // --------------------------------------------------
  // ALLOCATION LOOP
  // --------------------------------------------------

  for (const order of sortedOrders) {

    const sku = order.sku;
    if (!sku) continue;

    const demand = num(order.qty);

    const available = inventoryMap.get(sku) ?? 0;

    const allocated = Math.min(available, demand);

    const shortage = Math.max(0, demand - allocated);

    const remaining = available - allocated;

    // 🔥 CORE: SCALA INVENTORY
    inventoryMap.set(sku, remaining);

    // --------------------------------------------------
    // LOG
    // --------------------------------------------------

    const logEntry = {
      orderId: order.orderId,
      sku,
      demand,
      available,
      allocated,
      shortage,
      remaining
    };

    allocationLog.push(logEntry);

    // --------------------------------------------------
    // AGGREGATE SHORTAGE
    // --------------------------------------------------

    shortageMap[sku] = (shortageMap[sku] ?? 0) + shortage;
  }

  // --------------------------------------------------
  // FINAL INVENTORY
  // --------------------------------------------------

  const remainingInventory: Record<string, number> = {};

  for (const [sku, qty] of inventoryMap.entries()) {
    remainingInventory[sku] = qty;
  }

  // --------------------------------------------------
  // DEBUG (CRITICO)
  // --------------------------------------------------

  console.log("ALLOC_V2_LOG", allocationLog);
  console.log("ALLOC_V2_SHORTAGE_MAP", shortageMap);
  console.log("ALLOC_V2_REMAINING_INV", remainingInventory);

  // --------------------------------------------------
  // RETURN
  // --------------------------------------------------

  return {
    allocationLog,
    shortageMap,
    remainingInventory
  };
}