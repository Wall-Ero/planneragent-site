// PATH: core/src/executor/routes.executor.ts
// ======================================================
// PlannerAgent — Executor Routes v2
// ======================================================

import { executeRuntimeV1 } from "./executor.runtime.v1";
import type { ExecutorRequestV2 } from "../../../contracts/executor/executor.request.v2";

export async function handleExecutorPreview(req: ExecutorRequestV2) {
  return {
    preview: true,
    intent: req.intent,
  };
}

export async function handleExecutorRun(req: ExecutorRequestV2) {
  return executeRuntimeV1(
    {
      intents: [req.intent],
      context: req.context,
    },
    {
      tenantId: req.context.tenantId,
      approver_id: req.context.approver,
    }
  );
}