// core/src/execution/execution.policy.v1.ts
// ======================================================
// PlannerAgent — Execution Policy v1 (Authority Layer)
// Canonical Source of Truth
// ======================================================

import type { ExecutionIntent } from "./action.router";
import type { PlanTier } from "./execution.router.v1";

// ------------------------------------------------------

export type PolicyDecision =
  | "ALLOW"
  | "REQUIRES_APPROVAL"
  | "BLOCK";

export type PolicyResult = {
  decision: PolicyDecision;
  reason: string;
};

// ------------------------------------------------------

export function evaluateExecutionPolicy(params: {
  intent: ExecutionIntent;
  plan: PlanTier;
}): PolicyResult {

  const { intent, plan } = params;

  // --------------------------------------------------
  // VISION — NEVER EXECUTES
  // --------------------------------------------------

  if (plan === "VISION") {
    return {
      decision: "BLOCK",
      reason: "VISION layer cannot execute actions",
    };
  }

  // --------------------------------------------------
  // AGENT MODE CONTROL
  // --------------------------------------------------

  if (intent.mode === "AGENT") {
    if (plan === "JUNIOR") {
      return {
        decision: "BLOCK",
        reason: "AGENT mode not allowed at JUNIOR level",
      };
    }
  }

  // --------------------------------------------------
  // CAPABILITY RULES
  // --------------------------------------------------

  if (intent.capability_id === "update_order") {
    if (plan === "JUNIOR") {
      return {
        decision: "REQUIRES_APPROVAL",
        reason: "Order updates require human approval",
      };
    }
  }

  if (intent.capability_id === "adjust_production") {
    if (plan === "JUNIOR") {
      return {
        decision: "REQUIRES_APPROVAL",
        reason: "Production adjustments require approval",
      };
    }
  }

  // --------------------------------------------------
  // DEFAULT POLICY
  // --------------------------------------------------

  if (plan === "JUNIOR") {
    return {
      decision: "REQUIRES_APPROVAL",
      reason: "JUNIOR requires approval",
    };
  }

  if (plan === "SENIOR") {
    return {
      decision: "ALLOW",
      reason: "SENIOR delegated execution",
    };
  }

  if (plan === "PRINCIPAL") {
    return {
      decision: "ALLOW",
      reason: "PRINCIPAL full authority",
    };
  }

  return {
    decision: "BLOCK",
    reason: "Unknown plan tier",
  };
}