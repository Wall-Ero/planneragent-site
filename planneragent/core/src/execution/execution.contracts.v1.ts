// core/src/execution/execution.contracts.v1.ts
// ======================================================
// PlannerAgent — Execution Contracts V1
// Canonical Source of Truth
// ======================================================

import type { OptimizerAction } from "./action.router";

// ------------------------------------------------------

export type ExecutionMode =
  | "DIRECT"
  | "AGENT";

export type ExecutionCapabilityId =
  | "notify_supplier"
  | "update_order"
  | "adjust_production";

// ------------------------------------------------------

export interface ExecutionIntent {
  // 🔥 ALLINEATO
  action_kind: OptimizerAction["kind"];

  capability_id: ExecutionCapabilityId;

  mode: ExecutionMode;

  payload: Record<string, unknown>;

  rationale: string;
}

// ------------------------------------------------------

export interface ExecutionRequest {
  intents: ExecutionIntent[];

  context: {
    tenantId: string;
    approver?: string;
  };
}

// ------------------------------------------------------

export interface ExecutionResult {
  capability_id: ExecutionCapabilityId;

  success: boolean;

  executed_at: string;

  details?: Record<string, unknown>;

  error?: string;
}