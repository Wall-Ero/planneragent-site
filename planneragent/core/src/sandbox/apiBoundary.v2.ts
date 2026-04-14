// core/src/sandbox/apiBoundary.v2.ts
// ===============================
// EDGE & CORE Boundary Contracts — V2
// Source of Truth
// ===============================

import type {
  SandboxEvaluateRequestV2,
  PlanTier,
  PlanningDomain, // 👈 QUESTA
} from "./contracts.v2";

import type { DataAwarenessLevel } from "../reality/reality.types";

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
): { awareness_level?: DataAwarenessLevel } | undefined {
  if (!x || typeof x !== "object") return undefined;

  const raw = x as Record<string, unknown>;

  let awareness: DataAwarenessLevel | undefined;

  // 🔹 STRING → NUMBER (EDGE → CORE)
  if (typeof raw.awareness_level === "string") {
    const map: Record<string, DataAwarenessLevel> = {
      NONE: 0,
      SNAPSHOT: 1,
      BEHAVIORAL: 2,
      STRUCTURAL: 3,
    };

    awareness = map[raw.awareness_level];
  }

  // 🔹 NUMBER → NUMBER (compatibilità)
  if (typeof raw.awareness_level === "number") {
    if ([0, 1, 2, 3].includes(raw.awareness_level)) {
      awareness = raw.awareness_level as DataAwarenessLevel;
    }
  }

  return {
    awareness_level: awareness,
  };
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
  domain: normalizeDomain(body.domain),

  actor_id: String(body.actor_id),

  baseline_snapshot_id: String(body.baseline_snapshot_id),
  baseline_metrics: body.baseline_metrics,

  dataset_descriptor: normalizeDatasetDescriptor(body.dataset_descriptor),

  // 👇 AGGIUNGI QUI
  behavior_override: body.behavior_override ?? undefined,

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

    dataset_descriptor: normalizeDatasetDescriptor(body.dataset_descriptor) as any,

    snapshot: body.snapshot,

    behavior_override: body.behavior_override ?? undefined,

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