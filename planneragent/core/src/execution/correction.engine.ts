// ======================================================
// PATH: core/src/execution/correction.engine.ts
// PlannerAgent — Correction Engine V2
// Canonical Source of Truth
//
// V2:
// - inventory reconciliation driven
// - anomaly diagnosis driven
// - execution gap driven
// - dedupe by action + sku
// ======================================================

import type { ReconciliationResult } from "../reality/reconciliation.adapter";
import type { ExecutionGap } from "../decision/expected/execution.gap.engine";

// ------------------------------------------------------
// TYPES
// ------------------------------------------------------

export type AnomalyDiagnosis = {
  sku: string;
  delta: number;
  absDelta: number;
  cause: string;
  confidence: number;
  explanation?: string;
  suggestedAction?: string;
};

export type CorrectionAction = {
  action: string;
  sku: string;
  qty: number;
  confidence: number;
  blocking: boolean;
  reason: string;
  source:
    | "INVENTORY_RECONCILIATION"
    | "ANOMALY_DIAGNOSIS"
    | "EXECUTION_GAP";
};

export type CorrectionResult = {
  actions: CorrectionAction[];
  blocking: boolean;
};

// ------------------------------------------------------
// MAIN
// ------------------------------------------------------

export function generateCorrectionActions(
  reconciliation: ReconciliationResult,
  diagnosis: AnomalyDiagnosis[],
  executionGap: ExecutionGap[] = []
): CorrectionResult {
  const actions: CorrectionAction[] = [];

  // ----------------------------------------------------
  // 1. DIAGNOSIS-DRIVEN ACTIONS
  // ----------------------------------------------------

  for (const d of diagnosis ?? []) {
    if (!d?.sku) continue;

    const qty = Math.abs(d.delta ?? 0);

    switch (d.cause) {
      case "PRODUCTION_NOT_POSTED":
        actions.push({
          action: "POST_PRODUCTION_RECEIPT",
          sku: d.sku,
          qty,
          confidence: d.confidence ?? 0.8,
          blocking: true,
          reason: d.explanation ?? "Production receipt missing",
          source: "ANOMALY_DIAGNOSIS",
        });
        break;

      case "CONSUMPTION_NOT_REFLECTED":
        actions.push({
          action: "POST_COMPONENT_CONSUMPTION",
          sku: d.sku,
          qty,
          confidence: d.confidence ?? 0.8,
          blocking: true,
          reason: d.explanation ?? "Component consumption not posted",
          source: "ANOMALY_DIAGNOSIS",
        });
        break;

      case "SUPPLIER_RECEIPT_MISSING":
        actions.push({
          action: "POST_SUPPLIER_RECEIPT",
          sku: d.sku,
          qty,
          confidence: d.confidence ?? 0.7,
          blocking: true,
          reason: d.explanation ?? "Supplier receipt not posted",
          source: "ANOMALY_DIAGNOSIS",
        });
        break;

      case "SHIPMENT_NOT_POSTED":
        actions.push({
          action: "POST_CUSTOMER_SHIPMENT",
          sku: d.sku,
          qty,
          confidence: d.confidence ?? 0.7,
          blocking: true,
          reason: d.explanation ?? "Shipment not posted",
          source: "ANOMALY_DIAGNOSIS",
        });
        break;

      case "INVENTORY_ADJUSTMENT_REQUIRED":
        actions.push({
          action: "POST_INVENTORY_ADJUSTMENT",
          sku: d.sku,
          qty,
          confidence: d.confidence ?? 0.6,
          blocking: false,
          reason: d.explanation ?? "Inventory adjustment needed",
          source: "ANOMALY_DIAGNOSIS",
        });
        break;

      default:
        console.warn("UNKNOWN_DIAGNOSIS_CAUSE", d.cause, d);
        break;
    }
  }

  // ----------------------------------------------------
  // 2. EXECUTION GAP-DRIVEN ACTIONS
  // ----------------------------------------------------
  // UNDERCONSUMPTION: expected > actual
  // OVERCONSUMPTION: actual > expected
  // ----------------------------------------------------

  for (const gap of executionGap ?? []) {
    if (!gap?.sku || gap.type === "OK") continue;

    const qty = Math.abs(gap.delta ?? 0);

    if (gap.type === "UNDERCONSUMPTION") {
      actions.push({
        action: "INVESTIGATE_MISSING_CONSUMPTION",
        sku: gap.sku,
        qty,
        confidence: 0.85,
        blocking: true,
        reason: `Expected consumption ${gap.expected}, actual ${gap.actual}. Missing ${qty}.`,
        source: "EXECUTION_GAP",
      });

      actions.push({
        action: "POST_COMPONENT_CONSUMPTION",
        sku: gap.sku,
        qty,
        confidence: 0.75,
        blocking: true,
        reason: `Execution gap indicates missing component consumption posting (${qty}).`,
        source: "EXECUTION_GAP",
      });
    }

    if (gap.type === "OVERCONSUMPTION") {
      actions.push({
        action: "INVESTIGATE_OVERCONSUMPTION",
        sku: gap.sku,
        qty,
        confidence: 0.85,
        blocking: true,
        reason: `Expected consumption ${gap.expected}, actual ${gap.actual}. Excess ${qty}.`,
        source: "EXECUTION_GAP",
      });

      actions.push({
        action: "VERIFY_BOM_OR_SCRAP",
        sku: gap.sku,
        qty,
        confidence: 0.7,
        blocking: false,
        reason: `Overconsumption may indicate BOM error, scrap, or unplanned usage (${qty}).`,
        source: "EXECUTION_GAP",
      });
    }
  }

  // ----------------------------------------------------
  // 3. RECONCILIATION-ONLY SAFETY NET
  // ----------------------------------------------------
  // If reconciliation says mismatch but diagnosis is empty,
  // create a generic investigation action.
  // ----------------------------------------------------

  for (const row of reconciliation?.rows ?? []) {
    if (!row?.sku) continue;
    if (row.status === "OK") continue;

    const alreadyCovered = actions.some((a) => a.sku === row.sku);

    if (!alreadyCovered) {
      actions.push({
        action: "INVESTIGATE_INVENTORY_MISMATCH",
        sku: row.sku,
        qty: Math.abs(row.delta ?? 0),
        confidence: 0.6,
        blocking: row.status === "MAJOR",
        reason: `ERP qty ${row.erpQty}, reconstructed qty ${row.reconstructedQty}, delta ${row.delta}.`,
        source: "INVENTORY_RECONCILIATION",
      });
    }
  }

  // ----------------------------------------------------
  // 4. DEDUPE
  // ----------------------------------------------------

  const dedupedMap = new Map<string, CorrectionAction>();

  for (const a of actions) {
    const key = `${a.action}__${a.sku}`;

    if (!dedupedMap.has(key)) {
      dedupedMap.set(key, { ...a });
      continue;
    }

    const existing = dedupedMap.get(key)!;

    existing.qty = Math.max(existing.qty, a.qty);
    existing.confidence = Math.max(existing.confidence, a.confidence);
    existing.blocking = existing.blocking || a.blocking;

    if ((a.reason ?? "").length > (existing.reason ?? "").length) {
      existing.reason = a.reason;
    }
  }

  const dedupedActions = Array.from(dedupedMap.values());

  // ----------------------------------------------------
  // 5. BLOCKING
  // ----------------------------------------------------

  const blocking =
    reconciliation?.hasBlockingMismatch === true ||
    dedupedActions.some((a) => a.blocking);

  return {
    actions: dedupedActions,
    blocking,
  };
}