// core/src/decision/optimizer/actions.ts
// ======================================================
// PlannerAgent — Optimizer v1 Action Utilities
// Canonical Source of Truth
// ======================================================

import type { Action } from "./contracts";

export function actionsSignature(actions: Action[]): string {
  // Deterministic signature for candidate identity
  const parts = actions
    .slice()
    .sort((a, b) => actionKey(a).localeCompare(actionKey(b)))
    .map(actionKey);
  return parts.join("|");
}

function actionKey(a: Action): string {
  switch (a.kind) {
    case "RESCHEDULE_DELIVERY":
      return `RESCHEDULE:${a.orderId}:${a.shiftDays}`;
    case "EXPEDITE_SUPPLIER":
      return `EXPEDITE:${a.sku}:${round3(a.qty)}:${round3(a.costFactor)}:${a.supplierId ?? ""}`;
    case "SHORT_TERM_PRODUCTION_ADJUST":
      return `PROD_ADJ:${a.sku}:${round3(a.qty)}:${a.availableInDays}:${round3(a.costFactor)}`;
  }
}

function round3(v: number): string {
  if (!Number.isFinite(v)) return "0";
  return (Math.round(v * 1000) / 1000).toFixed(3);
}