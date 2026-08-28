// core/src/sandbox/apiBoundary.v2.ts
// ===============================
// EDGE & CORE Boundary Contracts — V2
// Source of Truth
// ===============================

import type {
  DatasetDescriptor,
  SandboxEvaluateRequestV2,
  PlanTier,
  PlanningDomain, // 👈 QUESTA
} from "./contracts.v2";

// -------------------------------
// Local helper types
// -------------------------------

type DatasetDescriptorLike = {
  hasSnapshot?: unknown;
  hasBehavioralEvents?: unknown;
  hasStructuralData?: unknown;
  awareness_level?: unknown;
};

// -------------------------------
// Normalizers
// -------------------------------

function normalizePlan(plan: unknown): PlanTier {
  const p = String(plan ?? "").toUpperCase();

  if (p === "BASIC") return "VISION";

  const allowed: PlanTier[] = [
    "VISION",
    "GRADUATE",
    "JUNIOR",
    "SENIOR",
    "PRINCIPAL",
    "CHARTER",
  ];

  if (!allowed.includes(p as PlanTier)) {
    throw new Error(`INVALID_PLAN: ${plan}`);
  }

  return p as PlanTier;
}



function normalizeDatasetDescriptor(
  x: unknown
): DatasetDescriptor | undefined {
  if (!x || typeof x !== "object") return undefined;

  const raw: DatasetDescriptorLike = x;
  if (
    typeof raw.hasSnapshot === "boolean" &&
    typeof raw.hasBehavioralEvents === "boolean" &&
    typeof raw.hasStructuralData === "boolean"
  ) {
    return {
      hasSnapshot: raw.hasSnapshot,
      hasBehavioralEvents: raw.hasBehavioralEvents,
      hasStructuralData: raw.hasStructuralData,
    };
  }

  const awareness = typeof raw.awareness_level === "string"
    ? { NONE: 0, SNAPSHOT: 1, BEHAVIORAL: 2, STRUCTURAL: 3 }[raw.awareness_level]
    : raw.awareness_level;

  if (awareness === 0) return { hasSnapshot: false, hasBehavioralEvents: false, hasStructuralData: false };
  if (awareness === 1) return { hasSnapshot: true, hasBehavioralEvents: false, hasStructuralData: false };
  if (awareness === 2) return { hasSnapshot: true, hasBehavioralEvents: true, hasStructuralData: false };
  if (awareness === 3) return { hasSnapshot: true, hasBehavioralEvents: true, hasStructuralData: true };
  return undefined;
}
export function normalizeDomain(domain: unknown): PlanningDomain {
  const d = String(domain ?? "").toLowerCase();

  if (d === "supply_chain") return "supply_chain";
  if (d === "production") return "production";
  if (d === "logistics") return "logistics";
  if (d === "finance") return "finance";
  if (d === "general") return "general";

  throw new Error(`INVALID_DOMAIN: ${domain}`);
}
// -------------------------------
// EDGE-LEVEL PARSER
// Used by worker.ts (client → EDGE)
// Snapshot MUST NOT be provided by client
// -------------------------------

export function parseEdgeRequestV2(
  body: any
): SandboxEvaluateRequestV2 & Required<Pick<SandboxEvaluateRequestV2, "actor_id">> {
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
  domain: normalizeDomain(body.domain),

  actor_id: String(body.actor_id),

  baseline_snapshot_id: String(body.baseline_snapshot_id),
  baseline_metrics: body.baseline_metrics,

  dataset_descriptor: normalizeDatasetDescriptor(body.dataset_descriptor),

  behavior_override: body.behavior_override ?? undefined,

  cognition: body.cognition ?? undefined,

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
    domain: normalizeDomain(body.domain),

    actor_id: String(body.actor_id),

    baseline_metrics: body.baseline_metrics,

    dataset_descriptor: normalizeDatasetDescriptor(body.dataset_descriptor),

    snapshot: body.snapshot,

    behavior_override: body.behavior_override ?? undefined,

    cognition: body.cognition ?? undefined,

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
