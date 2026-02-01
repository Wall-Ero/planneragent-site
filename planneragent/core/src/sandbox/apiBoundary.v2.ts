// src/sandbox/apiBoundary.v2.ts
// ===============================
// EDGE & CORE Boundary Contracts — V2
// ===============================

import type {
  SandboxEvaluateRequestV2,
  PlanTier,
  Intent,
  PlanningDomain
} from "./contracts.v2";

// -------------------------------
// EDGE-LEVEL PARSER
// Used by worker.ts (client → EDGE)
// Snapshot MUST NOT be provided by client
// -------------------------------
export function parseEdgeRequestV2(body: any) {
  if (!body) throw new Error("EMPTY_BODY");

  const required = [
    "company_id",
    "request_id",
    "plan",
    "intent",
    "domain",
    "actor_id",
    "baseline_snapshot_id",
    "baseline_metrics"
  ];

  for (const key of required) {
    if (!(key in body)) {
      throw new Error(`MISSING_FIELD: ${key}`);
    }
  }

  return {
    company_id: String(body.company_id),
    request_id: String(body.request_id),

    plan: body.plan as PlanTier,
    intent: body.intent as Intent,
    domain: body.domain as PlanningDomain,

    actor_id: String(body.actor_id),

    baseline_snapshot_id: String(body.baseline_snapshot_id),
    baseline_metrics: body.baseline_metrics
  };
}

// -------------------------------
// CORE-LEVEL PARSER
// Used inside CORE (EDGE → CORE)
// Snapshot MUST exist and be signed
// -------------------------------
export function parseSandboxEvaluateRequestV2(
  body: any
): SandboxEvaluateRequestV2 {
  if (!body) throw new Error("EMPTY_BODY");

  const required = [
    "company_id",
    "request_id",
    "plan",
    "intent",
    "domain",
    "actor_id",
    "baseline_snapshot_id",
    "baseline_metrics",
    "snapshot"
  ];

  for (const key of required) {
    if (!(key in body)) {
      throw new Error(`MISSING_FIELD: ${key}`);
    }
  }

  return {
    company_id: String(body.company_id),
    request_id: String(body.request_id),

    plan: body.plan as PlanTier,
    intent: body.intent as Intent,
    domain: body.domain as PlanningDomain,

    actor_id: String(body.actor_id),

    baseline_snapshot_id: String(body.baseline_snapshot_id),
    baseline_metrics: body.baseline_metrics,

    snapshot: body.snapshot
  };
}