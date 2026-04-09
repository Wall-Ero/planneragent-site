// ======================================================
// PlannerAgent — Correction Simulation Engine v1
// Simulate impact of correction actions on inventory
// ======================================================

import { NormalizedInventory } from "../normalization/inventory.normalizer";
import { CorrectionAction } from "../execution/correction.engine";

// ------------------------------------------------------
// TYPES
// ------------------------------------------------------

export type SimulationResult = {
  simulatedInventory: NormalizedInventory[];
  appliedActions: CorrectionAction[];
};

// ------------------------------------------------------
// MAIN
// ------------------------------------------------------

export function simulateCorrectionsOnInventory(
  inventory: NormalizedInventory[],
  actions: CorrectionAction[]
): SimulationResult {

  const map = new Map<string, number>();

  for (const row of inventory ?? []) {
    if (!row?.sku) continue;
    map.set(row.sku, Number(row.qty ?? 0));
  }

  for (const action of actions ?? []) {

    const prev = map.get(action.sku) ?? 0;

    switch (action.action) {

      case "POST_COMPONENT_CONSUMPTION":
        map.set(action.sku, prev - action.qty);
        break;

      case "ADJUST_INVENTORY_POS":
        map.set(action.sku, prev + action.qty);
        break;

      case "ADJUST_INVENTORY_NEG":
        map.set(action.sku, prev - action.qty);
        break;

      default:
        break;
    }
  }

  const simulatedInventory: NormalizedInventory[] = Array.from(map.entries()).map(
    ([sku, qty]) => ({
      sku,
      qty
    })
  );

  return {
    simulatedInventory,
    appliedActions: actions
  };
}