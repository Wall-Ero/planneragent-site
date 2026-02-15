// core/src/execution/contracts/execution.request.v1.ts
// ======================================================
// Execution Request — Governance Contract v1
// Canonical Source of Truth
// ======================================================

import type { PlanTier, Intent, PlanningDomain } from "../../sandbox/contracts.v2";

export type ExecutionRequestV1 = {
  request_id: string;
  company_id: string;

  plan: PlanTier;
  intent: Intent;
  domain: PlanningDomain;

  actor_id: string;

  action: {
    type: string;
    payload: Record<string, unknown>;
  };

  issued_at: string; // ISO-8601
};