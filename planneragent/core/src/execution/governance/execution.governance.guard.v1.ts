// core/src/execution/governance/execution.governance.guard.v1.ts
// ======================================================
// Execution Governance Guard — V1
// Canonical Source of Truth
// ======================================================

import type { ExecutionRequestV1 } from "../contracts/execution.contracts.v1";

export function executionGovernanceGuard(
  req: ExecutionRequestV1
): { ok: true } | { ok: false; reason: string } {

  // --------------------------------------------------
  // PLAN LEVEL RULES
  // --------------------------------------------------

  // VISION / GRADUATE / CHARTER → NEVER EXECUTE
  if (
    req.plan === "VISION" ||
    req.plan === "GRADUATE" ||
    req.plan === "CHARTER"
  ) {
    return { ok: false, reason: "EXECUTION_NOT_ALLOWED" };
  }

  // --------------------------------------------------
  // JUNIOR — must have explicit approval
  // --------------------------------------------------
  if (req.plan === "JUNIOR") {
    if (!req.approved_by) {
      return { ok: false, reason: "APPROVAL_REQUIRED" };
    }
  }

  // --------------------------------------------------
  // SENIOR — delegation must exist (not checked here, only presence)
  // --------------------------------------------------
  if (req.plan === "SENIOR") {
    if (!req.delegation_ref) {
      return { ok: false, reason: "DELEGATION_REQUIRED" };
    }
  }

  // --------------------------------------------------
  // PRINCIPAL — allowed (budget logic lives elsewhere)
  // --------------------------------------------------

  return { ok: true };
}