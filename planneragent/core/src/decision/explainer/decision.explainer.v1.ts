// core/src/decision/explainer/decision.explainer.v1.ts
// ======================================================
// PlannerAgent — Decision Explainer v1.1 (SEMANTIC + GOVERNANCE)
// Canonical Source of Truth
// ======================================================

import type { CandidatePlan } from "../optimizer/contracts";

import {
  WHY_CODES,
  TRADEOFF_CODES,
  RISK_CODES,
  DECISION_CODE_MAP,
} from "./decision.codes.v1";

// ------------------------------------------------------
// Types
// ------------------------------------------------------

export type DecisionExplanation = {
  summary: string;
  whyChosen: string[];
  tradeoffs: string[];
  risks: string[];

  // 🔥 NEW
  whyBlocked?: string;
  nextSteps?: string[];
};

// ------------------------------------------------------
// Main entry
// ------------------------------------------------------

export function explainDecision(
  best: CandidatePlan,
  candidates?: CandidatePlan[],
  options?: {
    anomaly?: boolean;
    anomalyReasons?: string[];
    requiredActions?: any[];
  }
): DecisionExplanation {
  const whyChosen = buildWhy(best);
  const tradeoffs = buildTradeoffs(best, candidates);
  const risks = buildRisks(best);

  const summary = buildSummary(best, whyChosen);

  let whyBlocked: string | undefined;
  let nextSteps: string[] | undefined;

  if (options?.anomaly) {
    whyBlocked = buildWhyBlocked(options.anomalyReasons);
    nextSteps = buildNextSteps(options.requiredActions);
  }

  return {
    summary,
    whyChosen,
    tradeoffs,
    risks,
    whyBlocked,
    nextSteps,
  };
}

// ------------------------------------------------------
// WHY → SEMANTIC
// ------------------------------------------------------

function buildWhy(plan: CandidatePlan): string[] {
  const out: string[] = [];
  const k = plan.kpis ?? {};

  if (k.shortageUnits === 0) out.push("ELIMINATES_SHORTAGE");
  if (k.serviceShortfall === 0) out.push("FULL_SERVICE");

  if (k.planChurn > 0 && k.planChurn <= 3) {
    out.push("LIMITED_CHURN");
  }

  if (plan.actions.length >= 2) {
    out.push("REDUCES_DEPENDENCY");
  }

  return dedupe(out);
}

// ------------------------------------------------------
// TRADEOFFS
// ------------------------------------------------------

function buildTradeoffs(
  best: CandidatePlan,
  candidates?: CandidatePlan[]
): string[] {
  const out: string[] = [];

  if (!candidates || candidates.length <= 1) return out;

  const alt = findBestAlternative(best, candidates);
  if (!alt) return out;

  const b = best.kpis;
  const a = alt.kpis;

  if (b.estimatedCost > a.estimatedCost) out.push("HIGHER_COST");
  if (b.planChurn > a.planChurn) out.push("INCREASED_PLAN_CHURN");
  if (b.inventoryDeltaUnits > a.inventoryDeltaUnits)
    out.push("INVENTORY_BUILDUP");

  if (best.actions.length > 1) {
    out.push("MULTI_ACTION_COMPLEXITY");
  }

  return dedupe(out);
}

// ------------------------------------------------------
// RISKS
// ------------------------------------------------------

function buildRisks(plan: CandidatePlan): string[] {
  const out: string[] = [];
  const steps = plan.evidence?.evalSteps ?? [];

  if (steps.some(s => s.includes("isolated_topology_node")))
    out.push("ISOLATED_TOPOLOGY");

  if (steps.some(s => s.includes("assumed_supply_penalty")))
    out.push("SUPPLY_ASSUMPTION");

  if (steps.some(s => s.includes("single_action_penalty")))
    out.push("SINGLE_SUPPLIER_DEPENDENCY");

  if (steps.some(s => s.includes("SHORTAGE_IN_FREEZE_HORIZON")))
    out.push("EXECUTION_RISK");

  return dedupe(out);
}

// ------------------------------------------------------
// WHY BLOCKED (NEW)
// ------------------------------------------------------

function buildWhyBlocked(reasons?: string[]): string {
  if (!reasons || reasons.length === 0) {
    return "Execution is blocked due to detected anomaly.";
  }

  if (reasons.includes("VERIFY_TOPOLOGY_NODE")) {
    return "Execution is blocked because topology reliability is not sufficient.";
  }

  if (reasons.includes("CHECK_INVENTORY_MISMATCH")) {
    return "Execution is blocked due to inventory inconsistency.";
  }

  return "Execution is blocked due to unresolved anomaly signals.";
}

// ------------------------------------------------------
// NEXT STEPS (NEW)
// ------------------------------------------------------

function buildNextSteps(actions?: any[]): string[] {
  if (!actions || actions.length === 0) return [];

  return actions.map((a) => {
    const action = typeof a === "string" ? a : a.action;

    switch (action) {
      case "VERIFY_TOPOLOGY_NODE":
        return "Verify supplier topology and node connections";
      case "CHECK_INVENTORY_MISMATCH":
        return "Reconcile inventory discrepancies before execution";
      case "REVIEW_DEMAND_SPIKE":
        return "Validate demand spike against real orders";
      default:
        return action;
    }
  });
}

// ------------------------------------------------------
// SUMMARY
// ------------------------------------------------------

function buildSummary(plan: CandidatePlan, why: string[]): string {
  const actionSummary = summarizeActions(plan.actions);

  const primaryWhyCode = why.length > 0 ? why[0] : null;
  const primaryWhyLabel = primaryWhyCode
    ? DECISION_CODE_MAP[primaryWhyCode]?.label
    : "Optimizes plan outcomes";

  return `Plan selected: ${actionSummary}. ${primaryWhyLabel}.`;
}

// ------------------------------------------------------
// Helpers
// ------------------------------------------------------

function findBestAlternative(
  best: CandidatePlan,
  candidates: CandidatePlan[]
): CandidatePlan | null {
  const sorted = candidates
    .filter(c => c.id !== best.id)
    .sort((a, b) => a.score - b.score);

  return sorted[0] ?? null;
}

function summarizeActions(actions: any[]): string {
  if (!actions || actions.length === 0) return "no action plan";

  const kinds = new Set(actions.map(a => a.kind));

  if (kinds.size === 1) {
    return actionLabel([...kinds][0]);
  }

  return Array.from(kinds).map(actionLabel).join(" + ");
}

function actionLabel(kind: string): string {
  switch (kind) {
    case "EXPEDITE_SUPPLIER":
      return "supplier expedite";
    case "SHORT_TERM_PRODUCTION_ADJUST":
      return "production adjustment";
    case "RESCHEDULE_DELIVERY":
      return "delivery reschedule";
    default:
      return kind.toLowerCase();
  }
}

function dedupe(arr: string[]): string[] {
  return Array.from(new Set(arr));
}