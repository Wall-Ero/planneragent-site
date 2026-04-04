// PATH: contracts/executor/executor.request.v2.ts
// ======================================================
// PlannerAgent — Executor Request v2
// Canonical · aligned with ExecutionIntent
// ======================================================

import type { ExecutionIntent } from "../../core/src/execution/execution.contracts.v1";

export type ExecutorRequestV2 = {
  intent: ExecutionIntent;

  context: {
    tenantId: string;
    approver?: string;
  };
};