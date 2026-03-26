// core/src/decision/decision.anomaly.guard.ts
// ======================================================
// PlannerAgent — Decision Anomaly Guard V1
// Canonical Source of Truth
//
// Purpose
// - detect suspicious decisions BEFORE learning
// - prevent poisoning of policy resolver
//
// Output:
// - true  → anomaly detected → do NOT learn
// - false → safe to learn
//
// Design:
// - deterministic
// - fast
// - explainable
// ======================================================

type CandidateKpis = {
  serviceShortfall?: number;
  shortageUnits?: number;
  estimatedCost?: number;
  planChurn?: number;
  [key: string]: number | undefined;
};

type Candidate = {
  actions?: any[];
  kpis?: CandidateKpis;
  violations?: string[];
};

export function detectDecisionAnomaly(
  candidate: Candidate | null
): boolean {

  if (!candidate) return true;

  const kpis = candidate.kpis ?? {};
  const actions = candidate.actions ?? [];

  // ==================================================
  // RULE 1 — NO ACTION BUT "SUCCESS"
  // ==================================================

  if ((actions.length ?? 0) === 0) {
    return true;
  }

  // ==================================================
  // RULE 2 — EXTREME PLAN CHURN
  // ==================================================

  if (typeof kpis.planChurn === "number" && kpis.planChurn > 10) {
    return true;
  }

  // ==================================================
  // RULE 3 — COST OUTLIER (very rough V1)
  // ==================================================

  if (typeof kpis.estimatedCost === "number" && kpis.estimatedCost > 1000) {
    return true;
  }

  // ==================================================
  // RULE 4 — TOO MANY ACTIONS
  // ==================================================

  if (actions.length > 10) {
    return true;
  }

  // ==================================================
  // RULE 5 — INCOHERENT KPI (defensive)
  // ==================================================

  if (
    typeof kpis.shortageUnits === "number" &&
    typeof kpis.serviceShortfall === "number" &&
    kpis.shortageUnits === 0 &&
    kpis.serviceShortfall > 0
  ) {
    return true;
  }

  return false;
}