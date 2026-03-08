// core/src/execution/execution.bridge.ts
// ======================================================
// PlannerAgent — Execution Bridge
// ======================================================

import { runExecutor } from "../executor/executor.runtime.v1";

export async function executePlan(plan: any, context: any) {

  const actions = plan.actions ?? [];

  const results = [];

  for (const action of actions) {

    const result = await runExecutor({
      action,
      approver: context.approver,
      tenantId: context.tenantId
    });

    results.push(result);
  }

  return results;
}