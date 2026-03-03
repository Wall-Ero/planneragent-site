// src/sandbox/apiBoundary.v2.ts
// ===============================
// EDGE & CORE Boundary Contracts — V2
// Source of Truth
// ===============================

import type {
  SandboxEvaluateRequestV2,
  PlanTier,
  Intent,
  PlanningDomain,
  DatasetDescriptor,
} from "./contracts.v2";

// -------------------------------
// Normalizers
// -------------------------------
function normalizePlan(plan: any): PlanTier {
  const p = String(plan);

  // Legacy alias normalization: BASIC is never exposed beyond the boundary.
  if (p === "BASIC") return "VISION";

  return p as PlanTier;
}

function normalizeDatasetDescriptor(x: any): DatasetDescriptor | undefined {
  if (!x || typeof x !== "object") return undefined;

  // No inference: accept only explicit booleans.
  return {
    hasSnapshot: Boolean((x as any).hasSnapshot),
    hasBehavioralEvents: Boolean((x as any).hasBehavioralEvents),
    hasStructuralData: Boolean((x as any).hasStructuralData),
  };
}

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
    "baseline_metrics",
  ];

  for (const key of required) {
    if (!(key in body)) {
      throw new Error(`MISSING_FIELD: ${key}`);
    }
  }

  return {
    company_id: String(body.company_id),
    request_id: String(body.request_id),

    plan: normalizePlan(body.plan),
    intent: body.intent as Intent,
    domain: body.domain as PlanningDomain,

    actor_id: String(body.actor_id),

    baseline_snapshot_id: String(body.baseline_snapshot_id),
    baseline_metrics: body.baseline_metrics,

    // Frontend-driven (declared) descriptor; optional
    dataset_descriptor: normalizeDatasetDescriptor(body.dataset_descriptor),
  };
}

// -------------------------------
// CORE-LEVEL PARSER
// Used inside CORE (EDGE → CORE)
// Snapshot MUST exist and be signed
// -------------------------------
export function parseSandboxEvaluateRequestV2(body: any): SandboxEvaluateRequestV2 {
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
    "snapshot",
  ];

  for (const key of required) {
    if (!(key in body)) {
      throw new Error(`MISSING_FIELD: ${key}`);
    }
  }

  return {
    company_id: String(body.company_id),
    request_id: String(body.request_id),

    plan: normalizePlan(body.plan),
    intent: body.intent as Intent,
    domain: body.domain as PlanningDomain,

    actor_id: String(body.actor_id),

    baseline_snapshot_id: String(body.baseline_snapshot_id),
    baseline_metrics: body.baseline_metrics,

    dataset_descriptor: normalizeDatasetDescriptor(body.dataset_descriptor),

    snapshot: body.snapshot,
  };
}