// core/src/executor/execution.governance.bridge.ts
// ======================================================
// EXECUTION GOVERNANCE BRIDGE — v1
// Canonical Source of Truth
// ======================================================

import type { ExecutionRequestV1 } from "./contracts/execution.request.v1";
import { enforceGraduateToolGovernance } from "../governance/graduate/graduate.tool.guard";
import { enforceCharterExecutionGuard } from "../governance/charter/charter.execution.guard";

export type ExecutionGovernanceResult =
  | { ok: true }
  | { ok: false; reason: string };

export function executionGovernanceBridge(
  req: ExecutionRequestV1,
  opts: {
    charterEnabled: boolean;
  }
): ExecutionGovernanceResult {
  // 1️⃣ Graduate guard
  const grad = enforceGraduateToolGovernance(req);
  if (!grad.ok) return grad;

  // 2️⃣ Charter kill-switch
  const charter = enforceCharterExecutionGuard(req, opts.charterEnabled);
  if (!charter.ok) return charter;

  return { ok: true };
}