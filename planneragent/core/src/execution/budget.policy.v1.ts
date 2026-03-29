// core/src/execution/budget.policy.v1.ts
// ======================================================
// PlannerAgent — Budget Policy v1 (Resource Authority)
// Canonical Source of Truth
// ======================================================

import type { PlanTier } from "./execution.router.v1";

// ------------------------------------------------------

export type BudgetDecision =
  | "ALLOW"
  | "BLOCK";

export type BudgetResult = {
  decision: BudgetDecision;
  reason: string;
};

// ------------------------------------------------------

export function evaluateBudgetPolicy(params: {
  plan: PlanTier;
  budgetRemaining?: number;
}): BudgetResult {

  const { plan, budgetRemaining } = params;

  // --------------------------------------------------
  // ONLY PRINCIPAL HAS BUDGET AUTHORITY
  // --------------------------------------------------

  if (plan !== "PRINCIPAL") {
    return {
      decision: "ALLOW",
      reason: "Budget not applicable for this plan tier",
    };
  }

  // --------------------------------------------------
  // PRINCIPAL — BUDGET CHECK
  // --------------------------------------------------

  if (typeof budgetRemaining === "number") {
    if (budgetRemaining <= 0) {
      return {
        decision: "BLOCK",
        reason: "No budget remaining",
      };
    }
  }

  return {
    decision: "ALLOW",
    reason: "Budget available",
  };
}