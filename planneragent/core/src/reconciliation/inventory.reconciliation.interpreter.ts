//src/reconstruction/inventory.reconciliation.guard.ts

// ======================================================
// PlannerAgent — Inventory Reconciliation Guard v1
// Prevent false inventory mismatches caused by movement double-counting
// ======================================================

import { NormalizedMovement } from "../normalization/movements.normalizer";
import { InventoryReconciliationRow } from "../reality/inventory.reconciliation";

// ------------------------------------------------------
// TYPES
// ------------------------------------------------------

export interface InventoryGuardResult {
  isFalseMismatch: boolean;
  reason?: string;
  adjustedRows?: InventoryReconciliationRow[];
}

// ------------------------------------------------------
// MAIN GUARD
// ------------------------------------------------------

export function applyInventoryReconciliationGuard(
  rows: InventoryReconciliationRow[],
  movements: NormalizedMovement[]
): InventoryGuardResult {

  if (!rows || rows.length === 0) {
    return { isFalseMismatch: false };
  }

  const movementMap = buildMovementImpactMap(movements);

  const adjustedRows: InventoryReconciliationRow[] = [];

  let falseMismatchDetected = false;

  for (const row of rows) {

    const movementImpact = movementMap.get(row.sku) ?? 0;

    // --------------------------------------------------
    // 🔍 CORE LOGIC
    // --------------------------------------------------
    // If delta is fully explained by movements,
    // it's likely a double-counting artifact
    // --------------------------------------------------

    const isExplainedByMovements =
      Math.abs(row.delta - movementImpact) < 0.0001;

    if (isExplainedByMovements) {

      falseMismatchDetected = true;

      adjustedRows.push({
  ...row,
  explainedByMovements: true,
  explanation:
    "Delta fully explained by movement set (possible double-counting)",
    // 👇 downgrade intelligente
    status: row.absDelta === 0 ? "MATCH" : "MINOR"
  });

      continue;
    }

    adjustedRows.push(row);
  }

  return {
    isFalseMismatch: falseMismatchDetected,
    reason: falseMismatchDetected
      ? "DELTA_EXPLAINED_BY_MOVEMENTS"
      : undefined,
    adjustedRows
  };
}

// ------------------------------------------------------
// MOVEMENT IMPACT MAP
// ------------------------------------------------------

function buildMovementImpactMap(
  movements: NormalizedMovement[]
): Map<string, number> {

  const map = new Map<string, number>();

  for (const m of movements ?? []) {

    if (!m?.sku) continue;

    const prev = map.get(m.sku) ?? 0;
    const qty = Number(m.qty ?? 0);

    switch (m.event) {

      case "PRODUCTION_LOAD":
      case "SUPPLIER_RECEIPT":
      case "STOCK_TRANSFER_IN":
      case "INVENTORY_ADJUSTMENT_POS":
        map.set(m.sku, prev + qty);
        break;

      case "COMPONENT_CONSUMPTION":
      case "CUSTOMER_SHIPMENT":
      case "STOCK_TRANSFER_OUT":
      case "INVENTORY_ADJUSTMENT_NEG":
        map.set(m.sku, prev - qty);
        break;

      default:
        break;
    }
  }

  return map;
}