// core/src/executor/executor.runtime.v1.ts
// ======================================================
// PlannerAgent — Executor Runtime v1
// Canonical Source of Truth (ALIGNED TO V1 CONTRACTS)
// ======================================================

import type {
  ExecutionRequest,
  ExecutionResult,
} from "../execution/execution.contracts.v1";

import { guardExecutionIntent } from "./executor.guard.v1";

import {
  resolveAgent,
  type ExecutionAgent,
} from "../execution/execution.agent.registry.v1";

import "./agents/index";

// ======================================================
// TYPES
// ======================================================

export interface ExecutorRuntimeEnv {
  tenantId: string;
  approver_id?: string;
  RESEND_API_KEY?: string;
  [key: string]: unknown;
}

export interface ExecutorRuntimeTrace {
  capability_id: string;
  agent_id: string;
  started_at: string;
  completed_at?: string;
  success?: boolean;
  error?: string;
}

// ======================================================
// HELPERS
// ======================================================

function nowIso(): string {
  return new Date().toISOString();
}

// ======================================================
// MAIN
// ======================================================

export async function executeRuntimeV1(
  req: ExecutionRequest,
  env: ExecutorRuntimeEnv
): Promise<{
  results: ExecutionResult[];
  trace: ExecutorRuntimeTrace[];
}> {
  const results: ExecutionResult[] = [];
  const traces: ExecutorRuntimeTrace[] = [];

  for (const intent of req.intents) {
    const trace: ExecutorRuntimeTrace = {
      capability_id: intent.capability_id,
      agent_id: "UNKNOWN",
      started_at: nowIso(),
    };

    const guard = guardExecutionIntent(intent, {
      hasAuthority: true,
      approver_id: env.approver_id,
    });

    if (!guard.ok) {
      trace.completed_at = nowIso();
      trace.success = false;
      trace.error = guard.reason;

      results.push({
        capability_id: intent.capability_id,
        success: false,
        executed_at: nowIso(),
        error: guard.reason,
      });

      traces.push(trace);
      continue;
    }

    let agent: ExecutionAgent;

    try {
      agent = resolveAgent(intent);
      trace.agent_id = agent.id;
    } catch (err: any) {
      trace.completed_at = nowIso();
      trace.success = false;
      trace.error = err?.message ?? "AGENT_RESOLUTION_FAILED";

      results.push({
        capability_id: intent.capability_id,
        success: false,
        executed_at: nowIso(),
        error: trace.error,
      });

      traces.push(trace);
      continue;
    }

    try {
      const res = await agent.execute({
        intent,
        env,
        context: req.context,
      });

      trace.completed_at = nowIso();
      trace.success = res.success;

      if (!res.success) {
        trace.error = res.error;
      }

      results.push(res);
    } catch (err: any) {
      trace.completed_at = nowIso();
      trace.success = false;
      trace.error = err?.message ?? "EXECUTION_FAILED";

      results.push({
        capability_id: intent.capability_id,
        success: false,
        executed_at: nowIso(),
        error: trace.error,
      });
    }

    traces.push(trace);
  }

  return {
    results,
    trace: traces,
  };
}