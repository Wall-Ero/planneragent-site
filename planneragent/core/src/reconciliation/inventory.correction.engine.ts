// core/src/reconciliation/inventory.correction.engine.ts

// ======================================================
// PlannerAgent — Inventory Correction Engine V2
// Generate operational actions from mismatches
// ======================================================

import { InventoryReconciliationResult } from "../reality/inventory.reconciliation";

// ------------------------------------------------------
// TYPES
// ------------------------------------------------------

export type InventoryCorrectionAction = {
  action: string;
  sku: string;
  qty: number;
  reason: string;
  confidence: number;
};

// ------------------------------------------------------
// MAIN
// ------------------------------------------------------

export function generateInventoryCorrections(
  reconciliation: InventoryReconciliationResult
): InventoryCorrectionAction[] {

  const actions: InventoryCorrectionAction[] = [];

  for (const row of reconciliation.rows) {

    // skip non mismatch
    if (row.status === "MATCH") continue;

    // skip explained → NON agire
    if (row.explainedByMovements) continue;

    const absDelta = row.absDelta;

    // --------------------------------------------------
    // 🔴 CASE 1 — CONSUMPTION NON REGISTRATA
    // --------------------------------------------------

    if (row.delta > 0) {
      // ERP > reconstructed → consumo mancante

      actions.push({
        action: "POST_COMPONENT_CONSUMPTION",
        sku: row.sku,
        qty: absDelta,
        reason: "CONSUMPTION_NOT_REFLECTED",
        confidence: 0.9
      });

      continue;
    }

    // --------------------------------------------------
    // 🔵 CASE 2 — STOCK NON REGISTRATO
    // --------------------------------------------------

    if (row.delta < 0) {
      // reconstructed > ERP → stock mancante ERP

      actions.push({
        action: "ADJUST_INVENTORY_POS",
        sku: row.sku,
        qty: absDelta,
        reason: "STOCK_UNDERSTATED",
        confidence: 0.8
      });

      continue;
    }
  }

  return actions;
}
