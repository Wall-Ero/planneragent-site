// src/sandbox/apiBoundary.v2.ts
// ==========================================
// Sandbox API Boundary v2 — Canonical
// - Validates public API input
// - Normalizes plan tiers
// - Enforces intent authority matrix
// - Requires snapshot
// - Produces governance-safe request for Core
// ==========================================

import {
  SandboxEvaluateRequestV2,
  PlanTier,
  PlanningDomain,
  Intent,
  PLAN_INTENT_MATRIX,
} from "./contracts.v2";

/* ===============================
 * Allowed enums (API contract)
 * =============================== */

const PLAN_TIERS: PlanTier[] = ["BASIC", "JUNIOR", "SENIOR"];

const PLANNING_DOMAINS: PlanningDomain[] = [
  "supply_chain",
  "production",
  "logistics",
];

const INTENTS: Intent[] = ["INFORM", "SENSE", "ADVISE", "EXECUTE"];

/* ===============================
 * Runtime alias (governance bridge)
 * =============================== */
// External clients may still speak "VISION"/"GRADUATE"
// Internally we normalize to PlanTier

const PLAN_ALIAS: Record<string, PlanTier> = {
  VISION: "BASIC",
  GRADUATE: "JUNIOR",
};

/* ===============================
 * Type guards
 * =============================== */

function isPlanTier(x: any): x is PlanTier {
  return PLAN_TIERS.includes(x);
}

function isPlanningDomain(x: any): x is PlanningDomain {
  return PLANNING_DOMAINS.includes(x);
}

function isIntent(x: any): x is Intent {
  return INTENTS.includes(x);
}

/* ===============================
 * Helpers
 * =============================== */

function pickString(...values: any[]): string | undefined {
  for (const v of values) {
    if (typeof v === "string") return v;
  }
  return undefined;
}

function pickObject(...values: any[]): Record<string, any> | undefined {
  for (const v of values) {
    if (typeof v === "object" && v !== null) return v;
  }
  return undefined;
}

/* ===============================
 * Governance helpers
 * =============================== */

function normalizePlan(raw?: string): PlanTier {
  if (!raw) throw new Error("plan is required");

  const normalized = PLAN_ALIAS[raw] ?? raw;

  if (!isPlanTier(normalized)) {
    throw new Error(`Invalid plan tier: ${raw}`);
  }

  return normalized;
}

function normalizeIntent(raw?: string): Intent {
  if (!raw) throw new Error("intent is required");

  const upper = raw.toUpperCase();

  if (!isIntent(upper)) {
    throw new Error(`Invalid intent: ${raw}`);
  }

  return upper as Intent;
}

function enforceAuthorityMatrix(
  plan: PlanTier,
  intent: Intent
) {
  const allowed = PLAN_INTENT_MATRIX[plan];

  if (!allowed.includes(intent)) {
    throw new Error(
      `Intent "${intent}" is not permitted for plan "${plan}". ` +
      `Allowed: ${allowed.join(", ")}`
    );
  }
}

/* ===============================
 * Public API parser (V2 Canonical)
 * =============================== */

export function parseSandboxEvaluateRequestV2(
  body: unknown
): SandboxEvaluateRequestV2 {
  if (typeof body !== "object" || body === null) {
    throw new Error("Invalid request body");
  }

  const b = body as Record<string, any>;

  const identity = pickObject(b.identity, b);
  const snapshot = pickObject(b.snapshot, b);

  /* ===============================
   * Identity / routing
   * =============================== */

  const company_id = pickString(
    identity?.company_id,
    identity?.companyId,
    b.company_id,
    b.companyId
  );

  if (!company_id) {
    throw new Error("company_id must be a string");
  }

  const rawPlan = pickString(identity?.plan, b.plan);
  const plan = normalizePlan(rawPlan);

  const domainRaw = pickString(identity?.domain, b.domain);
  const domain: PlanningDomain = isPlanningDomain(domainRaw)
    ? domainRaw
    : "supply_chain";

  /* ===============================
   * Snapshot (MANDATORY)
   * =============================== */

  const baseline_snapshot_id = pickString(
    snapshot?.baseline_snapshot_id,
    snapshot?.baselineSnapshotId,
    b.baseline_snapshot_id,
    b.baselineSnapshotId
  );

  if (!baseline_snapshot_id) {
    throw new Error("baseline_snapshot_id must be provided (snapshot required)");
  }

  /* ===============================
   * Intent (MANDATORY + GOVERNED)
   * =============================== */

  const rawIntent = pickString(
    b.intent,
    identity?.intent
  );

  const intent = normalizeIntent(rawIntent);

  // Enforce authority matrix (board-readable rule)
  enforceAuthorityMatrix(plan, intent);

  /* ===============================
   * Scenario input
   * =============================== */

  const baseline_metrics =
    typeof b.baseline_metrics === "object" && b.baseline_metrics !== null
      ? b.baseline_metrics
      : {};

  const scenario_metrics =
    typeof b.scenario_metrics === "object" && b.scenario_metrics !== null
      ? b.scenario_metrics
      : {};

  /* ===============================
   * Optional hints
   * =============================== */

  const constraints_hint =
    typeof b.constraints_hint === "object" && b.constraints_hint !== null
      ? b.constraints_hint
      : {};

  /* ===============================
   * Requested options
   * =============================== */

  const requested = {
    n_scenarios:
      typeof b.requested?.n_scenarios === "number"
        ? b.requested.n_scenarios
        : 3,

    horizon_days:
      typeof b.requested?.horizon_days === "number"
        ? b.requested.horizon_days
        : 21,
  };

  /* ===============================
   * Final validated request
   * =============================== */

  return {
    company_id,
    plan,
    domain,
    baseline_snapshot_id,
    intent,

    baseline_metrics,
    scenario_metrics,

    constraints_hint,
    requested,
  };
}