// core/src/sandbox/authority/authorityExecution.policy.ts
// ======================================================
// Authority Execution Policy — P3 Minimal
// Canonical Source of Truth
// ======================================================

import type { PlanTier } from "../contracts.v2";

/**
 * Defines if execution can EVER be allowed
 * at sandbox level (still preview only).
 */

export function isExecutionAllowedForPlan(plan: PlanTier): boolean {

  switch (plan) {

    case "VISION":
      return false;

    case "GRADUATE":
      return false;

    case "JUNIOR":
      return true;

    case "SENIOR":
      return true;

    case "PRINCIPAL":
      return true;

    case "CHARTER":
      return false;

    default:
      return false;
  }
}