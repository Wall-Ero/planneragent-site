// core/src/governance/graduate/graduate.tool.guard.ts
// ======================================================
// GRADUATE — Tool Governance Guard v1
// Canonical Source of Truth
// ======================================================

import type { ExecutionRequestV1 } from "../../../src/execution/contracts/execution.request.v1";

export type GraduateToolCheck =
  | { ok: true }
  | { ok: false; reason: string };

export function enforceGraduateToolGovernance(
  req: ExecutionRequestV1
): GraduateToolCheck {
  // Graduate never executes
  if (req.plan === "GRADUATE") {
    return {
      ok: false,
      reason: "GRADUATE_CANNOT_EXECUTE"
    };
  }

  return { ok: true };
}