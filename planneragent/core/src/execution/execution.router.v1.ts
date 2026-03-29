// core/src/execution/execution.router.v1.ts
// ======================================================
// PlannerAgent — Execution Authority Router v1 (Governed)
// Canonical Source of Truth
// ======================================================

import type { ExecutionIntent } from "./action.router";

// ------------------------------------------------------

export type PlanTier =
  | "VISION"
  | "JUNIOR"
  | "SENIOR"
  | "PRINCIPAL";

export type GovernanceDecision =
  | "BLOCKED"
  | "REQUIRES_APPROVAL"
  | "EXECUTE";

// ------------------------------------------------------

export type RoutedExecution = {
  intent: GovernanceDecision;
  reason: string;
};

// ------------------------------------------------------

export function routeExecutionByAuthority(params: {
  intent: ExecutionIntent;
  plan: PlanTier;
}): RoutedExecution {

  const { plan, intent } = params;

  // --------------------------------------------------
  // 🔒 GLOBAL BLOCK — VISION
  // --------------------------------------------------

  if (plan === "VISION") {
    return {
      intent: "BLOCKED",
      reason: "VISION layer does not allow execution",
    };
  }

  // --------------------------------------------------
  // 🤖 AGENT BLOCK (no autonomous agents unless SENIOR+)
  // --------------------------------------------------

  if (intent.mode === "AGENT" && plan === "JUNIOR") {
    return {
      intent: "BLOCKED",
      reason: "AGENT mode not allowed at JUNIOR level",
    };
  }

  // --------------------------------------------------
  // 🎯 CAPABILITY GUARD
  // --------------------------------------------------

  if (
    intent.capability_id === "update_order" &&
    plan === "JUNIOR"
  ) {
    return {
      intent: "REQUIRES_APPROVAL",
      reason: "Order updates require explicit approval",
    };
  }

  // --------------------------------------------------
  // JUNIOR
  // --------------------------------------------------

  if (plan === "JUNIOR") {
    return {
      intent: "REQUIRES_APPROVAL",
      reason: "Execution requires explicit human approval",
    };
  }

  // --------------------------------------------------
  // SENIOR
  // --------------------------------------------------

  if (plan === "SENIOR") {
    return {
      intent: "EXECUTE",
      reason: "Delegated execution allowed",
    };
  }

  // --------------------------------------------------
  // PRINCIPAL
  // --------------------------------------------------

  if (plan === "PRINCIPAL") {
    return {
      intent: "EXECUTE",
      reason: "Full authority execution",
    };
  }

  // --------------------------------------------------

  return {
    intent: "BLOCKED",
    reason: "Unknown plan tier",
  };
}