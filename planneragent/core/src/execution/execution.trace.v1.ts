// PATH: core/src/execution/execution.trace.v1.ts
// ======================================================
// PlannerAgent — Execution Trace v1
// Canonical Source of Truth
// ======================================================

import type { ExecutionIntent } from "./execution.contracts.v1";
import type { ExecutorResult } from "../executor/executor.result";
import type { GovernanceDecision } from "./execution.router.v1";

// ------------------------------------------------------

export type ExecutionStepTrace = {
  step_id: string;

  capability_id: string;

  action_kind: string;

  agent?: {
    role?: string;
    mode: string;
  };

  governance: {
    decision: GovernanceDecision;
    reason: string;
  };

  execution: {
    status: "SUCCESS" | "FAILED" | "SKIPPED";
    executed_at?: string;
    error?: string;
  };

  rationale: string;

  details?: Record<string, unknown>;
};

// ------------------------------------------------------

export type ExecutionTrace = {
  execution_id: string;

  steps: ExecutionStepTrace[];

  summary: {
    total_steps: number;
    success: number;
    failed: number;
    skipped: number;
    agents_used: string[];
  };
};

// ------------------------------------------------------

function nowId(): string {
  return `exec_${Date.now()}`;
}

// ------------------------------------------------------

export function createEmptyTrace(): ExecutionTrace {
  return {
    execution_id: nowId(),
    steps: [],
    summary: {
      total_steps: 0,
      success: 0,
      failed: 0,
      skipped: 0,
      agents_used: [],
    },
  };
}

// ------------------------------------------------------

export function pushStepTrace(params: {
  trace: ExecutionTrace;
  intent: ExecutionIntent;
  governance: {
    decision: GovernanceDecision;
    reason: string;
  };
  result?: ExecutorResult;
}) {

  const { trace, intent, governance, result } = params;

  const stepId = `step_${trace.steps.length + 1}`;

  // ------------------------------------------------------
  // STATUS
  // ------------------------------------------------------

  let status: "SUCCESS" | "FAILED" | "SKIPPED" = "SKIPPED";
  let executedAt: string | undefined;
  let error: string | undefined;
  let details: Record<string, unknown> | undefined;

  if (governance.decision !== "EXECUTE") {
    status = "SKIPPED";
  } else if (result?.ok) {
    status = "SUCCESS";
    executedAt = result.executed_at;
    details = result.details;
  } else {
    status = "FAILED";
    error = result?.reason ?? "UNKNOWN_ERROR";
  }

  // ------------------------------------------------------
  // AGENT
  // ------------------------------------------------------

  const agentRole =
    (intent as any).agent_role ?? undefined;

  const mode = intent.mode;

  if (agentRole && !trace.summary.agents_used.includes(agentRole)) {
    trace.summary.agents_used.push(agentRole);
  }

  // ------------------------------------------------------
  // PUSH
  // ------------------------------------------------------

  trace.steps.push({
    step_id: stepId,

    capability_id: intent.capability_id,

    action_kind: intent.action_kind,

    agent: {
      role: agentRole,
      mode,
    },

    governance: {
      decision: governance.decision,
      reason: governance.reason,
    },

    execution: {
      status,
      executed_at: executedAt,
      error,
    },

    rationale: intent.rationale,

    details,
  });

  // ------------------------------------------------------
  // SUMMARY UPDATE
  // ------------------------------------------------------

  trace.summary.total_steps++;

  if (status === "SUCCESS") trace.summary.success++;
  if (status === "FAILED") trace.summary.failed++;
  if (status === "SKIPPED") trace.summary.skipped++;
}
