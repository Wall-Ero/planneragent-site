// core/src/execution/execution.bridge.ts
// ======================================================
// PlannerAgent — Execution Bridge v3 (Authority Integrated)
// Canonical Source of Truth
// ======================================================

import type {
  ExecutionRequest,
  ExecutionResult,
} from "./execution.contracts.v1";

import type { ExecutionEvidence } from "../decision/decision.trace";

import { runExecutor } from "../executor/executor.runtime.v1";

import {
  routeExecutionByAuthority,
  type PlanTier,
} from "./execution.router.v1";

// ------------------------------------------------------

function nowIso(): string {
  return new Date().toISOString();
}

// ------------------------------------------------------

export async function executePlan(
  request: ExecutionRequest & {
    plan: PlanTier;
  }
): Promise<{
  results: ExecutionResult[];
  evidences: ExecutionEvidence[];
}> {

  const { intents, context, plan } = request;

  const results: ExecutionResult[] = [];
  const evidences: ExecutionEvidence[] = [];

  // ------------------------------------------------------
  // EXECUTION LOOP (authority-aware)
  // ------------------------------------------------------

  for (const intent of intents) {

    const routing = routeExecutionByAuthority({
      intent,
      plan,
    });

    // --------------------------------------------------
    // BLOCKED
    // --------------------------------------------------

    if (routing.intent === "BLOCKED") {

      results.push({
        capability_id: intent.capability_id,
        success: false,
        executed_at: nowIso(),
        error: "Execution blocked by governance layer",
      });

      evidences.push({
        capability_id: intent.capability_id,
        success: false,
        executed_at: nowIso(),
        details: {
          reason: "BLOCKED_BY_GOVERNANCE",
          governance_reason: routing.reason,
        },
        governance: routing.intent,
        rationale: intent.rationale,
      });

      continue;
    }

    // --------------------------------------------------
    // REQUIRES APPROVAL
    // --------------------------------------------------

    if (routing.intent === "REQUIRES_APPROVAL") {

      results.push({
        capability_id: intent.capability_id,
        success: false,
        executed_at: nowIso(),
        error: "Execution requires approval",
      });

      evidences.push({
        capability_id: intent.capability_id,
        success: false,
        executed_at: nowIso(),
        details: {
          reason: "AWAITING_APPROVAL",
          governance_reason: routing.reason,
        },
        governance: routing.intent,
        rationale: intent.rationale,
      });

      continue;
    }

    // --------------------------------------------------
    // EXECUTE
    // --------------------------------------------------

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

      details: result.ok
        ? result.details
        : {
            error: result.reason,
          },

      governance: routing.intent,
      rationale: intent.rationale,
    });
  }

  return { results, evidences };
}