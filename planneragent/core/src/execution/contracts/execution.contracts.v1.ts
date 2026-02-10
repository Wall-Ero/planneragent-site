// core/src/execution/contracts/execution.contracts.v1.ts
// ======================================================
// Execution Governance Contracts — V1
// Canonical Source of Truth
// ======================================================

import type { PlanTier, Intent, PlanningDomain } from "../../sandbox/contracts.v2";

// ------------------------------------------------------
// Execution Request (Sandbox → Executor Bridge)
// ------------------------------------------------------
export type ExecutionRequestV1 = {
  request_id: string;

  company_id: string;
  actor_id: string;

  plan: PlanTier;
  intent: Intent;
  domain: PlanningDomain;

  action_type: string;
  payload: Record<string, unknown>;

  approved_by?: string; // required for JUNIOR EXECUTE
  delegation_ref?: string; // required for SENIOR EXECUTE (if applicable)

  issued_at: string;
};

// ------------------------------------------------------
// Execution Result
// ------------------------------------------------------
export type ExecutionResultV1 =
  | {
      ok: true;
      execution_id: string;
      executed_at: string;
    }
  | {
      ok: false;
      reason:
        | "EXECUTION_NOT_ALLOWED"
        | "APPROVAL_REQUIRED"
        | "DELEGATION_REQUIRED"
        | "POLICY_BLOCKED"
        | "UNKNOWN_ACTION";
    };