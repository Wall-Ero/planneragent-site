//core/src/reconciliation/inventory.governance.ts

// ======================================================
// PlannerAgent — Inventory Governance Engine v1
// Decide if mismatch should block execution
// ======================================================

import { InventoryReconciliationResult } from "../reality/inventory.reconciliation";

// ------------------------------------------------------
// TYPES
// ------------------------------------------------------

export type InventoryGovernanceDecision = {
  shouldBlock: boolean;
  reasons: string[];
  blockingSkus: string[];
  nonBlockingSkus: string[];
};

// ------------------------------------------------------
// MAIN
// ------------------------------------------------------

export function evaluateInventoryGovernance(
  reconciliation: InventoryReconciliationResult
): InventoryGovernanceDecision {

  const reasons: string[] = [];
  const blockingSkus: string[] = [];
  const nonBlockingSkus: string[] = [];

  for (const row of reconciliation.rows) {

    const isMismatch = row.status !== "MATCH";
    const isMajor = row.status === "MAJOR";
    const isExplained = row.explainedByMovements === true;

    if (!isMismatch) continue;

    // --------------------------------------------------
    // 🟢 CASE 1 — EXPLAINED → NON BLOCCA
    // --------------------------------------------------

    if (isExplained) {
      nonBlockingSkus.push(row.sku);
      continue;
    }

    // --------------------------------------------------
    // 🔴 CASE 2 — MAJOR NON SPIEGATO → BLOCCA
    // --------------------------------------------------

    if (isMajor && !isExplained) {
      blockingSkus.push(row.sku);
      continue;
    }

    // --------------------------------------------------
    // 🟡 CASE 3 — MINOR NON SPIEGATO → WARNING
    // --------------------------------------------------

    nonBlockingSkus.push(row.sku);
  }

  const shouldBlock = blockingSkus.length > 0;

  if (shouldBlock) {
    reasons.push("INVENTORY_MISMATCH_BLOCKING");
  } else if (nonBlockingSkus.length > 0) {
    reasons.push("INVENTORY_MISMATCH_NON_BLOCKING");
  }

  return {
    shouldBlock,
    reasons,
    blockingSkus,
    nonBlockingSkus
  };
}