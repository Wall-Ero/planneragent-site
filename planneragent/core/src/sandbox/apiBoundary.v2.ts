// core/src/sandbox/apiBoundary.v2.ts
// ===============================
// EDGE & CORE Boundary Contracts — V2
// Source of Truth
// ===============================

import type {
  SandboxEvaluateRequestV2,
  PlanTier,
} from "./contracts.v2";

// -------------------------------
// Local helper types
// -------------------------------

type DatasetDescriptorLike = {
  awareness_level?: number;
};

// -------------------------------
// Normalizers
// -------------------------------

function normalizePlan(plan: unknown): PlanTier {
  const p = String(plan ?? "");

  if (p === "BASIC") return "VISION";

  return p as PlanTier;
}

function normalizeDatasetDescriptor(x: unknown): DatasetDescriptorLike | undefined {
  if (!x || typeof x !== "object") return undefined;

  const raw = x as Record<string, unknown>;

  const awareness =
    typeof raw.awareness_level === "number"
      ? raw.awareness_level
      : undefined;

  return {
    awareness_level: awareness,
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
    intent: String(body.intent),
    domain: String(body.domain),

    actor_id: String(body.actor_id),

    baseline_snapshot_id: String(body.baseline_snapshot_id),
    baseline_metrics: body.baseline_metrics,

    dataset_descriptor: normalizeDatasetDescriptor(body.dataset_descriptor),

    // pass-through datasets
    orders: body.orders ?? [],
    inventory: body.inventory ?? [],
    movements: body.movements ?? [],

    movord: body.movord ?? [],
    movmag: body.movmag ?? [],
    masterBom: body.masterBom ?? [],

    bom_reference: body.bom_reference,
    selected_bom_reference: body.selected_bom_reference,
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
    intent: String(body.intent),
    domain: String(body.domain),

    actor_id: String(body.actor_id),

    baseline_metrics: body.baseline_metrics,

    dataset_descriptor: normalizeDatasetDescriptor(body.dataset_descriptor) as any,

    snapshot: body.snapshot,

    // pass-through datasets
    orders: body.orders ?? [],
    inventory: body.inventory ?? [],
    movements: body.movements ?? [],

    movord: body.movord ?? [],
    movmag: body.movmag ?? [],
    masterBom: body.masterBom ?? [],

    bom_reference: body.bom_reference,
    selected_bom_reference: body.selected_bom_reference,
  };
}