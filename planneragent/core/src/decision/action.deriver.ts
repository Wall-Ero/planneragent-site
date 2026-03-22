// core/src/decision/action.deriver.ts
// ============================================================
// PlannerAgent — Action Deriver V1.1
// Canonical Source of Truth
// ============================================================

import type { DlEvidenceV2 } from "../sandbox/contracts.v2";
import type { OrdDecisionTrace } from "./ord/ord.trace";
import type { OptimizerAction } from "../execution/action.router";

export interface DerivedActionProposal {
  action: OptimizerAction;
  priority: number;
  reason: string;
  expected_impact?: string;
}

export interface DeriveActionsInput {
  ord: OrdDecisionTrace;
  dl: DlEvidenceV2;
}

export interface DeriveActionsResult {
  proposed_actions: DerivedActionProposal[];
}

// ------------------------------------------------------------
// UTILS
// ------------------------------------------------------------

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

function round3(x: number): number {
  return Math.round(x * 1000) / 1000;
}

// ------------------------------------------------------------
// SIGNAL PARSING
// ------------------------------------------------------------

function parseShortageSignals(signals: string[]): Array<{ sku: string; shortage: number }> {
  const out: Array<{ sku: string; shortage: number }> = [];

  for (const signal of signals) {
    if (!signal.startsWith("shortage:")) continue;

    const payload = signal.slice("shortage:".length);
    const eqIndex = payload.indexOf("=");

    if (eqIndex <= 0) continue;

    const sku = payload.slice(0, eqIndex).trim();
    const shortage = Number(payload.slice(eqIndex + 1).trim());

    if (!sku || !Number.isFinite(shortage) || shortage <= 0) continue;

    out.push({ sku, shortage });
  }

  return out;
}

// ------------------------------------------------------------
// DL ACCESSORS
// ------------------------------------------------------------

function getDemandP50(dl: DlEvidenceV2): number {
  return Number(dl.demand_forecast?.p50 ?? 0);
}

function getStockoutRisk(dl: DlEvidenceV2): number {
  return clamp01(Number(dl.risk_score?.stockout_risk ?? 0));
}

function getSupplierDependency(dl: DlEvidenceV2): number {
  return clamp01(Number(dl.risk_score?.supplier_dependency ?? 0));
}

// ------------------------------------------------------------
// DATA QUALITY (ORD-derived)
// ------------------------------------------------------------

function computeDataQuality(ord: OrdDecisionTrace): "HIGH" | "MEDIUM" | "LOW" | "UNKNOWN" {
  const { ordersSeen, inventorySeen } = ord.reality;

  if (ordersSeen === 0 && inventorySeen === 0) return "UNKNOWN";
  if (inventorySeen === 0) return "LOW";
  if (ordersSeen === 0) return "LOW";

  return "HIGH";
}

// ------------------------------------------------------------
// ACTIONS
// ------------------------------------------------------------

function deriveExpediteActions(dl: DlEvidenceV2): DerivedActionProposal[] {
  const shortages = parseShortageSignals(dl.anomaly_signals ?? []);
  const stockoutRisk = getStockoutRisk(dl);
  const supplierDependency = getSupplierDependency(dl);

  if (shortages.length === 0) return [];

  return shortages.map((item) => {
    const costFactor = round3(1 + stockoutRisk + supplierDependency);

    return {
      action: {
        kind: "EXPEDITE_SUPPLIER",
        sku: item.sku,
        qty: Math.ceil(item.shortage),
        costFactor,
        reason: `shortage:${item.sku}`,
      },
      priority: round3(clamp01(0.6 + stockoutRisk * 0.25 + supplierDependency * 0.15)),
      reason: `shortage_detected:${item.sku}`,
      expected_impact: "Reduce stockout risk via supplier acceleration",
    };
  });
}

function deriveProductionAdjustActions(dl: DlEvidenceV2): DerivedActionProposal[] {
  const shortages = parseShortageSignals(dl.anomaly_signals ?? []);
  const stockoutRisk = getStockoutRisk(dl);

  if (shortages.length === 0) return [];

  return shortages.map((item) => {
    const availableInDays =
      stockoutRisk >= 0.7 ? 1 :
      stockoutRisk >= 0.4 ? 2 : 3;

    return {
      action: {
        kind: "SHORT_TERM_PRODUCTION_ADJUST",
        sku: item.sku,
        qty: Math.ceil(item.shortage),
        availableInDays,
        costFactor: round3(1 + stockoutRisk * 0.5),
        reason: `prod_adjust:${item.sku}`,
      },
      priority: round3(clamp01(0.5 + stockoutRisk * 0.3)),
      reason: `production_adjustment:${item.sku}`,
      expected_impact: "Recover service level via production adjustment",
    };
  });
}

function deriveDeliveryRescheduleAction(
  ord: OrdDecisionTrace,
  dl: DlEvidenceV2
): DerivedActionProposal[] {

  const stockoutRisk = getStockoutRisk(dl);
  const demandP50 = getDemandP50(dl);

  if (ord.reality.ordersSeen <= 0) return [];
  if (stockoutRisk < 0.85) return [];
  if (demandP50 <= 0) return [];

  return [
    {
      action: {
        kind: "RESCHEDULE_DELIVERY",
        orderId: ord.requestId,
        shiftDays: 2,
        reason: "extreme_stockout",
      },
      priority: round3(clamp01(0.45 + stockoutRisk * 0.4)),
      reason: "delivery_reschedule_high_risk",
      expected_impact: "Reduce delivery pressure during supply instability",
    },
  ];
}

// ------------------------------------------------------------
// FINAL
// ------------------------------------------------------------

function dedupeAndSort(
  proposals: DerivedActionProposal[]
): DerivedActionProposal[] {

  const seen = new Set<string>();
  const out: DerivedActionProposal[] = [];

  for (const proposal of proposals) {
    const a = proposal.action;

    const key =
      a.kind === "RESCHEDULE_DELIVERY"
        ? `${a.kind}|${a.orderId}|${a.shiftDays}`
        : `${a.kind}|${a.sku}|${a.qty}`;

    if (seen.has(key)) continue;

    seen.add(key);
    out.push(proposal);
  }

  out.sort((a, b) => b.priority - a.priority);

  return out;
}

// ------------------------------------------------------------
// MAIN ENTRY
// ------------------------------------------------------------

export function deriveActionsV1(
  input: DeriveActionsInput
): DeriveActionsResult {

  const { ord, dl } = input;

  const dataQuality = computeDataQuality(ord);

  // ----------------------------------------------------------
  // HARD SAFETY GATE
  // ----------------------------------------------------------

  if (ord.decisionMode === "OBSERVATION") {
    return { proposed_actions: [] };
  }

  if (dataQuality === "UNKNOWN" || dataQuality === "LOW") {
    return {
      proposed_actions: [],
    };
  }

  // ----------------------------------------------------------
  // DERIVATION
  // ----------------------------------------------------------

  const proposals: DerivedActionProposal[] = [
    ...deriveExpediteActions(dl),
    ...deriveProductionAdjustActions(dl),
    ...deriveDeliveryRescheduleAction(ord, dl),
  ];

  return {
    proposed_actions: dedupeAndSort(proposals),
  };
}