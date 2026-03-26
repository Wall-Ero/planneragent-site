// core/src/decision/decision.outcome.validator.ts
// ======================================================
// PlannerAgent — Decision Outcome Validator V1
// Canonical Source of Truth
//
// Purpose
// - classify decision outcome for learning loop
// - deterministic, auditable, no LLM
//
// Output:
// - SUCCESS → decision achieved service objective
// - FAIL → decision leaves critical issues unresolved
// - CORRECTED → reserved for human override (future)
//
// Security role:
// - first anti-poisoning layer (basic)
// ======================================================

type DecisionOutcome = "SUCCESS" | "FAIL" | "CORRECTED";

type CandidateKpis = {
  serviceShortfall?: number;
  shortageUnits?: number;
  latenessDays?: number;
  [key: string]: number | undefined;
};

type Candidate = {
  actions?: any[];
  violations?: string[];
  kpis?: CandidateKpis;
};

export function validateDecisionOutcome(
  candidate: Candidate | null
): DecisionOutcome {

  if (!candidate) return "FAIL";

  const kpis = candidate.kpis ?? {};
  const violations = candidate.violations ?? [];

  // ==================================================
  // HARD FAIL CONDITIONS
  // ==================================================

  // Residual shortage
  if (typeof kpis.shortageUnits === "number" && kpis.shortageUnits > 0) {
    return "FAIL";
  }

  // Service shortfall
  if (typeof kpis.serviceShortfall === "number" && kpis.serviceShortfall > 0) {
    return "FAIL";
  }

  // Hard violations (future-proof)
  if (violations.includes("HARD_BLOCK")) {
    return "FAIL";
  }

  // ==================================================
  // SUCCESS CONDITIONS
  // ==================================================

  const hasActions = (candidate.actions?.length ?? 0) > 0;

  if (hasActions) {
    return "SUCCESS";
  }

  // ==================================================
  // FALLBACK
  // ==================================================

  return "FAIL";
}