// core/src/sandbox/llm/sovereignty.ts
// Sovereignty RFC v1 — Model/Economic class governance
// Goal: decide allowed economic classes BEFORE provider selection.
//
// Canonical rule (VISION/BASIC):
// - if budgetRemainingEur > 0 => paid/commercial allowed
// - if budgetRemainingEur == 0 => only free/oss allowed

export type PlanTier = "BASIC" | "JUNIOR" | "SENIOR";

export type EconomicClass = "paid" | "free" | "oss";

export type SovereigntyPolicyV1 = {
  allowed: EconomicClass[];
  preferred: EconomicClass;
  forbidPaidWhenBudgetZero: boolean;
};

/**
 * Resolve sovereignty policy purely from plan + remaining budget.
 * (No provider knowledge here.)
 */
export function resolveSovereigntyPolicyV1(params: {
  plan: PlanTier;
  budgetRemainingEur: number; // for BASIC: global pool remaining; for others: can be Infinity
}): SovereigntyPolicyV1 {
  const { plan, budgetRemainingEur } = params;

  if (plan === "BASIC") {
    if (budgetRemainingEur > 0) {
      return {
        allowed: ["paid", "free", "oss"],
        preferred: "paid",
        forbidPaidWhenBudgetZero: true
      };
    }
    // budget == 0 => only free/oss
    return {
      allowed: ["free", "oss"],
      preferred: "free",
      forbidPaidWhenBudgetZero: true
    };
  }

  // JUNIOR/SENIOR always allowed (they pay), keep oss as fallback.
  return {
    allowed: ["paid", "free", "oss"],
    preferred: "paid",
    forbidPaidWhenBudgetZero: false
  };
}