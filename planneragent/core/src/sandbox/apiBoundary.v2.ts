// src/sandbox/apiBoundary.v2.ts

import {
  SandboxEvaluateRequestV2,
  PlanTier,
  PlanningDomain,
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

/* ===============================
 * Type guards
 * =============================== */

function isPlanTier(x: any): x is PlanTier {
  return PLAN_TIERS.includes(x);
}

function isPlanningDomain(x: any): x is PlanningDomain {
  return PLANNING_DOMAINS.includes(x);
}

/* ===============================
 * Public API parser
 * =============================== */

export function parseSandboxEvaluateRequestV2(
  body: unknown
): SandboxEvaluateRequestV2 {
  if (typeof body !== "object" || body === null) {
    throw new Error("Invalid request body");
  }

  const b = body as Record<string, any>;

  // ---- identity / routing ----
  if (typeof b.company_id !== "string") {
    throw new Error("company_id must be a string");
  }

  if (!isPlanTier(b.plan)) {
    throw new Error(`Invalid plan tier: ${b.plan}`);
  }

  // ---- snapshot ----
  if (typeof b.baseline_snapshot_id !== "string") {
    throw new Error("baseline_snapshot_id must be a string");
  }


  // ---- optional scenario input ----

  const domain: PlanningDomain =
  isPlanningDomain(b.domain) ? b.domain : "supply_chain";


  const intent =
  typeof b.intent === "string"
    ? b.intent
    : "scenario_exploration";

  const baseline_metrics =
    typeof b.baseline_metrics === "object" && b.baseline_metrics !== null
      ? b.baseline_metrics
      : {};

  const scenario_metrics =
    typeof b.scenario_metrics === "object" && b.scenario_metrics !== null
      ? b.scenario_metrics
      : {};

  // ---- optional hints ----
  const constraints_hint =
    typeof b.constraints_hint === "object" && b.constraints_hint !== null
      ? b.constraints_hint
      : {};

  // ---- requested options ----
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
    company_id: b.company_id,
    plan: b.plan,
    domain: b.domain,
    baseline_snapshot_id: b.baseline_snapshot_id,
    intent: b.intent,

    baseline_metrics,
    scenario_metrics,

    constraints_hint,
    requested,
  };
}