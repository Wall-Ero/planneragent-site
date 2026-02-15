// core/src/governance/charter/charter.execution.guard.ts
// ======================================================
// CHARTER — Execution Kill-Switch Guard v1
// Canonical Source of Truth
// ======================================================

import type { ExecutionRequestV1 } from "../../../src/execution/contracts/execution.request.v1";

export type CharterGuardResult =
  | { ok: true }
  | { ok: false; reason: string };

export function enforceCharterExecutionGuard(
  req: ExecutionRequestV1,
  charterEnabled: boolean
): CharterGuardResult {
  if (!charterEnabled) {
    return {
      ok: false,
      reason: "CHARTER_EXECUTION_DISABLED"
    };
  }

  // Charter itself never executes
  if (req.plan === "CHARTER") {
    return {
      ok: false,
      reason: "CHARTER_CANNOT_EXECUTE"
    };
  }

  return { ok: true };
}