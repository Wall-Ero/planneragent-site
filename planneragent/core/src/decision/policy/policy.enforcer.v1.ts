// core/src/decision/policy/policy.enforcer.v1.ts
// ======================================================
// Decision Policy Enforcer V1
// Applies policy constraints to decision candidates
// HARD + SOFT governance
// ======================================================

export type PolicyContext = {
  primary_focus: "SERVICE" | "COST" | "STABILITY";
  weights: {
    service: number;
    cost: number;
    stability: number;
  };
  prefer_multi_action: boolean;
  allow_single_lever: boolean;
  max_plan_churn: number;
  risk_profile: "LOW" | "BALANCED" | "HIGH";
};

type Candidate = {
  score: number;
  actions: any[];
  kpis?: {
    serviceShortfall?: number;
    estimatedCost?: number;
    planChurn?: number;
  };
};

type PolicyResult = {
  adjustedScore: number;
  violations: string[];
};

export function applyPolicyConstraints(
  candidates: Candidate[],
  policy: PolicyContext
): { best: Candidate | null; debug: any[] } {

  const evaluated = candidates.map((c) => {
    const result = evaluateCandidate(c, policy);

    return {
      ...c,
      adjustedScore: c.score + result.adjustedScore,
      violations: result.violations,
    };
  });

  // --------------------------------------------------
  // HARD FILTER
  // --------------------------------------------------

  const filtered = evaluated.filter(
    (c) =>
      !c.violations.includes("HARD_BLOCK") &&
      !c.violations.includes("HARD_BLOCK_SERVICE_FAILURE")
  );

  if (filtered.length === 0) {
    return { best: null, debug: evaluated };
  }

  // --------------------------------------------------
  // SORT
  // --------------------------------------------------

  filtered.sort((a, b) => b.adjustedScore - a.adjustedScore);

  return {
    best: filtered[0],
    debug: filtered,
  };
}

// ======================================================
// CORE
// ======================================================

function evaluateCandidate(
  candidate: Candidate,
  policy: PolicyContext
): PolicyResult {

  let penalty = 0;
  const violations: string[] = [];

  const actionsCount = candidate.actions?.length ?? 0;
  const serviceShortfall = candidate.kpis?.serviceShortfall ?? 0;

  // ==================================================
  // 🔥 PRIMARY FOCUS — SERVICE DOMINANCE
  // ==================================================

  if (policy.primary_focus === "SERVICE") {
    if (serviceShortfall > 0.05) {
      violations.push("HARD_BLOCK_SERVICE_FAILURE");
    }
  }

  // ==================================================
  // SINGLE LEVER
  // ==================================================

  if (!policy.allow_single_lever && actionsCount === 1) {
    penalty -= 15;
    violations.push("SINGLE_LEVER_NOT_ALLOWED");
  }

  // ==================================================
  // MULTI ACTION
  // ==================================================

  if (policy.prefer_multi_action && actionsCount <= 1) {
    penalty -= 5;
    violations.push("MULTI_ACTION_PREFERRED");
  }

  // ==================================================
  // PLAN CHURN
  // ==================================================

  if (actionsCount > policy.max_plan_churn) {
    penalty -= 10;
    violations.push("PLAN_CHURN_EXCEEDED");
  }

  // ==================================================
  // RISK PROFILE
  // ==================================================

  if (policy.risk_profile === "LOW") {
    if (candidate.actions?.some(a => a.kind === "EXPEDITE_SUPPLIER")) {
      penalty -= 10;
      violations.push("RISK_TOO_HIGH_FOR_PROFILE");
    }
  }

  return {
    adjustedScore: penalty,
    violations,
  };
}