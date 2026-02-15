// core/src/executor/executor.audit.v1.ts
// ==================================================
// Executor Audit v1
// Canonical Source of Truth
// ==================================================

import type { ExecutionRequestV1 } from "../../../contracts/executor/execution.request.v1";
import type { ExecutionResultV1 } from "./executor.runtime.v1";

export type ExecutorAuditEntryV1 = {
  audit_ref: string;
  intent: ExecutionRequestV1["intent"];
  domain: string;
  action: string;
  ok: boolean;
  executed_at?: string;
};

export function buildExecutorAuditV1(
  audit_ref: string,
  req: ExecutionRequestV1,
  res: ExecutionResultV1
): ExecutorAuditEntryV1 {
  return {
    audit_ref,
    intent: req.intent,
    domain: req.scope.domain,
    action: req.scope.action,
    ok: res.ok,
    executed_at: res.ok ? res.executed_at : undefined,
  };
}