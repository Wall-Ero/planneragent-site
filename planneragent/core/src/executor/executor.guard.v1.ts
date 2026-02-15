// core/src/executor/executor.guard.v1.ts
// ======================================================
// Executor Guard — Governance Gate v1
// Canonical Source of Truth
// ======================================================

import type { ExecutionRequestV1 } from "../../../contracts/executor/execution.request.v1";

export type GuardResult =
  | { ok: true }
  | { ok: false; reason: string };

export function guardExecutionRequest(
  req: ExecutionRequestV1,
  opts: {
    hasAuthority: boolean;
    approver_id?: string;
  }
): GuardResult {
  // 1. Authority is mandatory
  if (!opts.hasAuthority) {
    return { ok: false, reason: "NO_AUTHORITY" };
  }

  // 2. EXECUTE always requires approver (Junior / Senior)
  if (req.intent === "EXECUTE" && !opts.approver_id) {
    return { ok: false, reason: "APPROVER_REQUIRED" };
  }

  return { ok: true };
}