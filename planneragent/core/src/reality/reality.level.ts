// core/src/reality/reality.level.ts
// ======================================================
// PlannerAgent — Data Awareness Level
// Canonical Source of Truth
// ======================================================

import type { DataAwarenessLevel } from "./reality.types";

export function computeDataAwarenessLevel(input: {
  orders?: unknown[];
  inventory?: unknown[];
  movements?: unknown[];
}): DataAwarenessLevel {

  const hasOrders = Array.isArray(input.orders) && input.orders.length > 0;
  const hasInventory = Array.isArray(input.inventory) && input.inventory.length > 0;
  const hasMovements = Array.isArray(input.movements) && input.movements.length > 0;

  if (!hasOrders && !hasInventory && !hasMovements) return 0;

  if (hasOrders && !hasInventory) return 1;

  if (hasOrders && hasInventory && !hasMovements) return 2;

  if (hasOrders && hasInventory && hasMovements) return 3;

  return 1;
}
