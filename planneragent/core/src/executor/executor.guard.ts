// PATH: core/src/executor/executor.guard.ts
// ======================================================
// PlannerAgent — Executor Guard
// Status: CANONICAL · GOVERNANCE ENFORCED
// ======================================================

import type { ExecutorRequest } from "../../../contracts/executor/executor.request";

export function assertExecutorAuthority(req: ExecutorRequest): void {
  if (!req.approver_id || !req.approved_at) {
    throw new Error("[EXECUTOR] Missing human approver");
  }
}

export function assertExecutorScope(req: ExecutorRequest): void {
  if (!req.scope?.domain || !req.scope?.action) {
    throw new Error("[EXECUTOR] Invalid execution scope");
  }
}