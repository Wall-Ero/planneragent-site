// PATH: core/src/execution/execution.bridge.ts
// ======================================================
// PlannerAgent — Execution Bridge V2
// Canonical Source of Truth
// ======================================================

import type {
  ExecutionRequest,
  ExecutionResult,
} from "./execution.contracts.v1";

import type { ExecutionEvidence } from "../decision/decision.trace";

import { runExecutor } from "../executor/executor.runtime.v1";

function nowIso(): string {
  return new Date().toISOString();
}

export async function executePlan(
  request: ExecutionRequest
): Promise<{
  results: ExecutionResult[];
  evidences: ExecutionEvidence[];
}> {

  const { intents, context } = request;

  const results: ExecutionResult[] = [];
  const evidences: ExecutionEvidence[] = [];

  for (const intent of intents) {

    const result = await runExecutor({
      intent,
      tenantId: context.tenantId,
      approver: context.approver,
    });

    results.push({
      capability_id: intent.capability_id,
      success: result.ok,
      executed_at: result.ok
        ? result.executed_at
        : nowIso(),

      details: result.ok ? result.details : undefined,
      error: result.ok ? undefined : result.reason,
    });

    evidences.push({
      capability_id: intent.capability_id,
      success: result.ok,
      executed_at: result.ok
        ? result.executed_at
        : nowIso(),

      external_ref:
        result.ok &&
        result.details &&
        typeof result.details === "object" &&
        "id" in result.details
          ? String((result.details as any).id)
          : undefined,

      details: result.ok ? result.details : undefined,
    });
  }

  return { results, evidences };
}